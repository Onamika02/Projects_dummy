import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../../apiUrls.js";
import prismaAccounting from "../../utils/prismaAccountingClient.js";
import { generateToken } from "../../utils/generateJWT.js";

let token;

describe("GET Trxn Fee Details API Tests (:GET /v1/transaction-type)", () => {
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

    const typeA = await prismaAccounting.transactionType.create({
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

    const typeB = await prismaAccounting.transactionType.create({
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

    await prismaAccounting. transactionLeg.create({
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
  });

  after(async () => {
    await prismaAccounting.$disconnect();
  });

  it("should return a fee details", async () => {
    const fee = await prismaAccounting. transactionLeg.findMany({
      where: {
        name: "Public",
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

    const response = await pactum
      .spec()
      .get(`${ApiUrls.apiBaseUrl}${ApiUrls.getLegs}/${fee[0].id}`)
      .withBearerToken(token)
      .expectStatus(200);

    const feeDb = await prismaAccounting. transactionLeg.findUnique({
      where: {
        id: fee[0].id,
      },
    });

    expect(response.body).to.be.an("object");
    expect(response.body.name).to.equal(feeDb.name);
    expect(response.body.description).to.equal(feeDb.description);
    expect(Number(response.body.id)).to.equal(Number(feeDb.id));
    expect(response.body.amount).to.equal(Number(feeDb.fixedAmount));
    expect(response.body.minamount).to.equal(Number(feeDb.minAmount));
    expect(response.body.maxamount).to.equal(Number(feeDb.maxAmount));
    expect(response.body.chargetype.toUpperCase()).to.equal(feeDb.chargeType);
    expect(response.body.type.toUpperCase()).to.equal(feeDb.type);
  });
});
