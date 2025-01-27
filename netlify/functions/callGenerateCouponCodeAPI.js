function getCorsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, PUT',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
  }
}

exports.handler = async (event) => {
 if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers.origin)
    };
  }
  try {
        // Parse the request body
        const { generatedCode, accessTokenValue, couponId } = JSON.parse(event.body);
        if (!generatedCode || accessTokenValue || !couponId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing required parameters" }),
            };
        }

        // Prepare the request options
        const url = `https://api.eventix.io/coupon/${couponId}/codes`;
        const options = {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessTokenValue}`,
                "Company": process.env.EVENTIX_COMPANY_ID, // Replace with your Company ID
            },
            body: JSON.stringify({
                codes: [
                    {
                        code: generatedCode,
                        applies_to_count: 1,
                    },
                ],
                applies_to_count: 1,
            }),
        };

        // Make the API call
        const response = await fetch(url, options);
        // Parse the response data
        const data = await response.json();

        // Return the generated coupon code data
        return {
            statusCode: 200,
            headers: getCorsHeaders(event.headers.origin),
            body: JSON.stringify(data),
        };
    } catch (error) {
        // Handle unexpected errors
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};

