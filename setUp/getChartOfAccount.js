import http from "k6/http";
import { check, sleep } from "k6";
import { adminAccessToken } from "./adminLogin.js";

export let coaIDs ={
  SysBank: null,
  CityBankTCS: null,
  TCS: null,
  EWallet: null,
  Customer: null,
  Merchant: null,
  SysCharge: null,
  GovtVat: null,
  SysExpense: null,
  TopUpProviders: null,
  MFSProviders: null,
  UtilityProviders: null
};

export let coaID = null;

export function getChartOfAccount() {
  const url = "https://api.p-pay.dev-polygontech.xyz/api/v1/chart-of-account";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminAccessToken}`,
  };

  const res = http.get(url, { headers: headers });

  check(res, {
    "Get Chart Of Account Successful": (r) => r.status === 200,
  });

  if (res.status === 200) {
    const responseBody = JSON.parse(res.body);

    const accountMappings = {
      "sys-bank-022": "SysBank",
      "city-bank-tcs-021": "CityBankTCS",
      "tcs-011": "TCS",
      "ewallet-011": "EWallet",
      "customer-011": "Customer",
      "merchant-011": "Merchant",
      "sys-charge-011": "SysCharge",
      "govt-vat-011": "GovtVat",
      "sys-ex-011": "SysExpense",
      "top-up-providers-011": "TopUpProviders",
      "mfs-provider-011": "MFSProviders",
      "utility-sys-providers-011": "UtilityProviders",
    };

    for (const [code, prop] of Object.entries(accountMappings)) {
      const account = responseBody.chartofaccounts.find(acc => acc.code === code);
      if (account) {
        coaIDs[prop] = account.id;
      } else {
        console.log(`Warning: Chart of Account with code ${code} not found`);
      }
    }

    coaID = coaIDs.Customer;
  }

  return coaIDs; 
}


