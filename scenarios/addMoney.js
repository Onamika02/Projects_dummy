import { group } from 'k6';
import { makeRequest } from '../libs/utils.js';
import { BASE_URL, API_ENDPOINTS, transactionCode } from '../config/constants.js';

export function addMoneyScenario(loginData) {
  
  let amount = 500000; 
  const { token, phoneNumber } = loginData;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  console.log(`Starting add money flow for user: ${phoneNumber}`);

  group('Add Money Flow', () => {
    const savedTransactions = getSavedTransactions(headers);

    const alArafahAddMoney = doAddMoneyAlArafah(headers, {
      accountType: 'MFS',
      transactionCode: transactionCode.addMoneyCode,
      amount: amount,
      distributorId: 204,
      mfsType: 'AL-ARAFAH',
      alArafahTrxnId: null
    });

    
    
    // Uncomment and modify if you want to use City add money as well
    // const cityAddMoney = doAddMoneyCity(headers, {
    //   accountType: 'CARD',
    //   transactionCode: '1230000',
    //   amount: 100,
    //   distributorId: 205,
    //   cardNumber: "345353535345345",
    //   cardType: 'VISA'
    // });
  });


function getSavedTransactions(headers) {
  const res = makeRequest(
    'GET',
    `${BASE_URL}${API_ENDPOINTS.addMoney.savedTransactions}`,
    null,
    headers
  );
  
  if (res.status !== 200) {
    console.error('Failed to get saved transactions:', res.status, res.body);
  }
  
  return res;
}

function doAddMoneyAlArafah(headers, params) {
  const res = makeRequest(
    'POST',
    `${BASE_URL}${API_ENDPOINTS.addMoney.doAddMoneyAlArafah}`,
    JSON.stringify(params),
    headers
  );
  
  console.log('Al-Arafah Add Money Response:', res.status);
  
  if (res.status !== 200) {
    console.error('Al-Arafah add money failed:', res.status, res.body, `${loginData.phoneNumber}`);

  }
  else{
    console.log(`Al-Arafah add money transaction completed for user: ${loginData.phoneNumber}`);
  }
  
  return res;
}
}
// function doAddMoneyCity(headers, params) {
//   const res = makeRequest(
//     'POST',
//     `${BASE_URL}${API_ENDPOINTS.addMoney.doAddMoneyCity}`,
//     JSON.stringify(params),
//     headers
//   );
  
//   console.log('City Add Money Response:', res.status);
  
//   if (res.status !== 200) {
//     console.error('City add money failed:', res.status, res.body);
//   } else {
//     console.log('City add money successful for amount:', params.amount);
//   }
  
//   return res;
// }