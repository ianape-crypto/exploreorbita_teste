/* ÓRBITA service worker: deixa a visita de volta mais rápida (cache local do navegador). */
var PAGE='orbita-page-v1', STATIC='orbita-static-v1', KEEP=[PAGE,STATIC];
self.addEventListener('install',function(e){self.skipWaiting();});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return KEEP.indexOf(k)<0;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));
});
function isStatic(u){
  if(u.origin===self.location.origin) return /\/(js|covers|img)\/|\.(webp|png|jpg|js|css|woff2?)$/.test(u.pathname);
  return u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com';
}
self.addEventListener('fetch',function(e){
  var r=e.request; if(r.method!=='GET') return;
  var u=new URL(r.url);
  if(r.mode==='navigate'){ // página: sempre tenta a versão nova primeiro
    e.respondWith(fetch(r).then(function(res){var c=res.clone();caches.open(PAGE).then(function(ca){ca.put(r,c);});return res;})
      .catch(function(){return caches.match(r,{cacheName:PAGE}).then(function(m){return m||caches.match('./',{cacheName:PAGE});});}));
    return;
  }
  if(!isStatic(u)) return;
  // arquivos (js, capas, imagens, fontes): usa o que já tem e atualiza em segundo plano
  e.respondWith(caches.open(STATIC).then(function(ca){
    return ca.match(r).then(function(hit){
      var net=fetch(r).then(function(res){if(res&&(res.ok||res.type==='opaque'))ca.put(r,res.clone());return res;}).catch(function(){return hit;});
      if(hit){e.waitUntil(net.catch(function(){}));return hit;}
      return net;
    });
  }));
});
