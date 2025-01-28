const { db } = require("./firebase");

const clientId = process.env.EVENTIX_CLIENT_ID;
const clientSecret = process.env.EVENTIX_CLIENT_SECRET;
const code = process.env.EVENTIX_CODE_KEY;
const companyId = process.env.EVENTIX_COMPANY_ID;

async function generateCouponCode(couponId, accessToken, generatedCode) {
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
                "Company": companyId, // Replace with your Company ID
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
}

async function generateAccessToken(params) {
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

    return responseData;
}

async function refreshAccessToken(refreshToken) {
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
}

function getCorsHeaders(origin) {
    return {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Headers': 'Content-Type, Accept, Origin, Authorization',
        'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    }
}

function validateToken(tokenData) {
    let tokenExpirationDate = tokenData.docs[0].expiryDate;
    let nowTimeStamp = new Date();

    if (tokenExpirationDate > nowTimeStamp) {
        return true;
    } else {
        return false;
    }
}

async function validateUserDiscountCode(currentUserEmail) {
    let currentUserData = await db.collection('users').where('emailAddress', '==', currentUserEmail).get();

    if (currentUserData && currentUserData.generatedCouponCode) {
        return false;
    } else if (currentUserData && !currentUserData.generatedCouponCode) {
        return true;
    }
}

async function checkUserInDb(currentUser) {
    let currentUserData = await db.collection('users').where('emailAddress', '==', currentUser.emailAddress).get();
    if (currentUserData) {
        return true;
    } else {
        let newUser = await db.collection('users').add({
            emailAddress: currentUser.emailAddress,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            generatedCouponCode: false
        })
        return false;
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
        let currentUserData = event.body;


        let users = await db.collection('users').get();
        let subscriptions = await db.collection('subscriptions').get();
        let eventixTokens = await db.collection('eventixTokens').get();

        if (currentUserData) {
            if (checkUserInDb(currentUserData)) {
                if (validateUserDiscountCode(currentUserData.emailAdress) && validateToken(eventixTokens)) {
                    //generate coupon code
                    generateCouponCode();
                    //update db users

                } else if (validateUserDiscountCode(currentUserData.emailAdress) && !validateToken(eventixTokens)) {
                    //refresh token
                    await refreshAccessToken().then(async () => {
                        await generateCouponCode().then(async () => {
                            //update db
                        });
                    });;
                } else if (!validateUserDiscountCode) {
                    //display alert - user already generated coupon code
                }
            }
        }

        return {
            statusCode: 200,
            headers: getCorsHeaders(event.headers.origin),
            body: JSON.stringify({
                data: data,
                test: 'TEST CONNECTION',
                subscriptions: subscriptions
            }),
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
