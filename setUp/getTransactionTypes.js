import http from "k6/http";
import { check, sleep } from "k6";
import { adminAccessToken } from "./adminLogin.js";

export function getAllTransactionType() {
  const url = "https://api.p-pay.dev-polygontech.xyz/api/v1/transaction-type";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminAccessToken}`,
  };

  const res = http.get(url, { headers: headers });

  check(res, {
    "Get all Transaction types successfully": (r) => r.status === 200,
  });

  if (res.status === 200) {
    const responseBody = JSON.parse(res.body);
  }
}
