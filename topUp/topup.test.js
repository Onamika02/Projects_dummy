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

describe("Do Recharge API Check: TOPUP(POST)", function () {
  this.timeout(30000);

  let token, customer, topUpProvider, sender, receiver, maxwallet, dailyLimitAmountUser, onholdUser, gp, teletalk, banglalink, userId;
  let activeConsumers = [];
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

    userId = await prismaAuth.appUser.findFirst({ where: { phone: "01317577237" } });
    token = generateUserToken(userId.id, "01317577237", "USER");
    const chartOfAccounts = await createBasicChartOfAccounts();

    customer = chartOfAccounts.find(account => account.code === "customer-01");
    topUpProvider = chartOfAccounts.find(account => account.code === "top-up-providers-01");

    await setupTransactionTypes(chartOfAccounts);
    await createUserAccounts(chartOfAccounts);

    sender = await prismaAccounting.userAccount.findUnique({ where: { identifier: "01317577237" } });
    receiver = await prismaAccounting.userAccount.findUnique({ where: { identifier: "01711106485" } });
    gp = await prismaAccounting.userAccount.findUnique({ where: { identifier: "gp-wallet-01" } });
    teletalk = await prismaAccounting.userAccount.findUnique({ where: { identifier: "teletalk-wallet-01" } });
    banglalink = await prismaAccounting.userAccount.findUnique({ where: { identifier: "bl-wallet-01" } });
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
    // await clearAllDatabases();
  });

  after(async function () {
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

    userId = await prismaAuth.appUser.findFirst({ where: { phone: "01317577237" } });
    token = generateUserToken(userId.id, "01317577237", "USER");
    const chartOfAccounts = await createBasicChartOfAccounts();

    customer = chartOfAccounts.find(account => account.code === "customer-01");
    topUpProvider = chartOfAccounts.find(account => account.code === "top-up-providers-01");

    await setupTransactionTypes(chartOfAccounts);
    await createUserAccounts(chartOfAccounts);
    sender = await prismaAccounting.userAccount.findUnique({ where: { identifier: "01317577237" } });
    receiver = await prismaAccounting.userAccount.findUnique({ where: { identifier: "01711106485" } });

    onholdUser = await prismaAccounting.userAccount.findUnique({ where: { identifier: "01317577238" } });
    maxwallet = await prismaAccounting.userAccount.findUnique({ where: { identifier: "01317577210" } });
    dailyLimitAmountUser = await prismaAccounting.userAccount.findUnique({ where: { identifier: "01715170020" } });

    const testConfig = {
      baseUrl: ApiUrls.apiBaseUrl,
      endpoint: ApiUrls.doTopUp,
      token: token,
      sender: sender,
      receiver: receiver,
      type: "Top Up",
      database: [prismaApi.topUp],
      transactionTypeCode: "1005",
      provider: gp.identifier,
      userId: userId.id,
      requestBody: {
        amount: 20,
        phone: receiver.identifier,
        operatorId: 2,
        rechargeType: "PREPAID",
        transactionTypeCode: "1005"
      },
      requestBodyForNotFullActiveUser: {
        amount: 200,
        phone: receiver.identifier,
        operatorId: 2,
        rechargeType: "PREPAID",
        transactionTypeCode: "1005"
      },
      requestBodyForMinWalleAmount: {
        amount: 40,
        phone: receiver.identifier,
        operatorId: 2,
        rechargeType: "PREPAID",
        transactionTypeCode: "1005"
      },
      requestBodyForMaxWalleAmount: {
        amount: 1001,
        phone: maxwallet.identifier,
        operatorId: 5,
        rechargeType: "PREPAID",
        transactionTypeCode: "1005"
      },
      requestBodyForDailyLimitAmount: {
        amount: 100,
        phone: dailyLimitAmountUser.identifier,
        operatorId: 2,
        rechargeType: "PREPAID",
        transactionTypeCode: "1005"
      },
      requestBodyForTypeMinAmount: {
        amount: 5,
        phone: receiver.identifier,
        operatorId: 2,
        rechargeType: "PREPAID",
        transactionTypeCode: "1005"
      },
      requestBodyForTypeMaxAmount: {
        amount: 1000000,
        phone: receiver.identifier,
        operatorId: 2,
        rechargeType: "PREPAID",
        transactionTypeCode: "1005"
      },
    }

    await runTransactionTests(testConfig);
    await prismaAccounting.$disconnect();
    await prismaAuth.$disconnect();
    await prismaApi.$disconnect();
  });

  it("should return 200 for successful topup and save this topup", async function () {
    await addInitialBalance(sender, 1000000);

    await pactum
      .spec()
      .post(`${ApiUrls.apiBaseUrl}${ApiUrls.doTopUp}`)
      .withBearerToken(token)
      .withJson({
        amount: 50,
        phone: receiver.identifier,
        operatorId: 2,
        rechargeType: "PREPAID",
        transactionTypeCode: "1005",
        save: true
      })
      .expectStatus(200);

    userId = await prismaAuth.appUser.findFirst({ where: { phone: "01317577237" } });

    // await checkSuccess({
    //   groupId: "topup",
    //   topic: "top_up_payment_result",
    //   log: 'Top Up: From 01317577237 to gp-wallet-01',
    //   amount: 50,
    //   resetToEarliest: true,
    //   onConsumerCreated: (consumer) => {
    //     activeConsumers.push(consumer);
    //   },
    //   callback: async () => {
    //     const topUpTable = await prismaApi.topUp.findMany({ where: { userId: userId.id } });
    //     const saveTopUp = await prismaApi.topUpSave.findMany({ where: { topUpId: topUpTable.id } });
    //     expect(saveTopUp).to.have.lengthOf(1);
    //     expect(topUpTable[0].status).to.equal("SUCCESS");
    //     expect(topUpTable[0].userId).to.equal(userId.id);
    //   }
    // });
  });
});