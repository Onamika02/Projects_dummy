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
import { addInitialBalance } from "../utils/addInitialBalance.js";
import { createAppUserAccounts } from "../utils/setupAppUser.js";

describe("Get Saved Transaction After Make Payment", async () => {
  
  let customer,
    amount,
    customerAccount1,
    merchantAccount1,
    merchantAccount2,
    merchantAccount3,
    merchantAccount4,
    type,
    userId1,
    userId2,
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

    userId1 = await prismaAuth.appUser.findFirst({
      where: {
        phone: "01317577237",
      },
    });

    userId2 = await prismaAuth.appUser.findFirst({
      where: {
        phone: "01711106485",
      },
    });

    tokenUser1 = generateUserToken(userId1.id, "01317577237", "USER");
    tokenUser2 = generateUserToken(userId2.id, "01711106485", "USER");

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

    merchantAccount1 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01999999999" },
    });
    merchantAccount2 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01999999888" },
    });
    merchantAccount3 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01999999880" },
    });
    merchantAccount4 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01999999777" },
    });

    await addInitialBalance(customerAccount1, 50000);
  });

  async function insertSavedTransaction({
    fromAccount,
    toAccount,
    transactionTypeId,
    transactionTypeCode,
    amount,
    agentMobile,
    paymentId,
  }) {
    const toAccountRecord = await prismaAccounting.userAccount.findUnique({
      where: { identifier: toAccount.identifier },
    });
  
    const trxn = await prismaAccounting.transaction.create({
      data: {
        amount,
        referenceNo: "ref-" + Date.now(),
        status: "SUCCESSFUL",
        fromAccountId: fromAccount.id,
        toAccountId: toAccountRecord.id,
        transactionTypeId,
        note: "Make Payment to merchant's account",
        log: `Money sent from ${fromAccount.identifier} to ${toAccount.identifier}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  
    const trxnInPayment = await prismaApi.payment.create({
      data: {
        agentMobile: toAccount.identifier,
        amount,
        fromAccount: fromAccount.identifier,
        toAccount: toAccountRecord.identifier,
        status: "SUCCESS",
        transactionTypeId,
        save: true,
        userId: userId1.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  
    if (trxnInPayment && trxn) {
      
      const existingSave = await prismaApi.paymentSave.findFirst({
        where: { 
          toAccount: toAccount.identifier,
          fromAccount: fromAccount.identifier 
        },
      });
  
      if (!existingSave) {
        await prismaApi.paymentSave.create({
          data: {
            amount,
            fromAccount: fromAccount.identifier,
            toAccount: toAccount.identifier,
            transactionTypeCode: "make-payment-001",
            transactionTypeId,
            save: true,
            paymentId: trxnInPayment.id,
            agentMobile: toAccount.identifier,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    }
  }

  it("should get saved transaction list for Payment", async () => {
    await insertSavedTransaction({
      fromAccount: customerAccount1,
      toAccount: merchantAccount1,
      transactionTypeId: trxnTypeId,
      transactionTypeCode: "make-payment-001",
      amount: 100,
      agentMobile: merchantAccount1.identifier,
    });

    await pactum
      .spec()
      .withBearerToken(tokenUser1)
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.savetrxnPayment}`)
      .expectStatus(200);

    const paymentID = await prismaApi.payment.findFirst({
      where: {
        agentMobile: merchantAccount1.identifier,
      },
    });

    const saveTrxnMakePayment = await prismaApi.paymentSave.findMany({});

    expect(saveTrxnMakePayment).to.have.lengthOf(1);
    expect(saveTrxnMakePayment[0].amount.toString()).to.equal("100");
    expect(saveTrxnMakePayment[0].save).to.be.true;
    expect(saveTrxnMakePayment[0].fromAccount).to.equal("01317577237");
    expect(saveTrxnMakePayment[0].toAccount).to.equal("01999999999");
    expect(saveTrxnMakePayment[0].transactionTypeCode).to.equal(
      "make-payment-001"
    );
    expect(saveTrxnMakePayment[0].transactionTypeId).to.equal(trxnTypeId);
    expect(saveTrxnMakePayment[0].createdAt).to.not.be.null;
    expect(saveTrxnMakePayment[0].updatedAt).to.not.be.null;
    expect(saveTrxnMakePayment[0].agentMobile).to.equal("01999999999");
    expect(saveTrxnMakePayment[0].paymentId).to.equal(paymentID.id);
  });

  it("should show the first transaction of ToAccount even after multiple transactions to the same account", async () => {
    await insertSavedTransaction({
      fromAccount: customerAccount1,
      toAccount: merchantAccount1,
      transactionTypeId: trxnTypeId,
      transactionTypeCode: "make-payment-001",
      amount: 100,
      agentMobile: merchantAccount1.identifier,
    });
    await insertSavedTransaction({
      fromAccount: customerAccount1,
      toAccount: merchantAccount1,
      transactionTypeId: trxnTypeId,
      transactionTypeCode: "make-payment-001",
      amount: 500,
      agentMobile: merchantAccount1.identifier,
    });

    await pactum
      .spec()
      .withBearerToken(tokenUser1)
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.savetrxnPayment}`)
      .expectStatus(200);

    const paymentID = await prismaApi.payment.findFirst({
      where: {
        agentMobile: merchantAccount1.identifier,
      },
    });

    const saveTrxnMakePayment = await prismaApi.paymentSave.findMany({});

    expect(saveTrxnMakePayment).to.have.lengthOf(1);
    expect(saveTrxnMakePayment[0].amount.toString()).to.equal("100");
    expect(saveTrxnMakePayment[0].paymentId).to.equal(paymentID.id);
  });

  it("should save only one transaction per unique toAccount", async () => {
    const uniqueMerchantAccounts = [
      { identifier: "01999999999" },
      { identifier: "01999999888" },
      { identifier: "01999999880" },
      { identifier: "01999999777" },
    ];

    for (let i = 0; i < 10; i++) {
      await insertSavedTransaction({
        fromAccount: customerAccount1,
        toAccount: uniqueMerchantAccounts[i % 4],
        transactionTypeId: trxnTypeId,
        transactionTypeCode: "make-payment-001",
        amount: 100,
        agentMobile: merchantAccount1.identifier,
      });
    }

    await pactum
      .spec()
      .withBearerToken(tokenUser1)
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.savetrxnPayment}`)
      .expectStatus(200);

    const savedTransactions = await prismaApi.paymentSave.findMany({}); 
    expect(savedTransactions).to.have.lengthOf(4);

    const savedToAccounts = savedTransactions.map((txn) => txn.toAccount);
    const uniqueIdentifiers = uniqueMerchantAccounts.map(acc => acc.identifier);
    expect(savedToAccounts).to.have.members(uniqueIdentifiers);
  });
  it("should return correct pagination and size", async () => {
    const uniqueMerchantAccounts = [
      { identifier: "01999999999" },
      { identifier: "01999999888" },
      { identifier: "01999999880" },
      { identifier: "01999999777" },
    ];

    for (let i = 0; i < 10; i++) {
      await insertSavedTransaction({
        fromAccount: customerAccount1,
        toAccount: uniqueMerchantAccounts[i % 4],
        transactionTypeId: trxnTypeId,
        transactionTypeCode: "make-payment-001",
        amount: 100,
        agentMobile: merchantAccount1.identifier,
      });
    }

    const response = await pactum
    .spec()
    .withBearerToken(tokenUser1)
    .withMethod("GET")
    .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.savetrxnPayment}?page=0&size=3`)
    .expectStatus(200);


    expect(response.body)
      .to.have.property("saveTransactions")
      .that.is.an("array");
    expect(response.body.saveTransactions).to.have.lengthOf(3);
    expect(response.body.saveTransactions[0].toAccount).to.equal("01999999777");
    expect(response.body.saveTransactions[1].toAccount).to.equal("01999999880");
    expect(response.body.saveTransactions[2].toAccount).to.equal("01999999888");
    expect(response.body.pagination.hasnext).to.equal(true);
    expect(response.body.pagination.currentpagetotalcount).to.equal(3);
    expect(response.body.pagination.totalcount).to.equal(4);
    expect(response.body.pagination.currentpage).to.equal(0);
  });
});
