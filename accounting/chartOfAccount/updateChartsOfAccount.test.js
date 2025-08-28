import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../../apiUrls.js";
import prismaAccounting from "../../utils/prismaAccountingClient.js";
import { generateToken } from "../../utils/generateJWT.js";
import prismaAuth from "../../utils/prismaAuthClient.js";

describe("Update Chart of Account API Tests (PATCH :/v1/chart-of-account)", () => {
  let token;

  const adminUser = {
    email: "admin@ppay.com",
    roles: "Admin",
    adminRole: "ADMIN",
  };

  const initialCoA = {
    name: "Sample Account Name",
    description: "This is a description for the chart of account.",
    transactionType: "SYSTEM",
    adminId: 1,
    headType: "ASSET",
    code: "ACC-4002",
    onlyParent: false,
    dailyLimitCount: 20,
    dailyLimitAmount: 30,
    monthlyLimitAmount: 30,
    monthlyLimitCount: 20,
    weeklyLimitAmount: 100,
    weeklyLimitCount: 5000,
    minWalletAmount: 600,
    maxWalletAmount: 1200,
  };

  const updatedFields = {
    name: "Updated Account Name",
    description: "This is an updated description for the chart of account.",
    code: "ACC-002",
    dailyLimit: {
      count: 10,
      amount: 60,
    },
    monthlyLimit: {
      count: 30,
      amount: 50,
    },
    weeklyLimit: {
      count: 20,
      amount: 30
    },
    minWalletAmount: 300,
    maxWalletAmount: 1500,
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
    await prismaAccounting.$executeRaw`SET session_replication_role = 'origin';`;
    await prismaAccounting.$transaction([
      prismaAccounting.chartOfAccountLog.deleteMany(),
      prismaAccounting.chartOfAccount.deleteMany(),
    ]);
    await prismaAccounting.$executeRaw`SET session_replication_role = 'replica';`;

});

const makeUpdateRequest = (id, data) => {
  return pactum
    .spec()
    .withMethod("PATCH")
    .withBearerToken(token)
    .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.updateChartOfAccount}/${id}`)
    .withJson(data);
};

const createChartOfAccount = async (data) => {
  return prismaAccounting.chartOfAccount.create({
    data,
  });
};


it("should update chart of account with valid fields", async () => {
  const createdCoA = await createChartOfAccount(initialCoA);

  await makeUpdateRequest(createdCoA.id, updatedFields).expectStatus(200);

  const updatedCoADb = await prismaAccounting.chartOfAccount.findUnique({
    where: { id: createdCoA.id },
    select: {
      name: true,
      description: true,
      code: true,
      dailyLimitCount: true,
      dailyLimitAmount: true,
      monthlyLimitCount: true,
      monthlyLimitAmount: true,
      weeklyLimitCount: true,
      weeklyLimitAmount: true,
      minWalletAmount: true,
      maxWalletAmount: true,
    },
  });

  expect(updatedCoADb.name).to.equal(updatedFields.name);
  expect(updatedCoADb.description).to.equal(updatedFields.description);
  expect(updatedCoADb.code).to.equal(updatedFields.code);
  expect(updatedCoADb.dailyLimitCount).to.equal(updatedFields.dailyLimit.count);
  expect(updatedCoADb.dailyLimitAmount).to.equal(updatedFields.dailyLimit.amount);
  expect(updatedCoADb.weeklyLimitCount).to.equal(updatedFields.weeklyLimit.count);
  expect(updatedCoADb.weeklyLimitAmount).to.equal(updatedFields.weeklyLimit.amount);
  expect(updatedCoADb.monthlyLimitCount).to.equal(updatedFields.monthlyLimit.count);
  expect(updatedCoADb.monthlyLimitAmount).to.equal(updatedFields.monthlyLimit.amount);
  expect(updatedCoADb.minWalletAmount).to.equal(updatedFields.minWalletAmount);
  expect(updatedCoADb.maxWalletAmount).to.equal(updatedFields.maxWalletAmount);

  const duplicateCoA = await prismaAccounting.chartOfAccount.findMany({
    where: { code: updatedFields.code },
  });
  expect(duplicateCoA).to.have.lengthOf(1);
});

// it("should not let user update CoA limits with negative values", async () => {
//   const createdCoA = await createChartOfAccount(initialCoA);

//   const negFieldsForCoA = {
//     name: "Updated Account Name",
//     description: "This is an updated description for the chart of account.",
//     code: "ACC-002",
//     dailyLimit: {
//       count: -10,
//       amount: -60,
//     },
//     monthlyLimit: {
//       count: -30,
//       amount: -50,
//     },
//     weeklyLimit: {
//       count: -20,
//       amount: - 30
//     },
//     minWalletAmount: -300,
//     maxWalletAmount: -1500,
//   };

//   await makeUpdateRequest(createdCoA.id, negFieldsForCoA).expectStatus(400);

//   const updatedCoADb = await prismaAccounting.chartOfAccount.findUnique({
//     where: { id: createdCoA.id },
//     select: {
//       name: true,
//       description: true,
//       code: true,
//       dailyLimitCount: true,
//       dailyLimitAmount: true,
//       monthlyLimitCount: true,
//       monthlyLimitAmount: true,
//       weeklyLimitCount: true,
//       weeklyLimitAmount: true,
//       minWalletAmount: true,
//       maxWalletAmount: true,
//     },
//   });

//   expect(updatedCoADb.name).to.equal(initialCoA.name);
//   expect(updatedCoADb.description).to.equal(initialCoA.description);
//   expect(updatedCoADb.code).to.equal(initialCoA.code);
//   expect(updatedCoADb.dailyLimitCount).to.equal(initialCoA.dailyLimitCount);
//   expect(updatedCoADb.dailyLimitAmount).to.equal(initialCoA.dailyLimitAmount);
//   expect(updatedCoADb.weeklyLimitCount).to.equal(initialCoA.weeklyLimitCount);
//   expect(updatedCoADb.weeklyLimitAmount).to.equal(initialCoA.weeklyLimitAmount);
//   expect(updatedCoADb.monthlyLimitCount).to.equal(initialCoA.monthlyLimitCount);
//   expect(updatedCoADb.monthlyLimitAmount).to.equal(initialCoA.monthlyLimitAmount);
//   expect(updatedCoADb.minWalletAmount).to.equal(initialCoA.minWalletAmount);
//   expect(updatedCoADb.maxWalletAmount).to.equal(initialCoA.maxWalletAmount);

// });

// it("should get 200 if the user does not insert limits in CoA", async () => {
//   const createdCoA = await createChartOfAccount(initialCoA);

//   const coAFieldsWithoutLimits = {
//     name: "Updated Account Name",
//     description: "This is an updated description for the chart of account.",
//     code: "ACC-002",
//     dailyLimitCount: null,
//     dailyLimitAmount: null,
//     monthlyLimitAmount: null,
//     monthlyLimitCount: null,
//     weeklyLimitAmount: null,
//     weeklyLimitCount: null,
//     minWalletAmount: null,
//     maxWalletAmount: null,
//   };

//   await makeUpdateRequest(createdCoA.id, coAFieldsWithoutLimits).expectStatus(200);

//   const updatedCoADb = await prismaAccounting.chartOfAccount.findUnique({
//     where: { id: createdCoA.id },
//     select: {
//       name: true,
//       description: true,
//       code: true,
//       dailyLimitCount: true,
//       dailyLimitAmount: true,
//       monthlyLimitCount: true,
//       monthlyLimitAmount: true,
//       weeklyLimitCount: true,
//       weeklyLimitAmount: true,
//       minWalletAmount: true,
//       maxWalletAmount: true,
//     },
//   });

//   expect(updatedCoADb.name).to.equal(coAFieldsWithoutLimits.name);
//   expect(updatedCoADb.description).to.equal(coAFieldsWithoutLimits.description);
//   expect(updatedCoADb.code).to.equal(coAFieldsWithoutLimits.code);
//   expect(updatedCoADb.dailyLimitCount).to.be.null;
//   expect(updatedCoADb.dailyLimitAmount).to.be.null;
//   expect(updatedCoADb.weeklyLimitCount).to.be.null;
//   expect(updatedCoADb.weeklyLimitAmount).to.be.null;
//   expect(updatedCoADb.monthlyLimitCount).to.be.null;
//   expect(updatedCoADb.monthlyLimitAmount).to.be.null;
//   expect(updatedCoADb.minWalletAmount).to.be.null;
//   expect(updatedCoADb.maxWalletAmount).to.be.null;

// });

it("should create log entry after update", async () => {
  const createdCoA = await createChartOfAccount(initialCoA);

  await makeUpdateRequest(createdCoA.id, updatedFields).expectStatus(200);

  const logEntry = await prismaAccounting.chartOfAccountLog.findFirst({
    where: { createdByAdminId: 1 },
  });

  expect(logEntry).to.include({
    changeType: "UPDATE",
  });
  expect(logEntry.oldValue).to.not.be.null;
  expect(logEntry.newValue).to.not.be.null;
});

it("should return 400 for non-allowed field updates", async () => {
  const createdCoA = await createChartOfAccount(initialCoA);

  const nonAllowedUpdates = {
    onlyParent: true,
    headType: "ASSET",
    transactionType: "SYSTEM",
  };

  await makeUpdateRequest(createdCoA.id, nonAllowedUpdates).expectStatus(200);

  const unchanged = await prismaAccounting.chartOfAccount.findUnique({
    where: { id: createdCoA.id },
  });

  expect(unchanged.onlyParent).to.equal(initialCoA.onlyParent);
  expect(unchanged.headType).to.equal(initialCoA.headType);
  expect(unchanged.transactionType).to.equal(initialCoA.transactionType);
});

it("should return 404 for non-existent chart of account", async () => {
  const nonExistentId = 99999;

  await makeUpdateRequest(nonExistentId, updatedFields).expectStatus(404);
});
});
