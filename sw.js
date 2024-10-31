const CACHE_NAME = 'todo-pwa-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json'
];

// 서비스 워커 설치 및 리소스 캐시
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('캐시 시작');
                // 각 파일을 개별적으로 캐시하여 실패한 파일 확인
                return Promise.all(
                    ASSETS_TO_CACHE.map(url => {
                        return cache.add(url).catch(error => {
                            console.error('캐시 실패:', url, error);
                        });
                    })
                );
            })
            .catch(error => {
                console.error('전체 캐시 실패:', error);
            })
    );
});

// 캐시 관리
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('이전 캐시 삭제:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .catch(error => {
                console.error('캐시 정리 실패:', error);
            })
    );
});

// IndexedDB에 데이터 저장
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("myCacheDatabase", 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = () => {
            request.result.createObjectStore("cache", { keyPath: "url" });
        };
    });
}

async function saveToIndexedDB(url, response) {
    const db = await openDatabase();
    const tx = db.transaction("cache", "readwrite");
    const store = tx.objectStore("cache");

    // Response를 Blob으로 변환하여 저장
    const responseBlob = await response.blob();
    store.put({ url, response: responseBlob });
    await tx.complete;
}
async function getFromIndexedDB(url) {
    const db = await openDatabase();
    const tx = db.transaction("cache", "readonly");
    const store = tx.objectStore("cache");
    const cachedData = await store.get(url);

    // Blob 데이터를 Response 객체로 변환하여 반환
    return cachedData ? new Response(cachedData.response) : null;
}

// 네트워크 요청 처리
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    // 캐시에서 찾음
                    return response;
                }

                // 캐시에 없으면 네트워크 요청
                return fetch(event.request)
                    .then(async response => {
                        // 유효하지 않은 응답은 그대로 반환
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // 응답을 IndexedDB에 저장
                        const responseToCache = response.clone();
                        await saveToIndexedDB(event.request.url, responseToCache);

                        return response;
                    })
                    .catch(error => {
                        console.error('fetch 실패:', error);
                        // 오프라인 상태일 때 기본 메시지를 반환
                        return new Response('오프라인 상태입니다.');
                    });
            })
    );
});
