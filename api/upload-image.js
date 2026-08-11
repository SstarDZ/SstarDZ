const formidable = require('formidable');
const { cloudinary } = require('../lib/cloudinary');

// على Vercel يجب تعطيل التحليل التلقائي للجسم حتى نقدر نقرأ multipart/form-data يدوياً
module.exports.config = {
    api: {
        bodyParser: false
    }
};

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const form = formidable({});
        const [, files] = await form.parse(req);
        const fileField = files.image;
        const file = Array.isArray(fileField) ? fileField[0] : fileField;

        if (!file) {
            return res.status(400).json({ error: 'لم يتم إرسال أي صورة' });
        }

        const result = await cloudinary.uploader.upload(file.filepath, {
            folder: 'dz-store-products'
        });

        res.status(200).json({ path: result.secure_url });
    } catch (err) {
        res.status(500).json({ error: 'تعذر رفع الصورة إلى Cloudinary' });
    }
};
