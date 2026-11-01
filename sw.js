const PREFIX=`heck:${self.registration.scope}:`;
const CACHE=PREFIX+'__BUILD_VERSION__';
const ASSETS=['./','index.html','style.css','app.js','game.js','worm.png','manifest.webmanifest','icon.svg?v=4','icon-180.png?v=4','icon-192.png?v=4','icon-512.png?v=4'];
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  // Fetch the complete release without reusing stale HTTP cache entries.
  await cache.addAll(ASSETS.map(path=>new Request(new URL(path,self.registration.scope),{cache:'reload'})));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  await Promise.all((await caches.keys()).filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const cached=await cache.match(event.request.mode==='navigate'?new URL('index.html',self.registration.scope):event.request);
  // Serve one complete release together; a new worker replaces it atomically.
  return cached||fetch(event.request);
 })());
});
