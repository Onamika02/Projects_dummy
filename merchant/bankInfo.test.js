import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../apiUrls.js";
import prismaAccounting from "../utils/prismaAccountingClient.js";
import prismaAuth from "../utils/prismaAuthClient.js";
import prismaApi from "../utils/prismaApiClient.js";
import { generateMerchantToken } from "../utils/merchantTokenJWT.js";

describe("Bank information for Mechant Onboarding", async () => {
  before(async () => {
    await prismaAuth.$connect();
    await prismaAccounting.$connect();
    await prismaApi.$connect();
  });
  after(async () => {
    await prismaAccounting.$disconnect();
    await prismaAuth.$disconnect();
    await prismaApi.$disconnect();
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

    await prismaAuth.appUser.deleteMany({});
    await prismaApi.MerchantUser.deleteMany({});
  });

  it("should Store bank information successfully", async () => {
    await prismaAuth.appUser.create({
      data: {
        fullname: "John",
        phone: "01747538382",
        profilePicture: "https://example.com/john.jpg",
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
        role: "MERCHANT",
        wrongPinCount: 0,
      },
    });

    const userFromDb = await prismaAuth.appUser.findFirst({
      where: {
        phone: "01747538382",
      },
    });

    if (!userFromDb) {
      throw new Error("User not found after creation");
    }

    const merchantUser = await prismaApi.MerchantUser.create({
      data: {
        userId: userFromDb.id,
        settlementFrequency: "MONTHLY"
      },
    });

    if (!merchantUser) {
      throw new Error("Merchant user not created");
    }

    const token = generateMerchantToken(Number(userFromDb.id), "01747538382", [
      "MERCHANT",
    ]);

    const bankInfo = {
      bankAccountNo: "1234567890",
      bankAccountName: "aaaaaa",
      bankName: "City Bank",
      bankBranchName: "Mirpur",
      settlementFrequency: "MONTHLY" 
    };

    await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.bankInformation}`)
      .withJson(bankInfo)
      .expectStatus(200);

    const bankInfoFromDb = await prismaApi.merchantUser.findMany({
      where: {
        userId: userFromDb.id,
        settlementFrequency: "MONTHLY"
      },
    });

    if (!bankInfoFromDb) {
      throw new Error("Bank information not found in database after creation");
    }

    expect(bankInfoFromDb[0]).to.not.be.null;
    expect(bankInfoFromDb[0].bankAccountNo).to.equal("1234567890");
    expect(bankInfoFromDb[0].bankAccountName).to.equal("aaaaaa");
    expect(bankInfoFromDb[0].bankName).to.equal("City Bank");
    expect(bankInfoFromDb[0].bankBranchName).to.equal("Mirpur");
    expect(bankInfoFromDb[0].settlementFrequency).to.equal("MONTHLY");
  });

  it("should show error if the user is not logged In", async () => {
    await prismaAuth.appUser.create({
      data: {
        fullname: "John",
        phone: "01747538382",
        profilePicture: "https://example.com/john.jpg",
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
        role: "MERCHANT",
        wrongPinCount: 0,
      },
    });

    const userFromDb = await prismaAuth.appUser.findFirst({
      where: {
        phone: "01747538382",
      },
    });

    await prismaApi.MerchantUser.create({
      data: {
        userId: userFromDb.id,
        settlementFrequency: "MONTHLY"
      },
    });

    const bankInfo = {
      bankAccountNo: "1234567890",
      bankAccountName: "aaaaaa",
      bankName: "City Bank",
      bankBranchName: "Mirpur",
      settlementFrequency: "MONTHLY" 
    };

    await pactum
      .spec()
      .withMethod("POST")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.bankInformation}`)
      .withJson(bankInfo)
      .expectStatus(403);
  });

  it("should show error if mechant doesnt exist", async () => {
    await prismaAuth.appUser.create({
      data: {
        fullname: "John",
        phone: "01747538382",
        profilePicture: "https://example.com/john.jpg",
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
        role: "MERCHANT",
        wrongPinCount: 0,
      },
    });

    const userFromDb = await prismaAuth.appUser.findFirst({
      where: {
        phone: "01747538382",
      },
    });

    await prismaApi.MerchantUser.create({
      data: {
        userId: userFromDb.id,
        settlementFrequency: "MONTHLY"
      },
    });

    const bankInfo = {
      bankAccountNo: "1234567890",
      bankAccountName: "aaaaaa",
      bankName: "City Bank",
      bankBranchName: "Mirpur",
      settlementFrequency: "MONTHLY" 
    };

    const invalidToken = generateMerchantToken(Number(5555), "01747538382", [
      "MERCHANT",
    ]);

    await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(invalidToken)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.bankInformation}`)
      .withJson(bankInfo)
      .expectStatus(400);
  });
});
