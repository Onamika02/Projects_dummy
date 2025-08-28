import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../apiUrls.js";
import prismaAccounting from "../utils/prismaAccountingClient.js";
import { generateUserToken } from "../utils/userTokenJWT.js";
import { clearAllDatabases } from "../utils/cleanDB.js";
import { createAppUserAccounts } from "../utils/setupAppUser.js";
import prismaAuth from "../utils/prismaAuthClient.js";
import prismaApi from "../utils/prismaApiClient.js";

describe("Add Nominee (POST :/user/nominee)", () => {

    let token, userId;
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
    });

    const requesBodyNominee = {
        name: "John Doe",
        nidNumber: "123456789",
        relation: "Brother",
        phoneNumber: "01718984384",
        birthDate: "25-02-2020"
    };

    it("should create a new nominee", async () => {
        await pactum
            .spec()
            .withMethod("POST")
            .withBearerToken(token)
            .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.addNominee}`)
            .withJson(requesBodyNominee).expectStatus(200);

        const createdNominee = await prismaAuth.nominee.findUnique({
            where: { userId: userId.id },
        });

        expect(createdNominee.name).to.equal("John Doe");
        expect(createdNominee.nidNumber).to.equal("123456789");
        expect(createdNominee.relation).to.equal("Brother");
        expect(createdNominee.phoneNumber).to.equal("01718984384");
    });


    it("should 400 if any data is missing", async () => {
        await pactum
            .spec()
            .withMethod("POST")
            .withBearerToken(token)
            .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.addNominee}`)
            .withJson({
                ...requesBodyNominee,
                name: ""
            }).expectStatus(400);

        const createdNominee = await prismaAuth.nominee.findUnique({
            where: { userId: userId.id },
        });

        expect(createdNominee).to.be.null;
    });


});