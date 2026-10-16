const C="lara-v3";
const FILES=["lara.html","manifest.json","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!=="lara-share").map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(u.origin!==location.origin) return;
  if(e.request.method==="POST"&&u.pathname.endsWith("lara.html")){
    e.respondWith((async()=>{
      const fd=await e.request.formData();
      const q=new URLSearchParams();
      ["title","text","url"].forEach(k=>{const v=fd.get(k);if(v&&typeof v==="string") q.set(k,v)});
      const f=fd.get("media");
      if(f&&f.size){
        const c=await caches.open("lara-share");
        await c.put("shared-file",new Response(f,{headers:{"Content-Type":f.type||"application/octet-stream","X-Name":encodeURIComponent(f.name||"archivo")}}));
        q.set("share","1");
      }
      return Response.redirect(new URL("lara.html?"+q.toString(),self.registration.scope).href,303);
    })());
    return;
  }
  if(e.request.method!=="GET") return;
  e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request).then(m=>m||caches.match("lara.html"))));
});
