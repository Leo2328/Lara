const CACHE="lara-v47";
self.addEventListener("install",e=>{self.skipWaiting()});
self.addEventListener("activate",e=>{
  e.waitUntil((async()=>{
    const ks=await caches.keys();
    await Promise.all(ks.filter(k=>k!==CACHE&&k!=="lara-share").map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
// Compartir hacia Lara: recibe texto, enlaces y archivos desde otras apps (Web Share Target, POST).
async function handleShare(r){
  const home=new URL("lara.html",self.registration.scope).href;
  try{
    const fd=await r.formData();
    const q=new URLSearchParams({share:"1"});
    ["title","text","url"].forEach(k=>{const v=fd.get(k);if(typeof v==="string"&&v) q.set(k,v.slice(0,4000))});
    let file=null;
    for(const [k,v] of fd.entries()){if(v&&typeof v==="object"&&typeof v.size==="number"&&v.size>0){file=v;break}}
    if(file){
      const c=await caches.open("lara-share");
      await c.put("shared-file",new Response(file,{headers:{"X-Name":encodeURIComponent(file.name||"archivo"),"Content-Type":file.type||"application/octet-stream"}}));
    }
    return Response.redirect(home+"?"+q.toString(),303);
  }catch(err){return Response.redirect(home,303)}
}
// Red primero: siempre intenta traer la versión nueva; si no hay internet, usa la copia guardada.
self.addEventListener("fetch",e=>{
  const r=e.request;
  if(r.method==="POST"&&new URL(r.url).origin===location.origin){e.respondWith(handleShare(r));return}
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
