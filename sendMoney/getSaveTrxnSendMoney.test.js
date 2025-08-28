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

describe("Get Saved Transaction After Send Money", async () => {
  let customer,
    amount,
    customerAccount1,
    customerAccount2,
    customerAccount3,
    customerAccount4,
    customerAccount5,
    customerAccount6,
    customerAccount7,
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
      where: { transactionCode: "1002" },
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
      where: { identifier: "01717084774" },
    });

    customerAccount4 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01717084775" },
    });

    customerAccount5 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01717084776" },
    });

    customerAccount6 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01717084777" },
    });

    customerAccount7 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01717084778" },
    });

    await addInitialBalance(customerAccount1, 50000);
  });

  async function insertSavedTransaction({
    fromAccount,
    toAccount,
    transactionTypeId,
    amount,
    userId,
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
        note: "Send Money to sender's account",
        log: `Money sent from ${fromAccount.identifier} to ${toAccount.identifier}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    if (trxn) {
      const existingSave = await prismaApi.sendMoneySave.findFirst({
        where: { toAccount: toAccount.identifier },
      });

      if (!existingSave) {
        await prismaApi.sendMoneySave.create({
          data: {
            amount,
            fromAccount: fromAccount.identifier,
            toAccount: toAccount.identifier,
            transactionTypeCode: "1002",
            transactionTypeId,
            save: true,
            receiverPhone: toAccount.identifier,
            userId: userId.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    }
  }

  it("should get saved transaction list", async () => {
    await insertSavedTransaction({
      fromAccount: customerAccount1,
      toAccount: customerAccount2,
      transactionTypeId: trxnTypeId,
      amount: 100,
      userId: userId1,
    });

    await pactum
      .spec()
      .withBearerToken(tokenUser1)
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.saveTrxnSendMoney}`)
      .expectStatus(200);

    const saveTrxnSendMoney = await prismaApi.sendMoneySave.findMany({});

    expect(saveTrxnSendMoney).to.have.lengthOf(1);
    expect(saveTrxnSendMoney[0].amount.toString()).to.equal("100");
    expect(saveTrxnSendMoney[0].save).to.be.true;
    expect(saveTrxnSendMoney[0].fromAccount).to.equal("01317577237");
    expect(saveTrxnSendMoney[0].toAccount).to.equal("01711106485");
    expect(saveTrxnSendMoney[0].transactionTypeCode).to.equal("1002");
    expect(saveTrxnSendMoney[0].userId.toString()).to.equal(
      userId1.id.toString()
    );
    expect(saveTrxnSendMoney[0].createdAt).to.not.be.null;
    expect(saveTrxnSendMoney[0].updatedAt).to.not.be.null;
    expect(saveTrxnSendMoney[0].receiverPhone).to.equal("01711106485");
  });

  it("should show the first transaction of ToAccount even after multiple transactions to the same account", async () => {
    await insertSavedTransaction({
      fromAccount: customerAccount1,
      toAccount: customerAccount2,
      transactionTypeId: trxnTypeId,
      amount: 100,
      userId: userId1,
    });

    await insertSavedTransaction({
      fromAccount: customerAccount1,
      toAccount: customerAccount2,
      transactionTypeId: trxnTypeId,
      amount: 200,
      userId: userId1,
    });

    await pactum
    .spec()
    .withBearerToken(tokenUser1)
    .withMethod("GET")
    .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.saveTrxnSendMoney}`)
    .expectStatus(200);

    const saveTrxnSendMoney = await prismaApi.sendMoneySave.findMany({});

    expect(saveTrxnSendMoney).to.have.lengthOf(1);
    expect(saveTrxnSendMoney[0].amount.toString()).to.equal("100");
  });

  it("should save only one transaction per unique toAccount", async () => {
    const uniqueToAccounts = [
      "01717084774",
      "01717084775",
      "01717084776",
      "01717084777",
      "01717084778",
    ];

    for (let i = 0; i < 10; i++) {
      await insertSavedTransaction({
        fromAccount: customerAccount1,
        toAccount: { identifier: uniqueToAccounts[i % 5] },
        transactionTypeId: trxnTypeId,
        amount: 100,
        userId: userId1,
      });
    }

    await pactum
      .spec()
      .withBearerToken(tokenUser1)
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.saveTrxnSendMoney}`)
      .expectStatus(200)
      .returns("body");

    const savedTransactions = await prismaApi.sendMoneySave.findMany({});
    expect(savedTransactions).to.have.lengthOf(5);

    const savedToAccounts = savedTransactions.map((txn) => txn.toAccount);
    expect(savedToAccounts).to.have.members(uniqueToAccounts);
  });

  it("should return correct pagination and size", async () => {
    const uniqueToAccounts = [
      "01717084774",
      "01717084775",
      "01717084776",
      "01717084777",
      "01717084778",
    ];

    for (let i = 0; i < 10; i++) {
      await insertSavedTransaction({
        fromAccount: customerAccount1,
        toAccount: { identifier: uniqueToAccounts[i % 5] },
        transactionTypeId: trxnTypeId,
        amount: 100,
        userId: userId1,
      });
    }

    const response = await pactum
      .spec()
      .withBearerToken(tokenUser1)
      .withMethod("GET")
      .withPath(
        `${ApiUrls.apiBaseUrl}${ApiUrls.saveTrxnSendMoney}?page=0&size=3`
      )
      .expectStatus(200);

    expect(response.body)
      .to.have.property("saveTransactions")
      .that.is.an("array");
    expect(response.body.saveTransactions).to.have.lengthOf(3);
    expect(response.body.saveTransactions[0].toAccount).to.equal("01717084778");
    expect(response.body.saveTransactions[1].toAccount).to.equal("01717084777");
    expect(response.body.saveTransactions[2].toAccount).to.equal("01717084776");
    expect(response.body.pagination.hasnext).to.equal(true);
    expect(response.body.pagination.currentpagetotalcount).to.equal(3);
    expect(response.body.pagination.totalcount).to.equal(5);
    expect(response.body.pagination.currentpage).to.equal(0);
  });
});
