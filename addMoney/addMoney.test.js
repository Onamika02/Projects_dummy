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
import { setupTransactionLegs } from "../utils/setUpLeg.js";
import { runTransactionTests, checkSuccess } from "../utils/doTransaction.js";
import { addInitialBalance } from "../utils/addInitialBalance.js";
import { createAppUserAccounts } from "../utils/setupAppUser.js";
import { generateVerifyPinToken } from "../utils/verifyPinToken.js";
import { createClient } from 'redis';
const redisClient = createClient({ url: 'redis://p-pay-cache-test:6379' });



describe.skip("API Check: Add Money(POST)", function () {
  this.timeout(30000);
  let activeConsumers = [];

  let token,
    customer,
    topUpType,
    topUpProvider,
    sender,
    receiver, maxwallet,
    dailyLimitAmountUser,
    onholdUser,
    gp,
    teletalk,
    banglalink,
    userId,
    consumer;
  let isConsumerRunning = false;
  let messageReceived = false;
  const validTopUpAmount = 200;

  before(async function () {
    await prismaAuth.$connect();
    await prismaAccounting.$connect();
    await prismaApi.$connect();
  });

  beforeEach(async () => {
    if (activeConsumers.length > 0) {
      for (const consumer of activeConsumers) {
        try {
          await consumer.disconnect();
        } catch (error) { }
      }
      activeConsumers = [];
    }
    await clearAllDatabases();
    await createAppUserAccounts();

    userId = await prismaAuth.appUser.findFirst({
      where: {
        phone: "01317577237",
      },
    });
    token = generateUserToken(userId.id, "01317577237", "USER");
    const chartOfAccounts = await createBasicChartOfAccounts();

    customer = chartOfAccounts.find(
      (account) => account.code === "customer-01"
    );
    topUpProvider = chartOfAccounts.find(
      (account) => account.code === "top-up-providers-01"
    );

    const transactionTypes = await setupTransactionTypes(chartOfAccounts);
    await setupTransactionLegs(transactionTypes);
    await createUserAccounts(chartOfAccounts);

    sender = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01317577237" },
    });
    receiver = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01711106485" },
    });
    gp = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "gp-wallet-01" },
    });
    teletalk = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "teletalk-wallet-01" },
    });
    banglalink = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "bl-wallet-01" },
    });
    const type = await prismaAccounting.transactionType.findUnique({
      where: { transactionCode: "1001" },
    });

    if (!redisClient || !redisClient.isOpen) {
      await redisClient.connect();
    }
  });
  afterEach(async function () {
    if (activeConsumers.length > 0) {
      for (const consumer of activeConsumers) {
        try {
          await consumer.disconnect();
        } catch (error) { }
      }
      activeConsumers = [];
    }
  });
  after(async () => {
    if (activeConsumers.length > 0) {
      for (const consumer of activeConsumers) {
        try {
          await consumer.disconnect();
        } catch (error) { }
      }
      activeConsumers = [];
    }
    await clearAllDatabases();
    await createAppUserAccounts();
    const chartOfAccounts = await createBasicChartOfAccounts();
    const transactionTypes = await setupTransactionTypes(chartOfAccounts);
    await createUserAccounts(chartOfAccounts);
    sender = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01317577237" },
    });
    receiver = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01711106485" },
    });

    onholdUser = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01317577238" }
    });

    maxwallet = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01317577210" }
    });

    dailyLimitAmountUser = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01715170020" }
    });

    const testConfig = {
      baseUrl: ApiUrls.apiBaseUrl,
      endpoint: ApiUrls.doAddMoney,
      token: token,
      sender: sender,
      receiver: receiver,
      type: "Top Up",
      database: [prismaApi.addMoneyLogs],
      transactionTypeCode: "1001",
      userId: userId.id,
      requestBody: {
        accountNumber: "123131324234",
        accountName: "Jarin",
        branchName: "Kalabagan",
        districtName: "Dhaka",
        transactionCode: "1001",
        accountType: "BANK",
        distributorId: 1,
        amount: 50,
        cityBankStatus: "APPROVED"
      },
      requestBodyForNotFullActiveUser: {
        accountNumber: "123131324234",
        accountName: "Jarin",
        branchName: "Kalabagan",
        districtName: "Dhaka",
        transactionCode: "1001",
        accountType: "BANK",
        distributorId: 1,
        amount: 50,
        cityBankStatus: "APPROVED"
      },
      requestBodyForMinWalleAmount: {
        accountNumber: "123131324234",
        accountName: "requestBodyForMinWalleAmount",
        branchName: "Kalabagan",
        districtName: "Dhaka",
        transactionCode: "1001",
        accountType: "BANK",
        distributorId: 1,
        amount: 9,
        cityBankStatus: "APPROVED"
      },
      requestBodyForMaxWalleAmount: {
        accountNumber: "123131324234",
        accountName: "requestBodyForMaxWalleAmount",
        branchName: "Kalabagan",
        districtName: "Dhaka",
        transactionCode: "1001",
        accountType: "BANK",
        distributorId: 1,
        amount: 1001,
        cityBankStatus: "APPROVED"
      },
      requestBodyForDailyLimitAmount: {
        amount: 100,
        accountNumber: "123131324234",
        accountName: "requestBodyForMaxWalleAmount",
        branchName: "Kalabagan",
        districtName: "Dhaka",
        transactionCode: "1001",
        accountType: "BANK",
        distributorId: 1,
        cityBankStatus: "APPROVED"
      },
      requestBodyForTypeMinAmount: {
        amount: 5,
        accountNumber: "123131324234",
        accountName: "requestBodyForMaxWalleAmount",
        branchName: "Kalabagan",
        districtName: "Dhaka",
        transactionCode: "1001",
        accountType: "BANK",
        distributorId: 1,
        cityBankStatus: "APPROVED"
      },
      requestBodyForTypeMaxAmount: {
        amount: 1000000,
        accountNumber: "123131324234",
        accountName: "requestBodyForMaxWalleAmount",
        branchName: "Kalabagan",
        districtName: "Dhaka",
        transactionCode: "1001",
        accountType: "BANK",
        distributorId: 1,
        cityBankStatus: "APPROVED"
      },
    }
    await runTransactionTests(testConfig);

    await prismaAccounting.$disconnect();
    await prismaAuth.$disconnect();
    await prismaApi.$disconnect();
  });

  it("should return 200 for successful add money from bank and save the transaction", async function () {
    const verifiedPinToken = generateVerifyPinToken("1001", userId.id, "01317577237", "USER");
    await redisClient.FLUSHALL();

    await redisClient.HSET(`token:${userId.phone}`, 'token', verifiedPinToken);

    await redisClient.HGET(`token:${userId.phone}`, 'token');
    await pactum
      .spec()
      .post(`${ApiUrls.apiBaseUrl}${ApiUrls.doAddMoney}`)
      .withBearerToken(token)
      .withJson({
        accountNumber: "123131324234",
        accountName: "Jarin",
        branchName: "Kalabagan",
        districtName: "Dhaka",
        transactionCode: "1001",
        accountType: "BANK",
        distributorId: 1,
        amount: 50,
        save: true,
        verifiedPinToken: verifiedPinToken,
        cityBankStatus: "APPROVED"
      })
      .expectStatus(200).inspect();

    await checkSuccess({
      groupId: "topup",
      topic: "add_money_bank_card_mfs",
      log: 'Add Money: From tcs to 01317577237',
      amount: 50,
      resetToEarliest: true,
      onConsumerCreated: (consumer) => {
        activeConsumers.push(consumer);
      },
      callback: async () => {
    console.log("111111111111111111111111111111");

        const addMoneyTable = await prismaApi.addMoneyLogs.findMany({
          where: { userId: userId.id },
        });

        const saveAddMoney = await prismaApi.addMoneySave.findMany({
          where: { addFundId: addMoneyTable.id },
        });
        expect(saveAddMoney).to.have.lengthOf(1);
        expect(saveAddMoney[0].accountNumber).to.include("123131324234");
        expect(saveAddMoney[0].accountName).to.equal("Jarin");
        expect(saveAddMoney[0].branchName).to.equal("Kalabagan");
        expect(saveAddMoney[0].districtName).to.equal("Dhaka");
        expect(saveAddMoney[0].accountType).to.equal("BANK");

        expect(addMoneyTable[0].status).to.equal("SUCCESS");

        expect(addMoneyTable[0].userId).to.equal(userId.id);
      }
    })
  });

  it("should return 200 for successful add money to card and save the transaction", async function () {
    const verifiedPinToken = generateVerifyPinToken("1001", userId.id, "01317577237", "USER");
    await redisClient.FLUSHALL();

    await redisClient.HSET(`token:${userId.phone}`, 'token', verifiedPinToken);

    await redisClient.HGET(`token:${userId.phone}`, 'token');
    await pactum
      .spec()
      .post(`${ApiUrls.apiBaseUrl}${ApiUrls.doAddMoney}`)
      .withBearerToken(token)
      .withJson({
        cardNumber: "123131324234",
        accountName: "Jarin",
        branchName: "Kalabagan",
        districtName: "Dhaka",
        transactionCode: "1001",
        accountType: "CARD",
        cardType: "VISA",
        distributorId: 2,
        amount: 50,
        verifiedPinToken: verifiedPinToken,
        cityBankStatus: "APPROVED"
      })
      .expectStatus(200);

    await checkSuccess({
      groupId: "topup",
      topic: "add_money_bank_card_mfs",
      log: 'Add Money: From tcs-card-visa to 01317577237',
      amount: 50,
      resetToEarliest: true,
      onConsumerCreated: (consumer) => {
        activeConsumers.push(consumer);
      },
      callback: async () => {

        const addMoneyTable = await prismaApi.addMoneyLogs.findMany({
          where: { userId: userId.id },
        });

        const saveAddMoney = await prismaApi.addMoneySave.findMany({
          where: { topUpId: addMoneyTable.id },
        });
        expect(saveAddMoney).to.have.lengthOf(0);

        expect(addMoneyTable[0].status).to.equal("SUCCESS");

        expect(addMoneyTable[0].userId).to.equal(userId.id);
      }
    })
  });

  it("should return 200 for successful add money to mfs and save the transaction", async function () {
    const verifiedPinToken = generateVerifyPinToken("1001", userId.id, "01317577237", "USER");
    await redisClient.FLUSHALL();

    await redisClient.HSET(`token:${userId.phone}`, 'token', verifiedPinToken);

    await redisClient.HGET(`token:${userId.phone}`, 'token');
    await pactum
      .spec()
      .post(`${ApiUrls.apiBaseUrl}${ApiUrls.doAddMoney}`)
      .withBearerToken(token)
      .withJson({
        transactionCode: "1001",
        accountType: "MFS",
        distributorId: 3,
        amount: 50,
        phone: "01711106485",
        mfsType: "BKASH",
        verifiedPinToken: verifiedPinToken,
        cityBankStatus: "APPROVED"
      })
      .expectStatus(200);
    await checkSuccess({
      groupId: "topup",
      topic: "add_money_bank_card_mfs",
      log: 'Add Money: From tcs-mfs-bkash to 01317577237',
      amount: 50,
      resetToEarliest: true,
      onConsumerCreated: (consumer) => {
        activeConsumers.push(consumer);
      },
      callback: async () => {

        const addMoneyTable = await prismaApi.addMoneyLogs.findMany({
          where: { userId: userId.id },
        });

        const saveAddMoney = await prismaApi.addMoneySave.findMany({
          where: { topUpId: addMoneyTable.id },
        });
        expect(saveAddMoney).to.have.lengthOf(0);

        expect(addMoneyTable[0].status).to.equal("SUCCESS");

        expect(addMoneyTable[0].userId).to.equal(userId.id);
      }
    })
  });

  it("should return 400 if user selects Bank type and do not provide accountNumber and bank distributor in add money", async function () {
    const verifiedPinToken = generateVerifyPinToken("1001", userId.id, "01317577237", "USER");
    await redisClient.FLUSHALL();

    await redisClient.HSET(`token:${userId.phone}`, 'token', verifiedPinToken);

    await redisClient.HGET(`token:${userId.phone}`, 'token');
    await pactum
      .spec()
      .post(`${ApiUrls.apiBaseUrl}${ApiUrls.doAddMoney}`)
      .withBearerToken(token)
      .withJson({
        accountName: "Jarin",
        branchName: "Kalabagan",
        districtName: "Dhaka",
        transactionCode: "1001",
        accountType: "BANK",
        amount: 50,
        verifiedPinToken: verifiedPinToken,
        distributorId: null,
        cityBankStatus: "APPROVED"
      })
      .expectStatus(400);

  });
});
