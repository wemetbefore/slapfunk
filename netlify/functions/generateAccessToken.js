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
    const clientId = process.env.EVENTIX_CLIENT_ID;
    const clientSecret = process.env.EVENTIX_CLIENT_SECRET;
    const code = process.env.EVENTIX_CODE_KEY;
    

    // Your function logic here
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: getCorsHeaders(event.headers.origin)
        };
    }

    try {   
        // Prepare payload
        const options = {
            "method": "POST",
            "headers": {
                "Content-Type": "application/json",
            },
            "body": JSON.stringify({
                grant_type: "authorization_code",
                client_id: clientId, // Use environment variables for sensitive data
                client_secret: clientSecret,
                redirect_uri: "https://www.google.nl/", // Replace with your actual redirect URI
                code: code
            })
        };

        // Make the API request
        const response = await fetch("https://auth.openticket.tech/tokens", options);
        // Parse the API response
        const responseData = await response.json();

        return {
            statusCode: 200,
            headers: getCorsHeaders(event.headers.origin),
            body: JSON.stringify({
                responseData: responseData
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
