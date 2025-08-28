import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../../apiUrls.js";
import prismaAuth from "../../utils/prismaAuthClient.js";
import prismaAccounting from "../../utils/prismaAccountingClient.js";
import { generateToken } from "../../utils/generateJWT.js";

describe("Create Chart of Account API Tests (POST /v1/chart-of-account)", () => {
  let token;
  const adminUser = {
    email: "admin@ppay.com",
    roles: "Admin",
    adminRole: "ADMIN",
  };

  const sampleCharOfAccount = {
    name: "Sample Account Name",
    description: "This is a description for the chart of account.",
    transactionType: "SYSTEM",
    headType: "ASSET",
    code: "ACC-4002",
    onlyParent: false,
    dailyLimit: {
      count: 20,
      amount: 30,
    },
    monthlyLimit: {
      count: 20,
      amount: 30,
    },
    weeklyLimit: {
      count: 20,
      amount: 30,
    },
    minWalletAmount: 600,
    maxWalletAmount: 1200,
  };

  const getPrismaData = (data) => ({
    name: data.name,
    description: data.description,
    transactionType: data.transactionType,
    headType: data.headType,
    code: data.code,
    onlyParent: data.onlyParent,
    dailyLimitCount: data.dailyLimit?.count,
    dailyLimitAmount: data.dailyLimit?.amount,
    monthlyLimitCount: data.monthlyLimit?.count,
    monthlyLimitAmount: data.monthlyLimit?.amount,
    weeklyLimitCount: data.weeklyLimit?.count,
    weeklyLimitAmount: data.weeklyLimit?.amount,
    minWalletAmount: data.minWalletAmount,
    maxWalletAmount: data.maxWalletAmount,
    adminId: 1,
  });

  before(async () => {
    await Promise.all([prismaAuth.$connect(), prismaAccounting.$connect()]);
    token = generateToken(
      1,
      adminUser.email,
      adminUser.roles,
      adminUser.adminRole
    );
  });

  after(async () => {
    await Promise.all([
      prismaAuth.$disconnect(),
      prismaAccounting.$disconnect(),
    ]);
  });

  beforeEach(async () => {
    await prismaAccounting.$transaction([
      prismaAccounting.ledger.deleteMany(),
      prismaAccounting.transaction.deleteMany(),
      prismaAccounting. transactionLegLog.deleteMany(),
      prismaAccounting. transactionLeg.deleteMany(),
      prismaAccounting.transactionTypeChangeLog.deleteMany(),
      prismaAccounting.transactionType.deleteMany(),
      prismaAccounting.userAccount.deleteMany(),
      prismaAccounting.chartOfAccountLog.deleteMany(),
      prismaAccounting.chartOfAccount.deleteMany(),
    ]);
  });

  const makeRequest = (data) => {
    return pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.createChartOfAccount}`)
      .withJson(data);
  };

  it("should create a new chart of account", async () => {
    await makeRequest(sampleCharOfAccount).expectStatus(201);

    const createdCoA = await prismaAccounting.chartOfAccount.findFirst({
      where: { code: sampleCharOfAccount.code },
    });
    expect(createdCoA).to.not.be.null;

    expect(createdCoA).to.include({
      name: sampleCharOfAccount.name,
      description: sampleCharOfAccount.description,
      transactionType: sampleCharOfAccount.transactionType,
      headType: sampleCharOfAccount.headType,
      code: sampleCharOfAccount.code,
      onlyParent: sampleCharOfAccount.onlyParent,
      minWalletAmount: sampleCharOfAccount.minWalletAmount,
      maxWalletAmount: sampleCharOfAccount.maxWalletAmount,
    });

    expect(createdCoA.dailyLimitCount).to.deep.equal(
      sampleCharOfAccount.dailyLimit.count
    );
    expect(createdCoA.weeklyLimitCount).to.deep.equal(
      sampleCharOfAccount.weeklyLimit.count
    );
    expect(createdCoA.monthlyLimitCount).to.deep.equal(
      sampleCharOfAccount.monthlyLimit.count
    );

    expect(createdCoA.dailyLimitAmount).to.deep.equal(
      sampleCharOfAccount.dailyLimit.amount
    );
    expect(createdCoA.weeklyLimitAmount).to.deep.equal(
      sampleCharOfAccount.weeklyLimit.amount
    );
    expect(createdCoA.monthlyLimitAmount).to.deep.equal(
      sampleCharOfAccount.monthlyLimit.amount
    );
  });

  it("should create a new chart of account when limits are not inserted", async () => {
    const sampleCoA2 = {
      name: "Sample Account Name",
      description: "This is a description for the chart of account.",
      transactionType: "SYSTEM",
      headType: "ASSET",
      code: "ACC-4002",
      onlyParent: false,
    };
    await makeRequest(sampleCoA2).expectStatus(201);

    const createdCoA = await prismaAccounting.chartOfAccount.findFirst({
      where: { code: sampleCharOfAccount.code },
    });
    expect(createdCoA).to.not.be.null;

    expect(createdCoA).to.include({
      name: sampleCharOfAccount.name,
      description: sampleCharOfAccount.description,
      transactionType: sampleCharOfAccount.transactionType,
      headType: sampleCharOfAccount.headType,
      code: sampleCharOfAccount.code,
      onlyParent: sampleCharOfAccount.onlyParent
    });

    expect(createdCoA.minWalletAmount).to.be.null;
    expect(createdCoA.maxWalletAmount).to.be.null;
    expect(createdCoA.dailyLimitCount).to.be.null;
    expect(createdCoA.weeklyLimitCount).to.be.null;
    expect(createdCoA.monthlyLimitCount).to.be.null;

    expect(createdCoA.dailyLimitAmount).to.be.null;
    expect(createdCoA.weeklyLimitAmount).to.be.null;
    expect(createdCoA.monthlyLimitAmount).to.be.null;
  });

  // it("should return 400 for negative values input in CoA", async () => {
  //   const invalidInput = {
  //     ...sampleCharOfAccount,
  //     dailyLimit: {
  //       count: -20,
  //       amount: -30,
  //     },
  //     monthlyLimit: {
  //       count: -20,
  //       amount: -30,
  //     },
  //     weeklyLimit: {
  //       count: -20,
  //       amount: -30,
  //     },
  //     minWalletAmount: -600,
  //     maxWalletAmount: -1200,
  //   };

  //   await makeRequest(invalidInput).expectStatus(400);
  // });

  it("should return 409 if the code is already taken", async () => {
    await prismaAccounting.chartOfAccount.create({
      data: getPrismaData(sampleCharOfAccount),
    });

    await makeRequest(sampleCharOfAccount).expectStatus(409);

    const accounts = await prismaAccounting.chartOfAccount.findMany({
      where: { code: sampleCharOfAccount.code },
    });
    expect(accounts).to.have.lengthOf(1);
  });

  it("should create chart of account and user account when onlyParent is true", async () => {
    const chartData = { ...sampleCharOfAccount, onlyParent: true };

    await makeRequest(chartData).expectStatus(201);

    const createdCoA = await prismaAccounting.chartOfAccount.findFirst({
      where: { code: chartData.code },
    });
    expect(createdCoA).to.not.be.null;

    const userAccount = await prismaAccounting.userAccount.findFirst({
      where: { chartOfAccount_id: createdCoA.id },
    });
    expect(userAccount).to.not.be.null;
  });

  it("should not create user account when onlyParent is false", async () => {
    await makeRequest(sampleCharOfAccount).expectStatus(201);

    const createdCoA = await prismaAccounting.chartOfAccount.findFirst({
      where: { code: sampleCharOfAccount.code },
    });
    expect(createdCoA).to.not.be.null;

    const userAccount = await prismaAccounting.userAccount.findFirst({
      where: { chartOfAccount_id: createdCoA.id },
    });
    expect(userAccount).to.be.null;
  });

  it("should create appropriate logs for new chart of account", async () => {
    await makeRequest(sampleCharOfAccount).expectStatus(201);

    const logEntry = await prismaAccounting.chartOfAccountLog.findFirst({
      where: { createdByAdminId: 1 },
    });

    expect(logEntry).to.include({
      changeType: "CREATE",
      oldValue: null,
    });
    expect(logEntry.newValue).to.not.be.null;
  });
});
