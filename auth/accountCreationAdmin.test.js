import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../apiUrls.js";
import prismaAccounting from "../utils/prismaAccountingClient.js";
import prismaAuth from "../utils/prismaAuthClient.js";
import { generateToken } from "../utils/generateJWT.js";


describe("Account Creation From Admin", async () => {
  let token;
  before(async () => {
    await prismaAuth.$connect();
    await prismaAccounting.$connect();
  });

  beforeEach(async () => {
    await prismaAccounting.ledger.deleteMany({});
    await prismaAccounting.transaction.deleteMany({});

    await prismaAccounting.transactionTypeChangeLog.deleteMany({});
    await prismaAccounting.transactionType.deleteMany({});

    await prismaAccounting.transactionLegLog.deleteMany({});
    await prismaAccounting.transactionLeg.deleteMany({});
    await prismaAccounting.accountLog.deleteMany({});
    await prismaAccounting.userAccount.deleteMany({});

    await prismaAccounting.chartOfAccountLog.deleteMany({});
    await prismaAccounting.chartOfAccount.deleteMany({});

    await prismaAuth.appUser.deleteMany({});
  });
  after(async () => {
    await prismaAccounting.$disconnect();
    await prismaAuth.$disconnect();
  });

  // it("should create user account successfully from Admin", async () => {
  //   const adminUser = {
  //     email: "admin@ppay.com",
  //     roles: "Admin",
  //     adminRole: "ADMIN",
  //   };
  //   token = generateToken(
  //     1,
  //     adminUser.email,
  //     adminUser.roles,
  //     adminUser.adminRole
  //   );

  //   const chartOfAccountData = {
  //     name: "Chart of Account 1",
  //     description: "Description for Account 1",
  //     transactionType: "SYSTEM",
  //     headType: "ASSET",
  //     code: "001",
  //     onlyParent: false,
  //     adminId: 1,
  //     minWalletAmount: 100,
  //     maxWalletAmount: 10000,
  //   };

  //   const chartOfAccount = await prismaAccounting.chartOfAccount.create({
  //     data: chartOfAccountData,
  //   });

  //   const chartOfAccountId = chartOfAccount.id;

  //   await pactum
  //     .spec()
  //     .withMethod("POST")
  //     .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.createAccountUrl}`)
  //     .withBearerToken(token)
  //     .withJson({
  //       chartOfAccountId: chartOfAccountId,
  //       accountName: "John",
  //       identifier: "01788448853",
  //       status: "FULL_ACTIVE",
  //     })
  //     .expectStatus(200);

  //   const allAccounts = await prismaAccounting.userAccount.findMany();

  //   const createdAccount = await prismaAccounting.userAccount.findUnique({
  //     where: { identifier: "01788448853" },
  //   });

  //   expect(createdAccount.identifier).to.equal("01788448853");
  //   expect(allAccounts.length).to.equal(1);
  //   expect(createdAccount.accountName).to.equal("John");
  //   expect(createdAccount.status).to.equal("FULL_ACTIVE");
  //   expect(createdAccount.chartOfAccount_id).to.equal(chartOfAccountId);
  //   expect(createdAccount.dailyLimitAmount).to.equal(null);
  //   expect(createdAccount.monthlyLimitAmount).to.equal(null);
  //   expect(createdAccount.monthlyLimitCount).to.equal(null);
  //   expect(createdAccount.weeklyLimitAmount).to.equal(null);
  //   expect(createdAccount.weeklyLimitCount).to.equal(null);
  //   expect(createdAccount.dailyLimitCount).to.equal(null);
  //   expect(createdAccount.maxWalletAmount).to.equal(null);
  //   expect(createdAccount.minWalletAmount).to.equal(null);
  // });

  it("should show error when identifier is not given", async () => {
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
      dailyLimitAmount: 100,
    };

    const chartOfAccount = await prismaAccounting.chartOfAccount.create({
      data: chartOfAccountData,
    });

    const chartOfAccountId = chartOfAccount.id;

    const testData = {
      accountName: "John",
      status: "FULL_ACTIVE",
      identifier: "01788448853",
      chartOfAccountId: chartOfAccountId,
    };

    await pactum
      .spec()
      .withMethod("POST")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.createAccountUrl}`)
      .withBearerToken(token)
      .withJson({
        accountName: testData.accountName,
        status: testData.status,
        chartOfAccountId: testData.chartOfAccountId,
      })
      .expectStatus(400);
  });

  // it("should show error code with already existing identifier in admin", async () => {
  //   const adminUser = {
  //     email: "admin@ppay.com",
  //     roles: "Admin",
  //     adminRole: "ADMIN",
  //   };
  //   token = generateToken(
  //     1,
  //     adminUser.email,
  //     adminUser.roles,
  //     adminUser.adminRole
  //   );

  //   const chartOfAccountData = {
  //     name: "Sample Account Name",
  //     adminId: 1,
  //     description: "This is a description for the chart of account.",
  //     transactionType: "SYSTEM",
  //     headType: "LIABILITY",
  //     code: "ACC-001",
  //     onlyParent: false,
  //   };

  //   const chartOfAccount = await prismaAccounting.chartOfAccount.create({
  //     data: chartOfAccountData,
  //   });

  //   const chartOfAccountId = chartOfAccount.id;

  //   const testData = {
  //     accountName: "John Doe",
  //     identifier: "01788448853",
  //     status: "FULL_ACTIVE",
  //     dailyLimitAmount: 50000,
  //     dailyLimitCount: 200,
  //     monthlyLimitAmount: 5000000,
  //     monthlyLimitCount: 6000,
  //     maxWalletAmount: 1000000,
  //     minWalletAmount: 500,
  //     weeklyLimitAmount: 250000,
  //     weeklyLimitCount: 1000,
  //     chartOfAccount_id: chartOfAccount.id,
  //   };

  //   await prismaAccounting.userAccount.create({
  //     data: testData,
  //   });

  //   await pactum
  //     .spec()
  //     .withMethod("POST")
  //     .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.createAccountUrl}`)
  //     .withBearerToken(token)
  //     .withJson({
  //       chartOfAccountId: chartOfAccountId,
  //       accountName: testData.accountName,
  //       identifier: testData.identifier,
  //       status: testData.status,
  //     })
  //     .expectStatus(409);

  //   const result = await prismaAccounting.userAccount.findMany({});
  //   expect(result.length).to.equal(1);
  // });

  // it("should show error if chart of account Id is not found", async () => {
  //   const adminUser = {
  //     email: "admin@ppay.com",
  //     roles: "Admin",
  //     adminRole: "ADMIN",
  //   };
  //   token = generateToken(
  //     1,
  //     adminUser.email,
  //     adminUser.roles,
  //     adminUser.adminRole
  //   );

  //   const chartOfAccountData = {
  //     name: "Sample Account Name",
  //     adminId: 1,
  //     description: "This is a description for the chart of account.",
  //     transactionType: "SYSTEM",
  //     headType: "ASSET",
  //     code: "ACC-001",
  //     onlyParent: false,
  //   };

  //   const chartOfAccount = await prismaAccounting.chartOfAccount.create({
  //     data: chartOfAccountData,
  //   });

  //   const chartOfAccountId = chartOfAccount.id;

  //   const response = await pactum
  //     .spec()
  //     .withMethod("POST")
  //     .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.createAccountUrl}`)
  //     .withBearerToken(token)
  //     .withJson({
  //       chartOfAccountId: 9999,
  //       accountName: "Anna",
  //       identifier: "01788448853",
  //       status: "LIMITED_ACTIVE",
  //     })
  //     .expectStatus(404);
  // });

  it("should check the logs for creating a account", async () => {
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
      dailyLimitAmount: 100,
    };

    const chartOfAccount = await prismaAccounting.chartOfAccount.create({
      data: chartOfAccountData,
    });

    const chartOfAccountId = chartOfAccount.id;

    await pactum
      .spec()
      .withMethod("POST")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.createAccountUrl}`)
      .withBearerToken(token)
      .withJson({
        chartOfAccountId: chartOfAccountId,
        accountName: "John",
        identifier: "01788448853",
        status: "FULL_ACTIVE",
      })
      .expectStatus(200);

    const createdAccount = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01788448853" },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    const logEntry = await prismaAccounting.accountLog.findMany({});

    expect(logEntry.length).to.equal(1);
  });
});
