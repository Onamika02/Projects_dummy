import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../../apiUrls.js";
import prismaAccounting from "../../utils/prismaAccountingClient.js";
import { generateToken } from "../../utils/generateJWT.js";
import { generateUserToken } from "../../utils/userTokenJWT.js";
import { clearAllDatabases } from "../../utils/cleanDB.js";
import { createBasicChartOfAccounts } from "../../utils/setUpCoA.js";
import { createUserAccounts } from "../../utils/setupAccounts.js";
import { createAppUserAccounts } from "../../utils/setupAppUser.js";

describe("Account Details GET API: apiUrl", async function () {
  //this.timeout(10000);
  let token;

  before(async () => {
    await prismaAccounting.$connect();
  });

  beforeEach(async () => {
    await clearAllDatabases();
    await createAppUserAccounts();
    const chartOfAccounts = await createBasicChartOfAccounts();
    await createUserAccounts(chartOfAccounts);
  });

  after(async () => {
    await prismaAccounting.$disconnect();
  });

  it("should get user details successfully", async () => {
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

    const COA = await prismaAccounting.chartOfAccount.findUnique({
      where: { code: "customer-01" },
    });

    const createdAccount = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01317577237" },
    });

    const response = await pactum
      .spec()
      .withMethod("GET")
      .withBearerToken(token)
      .withPath(
        `${ApiUrls.apiBaseUrl}${ApiUrls.getAccountDetails}${createdAccount.id}`
      )
      .expectStatus(200);

    expect(response.body.id).to.equal(createdAccount.id);
    expect(response.body.name).to.equal(createdAccount.accountName);
    expect(response.body.identifier).to.equal(createdAccount.identifier);
    expect(response.body.status).to.equal(createdAccount.status);
    expect(response.body.chartofaccount.id).to.equal(COA.id);
    expect(response.body.dailylimit.count).to.equal(
      createdAccount.dailyLimitCount
    );
    expect(response.body.monthlylimit.count).to.equal(
      createdAccount.monthlyLimitCount
    );
    expect(response.body.dailylimit.amount).to.equal(
      createdAccount.dailyLimitAmount
    );
    expect(response.body.monthlylimit.amount).to.equal(
      createdAccount.monthlyLimitAmount
    );
    expect(response.body.minwalletamount).to.equal(
      createdAccount.minWalletAmount
    );
    expect(response.body.weeklylimit.count).to.equal(
      createdAccount.weeklyLimitCount
    );
    expect(response.body.weeklylimit.amount).to.equal(
      createdAccount.weeklyLimitAmount
    );
    expect(response.body.maxwalletamount).to.equal(
      createdAccount.maxWalletAmount
    );
    expect(response.body.aitpercentage).to.equal(2.5);
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
      status: "FULL_ACTIVE",
      chartOfAccount: {
        connect: {
          id: CoAID,
        },
      },
    };

    const createdAccount = await prismaAccounting.UserAccount.create({
      data: testData,
    });
    const accountID = createdAccount.id;
    const response = await pactum
      .spec()
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.getAccountDetails}${accountID}`)
      .expectStatus(403);
  });

  it("should show error if the account ID does not exist", async () => {
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

    const accountID = 111;

    const response = await pactum
      .spec()
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.getAccountDetails}${accountID}`)
      .withBearerToken(token)
      .expectStatus(404);
  });
});
