const { db } = require("./firebase");

exports.handler = async (event) => {
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
