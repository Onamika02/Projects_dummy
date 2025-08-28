import pactum from "pactum";
import fs from "fs";
import FormData from "form-data";
import { Client as MinioClient } from "minio";
import { expect } from "chai";
import ApiUrls from "../apiUrls.js";
import prismaAccounting from "../utils/prismaAccountingClient.js";
import prismaAuth from "../utils/prismaAuthClient.js";
import prismaApi from "../utils/prismaApiClient.js";
import { generateMerchantToken } from "../utils/merchantTokenJWT.js";
import path from "path";

describe("Trade License for Mechant Onboarding", async () => {
  let token, idfromUser;

  const minioClient = new MinioClient({
    endPoint: "p-pay-minio-test",
    port: 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY || "doMESC6Lz7CiBFwa",
    secretKey:
      process.env.MINIO_SECRET_KEY || "wxO3CWvfeqSIyQTI0Icmhybumd6faHCy",
  });

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
    let userFromDb = await prismaAuth.appUser.findFirst({
      where: {
        phone: "01747538382",
      },
    });

    idfromUser = userFromDb.id;

    await prismaApi.MerchantUser.create({
      data: {
        userId: idfromUser,
        bankAccountNo: "1234567890",
        bankAccountName: "aaaaaa",
        bankName: "City Bank",
        bankBranchName: "Mirpur",
        tinNumber: "1234567887",
        organizationType: "Private Limited",
        organizationName: "Shukhee Private Limited",
        organizationAddress: "Agargaon, Dhaka",
        email: "shukhee@gmail.com",
        settlementFrequency: "MONTHLY"
      },
    });

    token = generateMerchantToken(Number(userFromDb.id), "01747538382", [
      "MERCHANT",
    ]);
  });

  // it("should Save trade license image successfully", async () => {
  //   const formData = new FormData();
  //   const imagePath = path.resolve("/opt/app/test-data/trade_license.jpeg");

  //   if (!fs.existsSync(imagePath)) {
  //     throw new Error(`Test image not found at path: ${imagePath}`);
  //   }

  //   formData.append("file", fs.createReadStream(imagePath), {
  //     filename: "trade_license.jpeg",
  //     contentType: "image/jpeg",
  //   });

  //   const res = await pactum
  //     .spec()
  //     .withMethod("POST")
  //     .withBearerToken(token)
  //     .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.tradeLicenseImageSave}`)
  //     .withFile(
  //       "tradeLicenseImage",
  //       path.resolve("/opt/app/test-data/trade_license.jpeg")
  //     )
  //     .expectStatus(200);

  //   const businessInfoFromDb = await prismaApi.merchantUser.findFirst({
  //     where: {
  //       userId: idfromUser,
  //     },
  //   });

  //   expect(businessInfoFromDb).to.not.be.null;
  //   expect(businessInfoFromDb.tradeLicense).to.not.be.null;
  //   expect(businessInfoFromDb.tradeLicense).to.be.string;
  // });

  // it("should Save trade license image successfully and verify in MinIO", async () => {
  //   const bucketName = "ppay";
  //   const imagePath = "/opt/app/test-data/trade_license.jpeg";
  //   const userPhone = "01747538382";

  //   const response = await pactum
  //     .spec()
  //     .post(`${ApiUrls.apiBaseUrl}${ApiUrls.tradeLicenseImageSave}`)
  //     .withBearerToken(token)
  //     .withFile("tradeLicenseImage", imagePath)
  //     .expectStatus(200);

  //   const exists = await minioClient.bucketExists(bucketName);
  //   expect(exists).to.be.true;

  //   const fileNamePattern = `trade_licenses/${userPhone}_*.trade_license.jpeg`;

  //   const objects = [];
  //   const stream = minioClient.listObjects(bucketName, "trade_licenses/", true);

  //   for await (const obj of stream) {
  //     objects.push(obj);
  //   }

  //   const regex = new RegExp(`^trade_licenses/${userPhone}.*trade_license.*$`);

  //   let fileFound = false;
  //   for (const obj of objects) {
  //     if (regex.test(obj.name)) {
  //       fileFound = true;
  //       break;
  //     }
  //   }

  //   expect(fileFound).to.be.true;

  //   const foundObjectName = objects.find((obj) => regex.test(obj.name))?.name;
  //   if (foundObjectName) {
  //     const stat = await minioClient.statObject(bucketName, foundObjectName);
  //     expect(stat).to.not.be.null;
  //     expect(stat.size).to.be.greaterThan(0);
  //   } else {
  //     throw new Error("File not found in the bucket.");
  //   }
  // });
});
