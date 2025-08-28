// import http from "k6/http";
// import { check, sleep } from "k6";
// import { login } from "../setUp/login.js";

// const accessToken = login();
// export function getChargeWithAmountSendMoney() {
//   const url =
//     "https://api.p-pay.dev-polygontech.xyz/api/v1/transaction-type/charge-with-amount?code=1002&amount=100";

//   const headers = {
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${accessToken}`,
    
//   };
//     console.log("qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",accessToken);

//   const res = http.get(url, { headers: headers });

//   check(res, {
//     "Get Charges with amount send money successfully": (r) => r.status === 200,
//   });

//   if (res.status === 200) {
//     const responseBody = JSON.parse(res.body);
//   }
// }
