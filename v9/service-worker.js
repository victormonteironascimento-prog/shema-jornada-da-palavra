/* Shema V9 — homologação. A PWA guarda apenas arquivos estáticos da própria prévia.
   Autenticação, dados de nuvem e textos externos nunca entram neste cache. */
const CACHE_PREFIX='shema-v9-rc1-'+encodeURIComponent(self.registration.scope)+'-';
const CACHE=CACHE_PREFIX+'20261026-r2';
const ASSETS=['./config.js','./config-runtime.js','./index.html','./app.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable.png'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 if(req.mode==='navigate'){
   event.respondWith(fetch(req).then(response=>{
      if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put('./index.html',copy)));}
      return response;
   }).catch(async()=>await caches.open(CACHE).then(cache=>cache.match('./index.html'))||Response.error()));
   return;
 }
 if(!ASSETS.some(path=>new URL(path,self.registration.scope).href===url.href))return;
 event.respondWith(caches.open(CACHE).then(cache=>cache.match(req)).then(hit=>hit||fetch(req)));
});
