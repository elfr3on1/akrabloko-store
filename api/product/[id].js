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
  const id = req.query.id;

  const doc = await db.collection("products").doc(id).get();
  if (!doc.exists) {
    return res.status(404).send("Not found");
  }

  const p = doc.data();

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`
<!doctype html>
<html lang="ar">
<head>
  <title>${p.title}</title>
  <meta name="description" content="${p.description}">
  <link rel="canonical" href="https://akrab loko.vercel.app/product/${id}">
  <meta property="og:type" content="product">
  <meta property="og:title" content="${p.title}">
  <meta property="og:description" content="${p.description}">
  <meta property="og:image" content="${p.image}">
</head>
<body>
<script>
  location.href = "/details.html?id=${id}";
</script>
</body>
</html>
`);
}
