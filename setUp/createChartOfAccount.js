import http from "k6/http";
import { check, sleep } from "k6";
import { adminAccessToken } from "./adminLogin.js";

const chartOfAccountPayloads = [
  {
    name: "Sys-Bank",
    description: "Description for Sys-Bank",
    transactionType: "SYSTEM",
    headType: "LIABILITY",
    code: "sys-bank-022",
    onlyParent: true,
    dailyLimit: {
      count: 55,
      amount: 35,
    },
    monthlyLimit: {
      count: 4554,
      amount: 543434,
    },
    weeklyLimit: {
      count: 5,
      amount: 76,
    },
    minWalletAmount: 600,
    maxWalletAmount: 1200
  },
  {
    name: "City Bank TCS",
    description: "Description for City Bank TCS",
    transactionType: "MEMBER",
    headType: "LIABILITY",
    code: "city-bank-tcs-021",
    onlyParent: false,
    dailyLimit: {
      count: 55,
      amount: 35,
    },
    monthlyLimit: {
      count: 4554,
      amount: 543434,
    },
    weeklyLimit: {
      count: 5,
      amount: 76,
    },
    minWalletAmount: 600,
    maxWalletAmount: 1200
  },
  {
    name: "TCS",
    description: "Description for TCS",
    transactionType: "SYSTEM",
    headType: "ASSET",
    code: "tcs-011",
    onlyParent: false
  },
  {
    name: "E WALLET",
    description: "Description for E WALLET",
    transactionType: "SYSTEM",
    headType: "LIABILITY",
    code: "ewallet-011",
    onlyParent: true
  },
  {
    name: "Customer",
    description: "Description for Customer",
    transactionType: "MEMBER",
    headType: "LIABILITY",
    code: "customer-011",
    onlyParent: false,
    dailyLimitCount: 1000000,
    dailyLimitAmount: 10000,
    monthlyLimitAmount: 5000000,
    monthlyLimitCount: 50000,
    weeklyLimitAmount: 2500000,
    weeklyLimitCount: 20000,
    minWalletAmount: 10,
    maxWalletAmount: 100000000,
  },
  {
    name: "Merchant",
    description: "Description for Merchant",
    transactionType: "MEMBER",
    headType: "LIABILITY",
    code: "merchant-011",
    onlyParent: false,
    dailyLimitCount: 1000000,
    dailyLimitAmount: 10000,
    monthlyLimitAmount: 5000000,
    monthlyLimitCount: 50000,
    weeklyLimitAmount: 2500000,
    weeklyLimitCount: 20000,
    minWalletAmount: 10,
    maxWalletAmount: 100000000,
  },
  {
    name: "Sys-Charge",
    description: "Description for Sys-Charge",
    transactionType: "SYSTEM",
    headType: "INCOME",
    code: "sys-charge-011",
    onlyParent: false
  },
  {
    name: "Govt. Vat",
    description: "Description for govt. vat",
    transactionType: "SYSTEM",
    headType: "LIABILITY",
    code: "govt-vat-011",
    onlyParent: true
  },
  {
    name: "Sys-Expense",
    description: "Description for Sys-Commission",
    transactionType: "SYSTEM",
    headType: "EXPENSE",
    code: "sys-ex-011",
    onlyParent: true
  },
  {
    name: "Top Up Providers",
    description: "Description for Top Up Providers",
    transactionType: "SYSTEM",
    headType: "LIABILITY",
    code: "top-up-providers-011",
    onlyParent: false,
    dailyLimitCount: 1000000,
    dailyLimitAmount: 10000,
    monthlyLimitAmount: 5000000,
    monthlyLimitCount: 500000,
    weeklyLimitAmount: 2500000,
    weeklyLimitCount: 200000,
    minWalletAmount: 10,
    maxWalletAmount: 1000000000,
  },
  {
    name: "MFS Providers",
    description: "Description for MFS Providers",
    transactionType: "SYSTEM",
    headType: "LIABILITY",
    code: "mfs-provider-011",
    onlyParent: false
  },
  {
    name: "Utility Providers",
    description: "Description for Utility Providers",
    transactionType: "SYSTEM",
    headType: "LIABILITY",
    code: "utility-sys-providers-011",
    onlyParent: false
  },
];

export function createChartOfAccount() {

    const payloadIndex = (__VU - 1) * 12 + __ITER;
    const payload = chartOfAccountPayloads[payloadIndex % chartOfAccountPayloads.length];
  
    const url = "https://api.p-pay.dev-polygontech.xyz/api/v1/chart-of-account";
  
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminAccessToken}`,
    };
  
    const response = http.post(url, JSON.stringify(payload), {
      headers: headers,
    });
  
    check(response, {
      "status is 201": (r) => r.status === 201,
      "transaction time < 1000ms": (r) => r.timings.duration < 1000,
    });
  
    console.log(`Iteration ${__ITER}: Response status: ${response.status}`);
    console.log(`Iteration ${__ITER}: Chart of Account Name: ${payload.name}`);
    console.log(`Iteration ${__ITER}: Chart of Account Code: ${payload.code}`);
  
    sleep(1);
  }
