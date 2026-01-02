import admin from "firebase-admin";

// دالة لتنظيف المفتاح السري
const getPrivateKey = () => {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  if (!key) return undefined;
  return key.replace(/\\n/g, "\n").replace(/^"|"$/g, "");
};

// تهيئة فايربيس مرة واحدة فقط
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: getPrivateKey(),
      }),
    });
  } catch (error) {
    console.error("Firebase init error:", error);
  }
}

const db = admin.firestore();

export default async function handler(req, res) {
  // الحصول على رقم المنتج من الرابط
  const { id } = req.query;

  if (!id) {
    return res.status(400).send("Product ID is missing");
  }

  try {
    // جلب بيانات المنتج من قاعدة البيانات
    const doc = await db.collection("products").doc(id).get();
    
    // قيم افتراضية في حالة عدم وجود المنتج
    let title = "أقربلوكو ستور";
    let desc = "تسوق أحدث صيحات الموضة";
    let image = "https://akrabloko.vercel.app/images/logo.png"; // تأكد من وجود صورة افتراضية

    if (doc.exists) {
      const data = doc.data();
      title = data.name || title;
      desc = data.desc || desc;
      image = data.coverImage || image;
    }

    // تجهيز صفحة HTML بسيطة جداً لواتساب (لن يراها المستخدم العادي طويلاً)
    const html = `
      <!DOCTYPE html>
      <html lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        
        <meta property="og:type" content="product" />
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${desc}" />
        <meta property="og:image" content="${image}" />
        <meta property="og:url" content="https://akrabloko.vercel.app/product/${id}" />
        <meta property="og:site_name" content="Akrabloko Store" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="${desc}" />
        <meta name="twitter:image" content="${image}" />
        
      </head>
      <body>
        <script>
            // التوجيه إلى صفحة التفاصيل الفعلية مع تمرير رقم المنتج
            window.location.replace("/details.html?id=${id}");
        </script>
      </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    // تخزين الكاش لمدة قصيرة (ساعة واحدة) لتحديث الصور بسرعة عند التغيير
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    res.status(200).send(html);

  } catch (error) {
    console.error("Server Error:", error);
    // في حالة الخطأ، حول المستخدم للصفحة الرئيسية
    res.status(500).send('<script>window.location.replace("/");</script>');
  }
}
