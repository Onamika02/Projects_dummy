import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../../apiUrls.js";
import prismaAccounting from "../../utils/prismaAccountingClient.js";
import { generateToken } from "../../utils/generateJWT.js";
import { clearAllDatabases } from "../../utils/cleanDB.js";

let token, account1, account2, typeA, typeB;

describe("Create Trxn Leg API Tests (POST fee:/v1/trxn-leg)", () => {
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

    await prismaAccounting.chartOfAccount.createMany({
      data: [
        {
          name: "Account 1",
          description: "Description for Account 1",
          transactionType: "SYSTEM",
          headType: "ASSET",
          code: "001",
          onlyParent: false,
          adminId: 1,
        },
        {
          name: "Account 2",
          description: "Description for Account 2",
          transactionType: "SYSTEM",
          headType: "ASSET",
          code: "002",
          onlyParent: true,
          adminId: 1,
        },
      ],
    });

    const account1 = await prismaAccounting.chartOfAccount.findUnique({
      where: {
        code: "001",
      },
    });

    const account2 = await prismaAccounting.chartOfAccount.findUnique({
      where: {
        code: "002",
      },
    });

    typeA = await prismaAccounting.transactionType.create({
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
      },
    });

    typeB = await prismaAccounting.transactionType.create({
      data: {
        transactionCode: "224",
        name: "TypeB",
        description: "qqqqqqqqqqqqqqqqq",
        minAmount: 66,
        maxAmount: 666,
        createdByAdminId: 1,
        createdByAdminIdentifier: "11",
        isActive: true,
        fromChartOfAccountId: account1.id,
        toChartOfAccountId: account2.id,
      },
    });
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
  });

  after(async () => {
    await prismaAccounting.$disconnect();
  });

  it("should create a new leg", async () => {
    const response = await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.createLeg}`)
      .withJson({
        name: "Send Money Fee",
        description: "Corporate description",
        type: "FEE",
        isEnable: true,
        originalTransactionType: typeA.id.toString(),
        generatedTransactionType: typeB.id.toString(),
        chargeType: "Percentage",

        amount: 30,
        minAmount: 30,
        maxAmount: 100,
      })
      .expectStatus(201);

    const createdFee = await prismaAccounting.transactionLeg.findMany({
      where: { name: "Corporate" },
    });
    expect(createdFee).to.not.be.null;
  });

  it("should return 400 for invalid input of fee", async () => {
    const invalidFee = {
      name: "",
      description: "Invalid description",
      type: "Type C",
      isEnable: true,
      originalTransactionType: 1,
      generatedTransactionType: 2,
      chargeType: "Charge Invalid",
      amount: -100,
      minAmount: -50,
      maxAmount: -200,
    };

    await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.createLeg}`)
      .withJson({
        name: "",
        description: "Invalid description",
        type: "Type C",
        isEnable: true,
        originalTransactionType: 1,
        generatedTransactionType: 2,
        chargeType: "Charge Invalid",
        amount: -100,
        minAmount: -50,
        maxAmount: -200,
      })
      .expectStatus(400);

    const dbFees = await prismaAccounting.transactionLeg.findMany({});

    expect(dbFees).to.have.lengthOf(0);
  });

  it("should return 419 if the fee already exists and cannot be created again", async () => {

    await prismaAccounting.transactionLeg.create({
      data: {
        name: 'Public',
        description: 'Initial description',
        type: 'FEE',
        isEnable: true,
        chargeType: "FIXED",
        fixedAmount: 100,
        minAmount: 10,
        maxAmount: 200,
        percentageAmount: 5,
        destinationType: "SOURCE",
        originalTransactionType: {
          connect: { id: Number(typeA.id) }
        },
        generatedTransactionType: {
          connect: { id: Number(typeB.id) }
        }
      },
    });

    const existingFee = {
      name: "Public",
      description: "Initial description",
      type: "FEE",
      isEnable: true,
      originalTransactionTypeId: typeA.id,
      generatedTransactionTypeId: typeB.id,
      chargeType: "FIXED",
      fixedAmount: 100,
      minAmount: 10,
      maxAmount: 200,
      percentageAmount: 5,
    };

    await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.createLeg}`)
      .withJson({
        name: "Corporate",
        description: "Corporate description",
        type: "FEE",
        isEnable: true,
        originalTransactionType: typeA.id.toString(),
        generatedTransactionType: typeB.id.toString(),
        chargeType: "Percentage",
        amount: 30,
        minAmount: 30,
        maxAmount: 100,
      })
      .expectStatus(400);

    const dbFees = await prismaAccounting.transactionLeg.findMany({
      where: {
        name: existingFee.name,
        description: existingFee.description,
        type: existingFee.type,
        isEnable: existingFee.isEnable,
        originalTransactionType: existingFee.originalTransactionType,
        generatedTransactionType: existingFee.generatedTransactionType,
        chargeType: existingFee.chargeType,
        amount: existingFee.amount,
        minAmount: existingFee.minAmount,
        maxAmount: existingFee.maxAmount,
      },
    });

    const feeRecord = dbFees[0];
    expect(feeRecord).to.exist;
    expect(feeRecord.name).to.equal(existingFee.name);
    expect(feeRecord.description).to.equal(existingFee.description);
    expect(feeRecord.type).to.equal(existingFee.type);
  });

  // it("should return 400 for multiple missing mandatory fields", async () => {
  //   await pactum
  //     .spec()
  //     .withMethod("POST")
  //     .withBearerToken(token)
  //     .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.createLeg}`)
  //     .withJson({
  //       description: "Test description",
  //       type: "FEE",
  //       originalTransactionType: 1,
  //       chargeType: "Percentage",
  //       amount: 100,
  //     })
  //     .expectStatus(400);
  // });

  it("should return 400 if originalTransactionType and generatedTransactionType are the same", async () => {

    const feeWithSameTypes = {
      name: "Public",
      description: "Initial description",
      type: "FEE",
      isEnable: true,
      originalTransactionType: typeA.id,
      generatedTransactionType: typeA.id,
      chargeType: "FIXED",
      fixedAmount: 100,
      minAmount: 10,
      maxAmount: 200,
      percentageAmount: 5,
    };

    await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.createLeg}`)
      .withJson({
        name: "Public",
        description: "Initial description",
        type: "FEE",
        isEnable: true,
        originalTransactionType: typeA.id.toString(),
        generatedTransactionType: typeA.id.toString(),
        chargeType: "FIXED",
        fixedAmount: 100,
        minAmount: 10,
        maxAmount: 200,
        percentageAmount: 5,
      })
      .expectStatus(400);

    const dbFees = await prismaAccounting.transactionLeg.findMany({
      where: {
        originalTransactionTypeId: feeWithSameTypes.originalTransactionType,
        generatedTransactionTypeId: feeWithSameTypes.generatedTransactionType,
      },
    });

    expect(dbFees).to.have.lengthOf(0);
  });

  it("should return 400 if type is AIT and charge type is anything but No Charge", async () => {

    const feeWithSameTypes = {
      name: "Public",
      description: "Initial description",
      type: "AIT",
      isEnable: true,
      originalTransactionType: typeA.id.toString(),
      generatedTransactionType: typeA.id.toString(),
      chargeType: "FIXED",
      fixedAmount: 100,
      minAmount: 10,
      maxAmount: 200,
      percentageAmount: 5,
    };

    await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.createLeg}`)
      .withJson(feeWithSameTypes)
      .expectStatus(400);

    const dbFees = await prismaAccounting.transactionLeg.findMany({
      where: {
        originalTransactionTypeId: feeWithSameTypes.originalTransactionType,
        generatedTransactionTypeId: feeWithSameTypes.generatedTransactionType,
      },
    });

    expect(dbFees).to.have.lengthOf(0);
  });

  it("should return 400 if type is VAT and charge type is anything but Percentage", async () => {

    const feeWithSameTypes = {
      name: "Public",
      description: "Initial description",
      type: "VAT",
      isEnable: true,
      originalTransactionType: typeA.id.toString(),
      generatedTransactionType: typeA.id.toString(),
      chargeType: "FIXED",
      fixedAmount: 100,
      minAmount: 10,
      maxAmount: 200,
      percentageAmount: 5,
    };

    await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.createLeg}`)
      .withJson(feeWithSameTypes)
      .expectStatus(400);

    const dbFees = await prismaAccounting.transactionLeg.findMany({
      where: {
        originalTransactionTypeId: feeWithSameTypes.originalTransactionType,
        generatedTransactionTypeId: feeWithSameTypes.generatedTransactionType,
      },
    });

    expect(dbFees).to.have.lengthOf(0);
  });

  it("should return 400 if maxAmount is less than or equal to minAmount", async () => {

    const feeWithInvalidMaxAmount = {
      name: "Public",
      description: "Initial description",
      type: "FEE",
      isEnable: true,
      originalTransactionTypeId: typeA.id,
      generatedTransactionTypeId: typeB.id,
      chargeType: "FIXED",
      fixedAmount: 100,
      minAmount: 10,
      maxAmount: 10,
      percentageAmount: 5,
    };

    await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.createLeg}`)
      .withJson({
        name: "Public",
        description: "Initial description",
        type: "FEE",
        isEnable: true,
        originalTransactionTypeId: typeA.id.toString(),
        generatedTransactionTypeId: typeB.id.toString(),
        chargeType: "FIXED",
        fixedAmount: 100,
        minAmount: 10,
        maxAmount: 10,
        percentageAmount: 5,
      })
      .expectStatus(400);

    const dbFees = await prismaAccounting.transactionLeg.findMany({
      where: {
        name: feeWithInvalidMaxAmount.name,
      },
    });

    expect(dbFees).to.have.lengthOf(0);

    const feeRecord = dbFees[0];
    if (feeRecord) {
      expect(feeRecord.minAmount).to.be.at.most(feeRecord.maxAmount);
    }
  });

  it("should return 400 if amount exceeds 100", async () => {

    const feeWithInvalidMaxAmount = {
      name: "Public",
      description: "Initial description",
      type: "FEE",
      isEnable: true,
      originalTransactionTypeId: typeA.id,
      generatedTransactionTypeId: typeB.id,
      chargeType: "FIXED",
      fixedAmount: 1000,
      minAmount: 10,
      maxAmount: 200,
      percentageAmount: 5,
    };

    await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.createLeg}`)
      .withJson({
        name: "Public",
        description: "Initial description",
        type: "FEE",
        isEnable: true,
        originalTransactionType: typeA.id.toString(),
        generatedTransactionType: typeB.id.toString(),
        chargeType: "FIXED",
        fixedAmount: 1000,
        minAmount: 10,
        maxAmount: 200,
        percentageAmount: 5,
      })
      .expectStatus(400);

    const dbFees = await prismaAccounting.transactionLeg.findMany({
      where: {
        name: feeWithInvalidMaxAmount.name,
      },
    });

    expect(dbFees).to.have.lengthOf(0);
  });

  // it("should store null in database min and max value if type is Fixed", async () => {

  //   const feeWithFixedType = {
  //     name: "Public",
  //     description: "Initial description",
  //     type: "FEE",
  //     isEnable: true,
  //     originalTransactionTypeId: Number(typeA.id),
  //     generatedTransactionTypeId: Number(typeB.id),
  //     chargeType: "FIXED",
  //     fixedAmount: 50,
  //     minAmount: 10,
  //     maxAmount: 200,
  //     amount: 5,
  //     destinationType: "SOURCE"
  //   };

  //   await pactum
  //     .spec()
  //     .withMethod("POST")
  //     .withBearerToken(token)
  //     .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.createLeg}`)
  //     .withJson(
  //       feeWithFixedType
  //     );

  //   const dbFees = await prismaAccounting.transactionLeg.findMany({
  //     where: { name: "Public" },
  //   });

  //   console.log("aaaaaaaaaaaaaaaaaaaaaaa", dbFees);
  //   expect(dbFees).to.have.lengthOf(1);
  //   const feeRecord = dbFees[0];

  //   expect(feeRecord.minAmount).to.be.null;
  //   expect(feeRecord.maxAmount).to.be.null;
  // });

  it("should check the logs for creating a fee", async () => {
    await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.createLeg}`)
      .withJson({
        name: "Corporate",
        description: "Corporate description",
        type: "FEE",
        isEnable: true,
        originalTransactionType: typeA.id.toString(),
        generatedTransactionType: typeB.id.toString(),
        chargeType: "Percentage",
        amount: 30,
        minAmount: 30,
        maxAmount: 100,
        destinationType: "SOURCE"
      }).expectStatus(201);

    const createdFee = await prismaAccounting.transactionLeg.findMany({
      where: { name: "Corporate" },
    });

    const logEntry = await prismaAccounting.transactionLegLog.findMany({
      where: { TransactionLeg_id: Number(createdFee[0].id) },
    });

    expect(logEntry).to.be.an("array").that.is.not.empty;
    expect(logEntry[0]).to.have.property("changeType").to.equal("CREATE");
    expect(logEntry[0]).to.have.property("oldValue").to.be.null;
    expect(logEntry[0]).to.have.property("newValue").not.to.be.null;
  });
});
