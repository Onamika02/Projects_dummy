import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../../apiUrls.js";
import prismaAccounting from "../../utils/prismaAccountingClient.js";
import { generateToken } from "../../utils/generateJWT.js";
import userAccountsDb from "../../utils/userAccount.js";

describe("Account LIST GET API: apiUrl", async () => {
  before(async () => {
    await prismaAccounting.$connect();
  });

  let token;
  beforeEach(async () => {
    await prismaAccounting.Ledger.deleteMany({});
    await prismaAccounting.Transaction.deleteMany({});
    await prismaAccounting.TransactionTypeChangeLog.deleteMany({});
    await prismaAccounting.TransactionType.deleteMany({});
    await prismaAccounting. transactionLegLog.deleteMany({});
    await prismaAccounting.TransactionLeg.deleteMany({});
    await prismaAccounting.UserAccount.deleteMany({});
    await prismaAccounting.ChartOfAccountLog.deleteMany({});
    await prismaAccounting.ChartOfAccount.deleteMany({});
  });
  after(async () => {
    await prismaAccounting.$disconnect();
  });
  it("should get user accounts LIST successfully", async () => {
    const adminUser = {
      email: "admin@ppay.com",
      roles: "Admin",
      adminRole: "ADMIN",
    };
    token = generateToken(
      1,
      adminUser.email,
      adminUser.roles,
      adminUser.adminRole
    );

    const chartOfAccountData = {
      name: "Sample Account Name",
      adminId: 1,
      description: "This is a description for the chart of account.",
      transactionType: "SYSTEM",
      headType: "ASSET",
      code: "ACC-001",
      onlyParent: false,
    };

    const chartOfAccount = await prismaAccounting.ChartOfAccount.create({
      data: chartOfAccountData,
    });

    const CoAID = chartOfAccount.id;

    const testData1 = {
      accountName: "John",
      identifier: "01711699870",
      status: "FULL_ACTIVE",
      chartOfAccount_id: CoAID,
    };

    const testData2 = {
      accountName: "John Doe",
      identifier: "01711699871",
      status: "FULL_ACTIVE",
      chartOfAccount_id: CoAID,
    };

    const testData3 = {
      accountName: "Johny Depp",
      identifier: "01711699879",
      status: "FULL_ACTIVE",
      chartOfAccount_id: CoAID,
    };

    await prismaAccounting.UserAccount.createMany({
      data: [testData1, testData2, testData3],
    });

    const response = await pactum
      .spec()
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.getAccountList}`)
      .withBearerToken(token)
      .expectStatus(200);

    expect(response.body.accounts).to.have.lengthOf(3);

    expect(response.body.accounts[0].name).to.equal("John");
    expect(response.body.accounts[0].identifier).to.equal("01711699870");
    expect(response.body.accounts[0].chartofaccount.id).to.equal(CoAID);
    expect(response.body.accounts[0].chartofaccount.name).to.equal(
      "Sample Account Name"
    );
    expect(response.body.accounts[0].status).to.equal("FULL_ACTIVE");

    expect(response.body.accounts[1].name).to.equal("John Doe");
    expect(response.body.accounts[1].identifier).to.equal("01711699871");
    expect(response.body.accounts[1].chartofaccount.name).to.equal(
      "Sample Account Name"
    );
    expect(response.body.accounts[1].status).to.equal("FULL_ACTIVE");

    expect(response.body.accounts[2].name).to.equal("Johny Depp");
    expect(response.body.accounts[2].identifier).to.equal("01711699879");
    expect(response.body.accounts[2].chartofaccount.name).to.equal(
      "Sample Account Name"
    );
    expect(response.body.accounts[2].status).to.equal("FULL_ACTIVE");
  });

  it("should show error if the user is not logged in", async () => {
    const chartOfAccountData = {
      name: "Sample Account Name",
      adminId: 1,
      description: "This is a description for the chart of account.",
      transactionType: "SYSTEM",
      headType: "ASSET",
      code: "ACC-001",
      onlyParent: false,
    };

    const chartOfAccount = await prismaAccounting.ChartOfAccount.create({
      data: chartOfAccountData,
    });

    const CoAID = chartOfAccount.id;

    const testData = {
      accountName: "John",
      identifier: "01711699870",
      chartOfAccount_id: CoAID,
    };

    await prismaAccounting.UserAccount.createMany({
      data: testData,
    });

    const response = await pactum
      .spec()
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.getAccountList}`)
      .expectStatus(403);
  });

  it("should show only 10 accounts in the account List ", async () => {
    await userAccountsDb();

    const users = await prismaAccounting.UserAccount.findMany({});

    const response = await pactum
      .spec()
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.getAccountList}`)
      .withBearerToken(token)
      .expectStatus(200);

    expect(response.body.accounts).to.have.lengthOf(10);
    expect(response.body.pagination.currentpage).to.equal(0);
    expect(response.body.pagination.currentpagetotalcount).to.equal(10);
    expect(response.body.pagination.hasnext).to.equal(true);
  });
  it("should show the remaining accounts in next page when the account list exceeds the count shown in one page", async () => {
    await userAccountsDb();

    const users = await prismaAccounting.UserAccount.findMany({});

    const response = await pactum
      .spec()
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.getAccountList}?page=1`)
      .withBearerToken(token)
      .expectStatus(200);

    expect(response.body.accounts).to.have.lengthOf(2);
    expect(response.body.pagination.currentpage).to.equal(1);
    expect(response.body.pagination.currentpagetotalcount).to.equal(2);
    expect(response.body.pagination.hasnext).to.equal(false);

  });
});
