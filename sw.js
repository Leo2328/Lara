const CACHE="lara-v40";
self.addEventListener("install",e=>{self.skipWaiting()});
self.addEventListener("activate",e=>{
  e.waitUntil((async()=>{
    const ks=await caches.keys();
    await Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
// Red primero: siempre intenta traer la versión nueva; si no hay internet, usa la copia guardada.
self.addEventListener("fetch",e=>{
  const r=e.request;
  if(r.method!=="GET"||new URL(r.url).origin!==location.origin) return;
  e.respondWith((async()=>{
    try{
      const res=await fetch(r,{cache:"no-store"});
      if(res&&res.ok){const c=await caches.open(CACHE);c.put(r,res.clone())}
      return res;
    }catch(err){
      const hit=await caches.match(r,{ignoreSearch:true});
      if(hit) return hit;
      throw err;
    }
  })());
});
self.addEventListener("notificationclick",e=>{
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:"window"}).then(cs=>cs.length?cs[0].focus():self.clients.openWindow("./")));
});
