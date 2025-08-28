import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../apiUrls.js";
import prismaAccounting from "../utils/prismaAccountingClient.js";
import prismaAuth from "../utils/prismaAuthClient.js";
import prismaApi from "../utils/prismaApiClient.js";
import { generateMerchantToken } from "../utils/merchantTokenJWT.js";

describe("Business information for Mechant Onboarding", async () => {
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

  it("should Store Business information successfully", async () => {
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

    const businessInfo = {
      tinNumber: "1234567887",
      organizationType: "Private Limited",
      organizationName: "Shukhee Private Limited",
      organizationAddress: "Agargaon, Dhaka",
      email: "shukhee@gmail.com",
    };

    await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.businessInformation}`)
      .withJson(businessInfo)
      .expectStatus(200);

    const businessInfoFromDb = await prismaApi.merchantUser.findMany({
      where: {
        userId: userFromDb.id,
      },
    });

    if (!businessInfoFromDb) {
      throw new Error(
        "Business information not found in database after creation"
      );
    }

    expect(businessInfoFromDb[0]).to.not.be.null;
    expect(businessInfoFromDb[0].tinNumber).to.equal("1234567887");
    expect(businessInfoFromDb[0].organizationType).to.equal("Private Limited");
    expect(businessInfoFromDb[0].organizationName).to.equal(
      "Shukhee Private Limited"
    );
    expect(businessInfoFromDb[0].organizationAddress).to.equal(
      "Agargaon, Dhaka"
    );
    expect(businessInfoFromDb[0].email).to.equal("shukhee@gmail.com");
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

    const businessInfo = {
      tinNumber: "1234567887",
      organizationType: "Private Limited",
      organizationName: "Shukhee Private Limited",
      organizationAddress: "Agargaon, Dhaka",
      email: "shukhee@gmail.com",
    };
    await pactum
      .spec()
      .withMethod("POST")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.businessInformation}`)
      .withJson(businessInfo)
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
    const businessInfo = {
      tinNumber: "1234567887",
      organizationType: "Private Limited",
      organizationName: "Shukhee Private Limited",
      organizationAddress: "Agargaon, Dhaka",
      email: "shukhee@gmail.com",
    };

    const invalidToken = generateMerchantToken(Number(5555), "01747538382", [
      "MERCHANT",
    ]);

    await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(invalidToken)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.businessInformation}`)
      .withJson(businessInfo)
      .expectStatus(400);
  });
  it("should show error with Invalid Email", async () => {
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

    const businessInfo = {
      tinNumber: "1234567887",
      organizationType: "Private Limited",
      organizationName: "Shukhee Private Limited",
      organizationAddress: "Agargaon, Dhaka",
      email: "shukhee",
    };

    await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.businessInformation}`)
      .withJson(businessInfo)
      .expectStatus(400);
  });
});
