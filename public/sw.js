const CACHE_VERSION = 'v3'
const CACHE_NAME = `blogvibe-${CACHE_VERSION}`
const OFFLINE_URL = '/offline'
const PRECACHE_URLS = ['/', OFFLINE_URL]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      // Delete all old caches and clean up quiz/admin pages from all caches
      const cleanupPromises = keys.map((key) => {
        if (key !== CACHE_NAME) {
          // Delete old cache completely
          return caches.delete(key)
        } else {
          // For current cache, delete any quiz/admin/API requests that might be cached
          return caches.open(key).then((cache) => {
            return cache.keys().then((requests) => {
              const deletePromises = requests
                .map((request) => {
                  try {
                    const url = new URL(request.url)
                    // Delete cached quiz, admin, and API requests to ensure fresh data
                    if (
                      url.pathname.startsWith('/api/') ||
                      url.pathname.startsWith('/admin/') ||
                      url.pathname.startsWith('/doquizz/')
                    ) {
                      return cache.delete(request)
                    }
                  } catch (e) {
                    // Ignore errors when parsing URL
                  }
                  return Promise.resolve()
                })
              return Promise.all(deletePromises)
            })
          })
        }
      })

      return Promise.all(cleanupPromises)
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Skip caching for Vercel analytics and external resources
  if (url.pathname.includes('/_vercel/') || url.origin !== self.location.origin) {
    // Let the request go through without caching
    return
  }

  // Skip caching for API requests, admin pages, and quiz pages
  // These need to always fetch fresh data
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/admin/') ||
    url.pathname.startsWith('/doquizz/')
  ) {
    // Always fetch from network, don't cache
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)))
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {})
          return response
        })
        .catch(async () => (await caches.match(request)) ?? caches.match(OFFLINE_URL))
    )
    return
  }

  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(cacheFirst(request))
    return
  }

  event.respondWith(staleWhileRevalidate(request))
})

const cacheFirst = (request) =>
  caches.match(request).then((cached) => {
    if (cached) return cached
    return fetch(request)
      .then((response) => {
        const copy = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {})
        return response
      })
      .catch(() => cached)
  })

const staleWhileRevalidate = (request) =>
  caches.match(request).then((cached) => {
    const fetchPromise = fetch(request)
      .then((response) => {
        const copy = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {})
        return response
      })
      .catch(() => undefined)
    return cached ?? fetchPromise
  })
