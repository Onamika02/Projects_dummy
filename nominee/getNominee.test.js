import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../apiUrls.js";
import prismaAccounting from "../utils/prismaAccountingClient.js";
import { generateUserToken } from "../utils/userTokenJWT.js";
import { clearAllDatabases } from "../utils/cleanDB.js";
import { createAppUserAccounts } from "../utils/setupAppUser.js";
import prismaAuth from "../utils/prismaAuthClient.js";
import prismaApi from "../utils/prismaApiClient.js";


describe("Get Nominee (GET :/user/nominee)", () => {

    let token, userId, nomineeData;
    before(async () => {
        await prismaAuth.$connect();
        await prismaAccounting.$connect();
        await prismaApi.$connect();
    });

    after(async () => {
        await prismaAuth.$disconnect();
        await prismaAccounting.$disconnect();
        await prismaApi.$disconnect();
    });

    beforeEach(async () => {
        await clearAllDatabases();
        await createAppUserAccounts();

        userId = await prismaAuth.appUser.findFirst({
            where: {
                phone: "01317577237",
            },
        });
        token = generateUserToken(userId.id, "01317577237", "USER");
        const nomineeData = {
            name: "John Doe",
            nidNumber: "123456789",
            relation: "Brother",
            phoneNumber: "01718984384",
            birthDate: "25-02-2020",
            userId: userId.id
        };
        await prismaAuth.nominee.create({
            data: nomineeData,
        });
    });

    it("should get a new nominee", async () => {

        const getNominee = await pactum
            .spec()
            .withMethod("GET")
            .withBearerToken(token)
            .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.addNominee}`)
            .expectStatus(200);

        const createdNominee = await prismaAuth.nominee.findUnique({
            where: { userId: userId.id },
        });
        expect(createdNominee.name).to.equal(getNominee.body.nominee.name);
        expect(createdNominee.nidNumber).to.equal(getNominee.body.nominee.nidnumber);
        expect(createdNominee.relation).to.equal(getNominee.body.nominee.relation);
        expect(createdNominee.phoneNumber).to.equal(getNominee.body.nominee.phonenumber);
    });

});