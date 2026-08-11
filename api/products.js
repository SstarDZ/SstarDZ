const { getDb } = require('../lib/db');

module.exports = async (req, res) => {
    const db = await getDb();
    const collection = db.collection('products');

    if (req.method === 'GET') {
        const products = await collection.find({}, { projection: { _id: 0 } }).toArray();
        return res.status(200).json(products);
    }

    if (req.method === 'POST') {
        const products = req.body;
        if (!Array.isArray(products)) {
            return res.status(400).json({ error: 'يجب إرسال مصفوفة منتجات' });
        }
        await collection.deleteMany({});
        if (products.length > 0) {
            await collection.insertMany(products);
        }
        return res.status(200).json(products);
    }

    res.status(405).json({ error: 'Method Not Allowed' });
};
