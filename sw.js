/* 微光圖境 Service Worker：離線可用（同源檔案：先用快取、背景更新） */
const CACHE = 'weiguang-v1';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', 'manifest.webmanifest', 'icon-192.png']).catch(() => {}))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.origin !== location.origin) return;               // 登入（Supabase）與外部資源一律走網路
    e.respondWith(caches.open(CACHE).then(async c => {
        const hit = await c.match(req, { ignoreSearch: true });
        const net = fetch(req).then(r => { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
        return hit || net;
    }));
});
