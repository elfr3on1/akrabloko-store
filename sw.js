const CACHE_NAME = 'akrabloko-v2'; // قمنا بتغيير الرقم لتحديث الكاش
const FILES_TO_CACHE = [
    './', 
    // يمكنك إضافة مسار اللوجو هنا لضمان ظهوره أوفلاين
    // './images/logo.png', 
];

// 1. التثبيت (Install)
self.addEventListener('install', (event) => {
    self.skipWaiting(); // تفعيل التحديث فوراً
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );
});

// 2. التفعيل وتنظيف القديم (Activate)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache); // مسح الكاش القديم
                    }
                })
            );
        })
    );
});

// 3. التشغيل (Fetch) - استراتيجية الشبكة أولاً (Network First)
self.addEventListener('fetch', (event) => {
    // نتجاهل طلبات الإضافات الخارجية
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // لو فيه نت: انسخ البيانات للكاش واعرضها
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // لو النت قاطع: هات من الكاش
                return caches.match(event.request).then((response) => {
                    if (response) return response;
                    // لو الصفحة مش في الكاش، رجعه للصفحة الرئيسية
                    if (event.request.mode === 'navigate') {
                        return caches.match('./');
                    }
                });
            })
    );
});
