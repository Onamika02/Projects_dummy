import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../apiUrls.js";
import prismaAuth from "../../src/utils/prismaAuthClient.js";
import prismaAccounting from "../../src/utils/prismaAccountingClient.js";
import prismaApi from "../utils/prismaApiClient.js";
import { generateToken } from "../../src/utils/generateJWT.js";
import { generateUserToken } from "../../src/utils/userTokenJWT.js";
import createTrxnTypeWithMinAmount from "../utils/TrxnTypeWithMinAmount.js";
import createTrxnTypeWithMaxAmount from "../utils/TrxnTypeWithMinAmount.js";

describe("Request Money ", () => {
  let token, appUser1, appUser2, createdType, account1, account2;
  before(async () => {
    await prismaAuth.$connect();
    await prismaAccounting.$connect();
    await prismaApi.$connect();
  });
  beforeEach(async () => {
    await prismaAccounting.ledger.deleteMany({});
    await prismaAccounting.transaction.deleteMany({});

    await prismaAccounting.transactionTypeChangeLog.deleteMany({});
    await prismaAccounting.transactionType.deleteMany({});

    await prismaAccounting.transactionLegLog.deleteMany({});
    await prismaAccounting.transactionLeg.deleteMany({});

    await prismaAccounting.userAccount.deleteMany({});

    await prismaAccounting.chartOfAccountLog.deleteMany({});
    await prismaAccounting.chartOfAccount.deleteMany({});

    await prismaApi.RequestMoney.deleteMany({});
    await prismaAuth.appUser.deleteMany({});

    await prismaAuth.appUser.createMany({
      data: [
        {
          fullname: "Onamika",
          phone: "01747538382",
          profilePicture: "https://example.com/onamika.jpg",
          email: "johndoe1@example.com",
          password: "123458",
          fathername: "John Doe",
          mothername: "Jane Doe",
          nidnumber: "1234567890",
          dob: "1990-01-01",
          nidaddress: "House 123, Street 456, City, District",
          presentAddress: "House 789, Street 321, City, District",
          district: "Dhaka",
          hasLiveliness: true,
          hasNidInfo: true,
          isEmailVerified: false,
          isPhoneVerified: false,
          nidBack: "https://example.com/nid_back.jpg",
          nidFront: "https://example.com/nid_front.jpg",
          presentAddress: "https://example.com/present_address.jpg",
          role:"USER",
          wrongPinCount: 0
        },

        {
          fullname: "Jarin",
          phone: "01711106999",
          profilePicture: "https://example.com/Jarin.jpg",
          email: "Jarin@example.com",
          password: "123458",
          fathername: "John Jarin",
          mothername: "Jarin Doe",
          nidnumber: "1234566890",
          dob: "1990-01-01",
          nidaddress: "House 123, Street 456, City, District",
          presentAddress: "House 789, Street 321, City, District",
          district: "Dhaka",
          hasLiveliness: true,
          hasNidInfo: true,
          isEmailVerified: false,
          isPhoneVerified: false,
          nidBack: "https://example.com/nid_back.jpg",
          nidFront: "https://example.com/nid_front.jpg",
          role:"USER",
          wrongPinCount: 0
        },
      ],
    });

    appUser1 = await prismaAuth.appUser.findUnique({
      where: { phone: "01747538382" },
    });

    appUser2 = await prismaAuth.appUser.findUnique({
      where: { phone: "01711106999" },
    });

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
          minWalletAmount: 100,
          maxWalletAmount: 10000,
        },
        {
          name: "Chart of Account 2",
          description: "Description for Account 2",
          transactionType: "SYSTEM",
          headType: "ASSET",
          code: "002",
          onlyParent: true,
          adminId: 1,
          minWalletAmount: 100,
          maxWalletAmount: 10000,
        },
        {
          name: "Chart of Account 3",
          description: "Description for Account 3",
          transactionType: "SYSTEM",
          headType: "LIABILITY",
          code: "003",
          onlyParent: true,
          adminId: 1,
          minWalletAmount: 100,
          maxWalletAmount: 10000,
        },
        {
          name: "Chart of Account 4",
          description: "Description for Account 4",
          transactionType: "SYSTEM",
          headType: "EXPENSE",
          code: "004",
          onlyParent: true,
          adminId: 1,
          minWalletAmount: 100,
          maxWalletAmount: 10000,
        },
      ],
    });

    const coA1 = await prismaAccounting.chartOfAccount.findUnique({
      where: { code: "001" },
    });

    const coA2 = await prismaAccounting.chartOfAccount.findUnique({
      where: { code: "002" },
    });

    const coA3 = await prismaAccounting.chartOfAccount.findUnique({
      where: { code: "003" },
    });
    const coA4 = await prismaAccounting.chartOfAccount.findUnique({
      where: { code: "004" },
    });

    await prismaAccounting.userAccount.createMany({
      data: [
        {
          accountName: appUser1.fullname,
          identifier: appUser1.phone,
          status: "FULL_ACTIVE",
          dailyLimitAmount: 50000,
          dailyLimitCount: 200000,
          monthlyLimitAmount: 5000000,
          monthlyLimitCount: 600000000,
          maxWalletAmount: 1000000000,
          minWalletAmount: 0,
          chartOfAccount_id: coA1.id,
        },
        {
          accountName: appUser2.fullname,
          identifier: appUser2.phone,
          dailyLimitAmount: 50000,
          dailyLimitCount: 200000,
          monthlyLimitAmount: 5000000,
          monthlyLimitCount: 600000000,
          maxWalletAmount: 1000000000,
          minWalletAmount: 0,
          status: "FULL_ACTIVE",
          chartOfAccount_id: coA2.id,
        },
      ],
    });

    account1 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01747538382" },
    });

    account2 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01711106999" },
    });

    const transactionTypes = [
      {
        transactionCode: "223",
        name: "Send Money",
        description: "Send money between accounts",
        minAmount: 50,
        maxAmount: 5000,
        createdByAdminId: 1,
        createdByAdminIdentifier: "11",
        isActive: true,
        fromChartOfAccount: { connect: { id: coA1.id } },
        toChartOfAccount: { connect: { id: coA2.id } },
      },
      {
        transactionCode: "TOPUP",
        name: "Top-up",
        description: "Top-up wallet balance",
        minAmount: 10,
        maxAmount: 10000,
        createdByAdminId: 1,
        createdByAdminIdentifier: "11",
        isActive: true,
        fromChartOfAccount: { connect: { id: coA1.id } },
        toChartOfAccount: { connect: { id: coA3.id } },
      },
      {
        transactionCode: "UTILITY",
        name: "Utility Payment",
        description: "Pay utility bills",
        minAmount: 100,
        maxAmount: 2000,
        createdByAdminId: 1,
        createdByAdminIdentifier: "11",
        isActive: true,
        fromChartOfAccount: { connect: { id: coA2.id } },
        toChartOfAccount: { connect: { id: coA4.id } },
      },
      {
        transactionCode: "CASHOUT",
        name: "Cash-out",
        description: "Withdraw money",
        minAmount: 100,
        maxAmount: 3000,
        createdByAdminId: 1,
        createdByAdminIdentifier: "11",
        isActive: true,
        fromChartOfAccount: { connect: { id: coA3.id } },
        toChartOfAccount: { connect: { id: coA4.id } },
      },
    ];

    for (const transactionType of transactionTypes) {
      await prismaAccounting.transactionType.create({ data: transactionType });
    }

    createdType = await prismaAccounting.transactionType.findMany({
      where: { createdByAdminIdentifier: "11" },
    });

    const addMoneyTransactionToAccount1 =
      await prismaAccounting.transaction.create({
        data: {
          fromAccountId: account1.id,
          toAccountId: account2.id,
          transactionTypeId: createdType[0].id,
          amount: Number(100),
          referenceNo: "Initial Funding",
          note: "Adding initial balance to sender's account",
        },
      });

    await prismaAccounting.ledger.create({
      data: {
        accountId: account1.id,
        transactionId: addMoneyTransactionToAccount1.id,
        amount: Number(100),
        description: "Add money transaction",
        type: "CREDIT",
      },
    });

    const addMoneyTransactionToAccount2 =
      await prismaAccounting.transaction.create({
        data: {
          fromAccountId: account2.id,
          toAccountId: account1.id,
          transactionTypeId: createdType[0].id,
          amount: Number(50),
          referenceNo: "Initial Funding",
          note: "Adding initial balance to sender's account",
        },
      });

    await prismaAccounting.ledger.create({
      data: {
        accountId: account2.id,
        transactionId: addMoneyTransactionToAccount2.id,
        amount: Number(50),
        description: "Add money transaction",
        type: "CREDIT",
      },
    });
  });
  after(async () => {
    await prismaAccounting.$disconnect();
    await prismaAuth.$disconnect();
    await prismaApi.$disconnect();
  });

  it("should request money successfully for all valid scenarios", async () => {
    const requestData = {
      requestedNumber: appUser2.phone,
      requestAmount: 50,
      transactionTypeCode: createdType[0].transactionCode,
    };
    token = generateUserToken(appUser1.id, appUser1.phone, "USER");

    await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.requestMoney}`)
      .withJson(requestData)
      .expectStatus(200);

    const requestsInDb = await prismaApi.requestMoney.findMany({});

    expect(requestsInDb.length).to.be.equal(1);
    expect(requestsInDb[0].requestSenderNumber).to.be.equal(appUser1.phone);
    expect(requestsInDb[0].requestReceiverNumber).to.be.equal(appUser2.phone);
    expect(Number(requestsInDb[0].requestedAmount)).to.be.equal(50);
    expect(requestsInDb[0].requesterId).to.be.equal(appUser1.id);

    const token2 = generateUserToken(appUser2.id, appUser2.phone, "USER");
  });
  it("should show error if the requested Number is not P-pay user", async () => {
    const requestData = {
      requestedNumber: "01711626600",
      requestAmount: 50,
      transactionTypeCode: createdType[0].transactionCode,
    };
    token = generateUserToken(appUser1.id, appUser1.phone, "USER");

    const response = await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.requestMoney}`)
      .withJson(requestData)
      .expectStatus(400);

    expect(response.body.error).to.equal("Receiver Doesn't exist");
  });
  it("should show error if the user requests negative amount", async () => {
    const requestData = {
      requestedNumber: appUser2.phone,
      requestAmount: -50,
      transactionTypeCode: createdType[0].transactionCode,
    };
    token = generateUserToken(appUser1.id, appUser1.phone, "USER");

    const response = await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.requestMoney}`)
      .withJson(requestData)
      .expectStatus(400);

    expect(response.body.errors.requestAmount).to.equal(
      "Count must be at least 1"
    );
  });
  it("should show error if user tries to request money to his number", async () => {
    
    const requestData = {
      requestedNumber: appUser1.phone,
      requestAmount: 50,
      transactionTypeCode: createdType[0].transactionCode,
    };
    token = generateUserToken(appUser1.id, appUser1.phone, "USER");

    const response = await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.requestMoney}`)
      .withJson(requestData)
      .expectStatus(500);

    expect(response.body.error).to.equal("Can't request money to own account");
  });

  it("should show error if requestedAmount is less than Min Amount of Transaction Type", async () => {
    const { transactionType } = await createTrxnTypeWithMinAmount(50);
    const requestData = {
      requestedNumber: appUser2.phone,
      requestAmount: 49,
      transactionTypeCode: transactionType.transactionCode,
    };
    token = generateUserToken(appUser1.id, appUser1.phone, "USER");

    const response = await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.requestMoney}`)
      .withJson(requestData)
      .expectStatus(400);

    expect(response.body.error).to.equal(
      "Transaction amount is less than minimum amount for this transaction type"
    );
  });

  it("should show error if the requestedAmount is more than Max Amount of Transaction Type", async () => {

    const { transactionType } = await createTrxnTypeWithMaxAmount(50);
    const requestData = {
      requestedNumber: appUser2.phone,
      requestAmount: 5001,
      transactionTypeCode: transactionType.transactionCode,
    };
    token = generateUserToken(appUser1.id, appUser1.phone, "USER");

    const response = await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.requestMoney}`)
      .withJson(requestData)
      .expectStatus(400);

    expect(response.body.error).to.equal(
      "Transaction amount is more than maximum amount for this transaction type"
    );
    expect(requestData.requestAmount).to.greaterThan(createdType[0].maxAmount);
  });
  it("should show error for Invalid Transaction Type Code", async () => {
    const requestData = {
      requestedNumber: appUser2.phone,
      requestAmount: 50,
      transactionTypeCode: 444444444,
    };
    token = generateUserToken(appUser1.id, appUser1.phone, "USER");

    const response = await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.requestMoney}`)
      .withJson(requestData)
      .expectStatus(406);
  });
});
