const { cloudinary, extractPublicId } = require('../lib/cloudinary');

module.exports = async (req, res) => {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const rawPath = req.query.path || '';
    const url = Array.isArray(rawPath) ? rawPath[0] : rawPath;
    const publicId = extractPublicId(url);

    if (publicId) {
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (err) {
            // لا نوقف الطلب في حال فشل حذف الصورة، المنتج نفسه محذوف من قاعدة البيانات أصلاً
        }
    }

    res.status(200).json({ ok: true });
};
