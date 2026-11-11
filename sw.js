/* Arice 離線快取：2026/11/11 先停用（平板上聲音出不來，先把今天新加的東西拿掉排除原因）。
   這個檔案留著，是為了讓已經裝過的平板自動把舊的快取和背景程式清掉。 */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf('arice-') === 0; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.registration.unregister(); }));
});
