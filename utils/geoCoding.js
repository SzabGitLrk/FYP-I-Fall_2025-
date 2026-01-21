const axios = require("axios");

async function getCoordinates(address) {
  const url = "https://maps.googleapis.com/maps/api/geocode/json";

  const response = await axios.get(url, {
    params: {
      address,
      key: process.env.GOOGLE_MAPS_API_KEY
    }
  });

  // 🔍 VERY IMPORTANT LOGS
  console.log("GEOCODING ADDRESS:", address);
  console.log("GEOCODING STATUS:", response.data.status);
  console.log("GEOCODING ERROR:", response.data.error_message || "NONE");

  if (response.data.status !== "OK") {
    throw new Error(response.data.error_message || "Geocoding failed");
  }

  const location = response.data.results[0].geometry.location;

  return {
    lat: location.lat,
    lng: location.lng
  };
}

module.exports = { getCoordinates };


