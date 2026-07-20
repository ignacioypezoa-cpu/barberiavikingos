const CACHE="vikingos-v1";const CORE=["/","/reservar","/mis-reservas","/productos","/images/logo-vikingos.png"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request)))});
self.addEventListener("push",event=>{const data=event.data?.json()||{title:"Vikingos",body:"Tienes una nueva notificación."};event.waitUntil(self.registration.showNotification(data.title,{body:data.body,icon:"/images/logo-vikingos.png",data:{url:data.url||"/mis-reservas"}}))});
self.addEventListener("notificationclick",event=>{event.notification.close();event.waitUntil(clients.openWindow(event.notification.data.url))});
