const CACHE_NAME = 'phaser-pwa-v1';

// [필수] 앱의 뼈대가 되는 최소한의 정적 파일만 선행 캐싱
const ASSETS_TO_CACHE = [
  './',
  './index.html'
];

// 1. 서비스 워커 설치 및 필수 파일 캐싱
self.addEventListener('install', (event) => {
    return;
  // 새 서비스 워커가 등록되는 즉시 대기 없이 활성화되도록 강제함
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. 서비스 워커 활성화 시 이전 버전 캐시 정리 및 즉시 제어 권한 획득
self.addEventListener('activate', (event) => {
    return;
  event.waitUntil(
    // 현재 열려있는 모든 탭/페이지를 새 서비스 워커가 즉시 제어하도록 설정
    self.clients.claim().then(() => {
      return caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              console.log('구버전 캐시 삭제:', cache);
              return caches.delete(cache);
            }
          })
        );
      });
    })
  );
});

// 3. 요청 가로채기 (제공해주신 코드 + 안전망 결합)
self.addEventListener('fetch', (event) => {
    return;
  // 크롬 확장 프로그램이나 chrome-extension:// 요청은 캐싱에서 제외 (에러 방지)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 3-1. 이미 캐시된 파일이 있다면 즉시 반환
      if (cachedResponse) {
        return cachedResponse;
      }

      // 3-2. 캐시에 없는 새로운 에셋(assets/...) 요청 처리
      return fetch(event.request)
        .then((networkResponse) => {
          // 정상적인 응답이 아니거나 오류가 있다면 그대로 반환 (캐싱 안 함)
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // 응답 스트림을 복사하여 캐시에 동적 저장 후 반환
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch((error) => {
          // [중요 추가] 네트워크도 안 되고 캐시도 없는 비상 상황 예외 처리
          console.error('네트워크 요청 실패 및 캐시 없음:', error);
          
          // 만약 이미지 요청이었다면 깨진 이미지 대신 투명한 임시 응답이라도 주어 크래시 방지
          if (event.request.headers.get('accept').includes('image')) {
            return new Response('<svg xmlns="http://w3.org" width="1" height="1"></svg>', {
              headers: { 'Content-Type': 'image/svg+xml' }
            });
          }
          
          // 일반 페이지 요청 실패 시 에러를 던지지 않고 기본 실패 응답 반환
          return new Response('오프라인 상태이며 네트워크 연결이 필요합니다.', { status: 503 });
        });
    })
  );
});
