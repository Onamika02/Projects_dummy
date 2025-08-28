import { group, sleep } from 'k6';
import { makeRequest } from '../libs/utils.js';
import { BASE_URL, API_ENDPOINTS, transactionCode } from '../config/constants.js';

export function makePaymentScenario(loginData) {
  let amount = 20;
  let delayBetweenSteps = 2; 
  let delayAfterCompletion = 5; 
  const { token, phoneNumber } = loginData;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  console.log(`Starting payment flow for user: ${phoneNumber}`);

  group('Make Payment Flow', () => {
    const charge = getChargeWithAmount(headers, {
      code: transactionCode.paymentCode,
      amount: amount,
    });


    sleep(delayBetweenSteps);

    const shootOtp = otpShoot(headers, {
      phoneNumber: phoneNumber 
    });

    sleep(delayBetweenSteps);

    const makePayment = payment(headers, {
      agentMobile: "01715170025",
      transactionTypeCode: transactionCode.paymentCode,
      note: "Payment transaction",
      amount: amount,
      referenceNo: "pay1",
      otp: '000000'
    }, loginData);

    sleep(delayAfterCompletion);
    
    console.log(`Payment flow completed for user: ${phoneNumber}`);
  });
}

function getChargeWithAmount(headers, params) {
  const res = makeRequest(
    'GET',
    `${BASE_URL}${API_ENDPOINTS.makePayment.chargeWithAmount}?code=${params.code}&amount=${params.amount}`,
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
    `${BASE_URL}${API_ENDPOINTS.makePayment.shootOtp}`,
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

function payment(headers, params, loginData) {
  const res = makeRequest(
    'POST',
    `${BASE_URL}${API_ENDPOINTS.makePayment.payment}`,
    JSON.stringify(params),
    headers
  );
  
  console.log('Payment Response:', res.status);
  
  if (res.status !== 200) {
    console.error('Payment failed:', res.status, res.body);
    console.log(`Payment failed for user: ${loginData.phoneNumber}`);
  } else {
    console.log(`Payment transaction completed for user: ${loginData.phoneNumber}, Amount: ${params.amount}, To Agent: ${params.agentMobile}`);
  }
  
  return res;
}