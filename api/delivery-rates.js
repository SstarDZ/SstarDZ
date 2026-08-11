const { getDb } = require('../lib/db');
const defaultRates = require('../data/delivery-rates.default.json');

module.exports = async (req, res) => {
    const db = await getDb();
    const settings = db.collection('settings');

    if (req.method === 'GET') {
        let doc = await settings.findOne({ _id: 'delivery_rates' });
        if (!doc) {
            doc = { _id: 'delivery_rates', rates: defaultRates };
            await settings.insertOne(doc);
        }
        return res.status(200).json(doc.rates);
    }

    if (req.method === 'POST') {
        const rates = req.body;
        if (typeof rates !== 'object' || rates === null || Array.isArray(rates)) {
            return res.status(400).json({ error: 'صيغة أسعار التوصيل غير صحيحة' });
        }
        await settings.replaceOne(
            { _id: 'delivery_rates' },
            { _id: 'delivery_rates', rates },
            { upsert: true }
        );
        return res.status(200).json(rates);
    }

    res.status(405).json({ error: 'Method Not Allowed' });
};
