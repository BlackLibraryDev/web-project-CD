// sw.js 수정
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. 이미 캐시된 파일이 있다면 즉시 반환
      if (cachedResponse) {
          return cachedResponse;
      }

      // 2. 캐시에 없는 새로운 에셋(assets/...) 요청 처리
      return fetch(event.request).then((networkResponse) => {
        // 정상적인 응답이 아니거나, 외부 요청(CDN 등)은 캐싱 제외
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // 응답 스트림을 복사하여 캐시에 저장 후 반환
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});
