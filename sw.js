/* Arice 離線快取
   - 頁面、題庫、程式：先問網路（最多等 4 秒），連不上或太慢就用上次存的，所以更新會馬上生效。
   - Firebase 程式庫、圖片：先用存的（很少變），背景再更新。
   - 聲音檔、登入、雲端資料（別的網域）：完全不碰。 */
var CACHE = 'arice-v1';
var SCOPE = new URL(self.registration.scope).pathname;

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf('arice-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function put(req, res) {
  if (res && res.ok && res.type === 'basic') { var c = res.clone(); caches.open(CACHE).then(function (ch) { return ch.put(req, c); }).catch(function () {}); }
  return res;
}
function cacheFirst(req) {
  return caches.match(req).then(function (hit) {
    var net = fetch(req).then(function (res) { return put(req, res); });
    if (hit) { net.catch(function () {}); return hit; }
    return net;
  });
}
function networkFirst(req) {
  return new Promise(function (resolve, reject) {
    var settled = false;
    var useCache = function (elseWait) {
      return caches.match(req).then(function (hit) {
        if (settled) return;
        if (hit) { settled = true; resolve(hit); } else if (!elseWait) { settled = true; reject(new TypeError('offline')); }
      });
    };
    var timer = setTimeout(function () { useCache(true); }, 4000);
    fetch(req).then(function (res) {
      clearTimeout(timer); put(req, res);
      if (!settled) { settled = true; resolve(res); }
    }).catch(function () { clearTimeout(timer); if (!settled) useCache(false); });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  var u = new URL(req.url);
  if (u.origin !== self.location.origin || u.pathname.indexOf(SCOPE) !== 0) return;
  if (/\.(mp3|m4a|ogg|wav|mp4|mobileconfig)$/i.test(u.pathname) || /\/sw\.js$/.test(u.pathname)) return;
  var stable = /\/lib\/firebase-[^/]+\.js$/.test(u.pathname) || /\.(png|jpe?g|webp|gif|svg|ico|woff2?)$/i.test(u.pathname);
  e.respondWith(stable ? cacheFirst(req) : networkFirst(req));
});
