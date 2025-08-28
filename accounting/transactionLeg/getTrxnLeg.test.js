
import pactum from 'pactum';
import { expect } from 'chai';
import ApiUrls from '../../apiUrls.js';
import prismaAccounting from '../../utils/prismaAccountingClient.js';
import { generateToken } from "../../utils/generateJWT.js";

let token;

describe('GET Trxn Leg API Tests (:GET /v1/transaction-leg)', () => {

  before(async () => {
    await prismaAccounting.$connect();
  });
  
  beforeEach(async () => {
    await prismaAccounting.ledger.deleteMany({});
    await prismaAccounting.transaction.deleteMany({});

    await prismaAccounting.transactionLegLog.deleteMany({});
    await prismaAccounting.transactionLeg.deleteMany({});

    await prismaAccounting.transactionTypeChangeLog.deleteMany({});
    await prismaAccounting.transactionType.deleteMany({});

    await prismaAccounting.userAccount.deleteMany({});

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


    const typeA = await prismaAccounting.transactionType.create({
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
      },
    });

    const typeB = await prismaAccounting.transactionType.create({
      data: {
        transactionCode: '224',
        name: 'TypeB',
        description: 'qqqqqqqqqqqqqqqqq',
        minAmount: 66,
        maxAmount: 666,
        createdByAdminId: 1,
        createdByAdminIdentifier: '11',
        isActive: true,
        fromChartOfAccountId: account1.id,
        toChartOfAccountId: account2.id,
      },
    });

    await prismaAccounting. transactionLeg.create({
      data: {
        name: 'Public',
        description: 'Initial description',
        type: 'FEE',
        isEnable: true,
        chargeType: "FIXED",
        fixedAmount: 100,
        minAmount: 10,
        maxAmount: 200,
        percentageAmount: 5,
        destinationType: "SOURCE",
        originalTransactionType: {
          connect: { id: Number(typeA.id) }
        },
        generatedTransactionType: {
          connect: { id: Number(typeB.id) }
        }
      },
    });
  });

  after(async () => {
    await prismaAccounting.$disconnect();
  });

  it('should return all legs', async () => {
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
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.getLegs}`)
      .expectStatus(200);

    const feeDb = await prismaAccounting. transactionLeg.findMany({});

    expect(response.body.transactionlegs).to.be.an('array');

    expect(response.body.transactionlegs.name).to.equal(feeDb.name);
    expect(response.body.transactionlegs.description).to.equal(feeDb.description);
    expect(response.body.transactionlegs.id).to.equal(feeDb.id);

  });
});
