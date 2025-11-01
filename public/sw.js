self.addEventListener("install", (e) => {
  e.waitUntil(caches.open("v1").then(c => c.addAll(["/","/offline"])));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/offline")));
    return;
  }
  e.respondWith(
    caches.match(req).then(res => res || fetch(req).then(resp => {
      const copy = resp.clone();
      caches.open("v1").then(c => c.put(req, copy)).catch(()=>{});
      return resp;
    }))
  );
});
