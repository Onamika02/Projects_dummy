import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../../apiUrls.js";
import prismaAccounting from "../../utils/prismaAccountingClient.js";
import prismaAuth from "../../utils/prismaAuthClient.js";
import prismaApi from "../../utils/prismaApiClient.js";
import trxnDb from "../../utils/generatedataForTrxn.js";
import createLedgerEntries from "../../utils/generateLedger.js";
import CreateTransactions from "../../utils/generateTrxn.js";
import { generateUserToken } from "../../utils/userTokenJWT.js";
import { addInitialBalance } from "../../utils/addInitialBalance.js";
import { clearAllDatabases } from "../../utils/cleanDB.js";
import { createBasicChartOfAccounts } from "../../utils/setUpCoA.js";
import { createUserAccounts } from "../../utils/setupAccounts.js";
import { setupTransactionTypes } from "../../utils/setUpTypes.js";
import { createAppUserAccounts } from "../../utils/setupAppUser.js";

describe("Get Balance Successfully after Transactions", async () => {
  let customerAccount1,
    customerAccount2,
    customerAccount3,
    type,
    tokenUser1,
    tokenUser2,
    tokenUser3;

  before(async () => {
    await prismaAuth.$connect();
    await prismaAccounting.$connect();
    await prismaApi.$connect();
  });

  after(async () => {
    await prismaAccounting.$disconnect();
    await prismaAuth.$disconnect();
    await prismaApi.$disconnect();
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

    tokenUser1 = generateUserToken(userId1.id, "01317577237", "USER");
    tokenUser2 = generateUserToken(userId2.id, "01711106485", "USER");
    tokenUser3 = generateUserToken(userId3.id, "01317577238", "USER");

    const chartOfAccounts = await createBasicChartOfAccounts();

    const customer = chartOfAccounts.find(
      (account) => account.code === "customer-01"
    );

    await setupTransactionTypes(chartOfAccounts);
    type = await prismaAccounting.transactionType.findUnique({
      where: { transactionCode: "1002" },
    });
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
  });

  it("should show account balance after initial Transaction", async () => {
    await addInitialBalance(customerAccount1, 10000);
    await addInitialBalance(customerAccount2, 10000);
    await addInitialBalance(customerAccount3, 10000);

    const responseBalanceForAcc1 = await pactum
      .spec()
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.getAccountbalance}`)
      .withBearerToken(tokenUser1)
      .expectStatus(200);

    const responseBalanceForAcc2 = await pactum
      .spec()
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.getAccountbalance}`)
      .withBearerToken(tokenUser2)
      .expectStatus(200);

    const responseBalanceForAcc3 = await pactum
      .spec()
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.getAccountbalance}`)
      .withBearerToken(tokenUser3)
      .expectStatus(200);

    expect(responseBalanceForAcc1.body.balance).to.equal(10000);
    expect(responseBalanceForAcc2.body.balance).to.equal(10000);
    expect(responseBalanceForAcc3.body.balance).to.equal(10000);
  });

  it("should show balance correctly after multiple transactions", async () => {
    let initialAmount = 1000;

    await addInitialBalance(customerAccount1, initialAmount);
    await addInitialBalance(customerAccount2, initialAmount);
    await addInitialBalance(customerAccount3, initialAmount);

    let amounts = [100, 100, 50, 65, 88];
    let acc1balance = 597;
    let acc2balance = 1403;

    const transactionsFromAcc1toAcc2 = await CreateTransactions(
      customerAccount1,
      customerAccount2,
      amounts,
      type
    );

    await createLedgerEntries(transactionsFromAcc1toAcc2);

    const responseBalanceForAcc1 = await pactum
      .spec()
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.getAccountbalance}`)
      .withBearerToken(tokenUser1)
      .expectStatus(200);

    expect(responseBalanceForAcc1.body.balance).to.equal(597);

    const responseBalanceForAcc2 = await pactum
      .spec()
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.getAccountbalance}`)
      .withBearerToken(tokenUser2)
      .expectStatus(200);

    expect(responseBalanceForAcc2.body.balance).to.equal(1403);

    let amounts2 = [50, 300, 200, 20, 10];
    let newBalanceForAcc2 = 1983;
    let newBalanceForAcc3 = 420;

    const transactionsFromAcc3toAcc2 = await CreateTransactions(
      customerAccount3,
      customerAccount2,
      amounts2,
      type
    );

    await createLedgerEntries(transactionsFromAcc3toAcc2);

    const responseBalanceForAcc2afterTrxn = await pactum
      .spec()
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.getAccountbalance}`)
      .withBearerToken(tokenUser2)
      .expectStatus(200);

    expect(responseBalanceForAcc2afterTrxn.body.balance).to.equal(2386);

    const responseBalanceForAcc3 = await pactum
      .spec()
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.getAccountbalance}`)
      .withBearerToken(tokenUser3)
      .expectStatus(200);

    expect(responseBalanceForAcc3.body.balance).to.equal(420);
  });
});
