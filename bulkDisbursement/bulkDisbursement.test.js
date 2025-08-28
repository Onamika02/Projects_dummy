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
import { runMerchantTransactionTests, checkSuccessForMerchant } from "../utils/doTransactionMerchant.js";
import { addInitialBalance } from "../utils/addInitialBalance.js";
import { createAppUserAccounts } from "../utils/setupAppUser.js";


describe("API Check: Bulk Disbursement(POST)", function () {
  this.timeout(30000);

  let token,
    customer,
    topUpType,
    topUpProvider,
    sender,
    receiver1,
    receiver2, maxwallet,
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
    await clearAllDatabases();
    await createAppUserAccounts();

    userId = await prismaAuth.appUser.findFirst({
      where: {
        phone: "01999999999",
      },
    });
    token = generateUserToken(userId.id, "01999999999", "MERCHANT");
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
      where: { identifier: "01999999999" },
    });
    receiver1 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01711106485" },
    });

    receiver2 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01317577237" },
    });

    const type = await prismaAccounting.transactionType.findUnique({
      where: { transactionCode: "1001" },
    });

  });

  after(async () => {
    sender = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01999999999" },
    });

    receiver1 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01711106485" },
    });

    receiver2 = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01317577237" },
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
      endpoint: ApiUrls.doBulkDisbursement,
      token: token,
      sender: sender,
      receiver1: receiver1,
      receiver2: receiver2,
      type: "Top Up",
      database: [prismaApi.bulkDisbursement],
      transactionTypeCode: "bulk-disbursement-001",
      userId: userId.id,
      requestBody: {
        bulks: [
          {
            toAccount: receiver1.identifier,
            amount: 20
          },
          {
            toAccount: receiver2.identifier,
            amount: 20
          }
        ],
        transactionTypeCode: "bulk-disbursement-001"
      },
      requestBodyForNotFullActiveUser: {
        bulks: [
          {
            toAccount: receiver1.identifier,
            amount: 200
          },
          {
            toAccount: receiver2.identifier,
            amount: 200
          }
        ],
        transactionTypeCode: "bulk-disbursement-001"
      },
      requestBodyForMinWalleAmount: {
        bulks: [
          {
            toAccount: receiver1.identifier,
            amount: 40
          },
          {
            toAccount: receiver2.identifier,
            amount: 40
          }
        ],
        transactionTypeCode: "bulk-disbursement-001"
      },
      requestBodyForMaxWalleAmount: {
        bulks: [
          {
            toAccount: receiver1.identifier,
            amount: 1001
          },
          {
            toAccount: receiver2.identifier,
            amount: 1001
          }
        ],
        transactionTypeCode: "bulk-disbursement-001"
      },
      requestBodyForDailyLimitAmount: {
        bulks: [
          {
            toAccount: receiver1.identifier,
            amount: 100
          },
          {
            toAccount: receiver2.identifier,
            amount: 100
          }
        ],
        transactionTypeCode: "bulk-disbursement-001"
      },
      requestBodyForTypeMinAmount: {
        bulks: [
          {
            toAccount: receiver1.identifier,
            amount: 5
          },
          {
            toAccount: receiver2.identifier,
            amount: 5
          }
        ],
        transactionTypeCode: "bulk-disbursement-001"
      },
      requestBodyForTypeMaxAmount: {
        bulks: [
          {
            toAccount: receiver1.identifier,
            amount: 1000000
          },
          {
            toAccount: receiver2.identifier,
            amount: 1000000
          }
        ],
        transactionTypeCode: "bulk-disbursement-001"
      },
    }
    await runMerchantTransactionTests(testConfig);

    await prismaAccounting.$disconnect();
    await prismaAuth.$disconnect();
    await prismaApi.$disconnect();
  });

  it("should return 200 for successful bulk disbursement", async function () {
    await addInitialBalance(sender, 1000000);

    await pactum
      .spec().withMethod("GET")
      .post(`${ApiUrls.apiBaseUrl}${ApiUrls.doBulkDisbursement}`)
      .withBearerToken(token)
      .withJson({
        bulks: [
          {
            toAccount: receiver1.identifier,
            amount: 50
          },
          {
            toAccount: receiver2.identifier,
            amount: 60
          }
        ],
        transactionTypeCode: "bulk-disbursement-001"
      })
      .expectStatus(200);

    await checkSuccessForMerchant({
      groupId: "topup",
      topic: "bulk_disbursement_trxn_result",
      log: 'Bulk Disbursement: From 01999999999 to 01711106485',
      amount1: 50,
      amount2: 60,
      resetToEarliest: true,
      callback: async () => {

      }
    })
  });

  it("should return 400 if any of the reciever is not merchant user", async function () {
    await pactum
      .spec()
      .post(`${ApiUrls.apiBaseUrl}${ApiUrls.doBulkDisbursement}`)
      .withBearerToken(token)
      .withJson({
        bulks: [
          {
            toAccount: "01888888888",
            amount: 50
          },
          {
            toAccount: receiver2.identifier,
            amount: 60
          }
        ],
        transactionTypeCode: "bulk-disbursement-001"
      })
      .expectStatus(400);
  });

});
