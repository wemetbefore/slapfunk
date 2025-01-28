const { db } = require("./firebase");

function getCorsHeaders(origin) {
    return {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Headers': 'Content-Type, Accept, Origin, Authorization',
        'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
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

        let users = await db.collection('users').get();
        let subscriptions = await db.collection('subscriptions').get();
        let eventixTokens = await db.collection('eventixTokens').get();

        if (event.body.email)
            //get user data and check if its in database 
            //if user already in db then make validations
            //if user not in db then update db and make validations
            //validation form db query ( users + tokens )
            //db query to check expiration token + flag coupon code`

            if (isCouponCodeGenerated) {
                //display alert - User already generated a coupon code
            } else if (!isCouponCodeGenerated && !isTokenExpired) {
                //generate coupon code + update db users + tokens
            } else if (isCouponCodeGenerated && !isTokenExpired) {
                //refresh token + generate + update db users + tokens
            }
        const data = subscriptions.docs.map((doc) => doc.data());

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
