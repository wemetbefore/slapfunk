const { db } = require("./firebase");

const clientId = process.env.EVENTIX_CLIENT_ID;
const clientSecret = process.env.EVENTIX_CLIENT_SECRET;
const code = process.env.EVENTIX_CODE_KEY;
const companyId = process.env.EVENTIX_COMPANY_ID;

async function generateCouponCode(couponId, eventixToken, generatedCode, event) {
    try {
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: getCorsHeaders(event.headers.origin)
            };
        }
        // Prepare the request options
        const url = `https://api.eventix.io/coupon/${couponId}/codes`;
        const options = {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${eventixToken.docs[0].accessToken}`,
                "Company": companyId,
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

async function generateAccessToken() {
    try {
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
    catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
}

async function refreshAccessToken(refreshToken) {
    try {
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
        //update db token
        return true
    }
    catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }


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

async function validateToken(tokenData) {
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

    if (currentUserData.docs.length && currentUserData.docs[0].generatedCouponCode) {
        return false;
    } else if (currentUserData.docs.length && !currentUserData.docs[0].generatedCouponCode) {
        return true;
    }
}

async function checkUserInDb(currentUser) {
    let currentUserData = await db.collection('users').where('emailAddress', '==', currentUser.email).get();
    if (currentUserData.docs.length) {
        return true;
    } else {
        let newUser = await db.collection('users').add({
            emailAddress: currentUser.email,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            generatedCouponCode: false
        })
        return false;
    }
}

function generateCode(subscriptionName) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "SF-" + subscriptionName.toUpperCase() + '-';

    for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters[randomIndex];
    }
    return code;
}
exports.handler = async (event) => {
    try {
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: getCorsHeaders(event.headers.origin)
            };
        }
        let eventixTokens = await db.collection('eventixTokens').get();
        let users = await db.collection('users').get();
        let subscriptions = await db.collection('subscriptions').get();

        let currentUserData = JSON.parse(event.body);
        let currentUserSubscription = await db.collection('subscriptions').where('subscriptionName', '==', currentUserData.payload.subscriptionName).get();

        let checkUserInDB = await checkUserInDb(currentUserData.payload);
        let tokenIsValid = await validateToken(eventixTokens);
        let validUserToGenerateCode = await validateUserDiscountCode(currentUserData.payload.email);
        let subId = currentUserSubscription.docs[0].subscriptionId;
        let accessTokenId = eventixTokens.docs[0].accessToken;
        let params = {
            subName: subId,
            eventixToken: accessTokenId
        };
        // let response = generateCouponCode(currentUserSubscription.docs[0].subscriptionId, eventixTokens, generatedCouponCode, event);

        // if (currentUserData.payload) {
        //     if (validUserToGenerateCode && tokenIsValid) {
        //         //generate coupon code
        //         let generatedCouponCode = generateCode(currentUserSubscription.subscriptionName)

        //         generateCouponCode(currentUserSubscription.subscriptionId, eventixTokens, generatedCouponCode);
        //         //update db users

        //     } else if (validUserToGenerateCode && !tokenIsValid) {
        //         //refresh token
        //         await refreshAccessToken(eventixTokens).then(async () => {
        //             let generatedCouponCode = generateCode(currentUserSubscription.subscriptionName)
        //             await generateCouponCode(currentUserSubscription.subscriptionId, eventixTokens, generatedCouponCode).then(async () => {
        //                 //update db
        //             });
        //         });;
        //     } else if (!validUserToGenerateCode) {
        //         //display alert - user already generated coupon code
        //         throw new Error("You've already generated a coupon code!");

        //     }
        // }

        return {
            statusCode: 200,
            headers: getCorsHeaders(event.headers.origin),
            body: JSON.stringify({
                params: params
            }),
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
