# متجر DZ - نسخة مجانية ودائمة (بدون قرص محلي، بدون localStorage)

كل التعديلات (منتجات، أسعار توصيل، صور) تُحفظ في خدمات سحابية مجانية دائمة:

- **MongoDB Atlas** (فئة M0 المجانية) → المنتجات وأسعار التوصيل.
- **Cloudinary** (الفئة المجانية) → صور المنتجات.
- **Render** (فئة Free Web Service) → استضافة الخادم نفسه.

بما أن البيانات والصور محفوظة خارج قرص السيرفر، فهي **لا تُفقد أبداً** حتى لو أعاد Render تشغيل
الخدمة (وهذا يحصل تلقائياً على الخطة المجانية بعد فترة خمول).

---

## الخطوة 1: أنشئ قاعدة بيانات MongoDB Atlas (مجانية)

1. سجّل حساب على https://www.mongodb.com/cloud/atlas/register (مجاني، بدون بطاقة بنكية).
2. أنشئ Cluster جديد واختر الفئة المجانية **M0**.
3. من "Database Access" أنشئ مستخدم (اسم مستخدم + كلمة سر) بصلاحية قراءة/كتابة.
4. من "Network Access" اضغط "Allow Access from Anywhere" (0.0.0.0/0) حتى يقدر Render يتصل.
5. من "Connect" اختر "Drivers" وانسخ رابط الاتصال (connection string)، شكله تقريباً:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   هذا هو `MONGODB_URI`.

## الخطوة 2: أنشئ حساب Cloudinary (مجاني)

1. سجّل حساب على https://cloudinary.com/users/register/free (مجاني دائم).
2. من لوحة التحكم الرئيسية (Dashboard) ستجد مباشرة:
   - `Cloud Name`
   - `API Key`
   - `API Secret`

## الخطوة 3: التشغيل محلياً (اختياري، للتجربة على جهازك)

```bash
npm install
cp .env.example .env
# ثم افتح .env وضع فيه القيم الحقيقية من الخطوتين 1 و 2
npm start
```

بعدها افتح:
- المتجر: http://localhost:3000
- لوحة التحكم: http://localhost:3000/dashboard.html

## الخطوة 4: النشر المجاني على Render

1. تأكد أن المشروع مرفوع على GitHub.
2. افتح https://render.com وسجّل دخول بحساب GitHub.
3. اضغط **New → Web Service** واختر الريبو الخاص بمشروعك.
4. اضبط:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. من تبويب **Environment** أضف المتغيرات التالية (نفس القيم من .env عندك):
   - `MONGODB_URI`
   - `MONGODB_DB` (اختياري، القيمة الافتراضية `dzstore`)
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
6. اضغط **Create Web Service** وانتظر انتهاء البناء.
7. ستحصل على رابط عام مثل `https://your-app.onrender.com` — جرّب فتحه وفتح `/dashboard.html` وأضف منتجاً تجريبياً.

> ملاحظة: الخدمة المجانية على Render "تنام" بعد 15 دقيقة خمول، وأول طلب بعدها يأخذ حوالي دقيقة
> ليستيقظ السيرفر. هذا طبيعي على الخطة المجانية ولا يؤثر على البيانات المحفوظة إطلاقاً.

---

## هيكل المشروع

```
project/
  server.js              <- الخادم (Express) + الاتصال بـ MongoDB و Cloudinary
  package.json
  data.js                 <- كود الواجهة الذي يتحدث مع الخادم (fetch)
  index.html               <- صفحة المتجر
  dashboard.html            <- لوحة التحكم
  data/
    delivery-rates.default.json  <- تُستخدم فقط لتهيئة أسعار التوصيل أول مرة في قاعدة البيانات
  .env.example              <- نموذج للمتغيرات البيئية المطلوبة
```
