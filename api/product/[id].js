import admin from "firebase-admin";

// دالة لتنظيف المفتاح السري من أي شوائب
const getPrivateKey = () => {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  if (!key) return undefined;
  
  // 1. استبدال الـ \n المكتوبة كحروف بـ سطر جديد حقيقي
  // 2. إزالة أي علامات تنصيص مزدوجة في الأول أو الآخر قد يضيفها فيرسل
  return key.replace(/\\n/g, "\n").replace(/^"|"$/g, "");
};

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: getPrivateKey(),
      }),
    });
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

const db = admin.firestore();

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    // محاولة جلب المنتج
    const doc = await db.collection("products").doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).send("Product not found - تأكد من رقم المنتج");
    }

    const p = doc.data();

    // تجهيز البيانات
    const title = p.name || "منتج من أقربلوكو";
    const description = p.desc || "تسوق أفضل المنتجات";
    const image = p.coverImage || ""; 
    const url = `https://akrabloko.vercel.app/details?id=${id}`;

    // إرسال الرد
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
      </head>
      <body>
        <script>window.location.href = "/details?id=${id}";</script>
      </body>
      </html>
    `);
  } catch (error) {
    // طباعة الخطأ الحقيقي في الـ Logs عشان نعرف السبب لو فشل تاني
    console.error("Detailed Error:", error);
    
    // إرسال تفاصيل الخطأ للشاشة عشان تشوفها (مؤقتاً عشان التصليح)
    res.status(500).send(`
      <h1>Error 500</h1>
      <p>حدث خطأ في الاتصال بقاعدة البيانات.</p>
      <pre>${error.message}</pre>
      <p>Check Vercel Logs for more details.</p>
    `);
  }
}
