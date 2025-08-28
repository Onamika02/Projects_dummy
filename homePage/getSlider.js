// import http from "k6/http";
// import { check, sleep } from "k6";
// import { login } from "../setUp/login.js";

// const accessToken = login();
// export function getSlider() {
//   const url = "https://api.p-pay.dev-polygontech.xyz/api/v1/user/slider/";

//   const headers = {
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${accessToken}`,
//   };

//   const res = http.get(url, { headers: headers });

//   check(res, {
//     "Get Slider Images successful": (r) => r.status === 200,
//   });

//   if (res.status === 200) {
//     const responseBody = JSON.parse(res.body);
//     const sliderImages = responseBody.data;
//   }
// }
