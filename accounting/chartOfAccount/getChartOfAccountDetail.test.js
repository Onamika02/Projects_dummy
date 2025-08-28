import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../../apiUrls.js";
import prismaAccounting from "../../utils/prismaAccountingClient.js";
import { generateToken } from "../../utils/generateJWT.js";
import prismaAuth from "../../utils/prismaAuthClient.js";

describe("GET Chart of Account Details API Tests (GET :/v1/chart-of-account/:id)", () => {
  let token;

  const adminUser = {
    email: "admin@ppay.com",
    roles: "Admin",
    adminRole: "ADMIN",
  };

  const sampleAccount = {
    name: "Account A",
    description: "Description A",
    transactionType: "MEMBER",
    headType: "ASSET",
    code: "001",
    onlyParent: false,
    adminId: 1,
    minWalletAmount: 23323,
    maxWalletAmount: 232323,
    dailyLimitCount: 20,
    dailyLimitAmount: 30,
    monthlyLimitCount: 20,
    monthlyLimitAmount: 30,
    weeklyLimitCount: 20,
    weeklyLimitAmount: 30,
  };

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
    await prismaAccounting.$executeRaw`SET session_replication_role = 'origin';`;
    await prismaAccounting.$transaction([
      prismaAccounting.userAccount.deleteMany(),
      prismaAccounting.chartOfAccount.deleteMany(),
    ]);
    await prismaAccounting.$executeRaw`SET session_replication_role = 'replica';`;
  });

  const makeGetDetailsRequest = (id) => {
    return pactum
      .spec()
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.getChartOfAccount}/${id}`)
      .withBearerToken(token);
  };

  it("should return details of a Chart of Account", async () => {
    const dbCoA = await prismaAccounting.chartOfAccount.create({
      data: sampleAccount,
    });

    const response = await makeGetDetailsRequest(dbCoA.id).expectStatus(200);

    const dbAccount = await prismaAccounting.chartOfAccount.findUnique({
      where: { id: dbCoA.id },
    });

    expect(response.body).to.include({
      name: sampleAccount.name,
      description: sampleAccount.description,
      transactiontype: sampleAccount.transactionType,
      headtype: sampleAccount.headType,
      code: sampleAccount.code,
      onlyparent: sampleAccount.onlyParent,
      minwalletamount: sampleAccount.minWalletAmount,
      maxwalletamount: sampleAccount.maxWalletAmount,
    });

    expect(dbAccount.dailyLimitCount).to.equal(response.body.dailylimit.count);
    expect(dbAccount.monthlyLimitCount).to.equal(response.body.monthlylimit.count);
    expect(dbAccount.weeklyLimitCount).to.equal(response.body.weeklylimit.count);

    expect(dbAccount.dailyLimitAmount).to.equal(response.body.dailylimit.amount);
    expect(dbAccount.monthlyLimitAmount).to.equal(response.body.monthlylimit.amount);
    expect(dbAccount.weeklyLimitAmount).to.equal(response.body.weeklylimit.amount);

  });
});
