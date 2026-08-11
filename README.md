# متجر DZ - نسخة بخادم حقيقي (بدون localStorage)

كل التعديلات (منتجات، أسعار توصيل، صور) تُحفظ الآن مباشرة في ملفات حقيقية على الخادم:

- `data/products.json` — قائمة المنتجات
- `data/delivery-rates.json` — أسعار التوصيل لكل ولاية
- `img/` — صور المنتجات المرفوعة (ملفات حقيقية، وليست base64)

لا يستخدم المشروع الآن `localStorage` إطلاقاً لتخزين البيانات.

## التشغيل محلياً

يتطلب [Node.js](https://nodejs.org) (نسخة 18 أو أحدث) مثبت على جهازك.

```bash
npm install
npm start
```

بعدها افتح المتصفح على:

- المتجر: http://localhost:3000
- لوحة التحكم: http://localhost:3000/dashboard.html

## النشر (Hosting)

بما أن الموقع أصبح يحتاج خادم Node.js يعمل باستمرار (وليس مجرد ملفات HTML ثابتة)،
لا يمكن رفعه على استضافة "ثابتة" فقط مثل GitHub Pages. تحتاج استضافة تدعم Node.js، مثل:

- Render.com
- Railway.app
- أي VPS (خادم افتراضي خاص) مع تشغيل `npm install && npm start`

عند النشر، تأكد أن مجلدي `data/` و `img/` قابلين للكتابة (لهما صلاحية write) على الخادم،
لأن التطبيق يكتب فيهما مباشرة عند كل عملية حفظ.

## هيكل المشروع

```
project/
  server.js          <- الخادم (Express) ونقاط الـ API
  package.json
  data.js             <- كود الواجهة الذي يتحدث مع الخادم (fetch)
  index.html          <- صفحة المتجر
  dashboard.html       <- لوحة التحكم
  data/
    products.json
    delivery-rates.json
  img/                <- صور المنتجات المرفوعة
```
