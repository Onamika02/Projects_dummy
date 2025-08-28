import { group, sleep } from 'k6';
import { makeRequest } from '../libs/utils.js';
import { BASE_URL, API_ENDPOINTS, transactionCode } from '../config/constants.js';

export function topUpScenario(loginData) {
  let amount = 20;
  let delayBetweenSteps = 5; 
  let delayAfterCompletion = 5; 
  const { token, phoneNumber } = loginData;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  console.log(`Starting top up flow for user: ${phoneNumber}`);

  group('Top Up Flow', () => {
    const recentContacts = getRecentContacts(headers);
    
    sleep(delayBetweenSteps);

    const operatorList = getOperatorList(headers);
    
    sleep(delayBetweenSteps);

    const shootOtp = otpShoot(headers, {
      phoneNumber: phoneNumber 
    });
    
    sleep(delayBetweenSteps);

    const topUp = doRecharge(headers, {
      amount: amount,
      phone: phoneNumber,
      operatorId: 53,
      name: 'User',
      transactionTypeCode: transactionCode.topUpCode,
      rechargeType: 'PREPAID',
      otp: '000000'
    }, loginData);
    
    sleep(delayAfterCompletion);
    
    console.log(`Top up flow completed for user: ${phoneNumber}`);
  });
}

function getRecentContacts(headers) {
  const res = makeRequest(
    'GET',
    `${BASE_URL}${API_ENDPOINTS.topUp.recentContacts}`,
    null,
    headers
  );
  
  if (res.status !== 200) {
    console.error('Failed to get recent contacts:', res.status, res.body);
  }
  
  return res;
}

function getOperatorList(headers) {
  const res = makeRequest(
    'GET',
    `${BASE_URL}${API_ENDPOINTS.topUp.operatorList}`,
    null,
    headers
  );
  
  console.log('Operator List Response:', res.status);
  if (res.status !== 200) {
    console.error('Failed to get operator list:', res.status, res.body);
  } else {
    console.log('Operator list retrieved successfully');
  }
  
  return res;
}

function otpShoot(headers, params) {
  const res = makeRequest(
    'POST',
    `${BASE_URL}${API_ENDPOINTS.topUp.shootOtp}`,
    JSON.stringify(params),
    headers
  );
  
  console.log('OTP Shoot Response:', res.status);
  if (res.status !== 200) {
    console.error('Failed to shoot OTP:', res.status, res.body);
  } else {
    console.log(`OTP sent successfully to: ${params.phoneNumber}`);
  }
  
  return res;
}

function doRecharge(headers, params, loginData) {
  const res = makeRequest(
    'POST',
    `${BASE_URL}${API_ENDPOINTS.topUp.doRecharge}`,
    JSON.stringify(params),
    headers
  );
  
  console.log('Top Up Response:', res.status);
  
  if (res.status !== 200) {
    console.error('Top up failed:', res.status, res.body);
    console.log(`Top up failed for user: ${loginData.phoneNumber}`);
  } else {
    console.log(`Top up transaction completed for user: ${loginData.phoneNumber}, Amount: ${params.amount}, Phone: ${params.phone}`);
  }
  
  return res;
}