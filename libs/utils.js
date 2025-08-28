import http from 'k6/http';
import { check } from 'k6';

export function makeRequest(method, url, payload = null, headers = {}) {
  const response = method === 'GET' 
    ? http.get(url, { headers })
    : http.post(url, payload, { headers });

  checkResponse(response);
  return response;
}

export function checkResponse(response, additionalChecks = {}) {
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });
}