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

describe("Merchant QR Code Generation", () => {
  let token, merchantUser, merchantAccount,qrString;
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

    token = generateMerchantToken(merchantUser.id, merchantUser.phone, [
      "MERCHANT",
    ]);

    const chartOfAccounts = await createBasicChartOfAccounts();
    await createUserAccounts(chartOfAccounts);

    merchantAccount = await prismaAccounting.userAccount.findUnique({
      where: { identifier: "01999999999" },
    });
  });

  
  function parseBanglaQR(qrString) {
    let parsedData = {};
    let index = 0;

    while (index < qrString.length) {
        if (index + 2 > qrString.length) break;
        let tag = qrString.substring(index, index + 2);
        index += 2;

        if (index + 2 > qrString.length) break;
        let length = parseInt(qrString.substring(index, index + 2), 10);
        index += 2;

        if (index + length > qrString.length) break;
        let value = qrString.substring(index, index + length);
        index += length;

        parsedData[tag] = value;
    }

    return validateBanglaQR(qrString, parsedData) ? parsedData : "Invalid Bangla QR Structure";
}


function validateBanglaQR(qrString, parsedData) {
  if (!qrString || typeof qrString !== "string") {
      console.error("Invalid QR String provided to validateBanglaQR");
      return false;
  }

  let isValid = true;

  if (parsedData["00"] !== "01") {
      console.error("❌ Failed: Tag '00' should be '01'");
      isValid = false;
  }
  
  if (parsedData["01"] !== "02" && parsedData["01"] !== "11") {
    console.error("❌ Failed: Tag '01' should be '02' or '11'");
    isValid = false;
}


  if (parsedData["58"] !== "BD") {
      console.error("❌ Failed: Tag '58' should be 'BD'");
      isValid = false;
  }
  
  if (parsedData["53"] !== "050") {
      console.error("❌ Failed: Tag '53' should be '050'");
      isValid = false;
  }
  
  if (!parsedData["26"] || parsedData["26"] === '') {
      if (parsedData["62"] && parsedData["62"].includes("MID")) {
          parsedData["26"] = parsedData["62"];
      } else {
          console.error("❌ Failed: Tag '26' is missing.");
          isValid = false;
      }
  }

  if (parsedData["63"]) {
      let qrWithoutCRC = qrString.slice(0, -8);
      let calculatedCRC = calculateCRC16(qrWithoutCRC + "6304");
      if (parsedData["63"] !== calculatedCRC) {
          console.error(`❌ CRC Mismatch: Expected ${calculatedCRC}, Got ${parsedData["63"]}`);
          isValid = false;
      }
  }

  return isValid;
}

function calculateCRC16(data) {
    let crc = 0xFFFF;
    let polynomial = 0x1021;
    let bytes = new TextEncoder().encode(data);

    for (let byte of bytes) {
        crc ^= (byte << 8);
        for (let i = 0; i < 8; i++) {
            let bit = (crc & 0x8000) !== 0;
            crc <<= 1;
            if (bit) {
                crc ^= polynomial;
            }
            crc &= 0xFFFF;
        }
    }

    return crc.toString(16).toUpperCase().padStart(4, "0");
}

  it("should generate a valid QR code", async () => {
    await prismaApi.merchantUser.create({
      data: {
        userId: merchantUser.id,
        panVisa: "1234567890123456",
        mid: "MID123456",
        mcc: "5411",
        settlementFrequency: "MONTHLY"
      },
    });

   const response =  await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.generateQR}`)
      .expectStatus(200)
      .expectJsonLike({
        qr: /000201.+/,
      });

    expect((response) => {
      const qr = response.json.qr;
      expect(qr).to.contain("1234567890123456");
      expect(qr).to.contain("MID123456");
      expect(qr).to.contain("5411");
    });

    const qrString = response.body.qr;  
    const parsedQR = parseBanglaQR(qrString);  

    if (parsedQR === "Invalid Bangla QR Structure") {
        throw new Error("QR validation failed: Invalid Bangla QR structure");
    }

    expect(validateBanglaQR(qrString, parsedQR)).to.equal(true);


  });

  it("should generate QR with only Phone Number if PanVisa, MCC, MID not provided ", async () => {
  await prismaApi.merchantUser.create({
      data: {
        userId: merchantUser.id,
        billNumber: "dsjk",
        merchantName: "GREHOSUKH",
        merchantCity: "RAJSHAHI",
        tid: "23100157",
        panMastercard: "511629555133965",
        panUnionPay: "3649005036490050116020149000008",
        settlementFrequency: "MONTHLY"
      },
    });
   
    const response =  await pactum
      .spec()
      .withMethod("POST")
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.generateQR}`)
      .expectStatus(200);

      expect((response) => {
        const qr = response.json.qr;
        expect(qr).to.contain("01999999999");
      });
  });

});
