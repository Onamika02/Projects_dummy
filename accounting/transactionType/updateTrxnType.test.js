import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../../apiUrls.js";
import prismaAccounting from "../../utils/prismaAccountingClient.js";
import { generateToken } from "../../utils/generateJWT.js";

let token, account1, account2;

describe("Update Transaction Type API Tests (PATCH  :/v1/transaction-type/)", () => {
  before(async () => {
    await prismaAccounting.$connect();
  });

  beforeEach(async () => {
    await prismaAccounting.ledger.deleteMany({});
    await prismaAccounting.transaction.deleteMany({});

    await prismaAccounting.transactionLegLog.deleteMany({});
    await prismaAccounting.transactionLeg.deleteMany({});

    await prismaAccounting.transactionTypeChangeLog.deleteMany({});
    await prismaAccounting.transactionType.deleteMany({});

    await prismaAccounting.userAccount.deleteMany({});

    await prismaAccounting.chartOfAccountLog.deleteMany({});
    await prismaAccounting.chartOfAccount.deleteMany({});

    account1 = await prismaAccounting.chartOfAccount.create({
      data: {
        name: "Account 1",
        description: "Description for Account 1",
        transactionType: "SYSTEM",
        headType: "ASSET",
        code: "001",
        onlyParent: false,
        adminId: 1,
      },
    });

    account2 = await prismaAccounting.chartOfAccount.create({
      data: {
        name: "Account 2",
        description: "Description for Account 2",
        transactionType: "SYSTEM",
        headType: "ASSET",
        code: "002",
        onlyParent: true,
        adminId: 1,
      },
    });

    await prismaAccounting.transactionType.create({
      data: {
        transactionCode: "223",
        name: "TypeA",
        description: "qqqqqqqqqqqqqqqqq",
        minAmount: 66,
        maxAmount: 666,
        createdByAdminId: 1,
        createdByAdminIdentifier: "11",
        isActive: true,
        fromChartOfAccountId: account1.id,
        toChartOfAccountId: account2.id,
        dailyLimitCount: 20,
        dailyLimitAmount: 30,
        monthlyLimitAmount: 30,
        monthlyLimitCount: 20,
        weeklyLimitAmount: 100,
        weeklyLimitCount: 5000,
      },
    });
  });

  after(async () => {
    await prismaAccounting.$disconnect();
  });

  it("should update a type with valid name, description, transaction code and limits of type", async () => {
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

    const type = await prismaAccounting.transactionType.findUnique({
      where: {
        transactionCode: "223",
      },
    });

    const typeId = type.id;

    const typeToUpdate = {
      name: "NEw NEw Account Name111",
      description: "New New This is a description for the chart of account.",
      transactionCode: "3311",
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
        amount: 30,
      },
    };


    await pactum
      .spec()
      .withMethod("PATCH")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.updateType}${typeId}`)
      .withJson(typeToUpdate)
      .expectStatus(200);

    const updatedTypeRecord = await prismaAccounting.transactionType.findUnique(
      {
        where: { id: typeId },
      }
    );

    expect(updatedTypeRecord).to.not.be.null;

    expect(updatedTypeRecord.name).to.equal(typeToUpdate.name);
    expect(updatedTypeRecord.description).to.equal(typeToUpdate.description);
    expect(updatedTypeRecord.transactionCode).to.equal(
      typeToUpdate.transactionCode
    );

    expect(Number(updatedTypeRecord.dailyLimitCount)).to.equal(
      typeToUpdate.dailyLimit.count
    );
    expect(Number(updatedTypeRecord.dailyLimitAmount)).to.equal(
      typeToUpdate.dailyLimit.amount
    );

    expect(Number(updatedTypeRecord.monthlyLimitCount)).to.equal(
      typeToUpdate.monthlyLimit.count
    );
    expect(Number(updatedTypeRecord.monthlyLimitAmount)).to.equal(
      typeToUpdate.monthlyLimit.amount
    );

    expect(Number(updatedTypeRecord.weeklyLimitCount)).to.equal(
      typeToUpdate.weeklyLimit.count
    );
    expect(Number(updatedTypeRecord.weeklyLimitAmount)).to.equal(
      typeToUpdate.weeklyLimit.amount
    );
  });

  it("should update a type with valid name, description and transaction code of type", async () => {
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

    const type = await prismaAccounting.transactionType.findUnique({
      where: {
        transactionCode: "223",
      },
    });

    const typeId = type.id;

    const typeToUpdate = {
      name: "NEw NEw Account Name111",
      description: "New New This is a description for the chart of account.",
      transactionCode: "3311",
      dailyLimitCount: 20,
      dailyLimitAmount: 30,
      monthlyLimitAmount: 30,
      monthlyLimitCount: 20,
      weeklyLimitAmount: 100,
      weeklyLimitCount: 5000,
    };


    await pactum
      .spec()
      .withMethod("PATCH")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.updateType}${typeId}`)
      .withJson(typeToUpdate)
      .expectStatus(200);

    const updatedTypeRecord = await prismaAccounting.transactionType.findUnique(
      {
        where: { id: typeId },
      }
    );

    expect(updatedTypeRecord).to.not.be.null;

    expect(updatedTypeRecord.name).to.equal(typeToUpdate.name);
    expect(updatedTypeRecord.description).to.equal(typeToUpdate.description);

    expect(updatedTypeRecord.transactionCode).to.equal(
      typeToUpdate.transactionCode
    );
  });

  // it("should not let user insert negative value in limits", async () => {
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

  //   const type = await prismaAccounting.transactionType.findUnique({
  //     where: {
  //       transactionCode: "223",
  //     },
  //   });

  //   const typeId = type.id;

  //   const typeToUpdate = {
  //     name: "NEw NEw Account Name111",
  //     description: "New New This is a description for the chart of account.",
  //     transactionCode: "3311",
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
  //       amount: -30,
  //     },
  //   };


  //   await pactum
  //     .spec()
  //     .withMethod("PATCH")
  //     .withBearerToken(token)
  //     .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.updateType}${typeId}`)
  //     .withJson(typeToUpdate)
  //     .expectStatus(400);

  //   const updatedTypeRecord = await prismaAccounting.transactionType.findUnique(
  //     {
  //       where: { id: typeId },
  //     }
  //   );

  //   expect(type).to.not.be.null;
  //   expect(type.name).to.equal(updatedTypeRecord.name);
  //   expect(type.description).to.equal(updatedTypeRecord.description);
  //   expect(type.fromChartOfAccountId).to.equal(updatedTypeRecord.fromChartOfAccountId);
  //   expect(type.toChartOfAccountId).to.equal(updatedTypeRecord.toChartOfAccountId);

  //   expect(type.fromChartOfAccountId).to.equal(updatedTypeRecord.fromChartOfAccountId);
  //   expect(type.toChartOfAccountId).to.equal(updatedTypeRecord.toChartOfAccountId);

  //   expect(Number(type.dailyLimitCount)).to.equal(Number(updatedTypeRecord.dailyLimitCount));
  //   expect(Number(type.dailyLimitAmount)).to.equal(Number(updatedTypeRecord.dailyLimitAmount));
  //   expect(Number(type.monthlyLimitCount)).to.equal(Number(updatedTypeRecord.monthlyLimitCount));
  //   expect(Number(type.monthlyLimitAmount)).to.equal(Number(updatedTypeRecord.monthlyLimitAmount));
  //   expect(Number(type.weeklyLimitCount)).to.equal(Number(updatedTypeRecord.weeklyLimitCount));
  //   expect(Number(type.weeklyLimitAmount)).to.equal(Number(updatedTypeRecord.weeklyLimitAmount));

  //   expect(type.isActive).to.be.true;

  // });

  it("should return 400 if attempting to update non-allowed fields like fromCoa and toCoa", async () => {
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

    const typeWithInvalidFields = {
      fromChartOfAccountId: account2,
      toChartOfAccountId: account1,
      transactionCode: "3311",
    };

    const type = await prismaAccounting.transactionType.findUnique({
      where: { transactionCode: "223" },
    });

    const typeId = type.id;
    await pactum
      .spec()
      .withMethod("PATCH")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.updateType}${typeId}`)
      .withJson({
        fromCoa: account1.id,
        toCoa: account2.id,
        transactionCode: "3311",
      })
      .expectStatus(400);

    const typeRecord = await prismaAccounting.transactionType.findUnique({
      where: { id: typeId },
    });

    expect(typeRecord).to.not.be.null;
    expect(typeRecord.fromChartOfAccountId).to.not.equal(
      typeWithInvalidFields.fromChartOfAccountId
    );
    expect(typeRecord.toChartOfAccountId).to.not.equal(
      typeWithInvalidFields.toChartOfAccountId
    );
    expect(typeRecord.transactionCode).to.not.equal(
      typeWithInvalidFields.transactionCode
    );
  });

  it("should check the logs for updating a type", async () => {
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

    const type = await prismaAccounting.transactionType.findUnique({
      where: {
        transactionCode: "223",
      },
    });

    const typeId = type.id;

    const typeToUpdate = {
      name: "NEw NEw Account Name111",
      description: "New New This is a description for the chart of account.",
      transactionCode: "3311",
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
        amount: 30,
      },
    };

    await pactum
      .spec()
      .withMethod("PATCH")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.updateType}${typeId}`)
      .withJson(typeToUpdate);

    const updatedTypeRecord = await prismaAccounting.transactionType.findUnique(
      {
        where: { id: typeId },
      }
    );

    const logEntry = await prismaAccounting.transactionTypeChangeLog.findMany({
      where: { transactionType_id: updatedTypeRecord.id },
    });

    expect(logEntry[0]).to.have.property("changeType").to.equal("UPDATE");
    expect(logEntry[0]).to.have.property("oldValue").not.to.be.null;
    expect(logEntry[0]).to.have.property("oldValue").not.to.be.null;
  });
});
