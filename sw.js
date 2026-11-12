/* 微光圖境 Service Worker：離線可用
 * - 網頁本體（HTML／導覽請求）：網路優先，有網路就一定拿到最新版；斷網才用快取
 * - 其他同源檔案（圖示等）：先用快取、背景更新
 * 每次更新網站時，請把 CACHE 的版本號 +1，舊快取會在啟用時自動清掉
 */
const CACHE = 'weiguang-v3';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', 'manifest.webmanifest', 'icon-192.png']).catch(() => {}))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.origin !== location.origin) return;               // 登入（Supabase）與外部資源一律走網路
    const isPage = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
    e.respondWith(caches.open(CACHE).then(async c => {
        if (isPage) {
            try { const r = await fetch(req, { cache: 'no-cache' }); if (r && r.ok) c.put(req, r.clone()); return r; }
            catch (_) { return (await c.match(req, { ignoreSearch: true })) || (await c.match('./')) || Response.error(); }
        }
        const hit = await c.match(req, { ignoreSearch: true });
        const net = fetch(req).then(r => { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
        return hit || net;
    }));
});
