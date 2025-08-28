import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../../apiUrls.js";
import prismaAccounting from "../../utils/prismaAccountingClient.js";
import { generateToken } from "../../utils/generateJWT.js";

describe("Create Trxn type API Tests (POST :/v1/transaction-type)", () => {
  let token, sampleType, account1, account2;

  const ADMIN_ID = 1;
  const ADMIN_IDENTIFIER = "1111";

  const adminUser = {
    email: "admin@ppay.com",
    roles: "Admin",
    adminRole: "ADMIN",
  };

  const sampleCharOfAccount = {
    name: "System",
    description: "Description A",
    transactionType: "MEMBER",
    headType: "ASSET",
    code: "001",
    onlyParent: false,
    adminId: ADMIN_ID,
    minWalletAmount: 23323,
    maxWalletAmount: 232323,
  };

  const getPrismaData = (data) => ({
    id: data.id,
    createdByAdminId: ADMIN_ID,
    createdByAdminIdentifier: ADMIN_IDENTIFIER,
    description: data.description,
    isActive: true,
    name: data.name,
    transactionCode: data.transactionCode,
    maxAmount: data.maxAmount,
    minAmount: data.minAmount,
    updatedAt: data.updatedAt,
    updatedByAdminId: data.updatedByAdminId,
    updatedByAdminIdentifier: data.updatedByAdminIdentifier,
    dailyLimitCount: data.dailyLimitCount,
    dailyLimitAmount: data.dailyLimitAmount,
    monthlyLimitCount: data.monthlyLimitCount,
    monthlyLimitAmount: data.monthlyLimitAmount,
    weeklyLimitCount: data.weeklyLimitCount,
    weeklyLimitAmount: data.weeklyLimitAmount,
    fromChartOfAccount: { connect: { id: data.fromCoa } },
    toChartOfAccount: { connect: { id: data.toCoa } },
  });

  before(async () => {
    await Promise.all([prismaAccounting.$connect()]);
    token = generateToken(
      ADMIN_ID,
      adminUser.email,
      adminUser.roles,
      adminUser.adminRole
    );
  });

  after(async () => {
    await Promise.all([prismaAccounting.$disconnect()]);
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

    const charOfAccounts = [
      sampleCharOfAccount,
      {
        ...sampleCharOfAccount,
        name: "Account B",
        code: "002",
        onlyParent: true,
        adminId: ADMIN_ID,
        description: "Description for Account 2",
      },
    ];

    await prismaAccounting.chartOfAccount.createMany({
      data: charOfAccounts,
    });

    [account1, account2] = await prismaAccounting.chartOfAccount.findMany({
      orderBy: { code: "asc" },
    });

    sampleType = {
      name: "Send Money",
      description: "This is a description for the Transaction Type.",
      fromCoa: account1.id,
      toCoa: account2.id,
      transactionCode: "send-money-1001",
      dailyLimit: { count: 20, amount: 30 },
      weeklyLimit: { count: 20, amount: 30 },
      monthlyLimit: { count: 20, amount: 30 },
    };
  });

  const makeCreateTypeRequest = (data) => {
    return pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.createType}`)
      .withJson(data);
  };

  it("should create a new type", async () => {
    await makeCreateTypeRequest(sampleType).expectStatus(201);

    const createdType = await prismaAccounting.transactionType.findUnique({
      where: { transactionCode: sampleType.transactionCode },
    });

    expect(createdType).to.not.be.null;
    expect(createdType.name).to.equal(sampleType.name);
    expect(createdType.description).to.equal(sampleType.description);
    expect(createdType.fromChartOfAccountId).to.equal(account1.id);
    expect(createdType.toChartOfAccountId).to.equal(account2.id);

    expect(createdType.fromChartOfAccountId).to.equal(sampleType.fromCoa);
    expect(createdType.toChartOfAccountId).to.equal(sampleType.toCoa);

    expect(Number(createdType.dailyLimitCount)).to.equal(sampleType.dailyLimit.count);
    expect(Number(createdType.dailyLimitAmount)).to.equal(sampleType.dailyLimit.amount);
    expect(Number(createdType.monthlyLimitCount)).to.equal(sampleType.monthlyLimit.count);
    expect(Number(createdType.monthlyLimitAmount)).to.equal(sampleType.monthlyLimit.amount);
    expect(Number(createdType.weeklyLimitCount)).to.equal(sampleType.weeklyLimit.count);
    expect(Number(createdType.weeklyLimitAmount)).to.equal(sampleType.weeklyLimit.amount);

    expect(createdType.isActive).to.be.true;
    expect(createdType.createdByAdminId).to.equal(ADMIN_ID);
    expect(createdType.createdByAdminIdentifier).to.equal(adminUser.email);
  });

  it("should return 400 for invalid input of type", async () => {
    const invalidType = {
      ...sampleType,
      fromCoa: null,
    };

    await makeCreateTypeRequest(invalidType).expectStatus(400);

    const dbTypes = await prismaAccounting.transactionType.findMany({
      where: {
        name: invalidType.name,
        description: invalidType.description,
        fromChartOfAccountId: invalidType.fromCoa,
        toChartOfAccountId: invalidType.toCoa,
        transactionCode: invalidType.transactionCode,
      },
    });

    expect(dbTypes).to.have.lengthOf(0);
  });

  it("should return 419 if the type already exists and cannot be created again", async () => {
    await prismaAccounting.transactionType.create({
      data: getPrismaData(sampleType),
    });

    await makeCreateTypeRequest(sampleType).expectStatus(419);

    const createdType = await prismaAccounting.transactionType.findMany({
      where: { transactionCode: sampleType.transactionCode },
    });
    expect(createdType).to.have.lengthOf(1);
  });

  it("should check the logs for creating a type", async () => {
    await makeCreateTypeRequest(sampleType).expectStatus(201);

    const createdType = await prismaAccounting.transactionType.findUnique({
      where: { transactionCode: sampleType.transactionCode },
    });

    const logEntry = await prismaAccounting.transactionTypeChangeLog.findMany({
      where: { transactionType_id: createdType.id },
    });

    expect(logEntry[0]).to.have.property("changeType").to.equal("CREATE");
    expect(logEntry[0]).to.have.property("oldValue").to.be.null;
    expect(logEntry[0]).to.have.property("newValue").not.to.be.null;
  });
});
