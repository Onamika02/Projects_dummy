import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../apiUrls.js";
import prismaAccounting from "../utils/prismaAccountingClient.js";
import prismaAuth from "../utils/prismaAuthClient.js";
import prismaApi from "../utils/prismaApiClient.js";
import { addInitialBalance } from "../utils/addInitialBalance.js";
import { generateUserToken } from "../utils/userTokenJWT.js";
import { clearAllDatabases } from "../utils/cleanDB.js";
import { createBasicChartOfAccounts } from "../utils/setUpCoA.js";
import { createUserAccounts } from "../utils/setupAccounts.js";
import { setupTransactionTypes } from "../utils/setUpTypes.js";
import { createAppUserAccounts } from "../utils/setupAppUser.js";
import { Kafka } from "kafkajs";

describe("Split Bill", function () {
  let customer,
    amount,
    customerAccount1,
    customerAccount2,
    customerAccount3,
    merchantAccount,
    type,
    userId,
    refNumber,
    tokenUser1,
    tokenUser2,
    tokenUser3,
    trxnTypeId;

  before(async () => {
    await prismaAuth.$connect();
    await prismaAccounting.$connect();
    await prismaApi.$connect();
  });

  after(async () => {
    await prismaAuth.$disconnect();
    await prismaApi.$disconnect();
    await prismaAccounting.$disconnect();
  });
  beforeEach(async () => {
    await clearAllDatabases();
    await createAppUserAccounts();

    const userId1 = await prismaAuth.appUser.findFirst({
      where: {
        phone: "01317577237",
      },
    });

    const userId2 = await prismaAuth.appUser.findFirst({
      where: {
        phone: "01711106485",
      },
    });
    const userId3 = await prismaAuth.appUser.findFirst({
      where: {
        phone: "01317577238",
      },
    });

    const merchantUser = await prismaAuth.appUser.findUnique({
      where: { phone: "01999999999" },
    });

    tokenUser1 = generateUserToken(userId1.id, "01317577237", "USER");
    tokenUser2 = generateUserToken(userId2.id, "01711106485", "USER");
    tokenUser3 = generateUserToken(userId3.id, "01317577238", "USER");

    const chartOfAccounts = await createBasicChartOfAccounts();

    customer = chartOfAccounts.find(
      (account) => account.code === "customer-01"
    );

    await setupTransactionTypes(chartOfAccounts);

    type = await prismaAccounting.transactionType.findUnique({
      where: { transactionCode: "make-payment-001" },
    });

    trxnTypeId = type.id;
    await createUserAccounts(chartOfAccounts);

    customerAccount1 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01317577237" },
    });
    customerAccount2 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01711106485" },
    });

    customerAccount3 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01317577238" },
    });

    await prismaApi.merchantUser.create({
      data: {
        userId: merchantUser.id,
        settlementFrequency: "MONTHLY",
      },
    });

    merchantAccount = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01999999999" },
    });
    await addInitialBalance(customerAccount1, 50000);
  });

  const checkSuccess = async ({
    callback,
    groupId,
    topic,
    log,
    amount,
    message,
  }) => {
    const kafka = new Kafka({
      clientId: "split-bill-test-client",
      brokers: ["p-pay-kafka-test:9092"],
    });

    const consumer = kafka.consumer({ groupId });

    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });

    await new Promise((resolve, reject) => {  
      const timeout = setTimeout(() => {
        reject(new Error("Kafka message processing timed out"));
      }, 10000); 
      consumer.run({
        eachMessage: async ({ message }) => {
          console.log("Received message:", message.value.toString()); 
          const parsedMessage = JSON.parse(message.value.toString());
          console.log("Parsed message:", parsedMessage); 

          if (parsedMessage.isSucess) {
            if (callback) await callback();
            const transactionFromDB =
              await prismaAccounting.transaction.findMany({
                where: {
                  referenceNo: refNumber,
                  transactionTypeId: trxnTypeId,
                },
              });

            const ledgerEntries = await prismaAccounting.ledger.findMany({
              where: {
                transactionId: transactionFromDB[0].id,
              },
            });

            const creditEntry = ledgerEntries.find(
              (entry) => entry.type === "CREDIT"
            );
            const debitEntry = ledgerEntries.find(
              (entry) => entry.type === "DEBIT"
            );

            const totalCreditAmount = creditEntry
              ? Number(creditEntry.amount)
              : 0;
            const totalDebitAmount = debitEntry ? Number(debitEntry.amount) : 0;

            expect(totalDebitAmount).to.equal(totalCreditAmount);
            expect(totalDebitAmount).to.equal(amount);
            clearTimeout(timeout);
            resolve();
          }
        },
      });
    });

    await consumer.stop();
    await consumer.disconnect();
  };

  // it("should split bill successfully for all valid scenarios", async () => {
  //   this.timeout(7000);

  //   const splitBillData = {
  //     totalAmount: 100,
  //     merchantNumber: "01999999999",
  //     requestedTo: [
  //       { phone: "01711106485", amount: 50 },
  //       { phone: "01317577238", amount: 50 },
  //     ],
  //     transactionTypeCode: "make-payment-001",
  //     note: "Dinner with friends",
  //   };

  //   await pactum
  //     .spec()
  //     .withBearerToken(tokenUser1)
  //     .withMethod("POST")
  //     .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.splitBill}`)
  //     .withJson(splitBillData)
  //     .expectStatus(200);

  //   const splitBillTransaction = await prismaApi.splitBill.findFirst({
  //     where: { requestReceiverNumber: "01999999999" },
  //   });

  //   expect(splitBillTransaction).to.not.be.null;
  //   expect(splitBillTransaction.status).to.equal("SUCCESS");

  //   refNumber = splitBillTransaction.referenceNumber;

  //   const reqMoney = await prismaApi.requestMoney.findMany({
  //     where: { splitBillId: splitBillTransaction.id.toString() },
  //   });

  //   await checkSuccess({
  //     groupId: "splitbill",
  //     topic: "split_bill_payment_result",
  //     log: "Make Payment: From 01317577237 to 01999999999",
  //     amount: 100,
  //     message: {
  //       value: JSON.stringify({
  //         referenceNo: refNumber,
  //         status: "SUCCESSFUL",
  //         totalAmount: 100,
  //         note: "Dinner with friends",
  //         totalAmountPaid: 100,
  //         requestedTo: [
  //           { phone: "01711106485", amount: 50 },
  //           { phone: "01317577238", amount: 50 },
  //         ],
  //       }),
  //     },
  //     callback: async () => {
  //       const transactionFromDB = await prismaAccounting.transaction.findFirst({
  //         where: { referenceNo: refNumber },
  //       });

  //       expect(transactionFromDB).to.not.be.null;
  //       expect(transactionFromDB.status).to.equal("SUCCESSFUL");
  //       expect(transactionFromDB.amount).to.equal(100);

  //       const splitBillTransaction = await prismaApi.splitBill.findFirst({
  //         where: { requestReceiverNumber: "01999999999" },
  //       });

  //       expect(splitBillTransaction).to.not.be.null;
  //       expect(splitBillTransaction.status).to.equal("SUCCESS");
  //     },
  //   });
  // });

  // it("should show error if the merchant doesnt exist", async () => {
  //   const splitBillData = {
  //     totalAmount: 100,
  //     merchantNumber: "01787878787",
  //     requestedTo: [
  //       { phone: "01711106485", amount: 50 },
  //       { phone: "01317577238", amount: 50 },
  //     ],
  //     transactionTypeCode: "make-payment-001",
  //     note: "Dinner with friends",
  //   };

  //   await pactum
  //     .spec()
  //     .withBearerToken(tokenUser1)
  //     .withMethod("POST")
  //     .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.splitBill}`)
  //     .withJson(splitBillData)
  //     .expectStatus(400);
  // });

  it("should show error if the user requests in his own account for Split Bill", async () => {
    const splitBillData = {
      totalAmount: 100,
      merchantNumber: "01999999999",
      requestedTo: [
        { phone: "01317577237", amount: 50 },
        { phone: "01317577238", amount: 50 },
      ],
      transactionTypeCode: "make-payment-001",
      note: "Dinner with friends",
    };

    await pactum
      .spec()
      .withBearerToken(tokenUser1)
      .withMethod("POST")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.splitBill}`)
      .withJson(splitBillData)
      .expectStatus(500);
  });
});