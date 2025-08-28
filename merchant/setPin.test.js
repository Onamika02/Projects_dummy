import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../apiUrls.js";
import prismaAccounting from "../utils/prismaAccountingClient.js";
import prismaAuth from "../utils/prismaAuthClient.js";
import prismaApi from "../utils/prismaApiClient.js";
import { generateTokenForSetPin } from "../utils/generateJWTforSetPin.js";

describe("Set Pin for Mechant Onboarding", async () => {
  let token;

  before(async () => {
    await prismaAuth.$connect();
    await prismaAccounting.$connect();
    await prismaApi.$connect();
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

    await prismaAuth.appUser.deleteMany({});
    await prismaApi.MerchantUser.deleteMany({});
  });

  after(async () => {
    await prismaAccounting.$disconnect();
    await prismaAuth.$disconnect();
    await prismaApi.$disconnect();
  });

  it("should check the user is stored in the DB after setting Pin", async () => {
    const phoneNumber = "01788448853";

    token = generateTokenForSetPin(phoneNumber);

    const res = await pactum
      .spec()
      .withMethod("POST")
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.setPin}`)
      .withJson({
        token: token,
        pin: "123459",
      })
      .expectStatus(200);

    const userInDb = await prismaAuth.appUser.findUnique({
      where: { phone: phoneNumber },
    });

    expect(userInDb.phone).to.equal(phoneNumber);
    expect(userInDb.role).to.equal("MERCHANT");
  });
});
