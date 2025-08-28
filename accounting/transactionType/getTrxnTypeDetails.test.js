import pactum from 'pactum';
import { expect } from 'chai';
import ApiUrls from '../../apiUrls.js';
import prismaAccounting from '../../utils/prismaAccountingClient.js';
import { generateToken } from "../../utils/generateJWT.js";

let token, typeId;


describe('GET Trxn Type API Tests (:GET /v1/transaction-type)', () => {

    before(async () => {
        await prismaAccounting.$connect();
    });

    beforeEach(async () => {
        await prismaAccounting.transactionLegLog.deleteMany({});
        await prismaAccounting.transactionLeg.deleteMany({});
        await prismaAccounting.transactionTypeChangeLog.deleteMany({});
        await prismaAccounting.transactionType.deleteMany({});
        await prismaAccounting.chartOfAccountLog.deleteMany({});
        await prismaAccounting.chartOfAccount.deleteMany({});

        await prismaAccounting.chartOfAccount.createMany({
            data: [
                {
                    name: 'Account 1',
                    description: 'Description for Account 1',
                    transactionType: 'SYSTEM',
                    headType: 'ASSET',
                    code: '001',
                    onlyParent: false,
                    adminId: 1
                },
                {
                    name: 'Account 2',
                    description: 'Description for Account 2',
                    transactionType: 'SYSTEM',
                    headType: 'ASSET',
                    code: '002',
                    onlyParent: true,
                    adminId: 1
                }
            ]
        });

        const account1 = await prismaAccounting.chartOfAccount.findUnique({
            where: {
                code: '001'
            }
        });

        const account2 = await prismaAccounting.chartOfAccount.findUnique({
            where: {
                code: '002'
            }
        });


        const createdType = await prismaAccounting.transactionType.create({
            data: {
                transactionCode: '223',
                name: 'TypeA',
                description: 'qqqqqqqqqqqqqqqqq',
                minAmount: 66,
                maxAmount: 666,
                createdByAdminId: 1,
                createdByAdminIdentifier: '11',
                isActive: true,
                fromChartOfAccountId: account1.id,
                toChartOfAccountId: account2.id,
                minAmount: 100,
                maxAmount: 1000,
                dailyLimitCount: 20,
                dailyLimitAmount: 30,
                monthlyLimitAmount: 30,
                monthlyLimitCount: 20,
                weeklyLimitAmount: 100,
                weeklyLimitCount: 5000,
            },
        });

        typeId = createdType.id;
    });


    after(async () => {
        await prismaAccounting.$disconnect();
    });

    it('should return transaction type detail', async () => {
        const adminUser = {
            email: "admin@ppay.com",
            roles: "Admin",
            adminRole: "ADMIN"
        };
        token = generateToken(1, adminUser.email, adminUser.roles, adminUser.adminRole);
        const response = await pactum
            .spec()
            .withMethod('GET')
            .withBearerToken(token)
            .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.getTypes}/${typeId}`)
            .expectStatus(200);

        const typeDB = await prismaAccounting.transactionType.findUnique({
            where: {
                transactionCode: '223',
            },
        });

        expect(response.body.name).to.equal(typeDB.name);
        expect(response.body.description).to.equal(typeDB.description);
        expect(response.body.transactioncode).to.equal(typeDB.transactionCode);
        expect(response.body.min).to.equal(typeDB.minAmount);
        expect(response.body.max).to.equal(typeDB.maxAmount);
        expect(response.body.isactive).to.equal(typeDB.isActive);

        expect(Number(typeDB.dailyLimitCount)).to.equal(response.body.dailylimit.count);
        expect(Number(typeDB.dailyLimitAmount)).to.equal(response.body.dailylimit.amount);
        expect(Number(typeDB.monthlyLimitCount)).to.equal(response.body.monthlylimit.count);
        expect(Number(typeDB.monthlyLimitAmount)).to.equal(response.body.monthlylimit.amount);
        expect(Number(typeDB.weeklyLimitCount)).to.equal(response.body.weeklylimit.count);
        expect(Number(typeDB.weeklyLimitAmount)).to.equal(response.body.weeklylimit.amount);
    });
});
