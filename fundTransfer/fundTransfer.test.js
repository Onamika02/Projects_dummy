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

describe("API Check: Fund Transfer(POST)", function () {
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

    await addInitialBalance(sender, 1000000);

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
      endpoint: ApiUrls.doFundTransfer,
      token: token,
      sender: sender,
      receiver: receiver,
      type: "Top Up",
      database: [prismaApi.fundTransferLogs],
      transactionTypeCode: "1003",
      userId: userId.id,
      requestBody: {
        accountNumber: "123131324234",
        accountName: "Jarin",
        branchName: "Kalabagan",
        districtName: "Dhaka",
        transactionCode: "1003",
        accountType: "BANK",
        distributorId: 1,
        amount: 50,
      },
      requestBodyForNotFullActiveUser: {
        accountNumber: "123131324234",
        accountName: "Jarin",
        branchName: "Kalabagan",
        districtName: "Dhaka",
        transactionCode: "1003",
        accountType: "BANK",
        distributorId: 1,
        amount: 50,
      },
      requestBodyForMinWalleAmount: {
        accountNumber: "123131324234",
        accountName: "requestBodyForMinWalleAmount",
        branchName: "Kalabagan",
        districtName: "Dhaka",
        transactionCode: "1003",
        accountType: "BANK",
        distributorId: 1,
        amount: 9,
      },
      requestBodyForMaxWalleAmount: {
        accountNumber: "123131324234",
        accountName: "requestBodyForMaxWalleAmount",
        branchName: "Kalabagan",
        districtName: "Dhaka",
        transactionCode: "1003",
        accountType: "BANK",
        distributorId: 1,
        amount: 1001,
      },
      requestBodyForDailyLimitAmount: {
        amount: 100,
        accountNumber: "123131324234",
        accountName: "requestBodyForMaxWalleAmount",
        branchName: "Kalabagan",
        districtName: "Dhaka",
        transactionCode: "1003",
        accountType: "BANK",
        distributorId: 1,
      },
      requestBodyForTypeMinAmount: {
        amount: 5,
        accountNumber: "123131324234",
        accountName: "requestBodyForMaxWalleAmount",
        branchName: "Kalabagan",
        districtName: "Dhaka",
        transactionCode: "1003",
        accountType: "BANK",
        distributorId: 1,
      },
      requestBodyForTypeMaxAmount: {
        amount: 1000000,
        accountNumber: "123131324234",
        accountName: "requestBodyForMaxWalleAmount",
        branchName: "Kalabagan",
        districtName: "Dhaka",
        transactionCode: "1003",
        accountType: "BANK",
        distributorId: 1,
      },
    }
    await runTransactionTests(testConfig);

    await prismaAccounting.$disconnect();
    await prismaAuth.$disconnect();
    await prismaApi.$disconnect();
  });

  it("should return 200 for successful fund transfer to bank and save the transaction", async function () {
    await pactum
      .spec()
      .post(`${ApiUrls.apiBaseUrl}${ApiUrls.doFundTransfer}`)
      .withBearerToken(token)
      .withJson({
        accountNumber: "123131324234",
        accountName: "Jarin",
        branchName: "Kalabagan",
        districtName: "Dhaka",
        transactionCode: "1003",
        accountType: "BANK",
        distributorId: 1,
        amount: 50,
        save: true
      })
      .expectStatus(200);

    userId = await prismaAuth.appUser.findFirst({
      where: {
        phone: "01317577237",
      },
    });

    // await checkSuccess({
    //   groupId: "topup",
    //   topic: "fund_transfer_bank_card_mfs_result",
    //   log: 'Fund Transfer: From 01317577237 to city-bank-tcs-01',
    //   amount: 50, resetToEarliest: true,
    //   onConsumerCreated: (consumer) => {
    //     activeConsumers.push(consumer);
    //   },
    //   callback: async () => {

    //     const fundTransferTable = await prismaApi.fundTransferLogs.findMany({
    //       where: { userId: userId.id },
    //     });

    //     const saveFundTransfer = await prismaApi.fundTransferSave.findMany({
    //       where: { fundTransferId: fundTransferTable.id },
    //     });
    //     expect(saveFundTransfer).to.have.lengthOf(1);
    //     expect(saveFundTransfer[0].accountNumber).to.include("123131324234");
    //     expect(saveFundTransfer[0].accountName).to.equal("Jarin");
    //     expect(saveFundTransfer[0].branchName).to.equal("Kalabagan");
    //     expect(saveFundTransfer[0].districtName).to.equal("Dhaka");
    //     expect(saveFundTransfer[0].accountType).to.equal("BANK");

    //     expect(fundTransferTable[0].status).to.equal("SUCCESS");

    //     expect(fundTransferTable[0].userId).to.equal(userId.id);
    //   }
    // })
  });

  // it("should return 200 for successful fund transfer to card and save the transaction", async function () {
  //   await pactum
  //     .spec()
  //     .post(`${ApiUrls.apiBaseUrl}${ApiUrls.doFundTransfer}`)
  //     .withBearerToken(token)
  //     .withJson({
  //       cardNumber: "123131324234",
  //       accountName: "Jarin",
  //       branchName: "Kalabagan",
  //       districtName: "Dhaka",
  //       transactionCode: "1003",
  //       accountType: "CARD",
  //       cardType: "VISA",
  //       distributorId: 2,
  //       amount: 50,
  //     })
  //     .expectStatus(200);

  //   await checkSuccess({
  //     groupId: "topup",
  //     topic: "fund_transfer_bank_card_mfs_result",
  //     log: 'Fund Transfer: From 01317577237 to visa-card-tcs-01',
  //     amount: 50, 
  //     resetToEarliest: true,
  //     onConsumerCreated: (consumer) => {
  //       activeConsumers.push(consumer);
  //     },
  //     callback: async () => {

  //     }
  //   })
  // });

  // it("should return 200 for successful fund transfer to mfs and save the transaction", async function () {
  //   await pactum
  //     .spec()
  //     .post(`${ApiUrls.apiBaseUrl}${ApiUrls.doFundTransfer}`)
  //     .withBearerToken(token)
  //     .withJson({
  //       transactionCode: "1003",
  //       accountType: "MFS",
  //       distributorId: 3,
  //       amount: 50,
  //       phoneNumber: "01711106485",
  //       mfsType: "BKASH",
  //     })
  //     .expectStatus(200);

  //   await checkSuccess({
  //     groupId: "topup",
  //     topic: "fund_transfer_bank_card_mfs_result",
  //     log: 'Fund Transfer: From 01317577237 to mfs-bkash-tcs-01',
  //     amount: 50, 
  //     resetToEarliest: true,
  //     onConsumerCreated: (consumer) => {
  //       activeConsumers.push(consumer);
  //     },
  //     callback: async () => {

  //       const fundTransferTable = await prismaApi.fundTransferLogs.findMany({
  //         where: { userId: userId.id },
  //       });

  //       const saveFundTransfer = await prismaApi.fundTransferSave.findMany({
  //         where: { fundTransferId: fundTransferTable.id },
  //       });
  //       expect(saveFundTransfer).to.have.lengthOf(0);

  //       expect(fundTransferTable[0].status).to.equal("SUCCESS");

  //       expect(fundTransferTable[0].userId).to.equal(userId.id);
  //     }
  //   })
  // });
});
