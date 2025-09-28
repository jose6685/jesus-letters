/**
 * 耶穌的信 3.0 - Service Worker
 * 提供PWA離線功能和緩存管理
 */

const CACHE_NAME = 'jesus-letters-v1.0.1'
const STATIC_CACHE = 'jesus-letters-static-v2'
const DYNAMIC_CACHE = 'jesus-letters-dynamic-v2'

// 需要緩存的靜態資源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/App.vue',
  '/src/components/WelcomePage.vue',
  '/src/components/HomePage.vue',
  '/src/components/SharePage.vue',
  '/src/components/LetterPage.vue',
  '/src/components/HistoryPage.vue',
  '/src/services/SimplifiedAIService.js',
  '/src/services/StorageService.js',
  '/src/services/ExportService.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;600;700&display=swap'
]

// 需要網絡優先的資源
const NETWORK_FIRST_URLS = [
  '/api/',
  'https://generativelanguage.googleapis.com/',
  'https://api.openai.com/'
]

// 安裝事件 - 緩存靜態資源
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker 安裝中...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 緩存靜態資源...')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('✅ Service Worker 安裝完成')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('❌ Service Worker 安裝失敗:', error)
      })
  )
})

// 激活事件 - 清理舊緩存
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker 激活中...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ 清理舊緩存:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('✅ Service Worker 激活完成')
        return self.clients.claim()
      })
  )
})

// 獲取事件 - 處理網絡請求
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // 跳過非GET請求
  if (request.method !== 'GET') {
    return
  }
  
  // 跳過Chrome擴展請求
  if (url.protocol === 'chrome-extension:') {
    return
  }
  
  // API請求 - 網絡優先策略
  if (isNetworkFirstUrl(request.url)) {
    event.respondWith(networkFirstStrategy(request))
    return
  }
  
  // 靜態資源 - 緩存優先策略
  if (isStaticAsset(request.url)) {
    event.respondWith(cacheFirstStrategy(request))
    return
  }
  
  // HTML頁面 - 網絡優先，緩存備用
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstStrategy(request))
    return
  }
  
  // 其他資源 - 緩存優先策略
  event.respondWith(cacheFirstStrategy(request))
})

/**
 * 網絡優先策略
 */
async function networkFirstStrategy(request) {
  try {
    // 嘗試網絡請求
    const networkResponse = await fetch(request)
    
    // 如果是成功的回應，緩存它
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('🌐 網絡請求失敗，嘗試緩存:', request.url)
    
    // 網絡失敗，嘗試從緩存獲取
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // 如果是HTML請求且沒有緩存，返回離線頁面
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/index.html')
    }
    
    // 返回離線回應
    return new Response(
      JSON.stringify({
        error: '網絡連接失敗',
        message: '請檢查您的網絡連接',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * 緩存優先策略
 */
async function cacheFirstStrategy(request) {
  // 先嘗試從緩存獲取
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    // 緩存中沒有，嘗試網絡請求
    const networkResponse = await fetch(request)
    
    // 緩存成功的回應
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('❌ 網絡和緩存都失敗:', request.url, error)
    
    // 返回離線回應
    return new Response(
      JSON.stringify({
        error: '資源不可用',
        message: '請檢查您的網絡連接',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * 檢查是否為網絡優先URL
 */
function isNetworkFirstUrl(url) {
  return NETWORK_FIRST_URLS.some(pattern => url.includes(pattern))
}

/**
 * 檢查是否為靜態資源
 */
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2']
  return staticExtensions.some(ext => url.includes(ext))
}

// 消息處理 - 與主線程通信
self.addEventListener('message', (event) => {
  const { type, data } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME })
      break
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true })
      })
      break
      
    case 'CACHE_URLS':
      cacheUrls(data.urls).then(() => {
        event.ports[0].postMessage({ success: true })
      })
      break
      
    default:
      console.log('🔔 未知消息類型:', type)
  }
})

/**
 * 清理所有緩存
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys()
  await Promise.all(cacheNames.map(name => caches.delete(name)))
  console.log('🗑️ 所有緩存已清理')
}

/**
 * 緩存指定URLs
 */
async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE)
  await cache.addAll(urls)
  console.log('📦 URLs已緩存:', urls)
}

// 推送通知處理（未來功能）
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: data.data,
    actions: [
      {
        action: 'open',
        title: '打開應用',
        icon: '/icons/open-icon.png'
      },
      {
        action: 'close',
        title: '關閉',
        icon: '/icons/close-icon.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// 通知點擊處理
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// 後台同步（未來功能）
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

/**
 * 後台同步處理
 */
async function doBackgroundSync() {
  try {
    // 這裡可以實現後台數據同步邏輯
    console.log('🔄 執行後台同步...')
  } catch (error) {
    console.error('❌ 後台同步失敗:', error)
  }
}

// 錯誤處理
self.addEventListener('error', (event) => {
  console.error('❌ Service Worker 錯誤:', event.error)
})

self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Service Worker 未處理的Promise拒絕:', event.reason)
})

console.log('🎉 Service Worker 腳本已載入')