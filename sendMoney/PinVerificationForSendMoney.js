// import https from "k6/http";
// import { check, sleep } from "k6";
// import { login } from "../setUp/login.js";

// const accessToken = login();
// export let pinToken = null;

// export function verifyPinTokenSendMoney() {
//   let pin = "123458";
//   let trxnCode = "1002";

//   let headers = {
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${accessToken}`,
//   };

//   let url1 = "https://api.p-pay.dev-polygontech.xyz/api/auth/verify-pin";
//   let payload = JSON.stringify({ pin: pin, trxnCode: trxnCode });
//   let res1 = https.post(url1, payload, { headers: headers });

//   check(res1, {
//     "Verify Pin Token successful": (r) => r.status === 200,
//   });

//   if (res1.status === 200) {
//     const responseBody = res1.json();
//     pinToken = responseBody.token;

//     return pinToken;
//   }
// }
