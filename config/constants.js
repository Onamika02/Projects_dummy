export const BASE_URL = 'https://api.p-pay.dev-polygontech.xyz';
// export const BASE_URL = 'http://p-pay-api-test:8080';
export const transactionCode = {
    sendMoneyCode: '5000001',
    addMoneyCode: '3210001',
    billPayCode: '1500001',
    fundTransferCode: '5000500',
    paymentCode: '8000001',
    topUpCode: '9000009',
    requestMoneyCode: '5000001'
};

export const API_ENDPOINTS = {
  login: '/api/user/login',
  balance: '/api/v1/account/balance',
  slider: '/api/v1/user/slider/',
  userSettings: '/api/v1/user/settings',

  sendMoney: {
    recentContacts: '/api/v1/send/money/contacts',
    savedTransactions: '/api/v1/save-transaction/send-money',
    chargeWithAmount: '/api/v1/transaction-type/charge-with-amount',
    shootOtp: '/api/user/send-otp',
    doSendMoney: '/api/v1/send/money/p-pay'
  },

  requestMoney: {
    recentContacts: '/api/v1/request/money/contacts',
    requestMoney: '/api/v1/request/money/',
    requestedMoneyList: '/api/v1/request/money/requests',
  },

  topUp: {
    recentContacts: '/api/v1/user/topup/contacts',
    operatorList: '/api/v1/user/topup/operators',
    shootOtp: '/api/user/send-otp',
    doRecharge: '/api/v1/user/topup/do-recharge',
    saveTransactionList: '/api/v1/save-transaction/topup'
  },

  addMoney: {
    savedTransactions: '/api/v1/save-transaction/add-money',
    chargeWithAmount: '/api/v1/transaction-type/charge-with-amount',
    doAddMoneyCity: '/api/v1/money/add',
    doAddMoneyAlArafah: '/api/v1/money/add/al-arafah'
  },

  fundTransfer: {
    savedTransactions: '/api/v1/save-transaction/fund-transfer',
    doFundTransfer: '/api/v1/money/fund/transfer',
  },
  makePayment: {
    recentContacts: '/api/v1/user/payment/contacts',
    chargeWithAmount: '/api/v1/transaction-type/charge-with-amount',
    shootOtp: '/api/user/send-otp',
    payment: '/api/v1/payment'
  },

  billPay: {
    savedTransactions: '/api/v1/save-transaction/pay-utility-bill',
    shootOtp: '/api/user/send-otp',
    doBillPay: '/api/v1/utility/pay-utility-bill',
    billerCategoriesList: '/api/v1/utility/biller-categories'
  }
};