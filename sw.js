/* sw.js — يجعل التطبيق يعمل بدون إنترنت بعد أول فتح */
const CACHE = 'multimeter-lab-v9';
const ASSETS = [
  './', './index.html', './css/style.css', './manifest.webmanifest',
  './js/engine.js', './js/meter.js', './js/parts.js', './js/missions.js',
  './js/sound.js', './js/i18n.js', './js/ui.js', './js/progress.js', './js/builder.js', './js/laws.js', './js/meter-ui.js', './js/app.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.pathname.includes('/api/')) return;   // التقدّم يذهب للخادم دائماً
  // الشبكة أولاً (حتى تصل التحديثات فوراً)، والنسخة المخزنة عند انقطاع الإنترنت
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok && url.origin === location.origin) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
  );
});
