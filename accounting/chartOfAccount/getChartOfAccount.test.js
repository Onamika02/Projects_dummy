import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../../apiUrls.js";
import prismaAccounting from "../../utils/prismaAccountingClient.js";
import { generateToken } from "../../utils/generateJWT.js";
import prismaAuth from "../../utils/prismaAuthClient.js";

describe("GET Chart of Account API Tests (GET :/v1/chart-of-account)", () => {
  let token;

  const adminUser = {
    email: "admin@ppay.com",
    roles: "Admin",
    adminRole: "ADMIN",
  };

  const sampleCharOfAccount = {
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
      prismaAccounting.$disconnect(),
      prismaAuth.$disconnect(),
    ]);
  });

  beforeEach(async () => {
    await prismaAccounting.$executeRaw`SET session_replication_role = replica;`;
    await prismaAccounting.$transaction([
      prismaAccounting.userAccount.deleteMany(),
      prismaAccounting.chartOfAccount.deleteMany(),
    ]);
    await prismaAccounting.$executeRaw`SET session_replication_role = origin;`;

    const charOfAccounts = [
      sampleCharOfAccount,
      {
        ...sampleCharOfAccount,
        name: "Account B",
        code: "002",
        onlyParent: true,
        adminId: 1,
        description: "Description for Account 2",
      },
    ];

    await prismaAccounting.chartOfAccount.createMany({
      data: charOfAccounts,
    });
  });

  const makeGetRequest = () => {
    return pactum
      .spec()
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.getChartOfAccount}`)
      .withBearerToken(token);
  };

  it("should return all Chart of Accounts", async () => {
    const response = await makeGetRequest().expectStatus(200);

    const dbAccounts = await prismaAccounting.chartOfAccount.findMany();

    expect(response.body.chartofaccounts).to.have.lengthOf(dbAccounts.length);
    dbAccounts.forEach((account, index) => {
      expect(response.body.chartofaccounts[index]).to.deep.include({
        name: account.name,
        description: account.description,
        transactiontype: account.transactionType,
        headtype: account.headType,
        code: account.code,
        onlyparent: account.onlyParent,
      });
    });

    expect(response.body.chartofaccounts[0].name).to.equal(sampleCharOfAccount.name);
    expect(response.body.chartofaccounts[1].name).to.equal("Account B");
  });
});
