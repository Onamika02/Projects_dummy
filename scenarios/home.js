import { BASE_URL, API_ENDPOINTS } from '../config/constants.js';
import { makeRequest } from '../libs/utils.js';
import { group } from 'k6';


export function homePageScenario(token) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  group('Home Page', () => {
    makeRequest('GET', `${BASE_URL}${API_ENDPOINTS.balance}`, null, headers);
    makeRequest('GET', `${BASE_URL}${API_ENDPOINTS.slider}`, null, headers);
    makeRequest('GET', `${BASE_URL}${API_ENDPOINTS.userSettings}`, null, headers);
  });
}