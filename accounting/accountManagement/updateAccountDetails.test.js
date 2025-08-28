import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../../apiUrls.js";
import prismaAccounting from "../../utils/prismaAccountingClient.js";
import { generateToken } from "../../utils/generateJWT.js";
import { generateUserToken } from "../../utils/userTokenJWT.js";

describe("Account Details Update API", () => {
  let token;
  let accountID;
  let CoAID;

  before(async () => {
    await prismaAccounting.$connect();
  });

  beforeEach(async () => {
    await prismaAccounting.Ledger.deleteMany({});
    await prismaAccounting.Transaction.deleteMany({});
    await prismaAccounting.TransactionTypeChangeLog.deleteMany({});
    await prismaAccounting.TransactionType.deleteMany({});
    await prismaAccounting.transactionLegLog.deleteMany({});
    await prismaAccounting.TransactionLeg.deleteMany({});
    await prismaAccounting.UserAccount.deleteMany({});
    await prismaAccounting.AccountLog.deleteMany({});
    await prismaAccounting.ChartOfAccountLog.deleteMany({});
    await prismaAccounting.ChartOfAccount.deleteMany({});

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
    CoAID = chartOfAccount.id;

    const initialAccountData = {
      accountName: "John",
      identifier: "01747538382",
      status: "LIMITED_ACTIVE",
      chartOfAccount: {
        connect: {
          id: CoAID,
        },
      },
      minWalletAmount: 100,
      dailyLimitCount: 10,
      dailyLimitAmount: 1000,
      monthlyLimitCount: 100,
      monthlyLimitAmount: 1000,
      maxWalletAmount: 1000,
      weeklyLimitCount: 10,
      weeklyLimitAmount: 100,
      aitPercentage: 2.5
    };

    const createdAccount = await prismaAccounting.UserAccount.create({
      data: initialAccountData,
    });
    accountID = createdAccount.id;

  });

  after(async () => {
    await prismaAccounting.$disconnect();
      await prismaAccounting.AccountLog.deleteMany({});
      await prismaAccounting.UserAccount.deleteMany({});
  

  });

  it("should update user details successfully", async () => {
    
    const updatedAccountData = {
      accountName: "cccccccccc",
      minWalletAmount: 500,
      dailyLimit: {
        count: 50,
        amount: 5000,
      },
      monthlyLimit: {
        count: 500,
        amount: 5000,
      },
      weeklyLimit: {
        count: 500,
        amount: 5000,
      },
      maxWalletAmount: 5000,
      aitPercentage: 3.5
    };
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

    const response = await pactum
      .spec()
      .withMethod("PUT")
      .withPath(
        `${ApiUrls.apiBaseUrl}${ApiUrls.updateAccountDetails}${accountID}/limit-update`
      )
      .withBearerToken(token)
      .withJson(updatedAccountData)
      .expectStatus(200);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const updatedAccount = await prismaAccounting.UserAccount.findUnique({
      where: { id: accountID },
    });

    expect(updatedAccount).to.not.be.null;
    expect(updatedAccount.accountName).to.equal(updatedAccountData.accountName);
    expect(updatedAccount.minWalletAmount).to.equal(
      updatedAccountData.minWalletAmount
    );
    expect(updatedAccount.maxWalletAmount).to.equal(
      updatedAccountData.maxWalletAmount
    );
    expect(updatedAccount.dailyLimitAmount).to.equal(
      updatedAccountData.dailyLimit.amount
    );
    expect(updatedAccount.dailyLimitCount).to.equal(
      updatedAccountData.dailyLimit.count
    );
    expect(updatedAccount.weeklyLimitAmount).to.equal(
      updatedAccountData.weeklyLimit.amount
    );
    expect(updatedAccount.weeklyLimitCount).to.equal(
      updatedAccountData.weeklyLimit.count
    );
    expect(updatedAccount.monthlyLimitAmount).to.equal(
      updatedAccountData.monthlyLimit.amount
    );
    expect(updatedAccount.monthlyLimitCount).to.equal(
      updatedAccountData.monthlyLimit.count
    );
    expect(updatedAccount.chartOfAccount_id).to.equal(CoAID);
    expect(updatedAccount.aitpercentage).to.equal(updatedAccountData.aitpercentage);
  });

  it("should show error if the user is not logged in", async () => {

    const updatedAccountData = {
      accountName: "bbbbbbb",
      minWalletAmount: 100,
      dailyLimit: {
        count: 10,
      },
      monthlyLimit: {
        count: 100,
      },
    };

    const response = await pactum
      .spec()
      .withMethod("PUT")
      .withPath(
        `${ApiUrls.apiBaseUrl}${ApiUrls.updateAccountDetails}${accountID}/limit-update`
      )
      .withJson(updatedAccountData)
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

    const accountID = 1111111;

    const updatedAccountData = {
      accountName: "bbbbbbb",
      minWalletAmount: 100,
      dailyLimit: {
        count: 10,
        amount: 5000,
      },
      monthlyLimit: {
        count: 100,
        amount: 5000,
      },
      weeklyLimit: {
        count: 500,
        amount: 5000,
      },
    };

    const response = await pactum
      .spec()
      .withMethod("PUT")
      .withPath(
        `${ApiUrls.apiBaseUrl}${ApiUrls.updateAccountDetails}${accountID}/limit-update`
      )
      .withJson(updatedAccountData)
      .withBearerToken(token)
      .expectStatus(404);
  });

  it("should check logs for updating account", async () => {

    const updatedAccountData = {
      accountName: "John",
      dailyLimit: { count: 50, amount: 5000 },
      monthlyLimit: { count: 500, amount: 5000 },
      weeklyLimit: { count: 500, amount: 5000 },
      maxWalletAmount: 5000,
      minWalletAmount: 600,
    };

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

    const response = await pactum
      .spec()
      .withMethod("PUT")
      .withPath(
        `${ApiUrls.apiBaseUrl}${ApiUrls.updateAccountDetails}${accountID}/limit-update`
      )
      .withBearerToken(token)
      .withJson(updatedAccountData)
      .expectStatus(200);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const updatedAccount = await prismaAccounting.UserAccount.findUnique({
      where: { id: accountID },
    });

    const logEntry = await prismaAccounting.AccountLog.findMany({
      where: {
        accountId:accountID,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    expect(logEntry[0].accountName).to.equal("John");
    expect(Number(logEntry[0].minWalletAmount)).to.equal(600);
    expect(Number(logEntry[0].dailyLimitCount)).to.equal(50);
    expect(Number(logEntry[0].dailyLimitAmount)).to.equal(5000);
    expect(Number(logEntry[0].weeklyLimitCount)).to.equal(500);
    expect(Number(logEntry[0].weeklyLimitAmount)).to.equal(5000);
    expect(Number(logEntry[0].monthlyLimitCount)).to.equal(500);
    expect(Number(logEntry[0].monthlyLimitAmount)).to.equal(5000);
    expect(Number(logEntry[0].maxWalletAmount)).to.equal(5000);
  });
});
