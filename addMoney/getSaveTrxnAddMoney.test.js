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

describe("Get Saved Transaction After Add Money", async () => {
  let customer,
    amount,
    customerAccount1,
    distributorAccount,
    ewalletAccount,
    userId1,
    userId2,
    tokenUser1,
    tokenUser2,
    addMoneyTrxnTypeId,
    bankToEwalletTrxnTypeId;

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

    const addMoneyType = await prismaAccounting.transactionType.findUnique({
      where: { transactionCode: "1001" },
    });
    addMoneyTrxnTypeId = addMoneyType.id;

    const bankToEwalletType = await prismaAccounting.transactionType.findUnique(
      {
        where: { transactionCode: "1000" },
      }
    );
    bankToEwalletTrxnTypeId = bankToEwalletType
      ? bankToEwalletType.id
      : addMoneyType.id;

    await createUserAccounts(chartOfAccounts);

    customerAccount1 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01317577237" },
    });

    distributorAccount = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "tcsCityBank" },
    });

    ewalletAccount = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "ewallet-01" },
    });

    await addInitialBalance(distributorAccount, 100000);
    await addInitialBalance(ewalletAccount, 100000);
  });

  async function insertAddMoneySavedTransaction({
    accountName,
    accountNumber,
    accountType,
    amount,
    bankName,
    branchName,
    cardType,
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
        fromAccountId: distributorAccount.id,
        toAccountId: ewalletAccount.id,
        transactionTypeId: addMoneyTrxnTypeId,
        note: `Bank: ${bankName} Branch: ${branchName} AccName: ${accountName} AccNo: ${accountNumber} AccType: ${accountType} District: ${districtName} CardType: ${cardType}`,
        log: `Add Money: From ${fromAccount} to ewallet-01`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    if (mainTrxn) {
      const customerUserAccount = await prismaAccounting.userAccount.findUnique(
        {
          where: { identifier: toAccount },
        }
      );
      await prismaAccounting.transaction.create({
        data: {
          amount,
          referenceNo: mainTrxn.referenceNo,
          status: "SUCCESSFUL",
          fromAccountId: ewalletAccount.id,
          toAccountId: customerUserAccount.id,
          transactionTypeId: bankToEwalletTrxnTypeId,
          note: "Add Money Leg -1",
          log: `Send eMoney to Customer: From ewallet-01 to ${toAccount}`,
          mainTransactionId: mainTrxn.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          description: "Add Money Leg -1",
        },
      });

      const existingSave = await prismaApi.addMoneySave.findFirst({
        where: {
          accountNumber: accountNumber,
        },
      });

      if (!existingSave) {
        await prismaApi.addMoneySave.create({
          data: {
            accountName,
            accountNumber,
            accountType,
            amount,
            bankName,
            branchName,
            cardNumber: `4${accountNumber.substring(0, 15)}`,
            cardType,
            distributorId: 1,
            districtName,
            fromAccount,
            isSave: true,
            mfsType: "",
            phoneNumber: "",
            toAccount,
            transactionTypeId: bankToEwalletTrxnTypeId,
            type: "BANK",
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    }
  }

  it("should get saved add money transaction list", async () => {
    await insertAddMoneySavedTransaction({
      accountName: "John Doe",
      accountNumber: "1234567890",
      accountType: "BANK",
      amount: 1000,
      bankName: "Example Bank",
      branchName: "Main Branch",
      cardType: "VISA",
      districtName: "Central District",
      fromAccount: "city-tcs-01",
      toAccount: "01317577237",
      userId: userId1.id,
    });

    await pactum
      .spec()
      .withBearerToken(tokenUser1)
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.saveTrxnAddMoney}`)
      .expectStatus(200);

    const savedAddMoneyTrxns = await prismaApi.addMoneySave.findMany({});

    expect(savedAddMoneyTrxns).to.have.lengthOf(1);
    expect(savedAddMoneyTrxns[0].amount.toString()).to.equal("1000");
    expect(savedAddMoneyTrxns[0].isSave).to.be.true;
    expect(savedAddMoneyTrxns[0].fromAccount).to.equal("city-tcs-01");
    expect(savedAddMoneyTrxns[0].toAccount).to.equal("01317577237");
    expect(savedAddMoneyTrxns[0].type).to.equal("BANK");
    expect(savedAddMoneyTrxns[0].userId.toString()).to.equal(
      userId1.id.toString()
    );
    expect(savedAddMoneyTrxns[0].accountName).to.equal("John Doe");
    expect(savedAddMoneyTrxns[0].accountNumber).to.equal("1234567890");
    expect(savedAddMoneyTrxns[0].bankName).to.equal("Example Bank");
    expect(savedAddMoneyTrxns[0].branchName).to.equal("Main Branch");
  });

  it("should show the first add money transaction of bank account even after multiple transactions with the same bank account", async () => {
    await insertAddMoneySavedTransaction({
      accountName: "John Doe",
      accountNumber: "1234567890",
      accountType: "BANK",
      amount: 1000,
      bankName: "Example Bank",
      branchName: "Main Branch",
      cardType: "VISA",
      districtName: "Central District",
      fromAccount: "city-tcs-01",
      toAccount: "01317577237",
      userId: userId1.id,
    });

    await insertAddMoneySavedTransaction({
      accountName: "John Doe",
      accountNumber: "1234567890",
      accountType: "BANK",
      amount: 2000,
      bankName: "Example Bank",
      branchName: "Main Branch",
      cardType: "VISA",
      districtName: "Central District",
      fromAccount: "city-tcs-01",
      toAccount: "01317577237",
      userId: userId1.id,
    });

    await pactum
      .spec()
      .withBearerToken(tokenUser1)
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.saveTrxnAddMoney}`)
      .expectStatus(200)
      .returns("body");

    const savedAddMoneyTrxns = await prismaApi.addMoneySave.findMany({});

    expect(savedAddMoneyTrxns).to.have.lengthOf(1);
    expect(savedAddMoneyTrxns[0].amount.toString()).to.equal("1000");
    expect(savedAddMoneyTrxns[0].accountNumber).to.equal("1234567890");
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
      await insertAddMoneySavedTransaction({
        accountName: `John Doe ${i % 5}`,
        accountNumber: bankAccounts[i % 5],
        accountType: "BANK",
        amount: 2222,
        bankName: "Example Bank",
        branchName: "Main Branch",
        cardType: "VISA",
        districtName: "Central District",
        fromAccount: "city-tcs-01",
        toAccount: "01317577237",
        userId: userId1.id,
      });
    }

    await pactum
      .spec()
      .withBearerToken(tokenUser1)
      .withMethod("GET")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.saveTrxnAddMoney}`)
      .expectStatus(200)
      .returns("body");

    const savedAddMoneyTrxns = await prismaApi.addMoneySave.findMany({});
    expect(savedAddMoneyTrxns).to.have.lengthOf(5);

    const savedAccountNumbers = savedAddMoneyTrxns.map(
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
      await insertAddMoneySavedTransaction({
        accountName: `John Doe ${i % 5}`,
        accountNumber: bankAccounts[i % 5],
        accountType: "BANK",
        amount: 1000,
        bankName: "Example Bank",
        branchName: "Main Branch",
        cardType: "VISA",
        districtName: "Central District",
        fromAccount: "city-tcs-01",
        toAccount: "01317577237",
        userId: userId1.id,
      });
    }

    const response = await pactum
      .spec()
      .withBearerToken(tokenUser1)
      .withMethod("GET")
      .withPath(
        `${ApiUrls.apiBaseUrl}${ApiUrls.saveTrxnAddMoney}?page=0&size=3`
      )
      .expectStatus(200);

    expect(response.body)
      .to.have.property("saveTransactions")
      .that.is.an("array");
    expect(response.body.saveTransactions).to.have.lengthOf(3);
    expect(response.body.pagination.hasnext).to.equal(true);
    expect(response.body.pagination.currentpagetotalcount).to.equal(3);
    expect(response.body.pagination.totalcount).to.equal(5);
    expect(response.body.pagination.currentpage).to.equal(0);
  });
});
