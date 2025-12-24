const CACHE_NAME = 'akrabloko-v1'; // اسم المخزن
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    // ضيف هنا أي ملفات تانية مهمة زي الصور لو مساراتها ثابتة
    // CDNs زي Tailwind المتصفح هيحفظها أوتوماتيك مع الاستخدام
];

// 1. مرحلة التثبيت: الموظف بيستلم شغله ويحفظ الملفات الأساسية
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );
});

// 2. مرحلة التشغيل: الموظف واقف على الباب
self.addEventListener('fetch', (event) => {
    event.respondWith(
        // حاول تجيب الملف من النت الأول (عشان الأسعار تكون جديدة)
        fetch(event.request)
            .then((response) => {
                // لو جبناه بنجاح، ندي نسخة للموظف يحفظها للزمن
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // لو النت قاطع! الموظف يطلع النسخة اللي معاه
                return caches.match(event.request).then((response) => {
                    return response || caches.match('/'); // لو ملقاش الملف، يرجعك للصفحة الرئيسية
                });
            })
    );
});
