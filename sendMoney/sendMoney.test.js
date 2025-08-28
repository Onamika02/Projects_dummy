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
import { runTransactionTests, checkSuccess } from "../utils/doTransaction.js";
import { addInitialBalance } from "../utils/addInitialBalance.js";
import { createAppUserAccounts } from "../utils/setupAppUser.js";
import { generateVerifyPinToken } from "../utils/verifyPinToken.js";
import { createClient } from 'redis';
const redisClient = createClient({ url: 'redis://p-pay-cache-test:6379' });

describe("Send Money API Check:(POST)", function () {
  this.timeout(30000);

  let token,
    customer,
    topUpType,
    topUpProvider, verifiedPinToken,
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

  before("send money", async function () {
    await prismaAuth.$connect();
    await prismaAccounting.$connect();
    await prismaApi.$connect();
    await redisClient.connect();
  });

  beforeEach("send money", async function () {
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

  });
  afterEach("send money", async function () {
    await clearAllDatabases();
    await redisClient.FLUSHALL();
  });
  after("send money", async function () {
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
      endpoint: ApiUrls.doSendMoney,
      token: token,
      sender: sender,
      receiver: receiver,
      transactionTypeCode: "1002",
      userId: userId.id,
      requestBody: {
        amount: 100,
        receiverPhone: receiver.identifier,
        transactionTypeCode: "1002",
        verifiedPinToken: verifiedPinToken
      },
      requestBodyForNotFullActiveUser: {
        amount: 200,
        receiverPhone: receiver.identifier,
        transactionTypeCode: "1002",
        verifiedPinToken: verifiedPinToken
      },
      requestBodyForMinWalleAmount: {
        amount: 4,
        receiverPhone: receiver.identifier,
        transactionTypeCode: "1002",
        verifiedPinToken: verifiedPinToken
      },
      requestBodyForMaxWalleAmount: {
        amount: 200,
        receiverPhone: receiver.identifier,
        transactionTypeCode: "1002",
        verifiedPinToken: verifiedPinToken
      },
      requestBodyForDailyLimitAmount: {
        amount: 100,
        receiverPhone: receiver.identifier,
        transactionTypeCode: "1002",
        verifiedPinToken: verifiedPinToken
      },
      requestBodyForTypeMinAmount: {
        amount: 9,
        receiverPhone: receiver.identifier,
        transactionTypeCode: "1002",
        verifiedPinToken: verifiedPinToken
      },
      requestBodyForTypeMaxAmount: {
        amount: 1000000,
        receiverPhone: receiver.identifier,
        transactionTypeCode: "1002",
        verifiedPinToken: verifiedPinToken
      },
    }
    await runTransactionTests(testConfig);


    await prismaAccounting.$disconnect();
    await prismaAuth.$disconnect();
    await prismaApi.$disconnect();
    await redisClient.disconnect();
  });

  it("should return 200 for successful send money and save this transaction", async function () {
    await addInitialBalance(sender, 1000000);

    const verifiedPinToken = generateVerifyPinToken("1002", userId.id, "01317577237", "USER");
    await redisClient.FLUSHALL();

    await redisClient.HSET(`token:${userId.phone}`, 'token', verifiedPinToken);

    await redisClient.HGET(`token:${userId.phone}`, 'token');

    await pactum
      .spec()
      .post(`${ApiUrls.apiBaseUrl}${ApiUrls.doSendMoney}`)
      .withBearerToken(token)
      .withJson({
        amount: 100,
        receiverPhone: receiver.identifier,
        transactionTypeCode: "1002",
        save: true,
        verifiedPinToken: verifiedPinToken
      })
      .expectStatus(200);

    // await checkSuccess({
    //   groupId: "topup",
    //   topic: "send_money_account_complete",
    //   log: 'Send Money: From 01317577237 to 01711106485',
    //   amount: 100, resetToEarliest: true,
    //   callback: async () => {
    //   }
    // })
  });
});