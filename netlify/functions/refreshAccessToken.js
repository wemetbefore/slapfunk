function getCorsHeaders(origin) {
    return {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Headers': 'Content-Type, Accept, Origin',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    }
}
exports.handler = async (event) => {
    try {
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: getCorsHeaders(event.headers.origin)
            };
        }

        const { refreshToken } = JSON.parse(event.body);
        if (!refreshToken) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing required parameters" }),
            };
        }
        // Prepare the payload
        const options = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: process.env.EVENTIX_CLIENT_ID, // Use environment variables
                client_secret: process.env.EVENTIX_CLIENT_SECRET,
                refresh_token: refreshToken,
                grant_type: "refresh_token"
            })
        };

        // Make the API request
        const response = await fetch("https://auth.openticket.tech/tokens", options);
        // Parse the API response
        const data = await response.json();

        // Return the new tokens
        return {
            statusCode: 200,
            headers: getCorsHeaders(event.headers.origin),
            body: JSON.stringify({
                accessToken: data.access_token,
                expiresAt: Date.now() + data.expires_in * 1000,
                refreshToken: data.refresh_token || refreshToken, // Fallback to the old refresh token if not provided
            })
        };

    } catch (error) {
        // Handle any unexpected errors
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
