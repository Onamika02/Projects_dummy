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

describe("Get Saved Transaction After Top Up", async () => {
  let customer,
    amount,
    customerAccount1,
    userId1,
    userId2,
    tokenUser1,
    tokenUser2,
    TopUpTypeId,
    operatorAccountForGrameenphone,
    operatorIdForGrameenphone,
    operatorAccountForBanglalink,
    operatorIdForBanglalink,
    operatorAccountForTeletalk,
    operatorIdForTeletalk;

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
      where: { phone: "01317577237" },
    });

    tokenUser1 = generateUserToken(userId1.id, "01317577237", "USER");

    const chartOfAccounts = await createBasicChartOfAccounts();
    await setupTransactionTypes(chartOfAccounts);

    const TopUpType = await prismaAccounting.transactionType.findUnique({
      where: { transactionCode: "1005" },
    });
    TopUpTypeId = TopUpType.id;
    await createUserAccounts(chartOfAccounts);

    customerAccount1 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01317577237" },
    });

    operatorAccountForGrameenphone =
      await prismaAccounting.userAccount.findUnique({
        where: { identifier: "gp-wallet-01" },
      });

    operatorIdForGrameenphone = await prismaApi.operator.findFirst({
      where: {
        accountIdentifier: "gp-wallet-01",
      type: "GRAMEENPHONE",
      },
    });

    operatorAccountForBanglalink =
      await prismaAccounting.userAccount.findUnique({
        where: { identifier: "bl-wallet-01" },
      });

    operatorIdForBanglalink = await prismaApi.operator.findFirst({
      where: {
        accountIdentifier: "bl-wallet-01",
       type: "BANGLALINK",
      },
    });

    operatorAccountForTeletalk = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "teletalk-wallet-01" },
    });

    operatorIdForTeletalk = await prismaApi.operator.findFirst({
      where: {
        accountIdentifier: "teletalk-wallet-01",
       type: "TELETALK",
      },
    });

    await addInitialBalance(customerAccount1, 100000);
  });

  async function insertTopUpSavedTransaction({
    amount,
    fromAccount,
    toAccount,
    transactionTypeCode,
    transactionTypeId,
    operatorId,
    operatorType,
    topUpId,
  }) {
    const trxn = await prismaAccounting.transaction.create({
      data: {
        amount,
        referenceNo: `ref-${Date.now()}`,
        status: "SUCCESSFUL",
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        transactionTypeId,
        note: `Top Up Pay to ${toAccount.identifier}`,
        log: `Money sent from ${fromAccount.identifier} to ${toAccount.identifier}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const trxnInTopUp = await prismaApi.topUp.create({
      data: {
        amount,
        referenceNumber: `ref-${Date.now()}`,
        status: "SUCCESS",
        rechargeType: "PREPAID",
        fromAccount: fromAccount.identifier,
        toAccount: toAccount.identifier,
        userId: userId1.id,
        operatorId:operatorId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
        
    })

    if (trxn) {
      const existingSave = await prismaApi.topUpSave.findFirst({
        where: {
          fromAccount: fromAccount.identifier,
          toAccount: toAccount.identifier,
          operatorId: operatorId.id,
        },
      });

      if (!existingSave) {
        await prismaApi.topUpSave.create({
          data: {
            amount,
            fromAccount: fromAccount.identifier,
            toAccount: toAccount.identifier,
            transactionTypeCode: "1005",
            transactionTypeId,
            save: true,
            operatorId,
            operatorType,
            topUpId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    }
  }

  it("should get saved Top Up transaction list", async () => {

    await insertTopUpSavedTransaction({
      amount: 1000,
      fromAccount: customerAccount1,
      toAccount: operatorAccountForGrameenphone,
      transactionTypeId: TopUpTypeId,
      transactionTypeCode: "1005",
      operatorId: operatorIdForGrameenphone.id,
      operatorType: "GRAMEENPHONE",
      topUpId: 1,
    });

    await pactum
      .spec()
      .withBearerToken(tokenUser1)
      .get(`${ApiUrls.apiBaseUrl}${ApiUrls.savetrxnTopUp}`)
      .expectStatus(200);

    const savedTopUpTrxns = await prismaApi.topUpSave.findMany({});

    expect(savedTopUpTrxns).to.have.lengthOf(1);
    expect(savedTopUpTrxns[0].amount.toString()).to.equal("1000");
    expect(savedTopUpTrxns[0].save).to.be.true;
    expect(savedTopUpTrxns[0].fromAccount).to.equal("01317577237");
    expect(savedTopUpTrxns[0].toAccount).to.equal("gp-wallet-01");
    expect(savedTopUpTrxns[0].transactionTypeCode).to.equal("1005");
    expect(savedTopUpTrxns[0].operatorId.toString()).to.equal(
      operatorIdForGrameenphone.id.toString()
    );
  });

  it("should show the first Utility Pay transaction of bank account even after multiple transactions with the same bank account", async () => {
    await insertTopUpSavedTransaction({
      amount: 1000,
      fromAccount: customerAccount1,
      toAccount: operatorAccountForGrameenphone,
      transactionTypeId: TopUpTypeId,
      transactionTypeCode: "1005",
      operatorId: operatorIdForGrameenphone.id,
      operatorType: "GRAMEENPHONE",
      topUpId: 1,
    });

    await insertTopUpSavedTransaction({
      amount: 2000,
      fromAccount: customerAccount1,
      toAccount: operatorAccountForGrameenphone,
      transactionTypeId: TopUpTypeId,
      transactionTypeCode: "1005",
      operatorId: operatorIdForGrameenphone.id,
      operatorType: "GRAMEENPHONE",
      topUpId: 1,
    });


    await pactum
      .spec()
      .withBearerToken(tokenUser1)
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.savetrxnTopUp}`)
      .expectStatus(200)
      .returns("body");

    const savedTopUpTrxns = await prismaApi.topUpSave.findMany({});

    expect(savedTopUpTrxns).to.have.lengthOf(1);
    expect(savedTopUpTrxns[0].amount.toString()).to.equal("1000");
    expect(savedTopUpTrxns[0].toAccount).to.equal("gp-wallet-01");
  });
  it("should save only one add money transaction per unique bank account", async () => {

    for (let i = 0; i < 10; i++) {
      await insertTopUpSavedTransaction({
        amount: 2000,
        fromAccount: customerAccount1,
        toAccount: operatorAccountForBanglalink,
        transactionTypeId: TopUpTypeId,
        transactionTypeCode: "1005",
        operatorId: operatorIdForBanglalink.id,
        operatorType: "BANGLALINK",
        topUpId: 1,
      });
    }

    for (let i = 0; i < 10; i++) {
      await insertTopUpSavedTransaction({
        amount: 2000,
        fromAccount: customerAccount1,
        toAccount: operatorAccountForGrameenphone,
        transactionTypeId: TopUpTypeId,
        transactionTypeCode: "1005",
        operatorId: operatorIdForGrameenphone.id,
        operatorType: "GRAMEENPHONE",
        topUpId: 1,
      });
    }
    for (let i = 0; i < 10; i++) {
      await insertTopUpSavedTransaction({
        amount: 2000,
        fromAccount: customerAccount1,
        toAccount: operatorAccountForTeletalk,
        transactionTypeId: TopUpTypeId,
        transactionTypeCode: "1005",
        operatorId: operatorIdForTeletalk.id,
        operatorType: "TELETALK",
        topUpId: 1,
      });
    }

    await pactum
      .spec()
      .withBearerToken(tokenUser1)
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.savetrxnTopUp}`)
      .expectStatus(200)
      .returns("body");

    const savedTopUpTrxns = await prismaApi.topUpSave.findMany({});
    expect(savedTopUpTrxns).to.have.lengthOf(3);
  });

  it("should return saved add money transaction list with correct pagination and size", async () => {
    
      await insertTopUpSavedTransaction({
        amount: 2000,
        fromAccount: customerAccount1,
        toAccount: operatorAccountForBanglalink,
        transactionTypeId: TopUpTypeId,
        transactionTypeCode: "1005",
        operatorId: operatorIdForBanglalink.id,
        operatorType: "BANGLALINK",
        topUpId: 1,
      });

      await insertTopUpSavedTransaction({
        amount: 2000,
        fromAccount: customerAccount1,
        toAccount: operatorAccountForGrameenphone,
        transactionTypeId: TopUpTypeId,
        transactionTypeCode: "1005",
        operatorId: operatorIdForGrameenphone.id,
        operatorType: "GRAMEENPHONE",
        topUpId: 1,
      });
    
      await insertTopUpSavedTransaction({
        amount: 1000,
        fromAccount: customerAccount1,
        toAccount: operatorAccountForTeletalk,
        transactionTypeId: TopUpTypeId,
        transactionTypeCode: "1005",
        operatorId: operatorIdForTeletalk.id,
        operatorType: "TELETALK",
        topUpId: 1,
      });

    const response = await pactum
      .spec()
      .withBearerToken(tokenUser1)
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.savetrxnTopUp}?page=0&size=2`)
      .expectStatus(200);

    expect(response.body)
      .to.have.property("saveTransactions")
      .that.is.an("array");
    expect(response.body.saveTransactions).to.have.lengthOf(2);
    expect(response.body.pagination.hasnext).to.equal(true);
    expect(response.body.pagination.currentpagetotalcount).to.equal(2);
    expect(response.body.pagination.totalcount).to.equal(3);
    expect(response.body.pagination.currentpage).to.equal(0);
  });
});
