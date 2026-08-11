/**
 * server.js - خادم بسيط لمتجر DZ
 * يقوم بتخديم الملفات الثابتة (index.html, dashboard.html, data.js)
 * ويوفر API لحفظ المنتجات وأسعار التوصيل والصور مباشرة في ملفات حقيقية
 * على القرص (وليس في المتصفح/localStorage).
 */

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const IMG_DIR = path.join(__dirname, 'img');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const RATES_FILE = path.join(DATA_DIR, 'delivery-rates.json');

// تأكد من وجود المجلدات والملفات الأساسية
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });
if (!fs.existsSync(PRODUCTS_FILE)) fs.writeFileSync(PRODUCTS_FILE, '[]');
if (!fs.existsSync(RATES_FILE)) fs.writeFileSync(RATES_FILE, '{}');

app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname)); // يخدم index.html, dashboard.html, data.js, img/ ...

// تخزين الصور المرفوعة مباشرة داخل مجلد img/ باسم فريد
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, IMG_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        const uniqueName = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage });

function readJsonFile(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJsonFile(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
}

// --- المنتجات ---
app.get('/api/products', (req, res) => {
    res.json(readJsonFile(PRODUCTS_FILE));
});

app.post('/api/products', (req, res) => {
    const products = req.body;
    if (!Array.isArray(products)) {
        return res.status(400).json({ error: 'يجب إرسال مصفوفة منتجات' });
    }
    writeJsonFile(PRODUCTS_FILE, products);
    res.json(products);
});

// --- أسعار التوصيل ---
app.get('/api/delivery-rates', (req, res) => {
    res.json(readJsonFile(RATES_FILE));
});

app.post('/api/delivery-rates', (req, res) => {
    const rates = req.body;
    if (typeof rates !== 'object' || rates === null || Array.isArray(rates)) {
        return res.status(400).json({ error: 'صيغة أسعار التوصيل غير صحيحة' });
    }
    writeJsonFile(RATES_FILE, rates);
    res.json(rates);
});

// --- رفع صور المنتجات: تُحفظ كملف حقيقي داخل مجلد img/ ---
app.post('/api/upload-image', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'لم يتم إرسال أي صورة' });
    }
    res.json({ path: `img/${req.file.filename}` });
});

// --- حذف صورة من مجلد img/ (اختياري، عند حذف منتج) ---
app.delete('/api/image', (req, res) => {
    const relPath = req.query.path || '';
    const filename = path.basename(relPath);
    const fullPath = path.join(IMG_DIR, filename);
    if (fullPath.startsWith(IMG_DIR) && fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }
    res.json({ ok: true });
});

app.listen(PORT, () => {
    console.log(`متجر DZ يعمل على: http://localhost:${PORT}`);
    console.log(`لوحة التحكم: http://localhost:${PORT}/dashboard.html`);
});
