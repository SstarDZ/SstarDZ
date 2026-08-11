/**
 * data.js - إدارة البيانات المركزية لمتجر DZ
 * كل القراءة والكتابة تتم مباشرة عبر الخادم (server.js)، والذي يخزّن
 * البيانات في ملفات حقيقية: data/products.json و data/delivery-rates.json،
 * وصور المنتجات في مجلد img/. لا يُستخدم localStorage إطلاقاً.
 */

let _productsCache = [];
let _ratesCache = {};

// يجب استدعاء هذه الدالة وانتظارها (await) مرة عند بداية كل صفحة
// قبل استخدام getProducts() أو getDeliveryRates()
async function loadStoreData() {
    const [productsRes, ratesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/delivery-rates')
    ]);
    _productsCache = await productsRes.json();
    _ratesCache = await ratesRes.json();
}

// --- المنتجات ---
function getProducts() {
    return _productsCache;
}

async function saveProducts(productsArray) {
    const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productsArray)
    });
    if (!res.ok) throw new Error('تعذر حفظ المنتجات على الخادم');
    _productsCache = await res.json();
    return _productsCache;
}

// رفع صورة منتج واحدة إلى الخادم، تُحفظ كملف حقيقي داخل img/
// وترجع المسار (مثال: "img/12345_ab12cd.jpg") لتخزينه مع المنتج
async function uploadProductImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('تعذر رفع الصورة إلى الخادم');
    const data = await res.json();
    return data.path;
}

// --- أسعار التوصيل ---
function getDeliveryRates() {
    return _ratesCache;
}

async function saveDeliveryRates(ratesObject) {
    const res = await fetch('/api/delivery-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ratesObject)
    });
    if (!res.ok) throw new Error('تعذر حفظ أسعار التوصيل على الخادم');
    _ratesCache = await res.json();
    return _ratesCache;
}
