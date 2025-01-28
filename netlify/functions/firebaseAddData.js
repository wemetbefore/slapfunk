const { db } = require("./firebase");

exports.handler = async () => {
    try {
        const snapshot = await db.collection("subscriptions").get();
        const data = snapshot.docs.map((doc) => doc.data());

        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
