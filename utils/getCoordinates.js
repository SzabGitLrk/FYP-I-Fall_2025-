const axios = require("axios");

const getCoordinates = async (address) => {
    const apiKey = process.env.LOCATIONIQ_API_KEY;
    
    // us1.locationiq.com is the standard endpoint
    // countrycodes=pk restricts searches to Pakistan only
    const url = `https://us1.locationiq.com/v1/search.php`;

    try {
        const response = await axios.get(url, {
            params: {
                key: apiKey,
                q: address,
                format: 'json',
                limit: 1,
                countrycodes: 'pk' // 🇵🇰 Very important for accuracy in Pakistan
            }
        });

        // LocationIQ returns an array of objects
        if (response.data && response.data.length > 0) {
            const result = response.data[0];
            return {
                latitude: parseFloat(result.lat),
                longitude: parseFloat(result.lon)
            };
        }

        console.warn("⚠️ LocationIQ couldn't find:", address);
        return { latitude: 24.8607, longitude: 67.0011 }; // Karachi Fallback

    } catch (error) {
        // If the API returns a 404 (Not Found), it throws an error in Axios
        if (error.response && error.response.status === 404) {
            console.warn("⚠️ Address not found in Pakistan:", address);
        } else {
            console.error("LocationIQ API Error:", error.message);
        }
        
        return { latitude: 24.8607, longitude: 67.0011 }; // Return fallback to prevent crash
    }
};

module.exports = getCoordinates;