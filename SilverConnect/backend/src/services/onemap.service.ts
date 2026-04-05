// backend/services/onemap.service.ts
import axios from "axios";

let oneMapToken: string | null = null;

/**
 * Request new token from OneMap
 */
export async function refreshOneMapToken() {
  try {
    console.log(" Using OneMap email:", process.env.ONEMAP_EMAIL || " MISSING");
    const res = await axios.post(
      "https://www.onemap.gov.sg/api/auth/post/getToken",
      {
        email: process.env.ONEMAP_EMAIL,
        password: process.env.ONEMAP_PASSWORD
      }
    );
    oneMapToken = res.data.access_token;
    console.log(" OneMap token refreshed");
    } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
        console.error(" Failed to refresh OneMap token:", err.response?.data || err.message);
    } else {
        console.error("Failed to refresh OneMap token:", err);
    }
    }
}

/**
 * Function to get walking route from OneMap
 */
export async function getWalkingRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
) {
  if (!oneMapToken) {
    console.log("Token missing — refreshing now...");
    await refreshOneMapToken();
  }

  const url =
    `https://www.onemap.gov.sg/api/public/routingsvc/route?` +
    `start=${startLat},${startLng}&end=${endLat},${endLng}` +
    `&routeType=walk&token=${oneMapToken}`;

  console.log("Calling OneMap with token:", oneMapToken?.slice(0, 10), "...");

  const res = await axios.get(url);

  // If token expired, refresh and retry
  if (res.data?.status_message === "Unauthorized") {
    console.log("OneMap token expired — refreshing and retrying...");
    await refreshOneMapToken();
    return getWalkingRoute(startLat, startLng, endLat, endLng);
  }

  return res.data;
}



// Refresh token at startup
refreshOneMapToken();
// Refresh every 23 hours (token valid for 24h)
setInterval(refreshOneMapToken, 23 * 60 * 60 * 1000);
