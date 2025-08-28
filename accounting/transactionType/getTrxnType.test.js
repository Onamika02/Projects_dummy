import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../../apiUrls.js";
import prismaAccounting from "../../utils/prismaAccountingClient.js";
import { generateToken } from "../../utils/generateJWT.js";

describe("GET Trxn Type API Tests (:GET /v1/transaction-type)", () => {
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
    await prismaAccounting.$executeRaw`SET session_replication_role = 'origin';`;
    await prismaAccounting.$transaction([
      prismaAccounting.ledger.deleteMany(),
      prismaAccounting.transaction.deleteMany(),
      prismaAccounting.transactionLegLog.deleteMany(),
      prismaAccounting.transactionLeg.deleteMany(),
      prismaAccounting.transactionTypeChangeLog.deleteMany(),
      prismaAccounting.transactionType.deleteMany(),
      prismaAccounting.userAccount.deleteMany(),
      prismaAccounting.chartOfAccountLog.deleteMany(),
      prismaAccounting.chartOfAccount.deleteMany(),
    ]);
    await prismaAccounting.$executeRaw`SET session_replication_role = 'replica';`;

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
      fromChartOfAccountId: account1.id,
      toChartOfAccountId: account2.id,
      transactionCode: "send-money-1001",
      createdByAdminId: ADMIN_ID,
      createdByAdminIdentifier: ADMIN_IDENTIFIER,
      isActive: true,
      minAmount: 100,
      maxAmount: 1000,
      dailyLimitCount: 20,
      dailyLimitAmount: 30,
      monthlyLimitAmount: 30,
      monthlyLimitCount: 20,
      weeklyLimitAmount: 100,
      weeklyLimitCount: 5000,
    };

    const types = [
      sampleType,
      {
        ...sampleType,
        name: "Top Up",
        description: "Top Up description",
        transactionCode: "top-up-2001",
      },
    ];

    await prismaAccounting.transactionType.createMany({
      data: types,
    });
  });

  const makeGetTypeRequest = () => {
    return pactum
      .spec()
      .withMethod("GET")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.getTypes}`);
  };

  it("should return all types", async () => {
    const response = await makeGetTypeRequest().expectStatus(200);
    const typeDB = await prismaAccounting.transactionType.findUnique({
      where: {
        transactionCode: sampleType.transactionCode,
      },
    });

    expect(response.body.transactiontypes).to.be.an("array");
    expect(response.body.transactiontypes).to.have.lengthOf.at.least(1);

    const firstType = response.body.transactiontypes[0];

    expect(firstType.name).to.equal("Send Money");
    expect(firstType.description).to.equal("This is a description for the Transaction Type.");
    expect(firstType.transactioncode).to.equal("send-money-1001");
    expect(firstType.isactive).to.equal(typeDB.isActive);

    expect(Number(typeDB.dailyLimitCount)).to.equal(firstType.dailylimit.count);
    expect(Number(typeDB.dailyLimitAmount)).to.equal(firstType.dailylimit.amount);
    expect(Number(typeDB.monthlyLimitCount)).to.equal(firstType.monthlylimit.count);
    expect(Number(typeDB.monthlyLimitAmount)).to.equal(firstType.monthlylimit.amount);
    expect(Number(typeDB.weeklyLimitCount)).to.equal(firstType.weeklylimit.count);
    expect(Number(typeDB.weeklyLimitAmount)).to.equal(firstType.weeklylimit.amount);

    const secondType = response.body.transactiontypes[1];

    expect(secondType.name).to.equal("Top Up");
    expect(secondType.description).to.equal("Top Up description");
    expect(secondType.transactioncode).to.equal("top-up-2001");
    expect(secondType.isactive).to.equal(typeDB.isActive);

    expect(Number(typeDB.dailyLimitCount)).to.equal(secondType.dailylimit.count);
    expect(Number(typeDB.dailyLimitAmount)).to.equal(secondType.dailylimit.amount);
    expect(Number(typeDB.monthlyLimitCount)).to.equal(secondType.monthlylimit.count);
    expect(Number(typeDB.monthlyLimitAmount)).to.equal(secondType.monthlylimit.amount);
    expect(Number(typeDB.weeklyLimitCount)).to.equal(secondType.weeklylimit.count);
    expect(Number(typeDB.weeklyLimitAmount)).to.equal(secondType.weeklylimit.amount);

  });
});
