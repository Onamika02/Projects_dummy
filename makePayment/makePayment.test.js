import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../apiUrls.js";
import prismaAccounting from "../utils/prismaAccountingClient.js";
import { generateUserToken } from "../utils/userTokenJWT.js";
import prismaAuth from "../utils/prismaAuthClient.js";
import prismaApi from "../utils/prismaApiClient.js";
import { clearAllDatabases } from "../utils/cleanDB.js";
import { createBasicChartOfAccounts } from "../utils/setUpCoA.js";
import { createUserAccounts } from "../utils/setupAccounts.js";
import { setupTransactionTypes } from "../utils/setUpTypes.js";
import { runTransactionTests, checkSuccess } from "../utils/doTransaction.js";
import { addInitialBalance } from "../utils/addInitialBalance.js";
import { createAppUserAccounts } from "../utils/setupAppUser.js";


describe("API Check: Make Payment(POST)", function () {
  this.timeout(30000);

  let token,
    customer,
    merchant,
    topUpProvider,
    sender,
    receiver, maxwallet,
    dailyLimitAmountUser,
    onholdUser,
    gp,
    teletalk,
    banglalink,
    userId,
    consumer;
  let isConsumerRunning = false;
  let messageReceived = false;
  const validTopUpAmount = 200;

  before(async function () {
    await prismaAuth.$connect();
    await prismaAccounting.$connect();
    await prismaApi.$connect();
  });

  beforeEach(async () => {
    await clearAllDatabases();
    await createAppUserAccounts();

    userId = await prismaAuth.appUser.findFirst({
      where: {
        phone: "01317577237",
      },
    });
    token = generateUserToken(userId.id, "01317577237", "USER");
    const chartOfAccounts = await createBasicChartOfAccounts();

    customer = chartOfAccounts.find(
      (account) => account.code === "customer-01"
    );
    merchant = chartOfAccounts.find(
      (account) => account.code === "merchant-01"
    );
    await setupTransactionTypes(chartOfAccounts);
    await createUserAccounts(chartOfAccounts);

    sender = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01317577237" },
    });
    receiver = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01999999999" },
    });

    const type = await prismaAccounting.transactionType.findUnique({
      where: { transactionCode: "make-payment-001" },
    });

    await addInitialBalance(sender, 1000000);

  });

  after(async () => {
    sender = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01317577237" },
    });
    receiver = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01999999999" },
    });

    onholdUser = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01317577238" }
    });

    maxwallet = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01317577210" }
    });

    dailyLimitAmountUser = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01715170020" }
    });

    const testConfig = {
      baseUrl: ApiUrls.apiBaseUrl,
      endpoint: ApiUrls.doPayment,
      token: token,
      sender: sender,
      receiver: receiver,
      type: "Top Up",
      database: [prismaApi.payment],
      transactionTypeCode: "make-payment-001",
      userId: userId.id,
      requestBody: {
        agentMobile: receiver.identifier,
        amount: 60,
        note: "khabar er taka",
        transactionTypeCode: "make-payment-001",
        referenceNo: "11111",
        save: true
      },
      requestBodyForNotFullActiveUser: {
        agentMobile: receiver.identifier,
        amount: 20,
        note: "khabar er taka",
        transactionTypeCode: "make-payment-001",
        referenceNo: "11111",
      },
      requestBodyForMinWalleAmount: {
        amount: 4,
        agentMobile: receiver.identifier,
        note: "requestBodyForMinWalleAmount",
        referenceNo: "1111111111",
        transactionTypeCode: "make-payment-001"
      },
      requestBodyForMaxWalleAmount: {
        amount: 200,
        agentMobile: receiver.identifier,
        note: "requestBodyForMaxWalleAmount",
        referenceNo: "1111111111",
        transactionTypeCode: "make-payment-001"

      },
      requestBodyForDailyLimitAmount: {
        amount: 200,
        agentMobile: receiver.identifier,
        note: "requestBodyForMaxWalleAmount",
        referenceNo: "1111111111",
        transactionTypeCode: "make-payment-001"
      },
      requestBodyForTypeMinAmount: {
        amount: 40,
        agentMobile: receiver.identifier,
        note: "requestBodyForTypeMinAmount",
        referenceNo: "1111111111",
        transactionTypeCode: "make-payment-001"
      },
      requestBodyForTypeMaxAmount: {
        amount: 1000000,
        agentMobile: receiver.identifier,
        note: "requestBodyForTypeMinAmount",
        referenceNo: "1111111111",
        transactionTypeCode: "make-payment-001"
      },
    }
    runTransactionTests(testConfig);

    await prismaAccounting.$disconnect();
    await prismaAuth.$disconnect();
    await prismaApi.$disconnect();
  });

  it("should return 200 for successful payment and save this payment", async function () {
    await pactum
      .spec()
      .post(`${ApiUrls.apiBaseUrl}${ApiUrls.doPayment}`)
      .withBearerToken(token)
      .withJson({
        agentMobile: receiver.identifier,
        amount: 200,
        note: "khabar er taka",
        transactionTypeCode: "make-payment-001",
        referenceNo: "11111",
        save: true
      })
      .expectStatus(200);

    userId = await prismaAuth.appUser.findFirst({
      where: {
        phone: "01317577237",
      },
    });

    // await checkSuccess({
    //   groupId: "topup",
    //   topic: "payment_result",
    //   log: 'Make Payment: From 01317577237 to 01999999999',
    //   amount: 200, resetToEarliest: true,
    //   callback: async () => {

    //     const paymentTable = await prismaApi.payment.findMany({
    //       where: { userId: userId.id },
    //     });

    //     expect(paymentTable[0].status).to.equal("SUCCESS");

    //     expect(paymentTable[0].userId).to.equal(userId.id);

    //     const savePayment = await prismaApi.paymentSave.findMany({
    //       where: { paymentId: paymentTable[0].id },
    //     });

    //     expect(savePayment).to.have.lengthOf(1);
    //     console.log(savePayment[0].note);
    //     expect(savePayment[0].note).to.equal("khabar er taka");
    //     expect(savePayment[0].paymentId).to.equal(paymentTable[0].id);
    //   }
    // })
  });
  
  it("should return 400 if the reciever is not merchant", async function () {
    await pactum
      .spec()
      .post(`${ApiUrls.apiBaseUrl}${ApiUrls.doPayment}`)
      .withBearerToken(token)
      .withJson({
        agentMobile: "01711106485",
        amount: 200,
        note: "khabar er taka",
        transactionTypeCode: "make-payment-001",
        referenceNo: "11111",
        save: true
      })
      .expectStatus(400);

      const apiTable = await prismaApi.payment.findMany({
        where: { userId: userId.id },
      });
      expect(apiTable[0].status).to.equal("TODO");
  });
});
