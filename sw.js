const CACHE_NAME = 'akrabloko-v3'; // تحديث الإصدار لتنشيط التغييرات
const FILES_TO_CACHE = [
    './',
    './admin',
    'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// 1. التثبيت
self.addEventListener('install', (event) => {
    self.skipWaiting(); 
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );
});

// 2. التفعيل وتنظيف القديم
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// 3. التشغيل (Fetch) - النسخة المحسنة والمصلحة
self.addEventListener('fetch', (event) => {
    // حل المشكلة الأساسية: تجاهل أي طلب ليس من نوع GET (مثل طلبات Firebase POST)
    if (event.request.method !== 'GET') return;

    // تجاهل روابط الـ Chrome Extensions والـ Firebase Auth/Firestore لضمان عدم حدوث تعارض
    if (event.request.url.includes('firestore.googleapis.com') || 
        event.request.url.includes('identitytoolkit.googleapis.com') ||
        !event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // التأكد من أن الرد صالح قبل محاولة تخزينه
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // في حالة عدم وجود إنترنت، ابحث في الكاش
                return caches.match(event.request).then((response) => {
                    if (response) return response;
                    if (event.request.mode === 'navigate') {
                        return caches.match('./');
                    }
                });
            })
    );
});
