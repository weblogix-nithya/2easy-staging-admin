import type { NextApiRequest, NextApiResponse } from "next";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { type, input, placeId, lat, lng } = req.query;

    let googleUrl = "";
    let options: RequestInit = {};

    if (type === "autocomplete") {
      googleUrl = `https://places.googleapis.com/v1/places:autocomplete?key=${GOOGLE_API_KEY}`;
      options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          languageCode: "en",
          regionCode: "AU",
          includedRegionCodes: ["AU"],
        }),
      };
    } else if (type === "details" && placeId) {
      googleUrl = `https://places.googleapis.com/v1/places/${placeId}?key=${GOOGLE_API_KEY}&fields=formattedAddress,location,addressComponents,displayName`;
    } else if (type === "timezone" && lat && lng) {
      googleUrl = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${Math.floor(
        Date.now() / 1000
      )}&key=${GOOGLE_API_KEY}`;
    } else {
      return res.status(400).json({ error: "Invalid request" });
    }

    const googleRes = await fetch(googleUrl, options);
    const data = await googleRes.json();
    return res.status(googleRes.status).json(data);
  } catch (err) {
    console.error("Google API Proxy Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
