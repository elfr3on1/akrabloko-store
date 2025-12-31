import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  const { id } = req.query;

  const doc = await db.collection("products").doc(id).get();
  if (!doc.exists) {
    return res.status(404).send("Not Found");
  }

  const p = doc.data();

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`
<!doctype html>
<html lang="ar">
<head>
  <title>${p.title}</title>
  <meta name="description" content="${p.description}">
  <link rel="canonical" href="https://your-domain.com/product/${id}">
  <meta property="og:title" content="${p.title}">
  <meta property="og:description" content="${p.description}">
  <meta property="og:image" content="${p.image}">
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "${p.title}",
      "image": "${p.image}",
      "description": "${p.description}",
      "offers": {
        "@type": "Offer",
        "price": "${p.price}",
        "priceCurrency": "EGP"
      }
    }
  </script>
</head>
<body>
  <div id="app"></div>
  <script src="/details.js"></script>
</body>
</html>
`);
}
