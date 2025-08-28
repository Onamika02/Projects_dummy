// export const loadOptions = {
//   stages: [
//     { duration: '5m', target: 10 },
//     { duration: '10m', target: 10 },
//     { duration: '5m', target: 0 }
//   ]
//   // thresholds: {
//   //   http_req_duration: ['p(95)<2000'],
//   //   http_req_failed: ['rate<0.01']
//   // }
// };

export const loadOptions = {
  //iterations: 1,
  vus: 80,
  duration: "3600s",
};
