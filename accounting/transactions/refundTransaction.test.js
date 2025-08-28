import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../../apiUrls.js";
import prismaAccounting from "../../utils/prismaAccountingClient.js";
import { generateToken } from "../../utils/generateJWT.js";
import { generateUserToken } from "../../utils/userTokenJWT.js";
import prismaAuth from "../../utils/prismaAuthClient.js";

describe("Refund Transaction API Balance Check (POST)", async () => {
  let token, createdType, account1, account2;

  before(async () => {
    await prismaAuth.$connect();
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
          name: "Chart of Account 1",
          description: "Description for Account 1",
          transactionType: "SYSTEM",
          headType: "ASSET",
          code: "001",
          onlyParent: true,
          adminId: 1,
        },
        {
          name: "Chart of Account 2",
          description: "Description for Account 2",
          transactionType: "SYSTEM",
          headType: "ASSET",
          code: "002",
          onlyParent: true,
          adminId: 1,
        },
      ],
    });

    const coA1 = await prismaAccounting.chartOfAccount.findUnique({
      where: { code: "001" },
    });

    const coA2 = await prismaAccounting.chartOfAccount.findUnique({
      where: { code: "002" },
    });

    const createdType = await prismaAccounting.transactionType.create({
      data: {
        transactionCode: "223",
        name: "Send Money",
        description: "qqqqqqqqqqqqqqqqq",
        minAmount: 66,
        maxAmount: 666,
        createdByAdminId: 1,
        createdByAdminIdentifier: "11",
        isActive: true,
        fromChartOfAccount: {
          connect: { id: coA1.id },
        },
        toChartOfAccount: {
          connect: { id: coA2.id },
        },
      },
    });
  });

  after(async () => {
    await prismaAccounting.$disconnect();
    await prismaAuth.$disconnect();
  });

  it("should return 200 for successful transaction refund where both sender and receiver is FULL_ACTIVE", async function () {
    const coA1 = await prismaAccounting.chartOfAccount.findUnique({
      where: { code: "001" },
    });

    const coA2 = await prismaAccounting.chartOfAccount.findUnique({
      where: { code: "002" },
    });

    await prismaAccounting.userAccount.createMany({
      data: [
        {
          accountName: "Jarin",
          identifier: "01317577237",
          status: "FULL_ACTIVE",
          dailyLimitAmount: 50000,
          dailyLimitCount: 200000,
          monthlyLimitAmount: 5000000,
          monthlyLimitCount: 600000000,
          maxWalletAmount: 1000000000,
          minWalletAmount: 500,
          chartOfAccount_id: coA1.id,
        },
        {
          accountName: "Sultana",
          identifier: "01711106485",
          dailyLimitAmount: 50000,
          dailyLimitCount: 200000,
          monthlyLimitAmount: 5000000,
          monthlyLimitCount: 600000000,
          maxWalletAmount: 1000000000,
          minWalletAmount: 500,
          status: "FULL_ACTIVE",
          chartOfAccount_id: coA2.id,
        },
      ],
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

    account1 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01317577237" },
    });

    account2 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01711106485" },
    });

    createdType = await prismaAccounting.transactionType.findMany({
      where: { createdByAdminIdentifier: "11" },
    });

    const addMoneyTransaction = await prismaAccounting.transaction.create({
      data: {
        fromAccountId: account1.id,
        toAccountId: account2.id,
        transactionTypeId: createdType[0].id,
        amount: 1000,
        referenceNo: "qqqqqqqqqq",
        note: "send money",
      },
    });

    await prismaAccounting.ledger.createMany({
      data: [
        {
          accountId: account1.id,
          transactionId: addMoneyTransaction.id,
          amount: 1000,
          description: "send money transaction",
          type: "DEBIT",
        },
        {
          accountId: account2.id,
          transactionId: addMoneyTransaction.id,
          amount: 1000,
          description: "send money transaction",
          type: "CREDIT",
        },
      ],
    });

    const transaction = await prismaAccounting.transaction.findMany({
      where: { referenceNo: "qqqqqqqqqq" },
    });

    const referenceNo = transaction[0]?.referenceNo;
    const transactionId = transaction[0]?.id;

    const legderBeforeRefund = await prismaAccounting.ledger.findMany({
      where: {
        transactionId: transactionId,
      },
    });

    await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.refundTransaction}`)
      .withJson({
        code: referenceNo,
      })
      .expectStatus(200);

    const refundedTransaction = await prismaAccounting.transaction.findMany({
      where: { mainTransactionId: transactionId },
    });

    expect(refundedTransaction).to.exist;
    expect(refundedTransaction[0].isRefunded).to.be.true;

    const legderAfterRefund = await prismaAccounting.ledger.findMany({
      where: {
        transactionId: refundedTransaction[0].id,
      },
    });

    expect(legderBeforeRefund).to.exist;
    expect(legderBeforeRefund).to.have.lengthOf(2);

    expect(legderBeforeRefund[0].amount).to.equal(1000);
    expect(legderBeforeRefund[0].type).to.equal('DEBIT');
    expect(legderBeforeRefund[0].accountId).to.equal(account1.id);

    expect(legderBeforeRefund[1].amount).to.equal(1000);
    expect(legderBeforeRefund[1].type).to.equal('CREDIT');
    expect(legderBeforeRefund[1].accountId).to.equal(account2.id);

    expect(legderAfterRefund).to.exist;
    expect(legderAfterRefund).to.have.lengthOf(2);

    expect(legderAfterRefund[0].amount).to.equal(1000);
    expect(legderAfterRefund[0].type).to.equal('DEBIT');
    expect(legderAfterRefund[0].accountId).to.equal(account2.id);

    expect(legderAfterRefund[1].amount).to.equal(1000);
    expect(legderAfterRefund[1].type).to.equal('CREDIT');
    expect(legderAfterRefund[1].accountId).to.equal(account1.id);
  });

  it("should return 200 for successful transaction refund where sender is FULL_ACTIVE and receiver is LIMITED_ACTIVE", async function () {
    const coA1 = await prismaAccounting.chartOfAccount.findUnique({
      where: { code: "001" },
    });

    const coA2 = await prismaAccounting.chartOfAccount.findUnique({
      where: { code: "002" },
    });

    await prismaAccounting.userAccount.createMany({
      data: [
        {
          accountName: "Jarin",
          identifier: "01317577237",
          status: "FULL_ACTIVE",
          dailyLimitAmount: 50000,
          dailyLimitCount: 200000,
          monthlyLimitAmount: 5000000,
          monthlyLimitCount: 600000000,
          maxWalletAmount: 1000000000,
          minWalletAmount: 500,
          chartOfAccount_id: coA1.id,
        },
        {
          accountName: "Sultana",
          identifier: "01711106485",
          dailyLimitAmount: 50000,
          dailyLimitCount: 200000,
          monthlyLimitAmount: 5000000,
          monthlyLimitCount: 600000000,
          maxWalletAmount: 1000000000,
          minWalletAmount: 500,
          status: "LIMITED_ACTIVE",
          chartOfAccount_id: coA2.id,
        },
      ],
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

    account1 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01317577237" },
    });

    account2 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01711106485" },
    });

    createdType = await prismaAccounting.transactionType.findMany({
      where: { createdByAdminIdentifier: "11" },
    });

    const addMoneyTransaction = await prismaAccounting.transaction.create({
      data: {
        fromAccountId: account1.id,
        toAccountId: account2.id,
        transactionTypeId: createdType[0].id,
        amount: 1000,
        referenceNo: "qqqqqqqqqq",
        note: "send money",
      },
    });

    await prismaAccounting.ledger.createMany({
      data: [
        {
          accountId: account1.id,
          transactionId: addMoneyTransaction.id,
          amount: 1000,
          description: "send money transaction",
          type: "DEBIT",
        },
        {
          accountId: account2.id,
          transactionId: addMoneyTransaction.id,
          amount: 1000,
          description: "send money transaction",
          type: "CREDIT",
        },
      ],
    });

    const transaction = await prismaAccounting.transaction.findMany({
      where: { referenceNo: "qqqqqqqqqq" },
    });

    const referenceNo = transaction[0]?.referenceNo;
    const transactionId = transaction[0]?.id;

    const legderBeforeRefund = await prismaAccounting.ledger.findMany({
      where: {
        transactionId: transactionId,
      },
    });

    await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.refundTransaction}`)
      .withJson({
        code: referenceNo,
      })
      .expectStatus(200);

    const refundedTransaction = await prismaAccounting.transaction.findMany({
      where: { mainTransactionId: transactionId },
    });

    const legderAfterRefund = await prismaAccounting.ledger.findMany({
      where: {
        transactionId: refundedTransaction[0].id,
      },
    });

    expect(legderBeforeRefund).to.exist;
    expect(legderBeforeRefund).to.have.lengthOf(2);

    expect(legderBeforeRefund[0].amount).to.equal(1000);
    expect(legderBeforeRefund[0].type).to.equal('DEBIT');
    expect(legderBeforeRefund[0].accountId).to.equal(account1.id);

    expect(legderBeforeRefund[1].amount).to.equal(1000);
    expect(legderBeforeRefund[1].type).to.equal('CREDIT');
    expect(legderBeforeRefund[1].accountId).to.equal(account2.id);

    expect(legderAfterRefund).to.exist;
    expect(legderAfterRefund).to.have.lengthOf(2);

    expect(legderAfterRefund[0].amount).to.equal(1000);
    expect(legderAfterRefund[0].type).to.equal('DEBIT');
    expect(legderAfterRefund[0].accountId).to.equal(account2.id);

    expect(legderAfterRefund[1].amount).to.equal(1000);
    expect(legderAfterRefund[1].type).to.equal('CREDIT');
    expect(legderAfterRefund[1].accountId).to.equal(account1.id);
  });

  it("should not refund a transaction that was refunded before", async function () {
    const coA1 = await prismaAccounting.chartOfAccount.findUnique({
      where: { code: "001" },
    });

    const coA2 = await prismaAccounting.chartOfAccount.findUnique({
      where: { code: "002" },
    });

    await prismaAccounting.userAccount.createMany({
      data: [
        {
          accountName: "Jarin",
          identifier: "01317577237",
          status: "FULL_ACTIVE",
          dailyLimitAmount: 50000,
          dailyLimitCount: 200000,
          monthlyLimitAmount: 5000000,
          monthlyLimitCount: 600000000,
          maxWalletAmount: 1000000000,
          minWalletAmount: 500,
          chartOfAccount_id: coA1.id,
        },
        {
          accountName: "Sultana",
          identifier: "01711106485",
          status: "FULL_ACTIVE",
          dailyLimitAmount: 50000,
          dailyLimitCount: 200000,
          monthlyLimitAmount: 5000000,
          monthlyLimitCount: 600000000,
          maxWalletAmount: 1000000000,
          minWalletAmount: 500,
          chartOfAccount_id: coA2.id,
        },
      ],
    });

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

    const account1 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01317577237" },
    });

    const account2 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01711106485" },
    });

    const createdType = await prismaAccounting.transactionType.findMany({
      where: { createdByAdminIdentifier: "11" },
    });

    const firstTransaction = await prismaAccounting.transaction.create({
      data: {
        fromAccountId: account1.id,
        toAccountId: account2.id,
        transactionTypeId: createdType[0].id,
        amount: 1000,
        referenceNo: "qqqqqqqqqq",
        note: "send money",
        status: "SUCCESSFUL",
      },
    });

    await prismaAccounting.ledger.createMany({
      data: [
        {
          accountId: account1.id,
          transactionId: firstTransaction.id,
          amount: 1000,
          description: "send money transaction",
          type: "DEBIT",
        },
        {
          accountId: account2.id,
          transactionId: firstTransaction.id,
          amount: 1000,
          description: "send money transaction",
          type: "CREDIT",
        },
      ],
    });

    await prismaAccounting.transaction.create({
      data: {
        fromAccountId: account2.id,
        toAccountId: account1.id,
        transactionTypeId: createdType[0].id,
        amount: 1000,
        referenceNo: "qqqqqqqqqq",
        note: "Refund transaction",
        description: "Refund of transaction: qqqqqqqqqq",
        log: "Refund of transaction: qqqqqqqqqq is Requested By: admin@ppay.com",
        mainTransactionId: firstTransaction.id,
        isRefunded: true,
      },
    });

    await prismaAccounting.ledger.createMany({
      data: [
        {
          accountId: account1.id,
          transactionId: firstTransaction.id,
          amount: 1000,
          description: "send money transaction",
          type: "CREDIT",
        },
        {
          accountId: account2.id,
          transactionId: firstTransaction.id,
          amount: 1000,
          description: "send money transaction",
          type: "DEBIT",
        },
      ],
    });

    const transaction = await prismaAccounting.transaction.findMany({
      where: { referenceNo: "qqqqqqqqqq" },
    });

    const referenceNo = transaction[0]?.referenceNo;

    await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.refundTransaction}`)
      .withJson({
        code: referenceNo,
      })
      .expectStatus(406);
  });

  it("should check that refund will be done only by the admin user", async function () {
    const coA1 = await prismaAccounting.chartOfAccount.findUnique({
      where: { code: "001" },
    });

    const coA2 = await prismaAccounting.chartOfAccount.findUnique({
      where: { code: "002" },
    });

    await prismaAccounting.userAccount.createMany({
      data: [
        {
          accountName: "Jarin",
          identifier: "01317577237",
          status: "FULL_ACTIVE",
          dailyLimitAmount: 50000,
          dailyLimitCount: 200000,
          monthlyLimitAmount: 5000000,
          monthlyLimitCount: 600000000,
          maxWalletAmount: 1000000000,
          minWalletAmount: 500,
          chartOfAccount_id: coA1.id,
        },
        {
          accountName: "Sultana",
          identifier: "01711106485",
          status: "FULL_ACTIVE",
          dailyLimitAmount: 50000,
          dailyLimitCount: 200000,
          monthlyLimitAmount: 5000000,
          monthlyLimitCount: 600000000,
          maxWalletAmount: 1000000000,
          minWalletAmount: 500,
          chartOfAccount_id: coA2.id,
        },
      ],
    });

    const appUser = {
      phoneNumber: "01711106485",
      pin: "123458",
    };
    token = generateUserToken(1, appUser.phoneNumber, "USER");
    const account1 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01317577237" },
    });

    const account2 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01711106485" },
    });

    const createdType = await prismaAccounting.transactionType.findMany({
      where: { createdByAdminIdentifier: "11" },
    });

    const firstTransaction = await prismaAccounting.transaction.create({
      data: {
        fromAccountId: account1.id,
        toAccountId: account2.id,
        transactionTypeId: createdType[0].id,
        amount: 1000,
        referenceNo: "qqqqqqqqqq",
        note: "send money",
        status: "SUCCESSFUL",
      },
    });

    await prismaAccounting.ledger.createMany({
      data: [
        {
          accountId: account1.id,
          transactionId: firstTransaction.id,
          amount: 1000,
          description: "send money transaction",
          type: "DEBIT",
        },
        {
          accountId: account2.id,
          transactionId: firstTransaction.id,
          amount: 1000,
          description: "send money transaction",
          type: "CREDIT",
        },
      ],
    });

    const transaction = await prismaAccounting.transaction.findMany({
      where: { referenceNo: "qqqqqqqqqq" },
    });

    const referenceNo = transaction[0]?.referenceNo;

    await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.refundTransaction}`)
      .withJson({
        code: referenceNo,
      })
      .expectStatus(401);

    const transactionId = transaction[0]?.id;

    const refundedTransaction = await prismaAccounting.transaction.findMany({
      where: { mainTransactionId: transactionId },
    });

    expect(refundedTransaction).to.be.empty;
  });
});
