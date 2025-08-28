import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../apiUrls.js";
import prismaAccounting from "../utils/prismaAccountingClient.js";
import prismaAuth from "../utils/prismaAuthClient.js";
import prismaApi from "../utils/prismaApiClient.js";

describe("Merchant Registration", () => {
  before(async () => {
    await prismaAuth.$connect();
    await prismaApi.$connect();
    await prismaAccounting.$connect();
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

    await prismaApi.MerchantUser.deleteMany({});

    await prismaAuth.appUser.deleteMany({});
  });

  it("should register merchant with Valid Phone Number", async () => {

   await new Promise((resolve) => setTimeout(resolve, 1000));
   const phoneNumber = "01749949333";
   const body = { phoneNumber };

    const res = await pactum
      .spec()
      .withMethod("POST")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.registerMerchant}`)
      .withJson(body)
      .expectStatus(200);
  });

  it("should show error when phone number is invalid", async () => {
    const phoneNumber = "0184565164";
    const body = { phoneNumber };

    const res = await pactum
      .spec()
      .withMethod("POST")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.registerMerchant}`)
      .withJson(body)
      .expectStatus(400);
  });

  it("should show error when phone Number Contains Special Character", async () => {
    const phoneNumber = "0184565#&@*";
    const body = { phoneNumber };
    const res = await pactum
      .spec()
      .withMethod("POST")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.registerMerchant}`)
      .withJson(body)
      .expectStatus(400);
  });

  it("should show error when phone Number Contains Text", async () => {
    const phoneNumber = "0184565164s";
    const body = { phoneNumber };

    const res = await pactum
      .spec()
      .withMethod("POST")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.registerMerchant}`)
      .withJson(body)
      .expectStatus(400);
  });

 
  it("should show error for duplicate phone Number", async () => {

    await prismaAuth.appUser.create({
      data: {
        fullname: "John Doe",
        phone: "01747538382",
        profilePicture: "https://example.com/john.jpg",
        password:"$2a$10$O.OzJsabGv4YyKPCwntAEeBIg8O67pIZbLOLBlZGp5Ss.8Ce6sEbS",
        email: "johndoe1@example.com",
        fathername: "John Doe",
        mothername: "Jane Doe",
        hasLiveliness: true,
        hasNidInfo:true,
        isEmailVerified: true,
        isPhoneVerified: true,
        role: "MERCHANT",
        wrongPinCount: 0,

      },
    });
    
    const user = await prismaAuth.appUser.findUnique({
      where: {
        phone: "01747538382",
      }
    });

    const phoneNumber = "01747538382";
    const body = { phoneNumber };

    const res = await pactum
    .spec()
    .withMethod("POST")
    .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.registerMerchant}`)
    .withJson(body)
    .expectStatus(409);
  });
});
