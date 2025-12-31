import admin from "firebase-admin";

// تهيئة الاتصال بفايربيس من السيرفر
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // هذا السطر يعالج مشكلة الأسطر الجديدة في المفتاح السري
      privateKey: process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n").replace(/"/g, "")
  : undefined,
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  // استخراج معرف المنتج من الرابط
  const { id } = req.query;

  try {
    // جلب بيانات المنتج من قاعدة البيانات
    const doc = await db.collection("products").doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).send("Product not found");
    }

    const p = doc.data();

    // تجهيز البيانات للعرض (استخدامنا لأسماء الحقول الموجودة في مشروعك)
    const title = p.name || "منتج مميز من أقربلوكو";
    const description = p.desc || `تسوق الآن ${p.name} بسعر ${p.price} ج.م`;
    const image = p.coverImage || "https://akrabloko.vercel.app/images/logo.png"; // تأكد من وضع رابط لوجو احتياطي صحيح
    const url = `https://akrabloko.vercel.app/details.html?id=${id}`;

    // إرسال كود HTML ثابت لقرائته من قبل روبوتات فيسبوك وواتساب
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=1, stale-while-revalidate=59");
    
    res.status(200).send(`
      <!doctype html>
      <html lang="ar">
      <head>
        <meta charset="utf-8">
        <title>${title} | Akrabloko</title>
        <meta name="description" content="${description}">
        
        <meta property="og:type" content="product">
        <meta property="og:url" content="${url}">
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${description}">
        <meta property="og:image" content="${image}">
        
        <meta property="twitter:card" content="summary_large_image">
        <meta property="twitter:title" content="${title}">
        <meta property="twitter:description" content="${description}">
        <meta property="twitter:image" content="${image}">
      </head>
      <body>
        <script>
          // توجيه الزائر الحقيقي لصفحة التفاصيل
          window.location.href = "/details.html?id=${id}";
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
}
