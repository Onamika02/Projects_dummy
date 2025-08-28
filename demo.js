import { loadOptions } from './config/options.js';
import { homePageScenario } from './scenarios/home.js';
import { login } from "./setUp/login.js";
import { sendMoneyScenario } from './scenarios/sendMoney.js';
import { requestMoneyScenario } from './scenarios/requestMoney.js';
import { topUpScenario } from './scenarios/topup.js';
import { addMoneyScenario } from './scenarios/addMoney.js';
import { makePaymentScenario } from './scenarios/makePayment.js';
import { billPayScenario } from './scenarios/billPay.js';
import { fundTransferScenario } from './scenarios/fundTransfer.js';
import { sleep } from 'k6';

export let options = loadOptions;

export default function () {

  const loginData = login();
  homePageScenario(loginData);

  addMoneyScenario(loginData);
  sleep(15);

  sendMoneyScenario(loginData);
  fundTransferScenario(loginData);

  billPayScenario(loginData);
  makePaymentScenario(loginData);
  topUpScenario(loginData);
  requestMoneyScenario(loginData);



}