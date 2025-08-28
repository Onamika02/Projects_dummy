import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../apiUrls.js";
import prismaAccounting from "../utils/prismaAccountingClient.js";
import prismaAuth from "../utils/prismaAuthClient.js";
import prismaApi from "../utils/prismaApiClient.js";
import { clearAllDatabases } from "../utils/cleanDB.js";
import { createBasicChartOfAccounts } from "../utils/setUpCoA.js";
import { createUserAccounts } from "../utils/setupAccounts.js";
import { generateMerchantToken } from "../../src/utils/merchantTokenJWT.js";
import { generateToken } from "../utils/generateJWT.js";

describe("Merchant Add Information For QR Generation", () => {
  let token, merchantUser, merchantAccount, merchantToken;
  before(async () => {
    await prismaAuth.$connect();
    await prismaAccounting.$connect();
    await prismaApi.$connect();
  });

  after(async () => {
    await prismaAuth.$disconnect();
    await prismaApi.$disconnect();
    await prismaAccounting.$disconnect();
  });
  beforeEach(async () => {
    await clearAllDatabases();
    await prismaAuth.appUser.create({
      data: {
        fullname: "Mosharof Hossain",
        phone: "01999999999",
        profilePicture: "https://example.com/Jarin.jpg",
        email: "mosharof@example.com",
        password:
          "$2a$10$C2JDo6LHB61PTl6mTBdEpeoPNRf7mDCKdbufHd.2uEJzwwm4hbP6q",
        fathername: "John Jarin re",
        mothername: "Jarin Doe pe",
        nidnumber: "1234566899",
        dob: "1990-01-01",
        nidaddress: "House 123, Street 456, City, District",
        presentAddress: "House 789, Street 321, City, District",
        district: "Dhaka",
        hasLiveliness: true,
        hasNidInfo: true,
        isEmailVerified: false,
        isPhoneVerified: false,
        nidBack: "https://example.com/nid_back.jpg",
        nidFront: "https://example.com/nid_front.jpg",
        role: "MERCHANT",
        wrongPinCount: 0
      },
    });

    merchantUser = await prismaAuth.appUser.findUnique({
      where: { phone: "01999999999" },
    });

    const adminUser = await prismaAuth.adminUser.findUnique({
        where: { email: "admin@example.com" },
      });


    token = generateToken(adminUser.id, "admin@example.com", "ADMIN", "ADMIN" );

    merchantToken =  generateMerchantToken(merchantUser.id, merchantUser.phone, [
        "MERCHANT",
      ]);

    const chartOfAccounts = await createBasicChartOfAccounts();
    await createUserAccounts(chartOfAccounts);

    await prismaApi.merchantUser.create({
        data: {
          userId: merchantUser.id,
          billNumber: "dsjk",
          merchantName: "GREHOSUKH",
          merchantCity: "RAJSHAHI",
          tid: "23100157",
          panMastercard: "511629555133965",
          bankAccountName: "GREHOSUKH",
          bankAccountNo: "1234567890",
          bankName: "City Bank",
          bankBranchName: "Mirpur",
          settlementFrequency: "MONTHLY"
        }
      });

    merchantAccount = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01999999999" },
    });
  });

  it("should successfully add information", async () => {
 
      const dataForQR={
        userId: merchantUser.id,
        panVisa: "1234567890123456",
        mid: "MID123456",
        mcc: "5411",
      }; 

    await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.addInfoQR}`)
      .withJson(dataForQR)
      .expectStatus(200);

    const merchantUserFromDb = await prismaApi.merchantUser.findFirst({
      where: {
        userId: merchantUser.id,
      },
    });

    expect(merchantUserFromDb).to.not.be.null;
    expect(merchantUserFromDb.panVisa).to.equal("1234567890123456");
    expect(merchantUserFromDb.mid).to.equal("MID123456");
    expect(merchantUserFromDb.mcc).to.equal("5411");

  });

  it("should show error if any other user except Admin tries to add information", async () => {

    const dataForQR={
        userId: merchantUser.id,
        panVisa: "1234567890123456",
        mid: "MID123456",
        mcc: "5411",
      }; 

    await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(merchantToken)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.addInfoQR}`)
      .withJson(dataForQR)
      .expectStatus(401);
  });

});
