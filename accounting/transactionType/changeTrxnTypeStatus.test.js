import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../../apiUrls.js";
import prismaAccounting from "../../utils/prismaAccountingClient.js";
import { generateToken } from "../../utils/generateJWT.js";

describe("Active or Inactive Transaction type API Tests (POST)", () => {
  let typeId;

  before(async () => {
    await prismaAccounting.$connect();
  });

  beforeEach(async () => {
    await prismaAccounting.ledger.deleteMany({});
    await prismaAccounting.transaction.deleteMany({});

    await prismaAccounting. transactionLegLog.deleteMany({});
    await prismaAccounting. transactionLeg.deleteMany({});

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
      where: { code: "001" },
    });

    const account2 = await prismaAccounting.chartOfAccount.findUnique({
      where: { code: "002" },
    });

    const createdType = await prismaAccounting.transactionType.create({
      data: {
        transactionCode: "223",
        name: "TypeA",
        description: "qqqqqqqqqqqqqqqqq",
        minAmount: 66,
        maxAmount: 666,
        createdByAdminId: 1,
        createdByAdminIdentifier: "11",
        isActive: true,
        fromChartOfAccount: {
          connect: { id: account1.id },
        },
        toChartOfAccount: {
          connect: { id: account2.id },
        },
      },
    });

    typeId = createdType.id;
  });

  after(async () => {
    await prismaAccounting.$disconnect();
  });

  it("should inactive a type and log the change", async () => {
    const adminUser = {
      email: "admin@ppay.com",
      roles: "Admin",
      adminRole: "ADMIN",
    };
    const token = generateToken(
      1,
      adminUser.email,
      adminUser.roles,
      adminUser.adminRole
    );

    const initialType = await prismaAccounting.transactionType.findUnique({
      where: { id: typeId },
    });

    expect(initialType).to.not.be.null;
    expect(initialType.isActive).to.be.true;

    const response = await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(
        `${ApiUrls.apiBaseUrl}${ApiUrls.changeStatusOfType}${typeId}/toggle-status`
      )
      .withJson({ isActive: false })
      .expectStatus(200);

    const updatedType = await prismaAccounting.transactionType.findUnique({
      where: { id: typeId },
    });

    expect(updatedType).to.not.be.null;
    expect(updatedType.isActive).to.be.false;

    const logEntry = await prismaAccounting.transactionTypeChangeLog.findFirst({
      where: {
        transactionType_id: typeId,
        changeType: "CHANGE_STATUS",
      },
    });

    expect(logEntry).to.not.be.null;
  });
});
