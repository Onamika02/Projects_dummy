import { group, sleep } from 'k6';
import { makeRequest } from '../libs/utils.js';
import { BASE_URL, API_ENDPOINTS, transactionCode } from '../config/constants.js';

export function requestMoneyScenario(loginData) {
  let requestAmount = 50;
  let delayBetweenSteps = 5; 
  let delayAfterCompletion = 5; 
  const { token, phoneNumber } = loginData;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  console.log(`Starting request money flow for user: ${phoneNumber}`);

  group('Request Money Flow', () => {
    const recentContacts = getRecentContacts(headers);
    
    sleep(delayBetweenSteps);

    const doRequest = requestMoney(headers, {
      requestedNumber: "01788448853",
      requestAmount: requestAmount,
      transactionTypeCode: transactionCode.requestMoneyCode
    }, loginData);
    
    sleep(delayBetweenSteps);

    const requestedMoneyList = getRequestedMoneyList(headers);
    
    sleep(delayAfterCompletion);
    
    console.log(`Request money flow completed for user: ${phoneNumber}`);
  });
}

function getRecentContacts(headers) {
  const res = makeRequest(
    'GET',
    `${BASE_URL}${API_ENDPOINTS.requestMoney.recentContacts}`,
    null,
    headers
  );
  
  if (res.status !== 200) {
    console.error('Failed to get recent contacts:', res.status, res.body);
  }
  
  return res;
}

function requestMoney(headers, params, loginData) {
  const res = makeRequest(
    'POST',
    `${BASE_URL}${API_ENDPOINTS.requestMoney.requestMoney}`,
    JSON.stringify(params),
    headers
  );
  
  console.log('Request Money Response:', res.status);
  
  if (res.status !== 200) {
    console.error('Request money failed:', res.status, res.body);
    console.log(`Request money failed for user: ${loginData.phoneNumber}`);
  } else {
    console.log(`Money request completed for user: ${loginData.phoneNumber}, Amount: ${params.requestAmount}, From: ${params.requestedNumber}`);
  }
  
  return res;
}

function getRequestedMoneyList(headers) {
  const res = makeRequest(
    'GET',
    `${BASE_URL}${API_ENDPOINTS.requestMoney.requestedMoneyList}`,
    null,
    headers
  );
  
  console.log('Requested Money List Response:', res.status);
  if (res.status !== 200) {
    console.error('Failed to get requested money list:', res.status, res.body);
  } else {
    console.log('Requested money list retrieved successfully');
  }
  
  return res;
}