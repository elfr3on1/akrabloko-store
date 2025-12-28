const CACHE_NAME = 'akrabloko-final-v1'; // غيرنا الاسم تماماً لإجبار المتصفح على التحديث

self.addEventListener('install', (event) => {
    self.skipWaiting(); // إجبار النسخة الجديدة على العمل فوراً
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    return caches.delete(cache); // مسح كل الكاش القديم فور تفعيل الكود الجديد
                })
            );
        }).then(() => self.clients.claim()) // السيطرة على المتصفح فوراً
    );
});

self.addEventListener('fetch', (event) => {
    // تجاهل طلبات Firebase والطلبات التي ليست GET لضمان السرعة
    if (event.request.method !== 'GET' || 
        event.request.url.includes('firestore.googleapis.com') ||
        event.request.url.includes('identitytoolkit.googleapis.com')) {
        return;
    }

    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
