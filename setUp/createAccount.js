import http from "k6/http";
import { check } from "k6";
import { coaID } from "./getChartOfAccount.js";
import { adminAccessToken } from "./adminLogin.js";
import papaparse from "https://cdn.jsdelivr.net/npm/papaparse@5.3.0/papaparse.min.js";

const csvFile = open("../data/identifiers.csv", "utf8");
const parsedData = papaparse.parse(csvFile, {
  header: true,
  skipEmptyLines: true,
}).data;
export function createAccount() {
  if (parsedData.length === 0) {
    console.error("CSV file is empty or incorrectly formatted.");
    return;
  }

  const rowIndex = (__VU - 1 + __ITER) % parsedData.length;

  console.log(`Row ${rowIndex} data:`, JSON.stringify(parsedData[rowIndex]));

  if (!parsedData[rowIndex] || !parsedData[rowIndex].identifier) {
    console.error(
      `Missing identifier at row ${rowIndex}. Row data: ${JSON.stringify(
        parsedData[rowIndex]
      )}`
    );
    return;
  }

  const identifier = parsedData[rowIndex].identifier.trim();
  if (!identifier) {
    console.error(`Empty identifier at row ${rowIndex}`);
    return;
  }

  const url = "https://api.p-pay.dev-polygontech.xyz/api/v1/account";

  const payload = JSON.stringify({
    accountName: "Imtiaz Munshi",
    identifier: identifier,
    chartOfAccountId: coaID,
    status: "LIMITED_ACTIVE",
  });

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminAccessToken}`,
  };

  const res = http.post(url, payload, { headers: headers });

  const success = check(res, {
    "Account Created Successfully": (r) => r.status === 200,
    "Transaction time < 1000ms": (r) => r.timings.duration < 1000,
  });

  if (!success) {
    console.error(
      `Request failed for identifier: ${identifier}, Response: ${res.body}`
    );
  }
}
