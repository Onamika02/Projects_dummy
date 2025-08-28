import { group, sleep } from 'k6';
import { makeRequest } from '../libs/utils.js';
import { BASE_URL, API_ENDPOINTS, transactionCode } from '../config/constants.js';

export function fundTransferScenario(loginData) {
  let amount = 10;
  let delayBetweenSteps = 5; 
  let delayAfterCompletion = 5; 
  
  const { token, phoneNumber } = loginData;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  console.log(`Starting fund transfer flow for user: ${phoneNumber}`);

  group('Fund Transfer Flow', () => {
    const savedTransactions = getSavedTransactions(headers);
    
    sleep(delayBetweenSteps);

    const shootOtp = otpShoot(headers, {
      phoneNumber: phoneNumber
    });
    
    sleep(delayBetweenSteps);

    const fundTransferBank = fundTransfer(headers, {
      accountType: 'MFS',
      transactionCode: transactionCode.fundTransferCode,
      amount: amount,
      distributorId: 1555,
      phoneNumber: '01711106485',
      mfsType: 'AL_ARAFAH',
      otp: '000000'
    });
    
    sleep(delayAfterCompletion);
    
    console.log(`Fund transfer flow completed for user: ${phoneNumber}`);
  });
}

function getSavedTransactions(headers) {
  const res = makeRequest(
    'GET',
    `${BASE_URL}${API_ENDPOINTS.fundTransfer.savedTransactions}`,
    null,
    headers
  );
  
  if (res.status !== 200) {
    console.error('Failed to get saved transactions:', res.status, res.body);
  }
  
  return res;
}

function otpShoot(headers, params) {
  const res = makeRequest(
    'POST',
    `${BASE_URL}${API_ENDPOINTS.makePayment.shootOtp}`,
    JSON.stringify(params),
    headers
  );
  
  console.log('OTP Shoot Response:', res.status);
  
  if (res.status !== 200) {
    console.error('OTP shoot failed:', res.status, res.body);
  } else {
    console.log(`OTP sent successfully to: ${params.phoneNumber}`);
  }
  
  return res;
}

function fundTransfer(headers, params) {
  const res = makeRequest(
    'POST',
    `${BASE_URL}${API_ENDPOINTS.fundTransfer.doFundTransfer}`,
    JSON.stringify(params),
    headers
  );
  
  console.log('Fund Transfer Response:', res.status);
  
  if (res.status !== 200) {
    console.error('Fund transfer failed:', res.status, res.body);
  } else {
    console.log(`Fund transfer completed successfully. Amount: ${params.amount}, To: ${params.phoneNumber}`);
  }
  
  return res;
}