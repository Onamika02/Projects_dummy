import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../apiUrls.js";
import prismaAccounting from "../utils/prismaAccountingClient.js";
import { generateUserToken } from "../utils/userTokenJWT.js";
import prismaAuth from "../utils/prismaAuthClient.js";
import prismaApi from "../utils/prismaApiClient.js";
import { clearAllDatabases } from "../utils/cleanDB.js";
import { createBasicChartOfAccounts } from "../utils/setUpCoA.js";
import { createUserAccounts } from "../utils/setupAccounts.js";
import { setupTransactionTypes } from "../utils/setUpTypes.js";
import { addInitialBalance } from "../utils/addInitialBalance.js";
import { createAppUserAccounts } from "../utils/setupAppUser.js";

describe("Get Saved Transaction After Fund Transfer", async () => {
  let customer,
    amount,
    customerAccount1,
    distributorAccount,
    userId1,
    userId2,
    tokenUser1,
    tokenUser2,
    fundTransferType,
    fundTransferTypeId;

  before(async () => {
    await prismaAuth.$connect();
    await prismaAccounting.$connect();
    await prismaApi.$connect();
  });

  after(async () => {
    await prismaAuth.$disconnect();
    await prismaApi.$disconnect();
    await prismaAccounting.$disconnect();
  });

  beforeEach(async () => {
    await clearAllDatabases();
    await createAppUserAccounts();

    userId1 = await prismaAuth.appUser.findFirst({
      where: {
        phone: "01317577237",
      },
    });

    userId2 = await prismaAuth.appUser.findFirst({
      where: {
        phone: "01711106485",
      },
    });

    tokenUser1 = generateUserToken(userId1.id, "01317577237", "USER");
    tokenUser2 = generateUserToken(userId2.id, "01711106485", "USER");

    const chartOfAccounts = await createBasicChartOfAccounts();

    customer = chartOfAccounts.find(
      (account) => account.code === "customer-01"
    );

    await setupTransactionTypes(chartOfAccounts);

    const fundTransferType = await prismaAccounting.transactionType.findUnique({
      where: { transactionCode: "1003" },
    });
    fundTransferTypeId = fundTransferType.id;

    await createUserAccounts(chartOfAccounts);

    customerAccount1 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01317577237" },
    });

    distributorAccount = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "tcsCityBank" },
    });

    await addInitialBalance(customerAccount1, 100000);
  });

  async function insertFundTransferSavedTransaction({
    accountName,
    accountNumber,
    accountType,
    amount,
    bankName,
    branchName,
    cardType,
    cardNumber,
    districtName,
    fromAccount,
    toAccount,
    userId,
  }) {
    const mainTrxn = await prismaAccounting.transaction.create({
      data: {
        amount,
        referenceNo: "Reference",
        status: "SUCCESSFUL",
        fromAccountId: customerAccount1.id,
        toAccountId: distributorAccount.id,
        transactionTypeId: fundTransferTypeId,
        note: `Bank: ${bankName} Branch: ${branchName} AccName: ${accountName} AccNo: ${accountNumber} AccType: ${accountType} District: ${districtName} CardType: ${cardType}`,
        log: `Fund Transfer: From ${fromAccount} to ${toAccount}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const existingSave = await prismaApi.fundTransferSave.findFirst({
      where: {
        accountNumber: accountNumber,
      },
    });

    if (!existingSave) {
      await prismaApi.fundTransferSave.create({
        data: {
          accountName,
          accountNumber,
          accountType,
          amount,
          bankName,
          branchName,
          cardNumber,
          cardType,
          distributorId: 1,
          districtName,
          fromAccount,
          isSave: true,
          mfsType: "",
          phoneNumber: "",
          toAccount,
          transactionTypeId: fundTransferTypeId,
          type: "BANK",
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
  }

  it("should get saved fund Transfer transaction list", async () => {
    await insertFundTransferSavedTransaction({
      accountName: "John Doe",
      accountNumber: "1234567890",
      accountType: "BANK",
      amount: 1000,
      bankName: "Example Bank",
      branchName: "Main Branch",
      cardType: "VISA",
      districtName: "Central District",
      toAccount: "city-tcs-01",
      fromAccount: "01317577237",
      userId: userId1.id,
    });

    await pactum
      .spec()
      .withBearerToken(tokenUser1)
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.saveTrxnFundTransfer}`)
      .expectStatus(200);

    const savedFundTransferTrxns = await prismaApi.fundTransferSave.findMany(
      {}
    );

    expect(savedFundTransferTrxns).to.have.lengthOf(1);
    expect(savedFundTransferTrxns[0].amount.toString()).to.equal("1000");
    expect(savedFundTransferTrxns[0].isSave).to.be.true;
    expect(savedFundTransferTrxns[0].toAccount).to.equal("city-tcs-01");
    expect(savedFundTransferTrxns[0].fromAccount).to.equal("01317577237");
    expect(savedFundTransferTrxns[0].type).to.equal("BANK");
    expect(savedFundTransferTrxns[0].userId.toString()).to.equal(
      userId1.id.toString()
    );
    expect(savedFundTransferTrxns[0].accountName).to.equal("John Doe");
    expect(savedFundTransferTrxns[0].accountNumber).to.equal("1234567890");
    expect(savedFundTransferTrxns[0].bankName).to.equal("Example Bank");
    expect(savedFundTransferTrxns[0].branchName).to.equal("Main Branch");
    expect(savedFundTransferTrxns[0].cardType).to.equal("VISA");
  });

  it("should show the first add money transaction of bank account even after multiple transactions with the same bank account", async () => {
    await insertFundTransferSavedTransaction({
      accountName: "John Doe",
      accountNumber: "1234567890",
      accountType: "BANK",
      amount: 1000,
      bankName: "Example Bank",
      branchName: "Main Branch",
      cardType: "VISA",
      districtName: "Central District",
      toAccount: "city-tcs-01",
      fromAccount: "01317577237",
      userId: userId1.id,
    });

    await insertFundTransferSavedTransaction({
      accountName: "John Doe",
      accountNumber: "1234567890",
      accountType: "BANK",
      amount: 2000,
      bankName: "Example Bank",
      branchName: "Main Branch",
      cardType: "VISA",
      districtName: "Central District",
      toAccount: "city-tcs-01",
      fromAccount: "01317577237",
      userId: userId1.id,
    });

    await pactum
      .spec()
      .withBearerToken(tokenUser1)
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.saveTrxnFundTransfer}`)
      .expectStatus(200)
      .returns("body");

    const savedFundTransferTrxns = await prismaApi.fundTransferSave.findMany(
      {}
    );

    expect(savedFundTransferTrxns).to.have.lengthOf(1);
    expect(savedFundTransferTrxns[0].amount.toString()).to.equal("1000");
    expect(savedFundTransferTrxns[0].accountNumber).to.equal("1234567890");
  });

  it("should save only one add money transaction per unique bank account", async () => {
    const bankAccounts = [
      "1234567891",
      "1234567892",
      "1234567893",
      "1234567894",
      "1234567895",
    ];

    for (let i = 0; i < 10; i++) {
      await insertFundTransferSavedTransaction({
        accountName: `John Doe ${i % 5}`,
        accountNumber: bankAccounts[i % 5],
        accountType: "BANK",
        amount: 2222,
        bankName: "Example Bank",
        branchName: "Main Branch",
        cardType: "VISA",
        districtName: "Central District",
        toAccount: "city-tcs-01",
        fromAccount: "01317577237",
        userId: userId1.id,
      });
    }

    const response = await pactum
      .spec()
      .withBearerToken(tokenUser1)
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.saveTrxnFundTransfer}`)
      .expectStatus(200);

    const savedFundTransferTrxns = await prismaApi.fundTransferSave.findMany(
      {}
    );
    expect(savedFundTransferTrxns).to.have.lengthOf(5);

    const savedAccountNumbers = savedFundTransferTrxns.map(
      (txn) => txn.accountNumber
    );
    expect(savedAccountNumbers).to.have.members(bankAccounts);
  });

  it("should return saved add money transaction list with correct pagination and size", async () => {
    const bankAccounts = [
      "1234567891",
      "1234567892",
      "1234567893",
      "1234567894",
      "1234567895",
    ];

    for (let i = 0; i < 10; i++) {
      await insertFundTransferSavedTransaction({
        accountName: `John Doe ${i % 5}`,
        accountNumber: bankAccounts[i % 5],
        accountType: "BANK",
        amount: 2222,
        bankName: "Example Bank",
        branchName: "Main Branch",
        cardType: "VISA",
        districtName: "Central District",
        toAccount: "city-tcs-01",
        fromAccount: "01317577237",
        userId: userId1.id,
      });
    }

    const transcations = await prismaAccounting.transaction.findMany({});

    const response = await pactum
      .spec()
      .withBearerToken(tokenUser1)
      .withMethod("GET")
      .withPath(
        `${ApiUrls.apiBaseUrl}${ApiUrls.saveTrxnFundTransfer}?page=0&size=3`
      )
      .expectStatus(200);
  });
});
