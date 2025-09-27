const VERSION = "1.1";

const FILES = [
    "index.html",

    "styles/layout.css",
    "styles/MaterialIcons-Regular.ttf",
    "styles/Nunito-VariableFont_wght.ttf",
    "styles/styles-dark.css",
    "styles/styles-light.css",

    "scripts/config.js",
    "scripts/data.js",
    "scripts/info.js",
    "scripts/input.js",
    "scripts/main.js",
    "scripts/screens.js",

    "icon/icon_192.png",
    "icon/icon_512.png"
];

const buildCache = async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(FILES);
};

self.addEventListener("install", (e) => {
    e.waitUntil(buildCache());
});


const deleteOldCaches = async () => {
    const keys = await caches.keys();
    const promises = keys.filter(key => key !== VERSION).map(key => caches.delete(key));
    Promise.all(promises);
};

self.addEventListener("activate", (e) => {
  e.waitUntil(deleteOldCaches());
    console.log("ACTIVATED");
});


const handleRequest = async (request) => {
    console.log("got request");
    const existing = caches.match(request);
    if (existing !== undefined) return existing;
    console.log("fetching new");

    const response = await fetch(request);
    const cache = await caches.open(VERSION);
    cache.put(request, response);
    return response;
};

self.addEventListener("fetch", (e) => {
  e.respondWith(handleRequest(e.request));
});