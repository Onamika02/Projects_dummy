import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../../apiUrls.js";
import prismaAccounting from "../../utils/prismaAccountingClient.js";
import { generateToken } from "../../utils/generateJWT.js";
import { generateUserToken } from "../../utils/userTokenJWT.js";

let token;

describe("Account Change Status PUT API", async () => {
  before(async () => {
    await prismaAccounting.$connect();
  });

  beforeEach(async () => {
    await prismaAccounting.Ledger.deleteMany({});
    await prismaAccounting.Transaction.deleteMany({});

    await prismaAccounting.TransactionTypeChangeLog.deleteMany({});
    await prismaAccounting.TransactionType.deleteMany({});

    await prismaAccounting. transactionLegLog.deleteMany({});
    await prismaAccounting.TransactionLeg.deleteMany({});

    await prismaAccounting.UserAccount.deleteMany({});
    await prismaAccounting.AccountLog.deleteMany({});

    await prismaAccounting.ChartOfAccountLog.deleteMany({});
    await prismaAccounting.ChartOfAccount.deleteMany({});
  });

  after(async () => {
    await prismaAccounting.$disconnect();
  });

  it("should change account status successfully", async () => {
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

    const appUser = {
      phoneNumber: "01747538382"
    };
   let token2 = generateUserToken(1, appUser.phoneNumber, "USER");

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

    const AccountStatusChangeData = {
      status: "LIMITED_ACTIVE",
    };

    await pactum
      .spec()
      .withMethod("PUT")
      .withPath(
        `${ApiUrls.apiBaseUrl}${ApiUrls.changeAccountStatus}${accountID}/status-update`
      )
      .withBearerToken(token)
      .withJson(AccountStatusChangeData)
      .expectStatus(200)
      .inspect();

      await new Promise(resolve => setTimeout(resolve, 50));
          const updatedAccountStatus = await prismaAccounting.UserAccount.findUnique({
      where: { id: accountID },
    });
    
    expect(updatedAccountStatus).to.not.be.null;

    expect(updatedAccountStatus.status).to.equal(
      AccountStatusChangeData.status
    );
  });
  it("should check logs for updating status", async () => {
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

    const testData = {
      accountName: "John",
      identifier: "01711699870",
      status: "LIMITED_ACTIVE",
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

    const AccountStatusChangeData = {
      status: "FULL_ACTIVE",
    };

    await pactum
      .spec()
      .withMethod("PUT")
      .withPath(
        `${ApiUrls.apiBaseUrl}${ApiUrls.changeAccountStatus}${accountID}/status-update`
      )
      .withBearerToken(token)
      .withJson(AccountStatusChangeData)
      .expectStatus(200);

    await new Promise(resolve => setTimeout(resolve, 50));

    const logs = await prismaAccounting.AccountLog.findMany({
      where: {
        accountId:accountID,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 1,
    });

    expect(logs).to.not.be.empty;
    const lastLog = logs[0];
    expect(lastLog).to.not.be.null;

    expect(lastLog).to.have.property("accountId");
    expect(lastLog.accountId.toString()).to.equal(accountID.toString());

    expect(lastLog).to.have.property("status");
    expect(lastLog.status).to.equal(AccountStatusChangeData.status);

    const updatedAccount = await prismaAccounting.UserAccount.findUnique({
      where: { id: accountID },
    });
    expect(updatedAccount.status).to.equal(AccountStatusChangeData.status);
  });
  it("should show error upon updating status from anywhere except admin panel", async () => {
    const appUser1Data = {
      phoneNumber: "01747538382",
    };

    const tokenforUserAccount = generateUserToken(
      1,
      appUser1Data.phoneNumber,
      "USER"
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

    const testData = {
      accountName: "John",
      identifier: "01711699870",
      status: "LIMITED_ACTIVE",
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

    const AccountStatusChangeData = {
      status: "FULL_ACTIVE",
    };

    const response = await pactum
      .spec()
      .withMethod("PUT")
      .withPath(
        `${ApiUrls.apiBaseUrl}${ApiUrls.changeAccountStatus}${accountID}/status-update`
      )
      .withBearerToken(tokenforUserAccount)
      .withJson(AccountStatusChangeData)
      .expectStatus(401);
  });
  it("should show error upon updating the status to current status", async () => {
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
    const testData = {
      accountName: "John",
      identifier: "01711699870",
      status: "LIMITED_ACTIVE",
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

    const AccountStatusChangeData = {
      status: "LIMITED_ACTIVE",
    };

    await pactum
      .spec()
      .withMethod("PUT")
      .withPath(
        `${ApiUrls.apiBaseUrl}${ApiUrls.changeAccountStatus}${accountID}/status-update`
      )
      .withBearerToken(token)
      .withJson(AccountStatusChangeData)
      .expectStatus(400);
  });
  it("should show error when trying to change status of a system account", async () => {
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
      name: "System Account Name",
      adminId: 1,
      description: "This is a description for the chart of account.",
      transactionType: "SYSTEM",
      headType: "ASSET",
      code: "ACC-001",
      onlyParent: true,
    };

    const chartOfAccount = await prismaAccounting.ChartOfAccount.create({
      data: chartOfAccountData,
    });

    const CoAID = chartOfAccount.id;

    const testData = {
      accountName: "System Account",
      identifier: "ACC-001",
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

    const AccountStatusChangeData = {
      status: "LIMITED_ACTIVE",
    };

    await pactum
      .spec()
      .withMethod("PUT")
      .withPath(
        `${ApiUrls.apiBaseUrl}${ApiUrls.changeAccountStatus}${accountID}/status-update`
      )
      .withBearerToken(token)
      .withJson(AccountStatusChangeData)
      .expectStatus(404);
  });
});
