const { MongoClient } = require('mongodb');

let clientPromise = null;

function getClientPromise() {
    if (!process.env.MONGODB_URI) {
        throw new Error('لم يتم ضبط MONGODB_URI في المتغيرات البيئية على Vercel.');
    }
    if (!clientPromise) {
        const client = new MongoClient(process.env.MONGODB_URI);
        clientPromise = client.connect();
    }
    return clientPromise;
}

async function getDb() {
    const client = await getClientPromise();
    return client.db(process.env.MONGODB_DB || 'dzstore');
}

module.exports = { getDb };
