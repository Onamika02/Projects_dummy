import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../apiUrls.js";
import prismaAccounting from "../utils/prismaAccountingClient.js";
import prismaAuth from "../utils/prismaAuthClient.js";
import prismaApi from "../utils/prismaApiClient.js";
import { generateMerchantToken } from "../utils/merchantTokenJWT.js";
import path from "path";

let token;
let chartOfAccountId;

describe("Account Creation for Merchant User", async () => {
  before(async () => {
    await prismaAuth.$connect();
    await prismaApi.$connect();
    await prismaAccounting.$connect();
  });

  beforeEach(async () => {
    await prismaAccounting.ledger.deleteMany({});
    await prismaAccounting.transaction.deleteMany({});
    await prismaAccounting.transactionTypeChangeLog.deleteMany({});
    await prismaAccounting.transactionType.deleteMany({});
    await prismaAccounting.transactionLegLog.deleteMany({});
    await prismaAccounting.transactionLeg.deleteMany({});
    await prismaAccounting.accountLog.deleteMany({});
    await prismaAccounting.userAccount.deleteMany({});
    await prismaAccounting.chartOfAccountLog.deleteMany({});
    await prismaAccounting.chartOfAccount.deleteMany({});
    await prismaAuth.adminUser.deleteMany({});
    await prismaAuth.appUser.deleteMany({});
    await prismaApi.adminSetting.deleteMany({});
    await prismaApi.merchantUser.deleteMany({});
  });

  after(async () => {
    await prismaAccounting.$disconnect();
    await prismaApi.$disconnect();
    await prismaAuth.$disconnect();
  });

  // it("should create Merchant account successfully from Merchant App", async () => {
  //   const appUser = await prismaAuth.appUser.create({
  //     data: {
  //       fullname: "John",
  //       phone: "01747538382",
  //       email: "johndoe1@example.com",
  //       password:
  //         "$2a$10$C2JDo6LHB61PTl6mTBdEpeoPNRf7mDCKdbufHd.2uEJzwwm4hbP6q",
  //       fathername: "John Doe",
  //       mothername: "Jane Doe",
  //       nidnumber: "1234567890",
  //       dob: "1990-01-01",
  //       nidaddress: "House 123, Street 456, City, District",
  //       presentAddress: "House 789, Street 321, City, District",
  //       district: "Dhaka",
  //       hasLiveliness: false,
  //       hasNidInfo: true,
  //       isEmailVerified: false,
  //       isPhoneVerified: false,
  //       role: "MERCHANT",
  //       wrongPinCount: 0,
  //     },
  //   });

  //   token = generateMerchantToken(Number(appUser.id), "01747538382", [
  //     "MERCHANT",
  //   ]);

  //   const admin = await prismaAuth.adminUser.create({
  //     data: {
  //       name: "Admin user",
  //       email: "admin@example.com",
  //       password:
  //         "$2a$10$M6jH9Ky2SbbJ5tu5dV220.PO86QWhef5cllDVNgwrxLWFPlqTYLlC",
  //       role: 0,
  //       isActive: true,
  //     },
  //   });

  //   const chartOfAccount = await prismaAccounting.chartOfAccount.create({
  //     data: {
  //       adminId: admin.id,
  //       code: "001",
  //       name: "Merchant",
  //       description: "Description for Account 1",
  //       headType: "LIABILITY",
  //       minWalletAmount: 100,
  //       maxWalletAmount: 100000,
  //       transactionType: "MEMBER",
  //       onlyParent: false,
  //       monthlyLimitCount: 0,
  //       monthlyLimitAmount: 0,
  //       weeklyLimitCount: 0,
  //       weeklyLimitAmount: 0,
  //       dailyLimitCount: 0,
  //       dailyLimitAmount: 0,
  //     },
  //   });

  //   chartOfAccountId = chartOfAccount.id;
  //   await new Promise((resolve) => setTimeout(resolve, 50));

  //   const verifyChartOfAccount =
  //     await prismaAccounting.chartOfAccount.findUnique({
  //       where: { id: chartOfAccountId },
  //     });

  //   if (!verifyChartOfAccount) {
  //     throw new Error(
  //       `Chart of Account with ID ${chartOfAccountId} was not found in the DB!`
  //     );
  //   }

  //   await prismaApi.adminSetting.create({
  //     data: {
  //       id: 1,
  //       userType: "MERCHANT",
  //       createdBy: admin.id,
  //       createdAt: new Date(),
  //       updatedAt: new Date(),
  //       info: JSON.stringify({
  //         merchantWalletCoaId: chartOfAccountId,
  //         bulkDisbursementTrxType: null,
  //         settlementTrxCode: null,
  //         sendMoneyTrxCode: null,
  //         addMoneyMfsTransferTrxCode: null,
  //         addMoneyBankTransferTrxCode: null,
  //         addMoneyCardTransferTrxCode: null,
  //         addMoneyInfo: null,
  //       }),
  //     },
  //   });

  //   await prismaApi.adminSetting.findFirst({
  //     where: { userType: "MERCHANT" },
  //   });

  //   await pactum
  //     .spec()
  //     .withMethod("POST")
  //     .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.saveLivelinessMerchant}`)
  //     .withBearerToken(token)
  //     .withFile(
  //       "livelinessImage",
  //       path.resolve("/opt/app/test-data/Onamika.jpeg")
  //     )
  //     .expectStatus(200);

  //   const createdAccount = await prismaAccounting.userAccount.findUnique({
  //     where: { identifier: "01747538382" },
  //   });

  //   const allAccounts = await prismaAccounting.userAccount.findMany();

  //   expect(createdAccount).to.not.be.null;
  //   expect(createdAccount.identifier).to.equal("01747538382");
  //   expect(allAccounts.length).to.equal(1);
  //   expect(createdAccount.accountName).to.equal("John");
  //   expect(createdAccount.status).to.equal("FULL_ACTIVE");
  //   expect(createdAccount.chartOfAccount_id).to.equal(chartOfAccountId);
  // });
});
