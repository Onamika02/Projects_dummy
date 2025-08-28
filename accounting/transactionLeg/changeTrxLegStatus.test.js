import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../../apiUrls.js";
import prismaAccounting from "../../utils/prismaAccountingClient.js";
import { generateToken } from "../../utils/generateJWT.js";

describe("Enable or Disable Trxn Leg API Tests (PUT :v1/trxn-leg/change-status)", () => {
  before(async () => {
    await prismaAccounting.$connect();
  });

  beforeEach(async () => {

    await prismaAccounting.$executeRaw`SET session_replication_role = 'origin';`;
    await prismaAccounting.transactionLegLog.deleteMany({});
    await prismaAccounting.transactionLeg.deleteMany({});
    await prismaAccounting.transactionTypeChangeLog.deleteMany({});
    await prismaAccounting.transactionType.deleteMany({});
    await prismaAccounting.chartOfAccountLog.deleteMany({});
    await prismaAccounting.chartOfAccount.deleteMany({});
    await prismaAccounting.$executeRaw`SET session_replication_role = 'replica';`;
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
  });

  after(async () => {
    await prismaAccounting.$disconnect();
  });

  // it("should disable a leg and change log", async () => {
  //   const adminUser = {
  //     email: "admin@ppay.com",
  //     roles: "Admin",
  //     adminRole: "ADMIN",
  //   };
  //   const token = generateToken(
  //     1,
  //     adminUser.email,
  //     adminUser.roles,
  //     adminUser.adminRole
  //   );

  //   const testFee = await prismaAccounting. transactionLeg.findMany({});

  //   const feeId = testFee[0].id;

  //   await pactum
  //     .spec()
  //     .put(`${ApiUrls.apiBaseUrl}${ApiUrls.enableDisableLeg}${feeId}`)
  //     .withBearerToken(token)
  //     .withJson({
  //       isEnable: false,
  //     })
  //     .expectStatus(200);

  //   const updatedFeeRecord = await prismaAccounting.transactionLeg.findUnique({
  //     where: { id: feeId },
  //   });

  //   expect(updatedFeeRecord.isEnable).to.be.false;

  //   const logEntry = await prismaAccounting.transactionLegLog.findMany({
  //     where: {
  //       TransactionLeg_id: feeId,
  //       changeType: "CHANGE_STATUS",
  //     }
  //   });

  //   expect(logEntry).to.not.be.null;
  //   expect(logEntry.changeType).to.equal("CHANGE_STATUS");
  // });
});
