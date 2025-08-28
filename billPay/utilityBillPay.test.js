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

describe("API Check: Utility Bill Pay(POST)", function () {
  this.timeout(30000);

  let token,
    customer,
    biller,
    sender,
    receiver, maxwallet,
    dailyLimitAmountUser,
    onholdUser,
    userId,
    consumer;
  let isConsumerRunning = false;
  let messageReceived = false;
  const validTopUpAmount = 200;

  before(async function () {
    await prismaAuth.$connect();
    await prismaAccounting.$connect();
    await prismaApi.$connect();
    await redisClient.connect();
  });

  beforeEach(async function () {
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
    biller = chartOfAccounts.find(
      (account) => account.code === "utility-sys-providers-01"
    );
    const transactionTypes = await setupTransactionTypes(chartOfAccounts);
    await createUserAccounts(chartOfAccounts);

    sender = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01317577237" },
    });
    receiver = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "wasa-01" },
    });

    const type = await prismaAccounting.transactionType.findUnique({
      where: { transactionCode: "1004" },
    });

    await addInitialBalance(sender, 1000000);

  });

  after(async function () {
    sender = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01317577237" },
    });
    receiver = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01999999999" },
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
      endpoint: ApiUrls.doUtilityBillPay,
      token: token,
      sender: sender,
      receiver: receiver,
      type: "Top Up",
      database: [prismaApi.utilityBillingInfo],
      transactionTypeCode: "1004",
      provider: receiver.identifier,
      userId: userId.id,
      requestBody: {
        billerId: 5,
        amount: 200,
        chargeFee: 5,
        transactionTypeCode: "1004",
        refId: "11111",
      },
      requestBodyForNotFullActiveUser: {
        agentMobile: receiver.identifier,
        amount: 20,
        note: "khabar er taka",
        transactionTypeCode: "1004",
        referenceNo: "11111",
      },
      requestBodyForMinWalleAmount: {
        billerId: 5,
        amount: 20,
        chargeFee: 5,
        transactionTypeCode: "1004",
        refId: "11111",
      },
      requestBodyForMaxWalleAmount: {
        billerId: 5,
        amount: 200,
        chargeFee: 5,
        transactionTypeCode: "1004",
        refId: "11111",
      },
      requestBodyForDailyLimitAmount: {
        billerId: 5,
        amount: 200,
        chargeFee: 5,
        transactionTypeCode: "1004",
        refId: "11111",
      },
      requestBodyForTypeMinAmount: {
        billerId: 5,
        amount: 5,
        chargeFee: 1,
        transactionTypeCode: "1004",
        refId: "11111",
      },
      requestBodyForTypeMaxAmount: {
        billerId: 5,
        amount: 5001,
        chargeFee: 5,
        transactionTypeCode: "1004",
        refId: "11111",
      },
    }
    await runTransactionTests(testConfig);

    await prismaAccounting.$disconnect();
    await prismaAuth.$disconnect();
    await prismaApi.$disconnect();
  });

  // it("should return 200 for successful bill pay and save this payment", async function () {
  //   const verifiedPinToken = generateVerifyPinToken("1002", userId.id, "01317577237", "USER");
  //   await redisClient.FLUSHALL();

  //   await redisClient.HSET(`token:${userId.phone}`, 'token', verifiedPinToken);

  //   await redisClient.HGET(`token:${userId.phone}`, 'token');
  //   await pactum
  //     .spec()
  //     .post(`${ApiUrls.apiBaseUrl}${ApiUrls.doUtilityBillPay}`)
  //     .withBearerToken(token)
  //     .withJson({
  //       billerId: 5,
  //       amount: 200,
  //       chargeFee: 5,
  //       transactionTypeCode: "1004",
  //       refId: "11111",
  //       save: true
  //     })
  //     .expectStatus(200);

  //   userId = await prismaAuth.appUser.findFirst({
  //     where: {
  //       phone: "01317577237",
  //     },
  //   });

  //   await checkSuccess({
  //     groupId: "topup",
  //     topic: "utility_bill_payment_result",
  //     log: 'Bill Pay: From 01317577237 to wasa-01',
  //     amount: 200, 
  //     resetToEarliest: true,
  //     callback: async () => {

  //       const utilityTable = await prismaApi.utilityBillingInfo.findMany({
  //         where: { userId: userId.id },
  //       });

  //       const saveUtility = await prismaApi.utilitySave.findMany({
  //         where: { pay: utilityTable.id },
  //       });

  //       const transactionTypeId = await prismaAccounting.transactionType.findFirst({
  //         where: {
  //           transactionCode: "1004",
  //         },
  //       });

  //       expect(saveUtility).to.have.lengthOf(1);
  //       expect(saveUtility[0].transactionTypeId).to.equal(transactionTypeId.id);

  //       expect(utilityTable[0].status).to.equal("SUCCESS");

  //       expect(utilityTable[0].userId).to.equal(userId.id);

  //     }
  //   })
  // });

  it("should return 400 if the biller id does not exists", async function () {
    await pactum
      .spec()
      .post(`${ApiUrls.apiBaseUrl}${ApiUrls.doTopUp}`)
      .withBearerToken(token)
      .withJson({
        billerId: 9,
        amount: 200,
        chargeFee: 5,
        transactionTypeCode: "1004",
        refId: "11111",
      })
      .expectStatus(400);
  });

});
