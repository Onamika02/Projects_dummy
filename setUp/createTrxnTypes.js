import http from "k6/http";
import { check, sleep } from "k6";
import { adminAccessToken } from "./adminLogin.js";

const trxnTYpePayloads = [
  {
    transactionCode: "1000",
    name: "Add Money Bank to E Wallet",
    description: "Money Bank to E Wallet",
    min: 10,
    max: 25000,
    fromCoa: 14,
    toCoa: 16,
    dailyLimit: {
      count: 2000,
      amount: 5000000000,
    },
    monthlyLimit: {
      count: 20000,
      amount: 5000000000000,
    },
    weeklyLimit: {
      count: 2000,
      amount: 500000000000000,
    },
  },
  {
    transactionCode: "1002",
    name: "Send Money",
    description: "Send money between customers",
    min: 10,
    max: 25000,
    fromCoa: 17,
    toCoa: 17,
    dailyLimit: {
      count: 20,
      amount: 30,
    },
    monthlyLimit: {
      count: 20,
      amount: 300,
    },
    weeklyLimit: {
      count: 100,
      amount: 5000,
    },
  },
  {
    transactionCode: "2001",
    name: "Send Money Charge",
    description: "Send money charge",
    min: null,
    max: null,
    fromCoa: 17,
    toCoa: 19,
    dailyLimit: {
      count: 20,
      amount: 30,
    },
    monthlyLimit: {
      count: 20,
      amount: 300,
    },
    weeklyLimit: {
      count: 100,
      amount: 5000,
    },
  },
  {
    transactionCode: "2000",
    name: "Send E Money",
    description: "Send e-money",
    min: null,
    max: null,
    fromCoa: 13,
    toCoa: 17,
    dailyLimit: {
      count: 20,
      amount: 30,
    },
    monthlyLimit: {
      count: 20,
      amount: 300,
    },
    weeklyLimit: {
      count: 100,
      amount: 5000,
    },
  },
  {
    transactionCode: "3001",
    name: "Send Money Govt VAT",
    description: "Send money govt vat",
    min: null,
    max: null,
    fromCoa: 21,
    toCoa: 20,
    dailyLimit: {
      count: 20,
      amount: 30,
    },
    monthlyLimit: {
      count: 20,
      amount: 300,
    },
    weeklyLimit: {
      count: 100,
      amount: 5000,
    },
  },
  {
    transactionCode: "1005",
    name: "Top Up",
    description: "Top-up wallet balance",
    min: 10,
    max: 1000,
    fromCoa: 17,
    toCoa: 22,
    dailyLimit: {
      count: 10,
      amount: 200,
    },
    monthlyLimit: {
      count: 20,
      amount: 300,
    },
    weeklyLimit: {
      count: 15,
      amount: 250,
    },
  },
  {
    transactionCode: "1004",
    name: "Bill Pay",
    description: "Pay bills",
    min: 10,
    max: 5000,
    fromCoa: 17,
    toCoa: 24,
    dailyLimit: {
      count: 20,
      amount: 3000,
    },
    monthlyLimit: {
      count: 30,
      amount: 5000,
    },
    weeklyLimit: {
      count: 40,
      amount: 4000,
    },
  },
  {
    transactionCode: "2002",
    name: "Cash Out charge",
    description: "cash out charge",
    min: null,
    max: null,
    fromCoa: 17,
    toCoa: 19,
    dailyLimit: {
      count: 20,
      amount: 30,
    },
    monthlyLimit: {
      count: 60,
      amount: 400,
    },
    weeklyLimit: {
      count: 100,
      amount: 5000,
    },
  },
  {
    transactionCode: "1001",
    name: "Add Money",
    description: "Add money",
    min: 10,
    max: 30000,
    fromCoa: 16,
    toCoa: 17,
    dailyLimit: {
      count: 20,
      amount: 50,
    },
    monthlyLimit: {
      count: 60,
      amount: 400,
    },
    weeklyLimit: {
      count: 100,
      amount: 5000,
    },
  },
  {
    transactionCode: "1003",
    name: "Fund Transfer",
    description: "Fund Transfer",
    min: 5,
    max: 20000,
    fromCoa: 17,
    toCoa: 14,
    dailyLimit: {
      count: 20,
      amount: 50,
    },
    monthlyLimit: {
      count: 600,
      amount: 4000,
    },
    weeklyLimit: {
      count: 100,
      amount: 5000,
    },
  },
  {
    name: "Make Payment",
    description: "Make Payment",
    fromCoa: 17,
    toCoa: 18,
    transactionCode: "make-payment-001",
    dailyLimit: {
      count: 20,
      amount: 200,
    },
    monthlyLimit: {
      count: 60,
      amount: 400,
    },
    weeklyLimit: {
      count: 50,
      amount: 300,
    },
    min: 50,
    max: 50000,
  },
  {
    name: "bulk-disbursement",
    description:
      "This is a description for the Transaction Type bulk disbursement.",
    fromCoa: 18,
    toCoa: 17,
    transactionCode: "bulk-disbursement-01",
    dailyLimit: {
      count: null,
      amount: null,
    },
    monthlyLimit: {
      count: null,
      amount: null,
    },
    weeklyLimit: {
      count: null,
      amount: null,
    },
    min: 10,
    max: 564654,
  },
];

export function createTrxnType() {
  const payloadIndex = (__VU - 1) * 12 + __ITER;
  const payload = trxnTYpePayloads[payloadIndex % trxnTYpePayloads.length];


  const url = "https://api.p-pay.dev-polygontech.xyz/api/v1/transaction-type";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminAccessToken}`,
  };

  const response = http.post(url, JSON.stringify(payload), {
    headers: headers,
  });


  console.log("RESPONSE::",response.body);

  check(response, {
    "status is 201": (r) => r.status === 201,
    "transaction time < 1000ms": (r) => r.timings.duration < 1000,
  });

  console.log(`Iteration ${__ITER}: Response status: ${response.status}`);
  console.log(`Iteration ${__ITER}: Transaction Type Name: ${payload.name}`);
  console.log(`Iteration ${__ITER}: Transaction Type Code: ${payload.transactionCode}`);

  sleep(1);
}
