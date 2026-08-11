/**
 * server.js - خادم متجر DZ
 *
 * البيانات (المنتجات وأسعار التوصيل) تُحفظ في قاعدة بيانات MongoDB Atlas
 * (مجانية دائمة، فئة M0)، وصور المنتجات تُحفظ وتُستضاف عبر Cloudinary
 * (مجاني دائم أيضاً). لا يعتمد المشروع على القرص المحلي للسيرفر إطلاقاً،
 * لذلك يعمل بشكل موثوق حتى على استضافات مجانية يُعاد تشغيلها بشكل متكرر
 * مثل Render (Free Web Service)، لأن البيانات لا تُفقد أبداً مع كل إعادة تشغيل.
 *
 * المتغيرات البيئية المطلوبة (env vars):
 *   MONGODB_URI            رابط الاتصال بقاعدة بيانات MongoDB Atlas
 *   MONGODB_DB              اسم قاعدة البيانات (اختياري، افتراضي: dzstore)
 *   CLOUDINARY_CLOUD_NAME    من لوحة تحكم Cloudinary
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */

require('dotenv').config();

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const { v2: cloudinary } = require('cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------
// إعداد Cloudinary (تخزين واستضافة صور المنتجات)
// ---------------------------------------------------------------------
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// الصور تُستقبل في الذاكرة مؤقتاً فقط، ثم تُرفع مباشرة إلى Cloudinary
// (لا يوجد أي كتابة على قرص السيرفر)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

function uploadBufferToCloudinary(buffer) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'dz-store-products' },
            (error, result) => (error ? reject(error) : resolve(result))
        );
        stream.end(buffer);
    });
}

// يستخرج public_id من رابط Cloudinary حتى نقدر نحذف الصورة عند حذف المنتج
function extractPublicId(url) {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
    return match ? match[1] : null;
}

// ---------------------------------------------------------------------
// إعداد MongoDB Atlas (المنتجات وأسعار التوصيل)
// ---------------------------------------------------------------------
const DB_NAME = process.env.MONGODB_DB || 'dzstore';
let db;

async function connectDB() {
    if (!process.env.MONGODB_URI) {
        throw new Error('لم يتم ضبط MONGODB_URI في المتغيرات البيئية.');
    }
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('تم الاتصال بقاعدة بيانات MongoDB Atlas بنجاح');

    // تهيئة أسعار التوصيل تلقائياً عند أول تشغيل فقط (58 ولاية) إن لم تكن موجودة
    const settings = db.collection('settings');
    const existingRates = await settings.findOne({ _id: 'delivery_rates' });
    if (!existingRates) {
        const defaultRatesPath = path.join(__dirname, 'data', 'delivery-rates.default.json');
        const defaultRates = JSON.parse(fs.readFileSync(defaultRatesPath, 'utf8'));
        await settings.insertOne({ _id: 'delivery_rates', rates: defaultRates });
        console.log('تمت تهيئة أسعار التوصيل الافتراضية لأول مرة');
    }
}

app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

// --- المنتجات ---
app.get('/api/products', async (req, res) => {
    try {
        const products = await db.collection('products').find({}, { projection: { _id: 0 } }).toArray();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'تعذر قراءة المنتجات من قاعدة البيانات' });
    }
});

app.post('/api/products', async (req, res) => {
    const products = req.body;
    if (!Array.isArray(products)) {
        return res.status(400).json({ error: 'يجب إرسال مصفوفة منتجات' });
    }
    try {
        const collection = db.collection('products');
        await collection.deleteMany({});
        if (products.length > 0) {
            await collection.insertMany(products);
        }
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'تعذر حفظ المنتجات في قاعدة البيانات' });
    }
});

// --- أسعار التوصيل ---
app.get('/api/delivery-rates', async (req, res) => {
    try {
        const doc = await db.collection('settings').findOne({ _id: 'delivery_rates' });
        res.json(doc ? doc.rates : {});
    } catch (err) {
        res.status(500).json({ error: 'تعذر قراءة أسعار التوصيل من قاعدة البيانات' });
    }
});

app.post('/api/delivery-rates', async (req, res) => {
    const rates = req.body;
    if (typeof rates !== 'object' || rates === null || Array.isArray(rates)) {
        return res.status(400).json({ error: 'صيغة أسعار التوصيل غير صحيحة' });
    }
    try {
        await db.collection('settings').replaceOne(
            { _id: 'delivery_rates' },
            { _id: 'delivery_rates', rates },
            { upsert: true }
        );
        res.json(rates);
    } catch (err) {
        res.status(500).json({ error: 'تعذر حفظ أسعار التوصيل في قاعدة البيانات' });
    }
});

// --- رفع صور المنتجات إلى Cloudinary ---
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'لم يتم إرسال أي صورة' });
    }
    try {
        const result = await uploadBufferToCloudinary(req.file.buffer);
        res.json({ path: result.secure_url });
    } catch (err) {
        res.status(500).json({ error: 'تعذر رفع الصورة إلى Cloudinary' });
    }
});

// --- حذف صورة من Cloudinary (اختياري، عند حذف منتج) ---
app.delete('/api/image', async (req, res) => {
    const url = req.query.path || '';
    const publicId = extractPublicId(url);
    if (publicId) {
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (err) {
            // لا نوقف الطلب في حال فشل حذف الصورة، المنتج نفسه محذوف من قاعدة البيانات أصلاً
        }
    }
    res.json({ ok: true });
});

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`متجر DZ يعمل على: http://localhost:${PORT}`);
            console.log(`لوحة التحكم: http://localhost:${PORT}/dashboard.html`);
        });
    })
    .catch(err => {
        console.error('فشل الاتصال بقاعدة البيانات، تأكد من صحة MONGODB_URI:', err.message);
        process.exit(1);
    });
