import { group, sleep } from 'k6';
import { makeRequest } from '../libs/utils.js';
import { BASE_URL, API_ENDPOINTS, transactionCode } from '../config/constants.js';

export function billPayScenario(loginData) {
    let delayBetweenSteps = 5; 
    let delayAfterCompletion = 5; 
    
    const { token, phoneNumber } = loginData;

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    console.log(`Starting bill pay flow for user: ${phoneNumber}`);

    group('Bill Pay Flow', () => {
        const savedTransactions = getSavedTransactions(headers);
        
        sleep(delayBetweenSteps);

        const billerCategoriesList = getBillerCategoriesList(headers, {
            billerType: "WATER"
        });
        
        sleep(delayBetweenSteps);

        const shootOtp = otpShoot(headers, {
            phoneNumber: phoneNumber
        });
        
        sleep(delayBetweenSteps);

        const billPay = doBillPay(headers, {
            billerId: 2,
            amount: 10,
            chargeFee: 10,
            refId: "1234",
            transactionTypeCode: transactionCode.billPayCode,
            otp: "000000"
        }, loginData);
        
        sleep(delayAfterCompletion);
        
        console.log(`Bill pay flow completed for user: ${phoneNumber}`);
    });
}

function getSavedTransactions(headers) {
    const res = makeRequest(
        'GET',
        `${BASE_URL}${API_ENDPOINTS.billPay.savedTransactions}`,
        null,
        headers
    );

    if (res.status !== 200) {
        console.error('Failed to get saved transactions:', res.status, res.body);
    }

    return res;
}

function getBillerCategoriesList(headers, params) {
    const res = makeRequest(
        'GET',
        `${BASE_URL}${API_ENDPOINTS.billPay.billerCategoriesList}?billerType=${params.billerType}`,
        null,
        headers
    );

    console.log('Biller Categories List Response:', res.status);
    if (res.status !== 200) {
        console.error('Failed to get biller categories:', res.status, res.body);
    }

    return res;
}

function otpShoot(headers, params) {
    const res = makeRequest(
        'POST',
        `${BASE_URL}${API_ENDPOINTS.billPay.shootOtp}`,
        JSON.stringify(params),
        headers
    );

    if (res.status !== 200) {
        console.error('Failed to shoot OTP:', res.status, res.body);
    } else {
        console.log(`OTP sent successfully to: ${params.phoneNumber}`);
    }

    return res;
}

function doBillPay(headers, params, loginData) {
    const res = makeRequest(
        'POST',
        `${BASE_URL}${API_ENDPOINTS.billPay.doBillPay}`,
        JSON.stringify(params),
        headers
    );

    console.log('Bill Pay Response:', res.status);
    if (res.status !== 200) {
        console.error('Bill pay failed:', res.status, res.body, `User: ${loginData.phoneNumber}`);
    } else {
        console.log(`Bill pay transaction completed for user: ${loginData.phoneNumber}, Amount: ${params.amount}`);
    }

    return res;
}