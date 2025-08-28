import http from "k6/http";
import { check } from "k6";

export let adminAccessToken = null;

export function adminLogin() {
    const url = "https://api.p-pay.dev-polygontech.xyz/api/v1/admin-user/guest/login";
    const payload = JSON.stringify({ 
        email: "admin@ppay.com", 
        password: "PpayAdmin#1" 
    });

    const headers = {
        'Content-Type': 'application/json',
        'x-client-platform': `admin-web`
    };

    const res = http.post(url, payload, { headers: headers });

    check(res, {
      "Admin Login successful": (r) => r.status === 200,
    });

    adminAccessToken = res.json("accessToken");
}