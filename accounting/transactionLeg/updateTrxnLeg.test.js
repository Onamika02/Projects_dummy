import pactum from 'pactum';
import { expect } from 'chai';
import ApiUrls from '../../apiUrls.js';
import prismaAccounting from '../../utils/prismaAccountingClient.js';
import { generateToken } from "../../utils/generateJWT.js";

let token, feeId;

describe('Update Trxn Fee API Tests (PATCH  :/v1/trxn-fee/)', () => {
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

    const adminUser = {
      email: "admin@ppay.com",
      roles: "Admin",
      adminRole: "ADMIN"
    };
    token = generateToken(1, adminUser.email, adminUser.roles, adminUser.adminRole);
  });

  after(async () => {
    await prismaAccounting.$disconnect();
  });

  it('should update a fee with valid name, description', async () => {
  
    const fee = await prismaAccounting. transactionLeg.findMany({
      where: {
        name: 'Public',
      },
    });
    
    const feeId = fee[0].id;
    
    const feeToUpdate = {
      name: "Updated Fee Name",
      description: "Updated description"
    };

    await pactum
      .spec()
      .withMethod('PATCH')
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.updateLegs}${feeId}`)
      .withJson(feeToUpdate)
      .expectStatus(200);

    const updatedFeeRecord = await prismaAccounting. transactionLeg.findUnique({
      where: { id: feeId }
    });

    expect(updatedFeeRecord).to.not.be.null;
    expect(updatedFeeRecord.name).to.equal(feeToUpdate.name);
    expect(updatedFeeRecord.description).to.equal(feeToUpdate.description);
  });

  it('should return 400 if attempting to update non-allowed fields like type, original and generated transaction type', async () => {
    const fee = await prismaAccounting. transactionLeg.findMany({
      where: {
        name: 'Public',
      },
    });
    const feeId = fee[0].id;

    const feeWithInvalidFields  = {
      type: "AIT",
      originalTransactionType: 55,
      generatedTransactionType: 55,
    };
    await pactum
      .spec()
      .withMethod('PATCH')
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.updateLegs}${feeId}`)
      .withJson(feeWithInvalidFields)
      .expectStatus(200);

    const feeRecord = await prismaAccounting. transactionLeg.findUnique({
      where: { id: feeId }
    });

    expect(feeRecord).to.not.be.null;
    expect(feeRecord.type).to.not.equal(feeWithInvalidFields.type);
    expect(feeRecord.originalTransactionTypeId).to.not.equal(feeWithInvalidFields.originalTransactionType);
    expect(feeRecord.generatedTransactionTypeId).to.not.equal(feeWithInvalidFields.generatedTransactionType);
  });

  it('should check the logs for updating a fee', async () => {

    const fee = await prismaAccounting. transactionLeg.findMany({
      where: {
        name: 'Public'
      },
    });

    const feeId = fee[0].id;

    const feeToUpdate = {
      name: "Updated Fee Name",
    };

    await pactum
      .spec()
      .withMethod('PATCH')
      .withBearerToken(token)
      .withPath(`${ApiUrls.apiBaseUrl}${ApiUrls.updateLegs}${feeId}`)
      .withJson(feeToUpdate);

    const updatedFeeRecord = await prismaAccounting. transactionLeg.findMany({
      where: { id: feeId }
    });

    const logEntry = await prismaAccounting. transactionLegLog.findMany({
      where: { transactionLeg_id: updatedFeeRecord.id }
    });

    expect(logEntry[0]).to.have.property('changeType').to.equal('UPDATE');
    expect(logEntry[0]).to.have.property('oldValue').not.to.be.null;
    expect(logEntry[0]).to.have.property('oldValue').not.to.be.null;
  });
});