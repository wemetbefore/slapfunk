const { db } = require("./firebase");

const clientId = process.env.EVENTIX_CLIENT_ID;
const clientSecret = process.env.EVENTIX_CLIENT_SECRET;
const code = process.env.EVENTIX_CODE_KEY;
const companyId = process.env.EVENTIX_COMPANY_ID;

async function generateCouponCode(couponId, eventixToken, generatedCode) {
    try {
        let accessTokenId = eventixToken[0].accessToken;

        // Prepare the request options
        const url = `https://api.eventix.io/coupon/${couponId}/codes`;
        const options = {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessTokenId}`,
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
                client_id: clientId, // Use environment variables
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: "refresh_token"
            })
        };

        // Make the API request
        const response = await fetch("https://auth.openticket.tech/tokens", options);
        // Parse the API response
        const data = await response.json();
        //update db token
        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
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
    let tokenExpirationDate = tokenData[0].expiryDate._seconds;
    let nowTimeStamp = Date.now() * 1000;

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
    let currentUserDataSnapshot = await db.collection('users').where('emailAddress', '==', currentUser.email).get();
    let currentUserData = currentUserDataSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    if (currentUserData.length) {
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
        let eventixTokensSnapshot = await db.collection('eventixTokens').get();
        let eventixTokens = eventixTokensSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        let usersSnapshot = await db.collection('users').get();
        let users = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        let subscriptionsSnapshot = await db.collection('subscriptions').get();
        let subscriptions = subscriptionsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        let currentUserData = JSON.parse(event.body);

        let currentUserSubscriptionSnapshot = await db.collection('subscriptions').where('subscriptionName', '==', currentUserData.payload.subscriptionName).get();
        let currentUserSubscription = currentUserSubscriptionSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        let checkUserInDB = await checkUserInDb(currentUserData.payload);
        let tokenIsValid = await validateToken(eventixTokens);
        let validUserToGenerateCode = await validateUserDiscountCode(currentUserData.payload.email);
        let currentUserSubscriptionId = currentUserSubscription[0].subscriptionId;
        let currentUserSubscriptionName = currentUserSubscription[0].subscriptionName;
        let refreshToken = eventixTokens[0].refreshToken;

        return {
            statusCode: 200,
            headers: getCorsHeaders(event.headers.origin),
            body: JSON.stringify({
                nowMilliseconds: Date.now(),
                expiryDateTokenSeconds: eventixTokens[0].expiryDate._seconds,
                expiryDateTokenNanoSeconds: eventixTokens[0].expiryDate._nanoseconds,
                // response: response
            }),
        }


        // if (currentUserData.payload) {
        //     if (validUserToGenerateCode && tokenIsValid) {
        //         let generatedCouponCode = generateCode(currentUserSubscriptionName)
        //         let response = generateCouponCode(currentUserSubscriptionId, eventixTokens, generatedCouponCode);
        //         return {
        //             statusCode: 200,
        //             headers: getCorsHeaders(event.headers.origin),
        //             body: JSON.stringify({
        //                 generatedCouponCode: generatedCouponCode,
        //                 response: response
        //             }),
        //         }
        //     } else if (validUserToGenerateCode && !tokenIsValid) {
        //         let refreshToken = refreshAccessToken(refreshToken);
        //         let generatedCouponCode = generateCode(currentUserSubscriptionName)
        //         let response = generateCouponCode(currentUserSubscriptionId, eventixTokens, generatedCouponCode);
        //         return {
        //             statusCode: 200,
        //             headers: getCorsHeaders(event.headers.origin),
        //             body: JSON.stringify({
        //                 refreshToken: refreshToken,
        //                 response: response
        //             }),
        //         }
        //     } else if (!validUserToGenerateCode) {
        //         //display alert - user already generated coupon code
        //         throw new Error("You've already generated a coupon code!");
        //     }
        // }

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};