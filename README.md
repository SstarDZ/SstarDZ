# متجر DZ - نسخة Vercel (Serverless)

هذه نسخة معدّلة خصيصاً لتعمل على **Vercel**. Vercel لا يشغّل خادم Express تقليدي
(`app.listen`)، بل كل ملف داخل مجلد `api/` يصبح "دالة سحابية" (serverless function)
مستقلة تُستدعى عند الطلب فقط. لذلك تم تقسيم الخادم القديم إلى ملفات منفصلة:

```
api/
  products.js          <- GET/POST /api/products
  delivery-rates.js     <- GET/POST /api/delivery-rates
  upload-image.js        <- POST /api/upload-image
  image.js                <- DELETE /api/image
lib/
  db.js                    <- الاتصال بـ MongoDB Atlas (مشترك بين الدوال)
  cloudinary.js              <- إعداد Cloudinary (مشترك بين الدوال)
data/
  delivery-rates.default.json  <- تُستخدم فقط لتهيئة أسعار التوصيل أول مرة
index.html / dashboard.html / data.js   <- تُخدَّم كملفات ثابتة تلقائياً من Vercel
```

البيانات (المنتجات وأسعار التوصيل) في **MongoDB Atlas**، والصور في **Cloudinary** —
كلاهما مجاني دائم، ومناسب تماماً لطبيعة Vercel التي لا تملك قرصاً دائماً للكتابة عليه.

---

## المتغيرات البيئية المطلوبة على Vercel

من إعدادات مشروعك على vercel.com → **Settings → Environment Variables** أضف:

| المتغير | من أين تحصل عليه |
|---|---|
| `MONGODB_URI` | MongoDB Atlas → Connect → Drivers |
| `MONGODB_DB` | اختياري، افتراضياً `dzstore` |
| `CLOUDINARY_CLOUD_NAME` | لوحة تحكم Cloudinary → Dashboard |
| `CLOUDINARY_API_KEY` | لوحة تحكم Cloudinary → Dashboard |
| `CLOUDINARY_API_SECRET` | لوحة تحكم Cloudinary → Dashboard |

بعد إضافتها، اعمل **Redeploy** للمشروع من تبويب Deployments حتى تُطبَّق المتغيرات
(إضافة متغير بيئي لا تُفعَّل تلقائياً على نشر سابق).

## التشغيل محلياً (اختياري)

```bash
npm install -g vercel   # إن لم يكن مثبتاً
npm install
vercel dev
```

`vercel dev` يشغّل نفس بيئة Vercel محلياً (يقرأ ملف `.env` أو `.env.local` تلقائياً).
انسخ `.env.example` إلى `.env` وضع فيه القيم الحقيقية قبل التشغيل.

## ملاحظات مهمة

- لا حاجة لـ `vercel.json`: البنية أعلاه (ملفات ثابتة في الجذر + مجلد `api/`) تُكتشف
  تلقائياً من Vercel.
- كل استدعاء لدالة سحابية يفتح اتصالاً بقاعدة البيانات؛ استخدمنا اتصالاً مُخزَّناً مؤقتاً
  (`lib/db.js`) لتقليل زمن الاستجابة قدر الإمكان بين الاستدعاءات المتتالية.
- رفع الصور يمر أولاً عبر ملف مؤقت داخل `/tmp` (مساحة مؤقتة يوفرها Vercel لكل تنفيذ)
  ثم يُرفع إلى Cloudinary مباشرة؛ لا يبقى أي أثر دائم على خوادم Vercel.
