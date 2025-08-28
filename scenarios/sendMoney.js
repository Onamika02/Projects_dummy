import { group, sleep } from 'k6';
import { makeRequest } from '../libs/utils.js';
import { BASE_URL, API_ENDPOINTS, transactionCode } from '../config/constants.js';

export function sendMoneyScenario(loginData) {
  let amount = 50;
  let delayBetweenSteps = 2; 
  let delayAfterCompletion = 5;

  const { token, phoneNumber } = loginData;
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  console.log(`Starting send money flow for user: ${phoneNumber}`);

  group('Send Money Flow', () => {
    const recentContacts = getRecentContacts(headers);
    
    sleep(delayBetweenSteps);

    const savedTransactions = getSavedTransactions(headers);
    
    sleep(delayBetweenSteps);

    const charge = getChargeWithAmount(headers, {
      code: transactionCode.sendMoneyCode,
      amount: amount
    });
    
    sleep(delayBetweenSteps);

    const shootOtp = otpShoot(headers, {
      phoneNumber: phoneNumber 
    });
    
    sleep(delayBetweenSteps);

    const postSendMoney = doSendMoney(headers, {
      receiverPhone: "01788448853",
      amount: amount,
      transactionTypeCode: transactionCode.sendMoneyCode,
      save: true,
      otp: "000000"
    }, loginData);
    
    sleep(delayAfterCompletion);
    
    console.log(`Send money flow completed for user: ${phoneNumber}`);
  });
}

function getRecentContacts(headers) {
  const res = makeRequest(
    'GET',
    `${BASE_URL}${API_ENDPOINTS.sendMoney.recentContacts}`,
    null,
    headers
  );
  
  if (res.status !== 200) {
    console.error('Failed to get recent contacts:', res.status, res.body);
  }
  
  return res;
}

function getSavedTransactions(headers) {
  const res = makeRequest(
    'GET',
    `${BASE_URL}${API_ENDPOINTS.sendMoney.savedTransactions}`,
    null,
    headers
  );
  
  if (res.status !== 200) {
    console.error('Failed to get saved transactions:', res.status, res.body);
  }
  
  return res;
}

function getChargeWithAmount(headers, params) {
  const res = makeRequest(
    'GET',
    `${BASE_URL}${API_ENDPOINTS.sendMoney.chargeWithAmount}?code=${params.code}&amount=${params.amount}`,
    null,
    headers
  );
  
  console.log('Charge With Amount Response:', res.status);
  if (res.status !== 200) {
    console.error('Failed to get charge with amount:', res.status, res.body);
  } else {
    console.log(`Charge calculated for amount: ${params.amount}`);
  }
  
  return res;
}

function otpShoot(headers, params) {
  const res = makeRequest(
    'POST',
    `${BASE_URL}${API_ENDPOINTS.sendMoney.shootOtp}`,
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

function doSendMoney(headers, params, loginData) {
  const res = makeRequest(
    'POST',
    `${BASE_URL}${API_ENDPOINTS.sendMoney.doSendMoney}`,
    JSON.stringify(params),
    headers
  );
  
  console.log('Send Money Response:', res.status);
  
  if (res.status !== 200) {
    console.error('Send money failed:', res.status, res.body);
    console.log(`Send money failed for user: ${loginData.phoneNumber}`);
  } else {
    console.log(`Send money transaction completed for user: ${loginData.phoneNumber}, Amount: ${params.amount}, To: ${params.receiverPhone}`);
  }
  
  return res;
}