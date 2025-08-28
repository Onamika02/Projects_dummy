import pactum from "pactum";
import { expect } from "chai";
import ApiUrls from "../apiUrls.js";
import prismaAccounting from "../utils/prismaAccountingClient.js";
import { generateUserToken } from "../utils/userTokenJWT.js";
import prismaAuth from "../utils/prismaAuthClient.js";
import prismaApi from "../utils/prismaApiClient.js";
import { clearAllDatabases } from "../utils/cleanDB.js";
import { createBasicChartOfAccounts } from "../utils/setUpCoA.js";
import { createUserAccounts } from "../utils/setupAccounts.js";
import { setupTransactionTypes } from "../utils/setUpTypes.js";
import { runMerchantTransactionTests, checkSuccessForMerchant } from "../utils/doTransactionMerchant.js";
import { addInitialBalance } from "../utils/addInitialBalance.js";
import { createAppUserAccounts } from "../utils/setupAppUser.js";

describe("API Check: Bulk Disbursement(GET)", function () {
    let userId, token;
    before(async function () {
        await prismaAuth.$connect();
        await prismaAccounting.$connect();
        await prismaApi.$connect();
    });

    beforeEach(async () => {
        await clearAllDatabases();
        await createAppUserAccounts();
        userId = await prismaAuth.appUser.findFirst({
            where: {
                phone: "01999999999",
            },
        });
        token = generateUserToken(userId.id, "01999999999", "MERCHANT");
        const chartOfAccounts = await createBasicChartOfAccounts();

        const transactionTypes = await setupTransactionTypes(chartOfAccounts);
        await createUserAccounts(chartOfAccounts);

    });

    it("should return bulk disbursement list", async function () {
        const bulks = await prismaApi.bulkDisbursement.createMany({
            data: [
                {
                    fromAccount: '01999999999',
                    toAccount: '01317577237',
                    amount: 10,
                    status: "SUCCESS",
                    referenceNumber: null,
                    merchantId: userId.id,
                    createdAt: new Date('2025-03-11T10:53:26.091Z'),
                    updatedAt: new Date('2025-03-11T10:53:26.091Z'),
                },
                {
                    fromAccount: '01999999999',
                    toAccount: '01711106485',
                    amount: 25,
                    status: "SUCCESS",
                    referenceNumber: null,
                    merchantId: userId.id,
                    createdAt: new Date('2025-03-11T10:53:26.092Z'),
                    updatedAt: new Date('2025-03-11T10:53:26.092Z'),
                }
            ],
            skipDuplicates: true,
        });

        const response = await pactum
            .spec()
            .withBearerToken(token)
            .withMethod("GET")
            .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.doBulkDisbursement}`)
            .expectStatus(200);

            expect(response.body.bulkDisbursements).to.be.an("array");
            expect(response.body.bulkDisbursements.length).to.equal(2);
        
            const firstDisbursement = response.body.bulkDisbursements[0];
            expect(firstDisbursement).to.have.property("id");
            expect(firstDisbursement).to.have.property("fromAccount", "01999999999");
            expect(firstDisbursement).to.have.property("toAccount", "017xxxxx485");
            expect(firstDisbursement).to.have.property("amount", 25);
            expect(firstDisbursement).to.have.property("status", "SUCCESS");
            expect(firstDisbursement).to.have.property("failedReason", null);
        
            const secondDisbursement = response.body.bulkDisbursements[1];
            expect(secondDisbursement).to.have.property("id");
            expect(secondDisbursement).to.have.property("fromAccount", "01999999999");
            expect(secondDisbursement).to.have.property("toAccount", "013xxxxx237");
            expect(secondDisbursement).to.have.property("amount", 10);
            expect(secondDisbursement).to.have.property("status", "SUCCESS");
            expect(secondDisbursement).to.have.property("failedReason", null);

            expect(response.body.paginationData).to.have.property("totalcount", 2);
            expect(response.body.paginationData).to.have.property("currentpage", 0);
            expect(response.body.paginationData).to.have.property("currentpagetotalcount", 2);
            expect(response.body.paginationData).to.have.property("hasnext", false);

    });
});