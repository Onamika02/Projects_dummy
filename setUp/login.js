import https from "k6/http";
import { check } from "k6";
import { SharedArray } from "k6/data";
import papaparse from "https://cdn.jsdelivr.net/npm/papaparse@5.3.0/papaparse.min.js";
import { BASE_URL, API_ENDPOINTS } from '../config/constants.js';

const HEADERS = {
  "Content-Type": "application/json",
  "Accept": "application/json"
};

const users = new SharedArray('users', () => {
  const csvFile = open("../data/login_credentials.csv", "utf8");
  const parsed = papaparse.parse(csvFile, { header: true }).data;

  return parsed.filter(u => u.phoneNumber && u.pin);
});

export function login() {
  const userIndex = (__VU - 1) % users.length;
  const { phoneNumber, pin } = users[userIndex];

  const payload = JSON.stringify({ phoneNumber, pin });

  const response = https.post(
    `${BASE_URL}${API_ENDPOINTS.login}`,
    payload,
    { headers: HEADERS }
  );

  let jsonBody;
  try {
    jsonBody = response.json();
  } catch (e) {
    console.error(`JSON parse failed. Response body:\n${response.body}`);
    return null;
  }

  const isSuccess = check(response, {
    "Login successful": (r) => r.status === 200,
    "Response has token": (r) => jsonBody?.token?.accessToken !== undefined
  });

  if (!isSuccess) {
    console.error(`Login failed with status ${response.status}: ${response.body}`);
    return null;
  }

  return {
    token: jsonBody.token.accessToken,
    phoneNumber: phoneNumber 
  };
}