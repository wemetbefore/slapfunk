const { db } = require("./firebase");

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

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: getCorsHeaders(event.headers.origin)
        };
    }

    try {
        const data = JSON.parse(event.body);

        // Add data to Firestore
        const docRef = await db.collection("subscriptions").add(data);

        return {
            statusCode: 200,
            body: JSON.stringify({ id: docRef.id }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
