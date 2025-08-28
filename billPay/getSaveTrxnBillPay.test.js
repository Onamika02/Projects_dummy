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

describe("Get Saved Transaction After Utility Pay", async () => {
  let userId1,
    tokenUser1,
    customerAccount1,
    billerId,
    billPayDistributorAccount,
    utilityPayTypeId,
    billPayDistributorAccountForWater,
    billerIdForWater,
    billPayDistributorAccountForGas,
    billerIdForGas;

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

    const utilityPayType = await prismaAccounting.transactionType.findUnique({
      where: { transactionCode: "1004" },
    });
    utilityPayTypeId = utilityPayType.id;
    await createUserAccounts(chartOfAccounts);

    customerAccount1 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01317577237" },
    });

    billPayDistributorAccount = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "polli-bidyut-01" },
    });

    billerId = await prismaApi.billerCategories.findFirst({
      where: {
        accountIdentifier: "polli-bidyut-01",
        billerType: "ELECTRICITY",
      },
    });

    billPayDistributorAccountForWater =
      await prismaAccounting.userAccount.findUnique({
        where: { identifier: "wasa-01" },
      });

    billerIdForWater = await prismaApi.billerCategories.findFirst({
      where: {
        accountIdentifier: "wasa-01",
        billerType: "WATER",
      },
    });

    billPayDistributorAccountForGas =
      await prismaAccounting.userAccount.findUnique({
        where: { identifier: "titas-gas-01" },
      });

    billerIdForGas = await prismaApi.billerCategories.findFirst({
      where: {
        accountIdentifier: "titas-gas-01",
        billerType: "GAS",
      },
    });

    await addInitialBalance(customerAccount1, 100000);
  });

  async function insertUtilityPaySavedTransaction({
    amount,
    fromAccount,
    toAccount,
    transactionTypeId,
    billerId,
  }) {
    const trxn = await prismaAccounting.transaction.create({
      data: {
        amount,
        referenceNo: `ref-${Date.now()}`,
        status: "SUCCESSFUL",
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        transactionTypeId,
        note: `Utility Bill Pay to ${toAccount.identifier}`,
        log: `Money sent from ${fromAccount.identifier} to ${toAccount.identifier}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    if (trxn) {
      const existingSave = await prismaApi.utilitySave.findFirst({
        where: {
          fromAccount: fromAccount.identifier,
          toAccount: toAccount.identifier,
          billerId: billerId.id,
        },
      });

      if (!existingSave) {
        await prismaApi.utilitySave.create({
          data: {
            amount,
            fromAccount: fromAccount.identifier,
            toAccount: toAccount.identifier,
            transactionTypeCode: "1004",
            transactionTypeId,
            save: true,
            billerId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    }
  }

  it("should get saved Utility Pay transaction list", async () => {
    await insertUtilityPaySavedTransaction({
      amount: 1000,
      fromAccount: customerAccount1,
      toAccount: billPayDistributorAccount,
      transactionTypeId: utilityPayTypeId,
      billerId: billerId.id,
    });

    await pactum
      .spec()
      .withBearerToken(tokenUser1)
      .get(`${ApiUrls.apiBaseUrl}${ApiUrls.savetrxnUtilityPay}`)
      .expectStatus(200);

    const savedUtilityTrxns = await prismaApi.utilitySave.findMany({});

    expect(savedUtilityTrxns).to.have.lengthOf(1);
    expect(savedUtilityTrxns[0].amount.toString()).to.equal("1000");
    expect(savedUtilityTrxns[0].save).to.be.true;
    expect(savedUtilityTrxns[0].fromAccount).to.equal("01317577237");
    expect(savedUtilityTrxns[0].toAccount).to.equal("polli-bidyut-01");
    expect(savedUtilityTrxns[0].transactionTypeCode).to.equal("1004");
    expect(savedUtilityTrxns[0].billerId.toString()).to.equal(
      billerId.id.toString()
    );
  });

  it("should show the first Utility Pay transaction of bank account even after multiple transactions with the same bank account", async () => {
    await insertUtilityPaySavedTransaction({
      amount: 1000,
      fromAccount: customerAccount1,
      toAccount: billPayDistributorAccount,
      transactionTypeId: utilityPayTypeId,
      billerId: billerId.id,
    });
    await insertUtilityPaySavedTransaction({
      amount: 2000,
      fromAccount: customerAccount1,
      toAccount: billPayDistributorAccount,
      transactionTypeId: utilityPayTypeId,
      billerId: billerId.id,
    });

    await pactum
      .spec()
      .withBearerToken(tokenUser1)
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.savetrxnUtilityPay}`)
      .expectStatus(200)
      .returns("body");

    const savedUtilityTrxns = await prismaApi.utilitySave.findMany({});

    expect(savedUtilityTrxns).to.have.lengthOf(1);
    expect(savedUtilityTrxns[0].amount.toString()).to.equal("1000");
    expect(savedUtilityTrxns[0].toAccount).to.equal("polli-bidyut-01");
  });

  it("should save only one Utility Pay transaction per unique biller category", async () => {
    for (let i = 0; i < 10; i++) {
      await insertUtilityPaySavedTransaction({
        amount: 1000,
        fromAccount: customerAccount1,
        toAccount: billPayDistributorAccount,
        transactionTypeId: utilityPayTypeId,
        billerId: billerId.id,
      });
    }

    for (let i = 0; i < 10; i++) {
      await insertUtilityPaySavedTransaction({
        amount: 500,
        fromAccount: customerAccount1,
        toAccount: billPayDistributorAccountForWater,
        transactionTypeId: utilityPayTypeId,
        billerId: billerId.id,
      });
    }

    for (let i = 0; i < 10; i++) {
      await insertUtilityPaySavedTransaction({
        amount: 2000,
        fromAccount: customerAccount1,
        toAccount: billPayDistributorAccountForGas,
        transactionTypeId: utilityPayTypeId,
        billerId: billerId.id,
      });
    }

    await pactum
      .spec()
      .withBearerToken(tokenUser1)
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.savetrxnUtilityPay}`)
      .expectStatus(200);

    const savedUtilityTrxns = await prismaApi.utilitySave.findMany({});
    expect(savedUtilityTrxns).to.have.lengthOf(3);
  });
  it("should return saved Utility Pay transaction list with correct pagination and size", async () => {
    for (let i = 0; i < 10; i++) {
      await insertUtilityPaySavedTransaction({
        amount: 1000,
        fromAccount: customerAccount1,
        toAccount: billPayDistributorAccount,
        transactionTypeId: utilityPayTypeId,
        billerId: billerId.id,
      });
    }

    for (let i = 0; i < 10; i++) {
      await insertUtilityPaySavedTransaction({
        amount: 500,
        fromAccount: customerAccount1,
        toAccount: billPayDistributorAccountForWater,
        transactionTypeId: utilityPayTypeId,
        billerId: billerId.id,
      });
    }

    for (let i = 0; i < 10; i++) {
      await insertUtilityPaySavedTransaction({
        amount: 2000,
        fromAccount: customerAccount1,
        toAccount: billPayDistributorAccountForGas,
        transactionTypeId: utilityPayTypeId,
        billerId: billerId.id,
      });
    }

    const response = await pactum
      .spec()
      .withBearerToken(tokenUser1)
      .withMethod("GET")
      .withPath(
        `${ApiUrls.apiBaseUrl}${ApiUrls.savetrxnUtilityPay}?page=0&size=2`
      )
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
