import axios from "axios";

const WEBHOOK_URL = "https://webhook.site/709cc290-16db-4b98-9503-0357da4af4ee"; // Replace with your webhook.site URL
const ABDM_BASE_URL = "https://dev.abdm.gov.in/gateway";
const AUTH_URL = `${ABDM_BASE_URL}/v0.5/sessions`;

let accessToken = null;
let tokenExpiration = null;

const getAccessToken = async () => {
  if (!accessToken || Date.now() >= tokenExpiration) {
    try {
      const response = await axios.post(WEBHOOK_URL, {
        url: AUTH_URL,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          clientId: process.env.ABDM_CLIENT_ID,
          clientSecret: process.env.ABDM_CLIENT_SECRET,
        },
      });
      const abdmResponse = JSON.parse(response.data.content);
      accessToken = abdmResponse.accessToken;
      console.log("Access token:", accessToken);
      tokenExpiration = Date.now() + abdmResponse.expiresIn * 1000;
    } catch (error) {
      console.error("Error getting access token:", error);
      throw error;
    }
  }
  return accessToken;
};

const makeABDMRequest = async (method, endpoint, data = null) => {
  const token = await getAccessToken();
  try {
    const response = await axios.post(WEBHOOK_URL, {
      url: `${ABDM_BASE_URL}${endpoint}`,
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: data,
    });
    return JSON.parse(response.data.content);
  } catch (error) {
    console.error(`Error making ABDM request to ${endpoint}:`, error);
    throw error;
  }
};

export const generateAadhaarOTP = async (aadhaar) => {
  return makeABDMRequest("POST", "/v1/registration/aadhaar/generateOtp", {
    aadhaar,
  });
};

export const verifyAadhaarOTP = async (txnId, otp) => {
  return makeABDMRequest("POST", "/v1/registration/aadhaar/verifyOTP", {
    txnId,
    otp,
  });
};

export const createHealthId = async (txnId, healthId) => {
  return makeABDMRequest("POST", "/v1/registration/aadhaar/createHealthId", {
    txnId,
    healthId,
  });
};

export const updateHealthRepositoryURL = async (newURL) => {
  return makeABDMRequest("PATCH", "/devservice/v1/bridges", { url: newURL });
};
