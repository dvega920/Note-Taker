const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/notes.html",
    "/manifest.webmanifest",
    "/assets/css/styles.css",
    "/assets/js/index.js",
];

const CACHE_NAME = "static-cache-v2";

const DATA_CACHE_NAME = "data-cache-v1";

// when the service worker is installed
self.addEventListener("install", function (evt) {
    // tell the service worker to wait until all of this is finished
    evt.waitUntil(
        // open the static cache and once it's open (promise) then
        caches.open(CACHE_NAME).then(cache => {
            console.log("Your files were pre-cached successfully!");
            // add all of the files that we want to cache into the static file cache
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    // now tell the current service working to stop waiting, this ensures that the newly
    // installed service worker takes over the page when it's installed (if it was updated),
    // rather than requiring the pages to be refreshed
    self.skipWaiting();
});

// the activate event is fired right after the installation, this activate event
// is used when we want to clean up anything that may have been left over from 
// the previous service worker
self.addEventListener("activate", function (evt) {
    // tell the service worker to wait until all of this is finished
    evt.waitUntil(
        // we're getting ALL of the items from the cache by their key
        caches.keys().then(keyList => {
            // we want to return a promise (that is required for this method to work)
            // we are using Promise.all so that it will wait until all of the
            // delete methods we are calling below will be completed before moving on
            return Promise.all(
                // we're mapping over all of the keys from the cache
                keyList.map(key => {
                    // if the key does not match the current CACHE_NAME and the DATA_CACHE_NAME
                    // then it is an older cache and we don't need it anymore. Basically we
                    // probably changed CACHE_NAME from "static-cache-v1" to "static-cache-v2"
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log("Removing old cache data", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );

    // similar to the self.skipWaiting() method, this allows us to ensure that once
    // this service worker has been activated, it will take control of any pages
    // needed, rather than let the old service worker run on those pages until
    // they are refreshed
    self.clients.claim();
});

// whenever a page controlled by this service worker tries to fetch a resource
// (this could be an API call, or trying to load a static asset)
self.addEventListener("fetch", function (evt) {
    // check if the request includes "/api/" in the URL, if it does we know this is an API
    // call, and we want to check to see if we have cached a response for this request
    // in our DATA_CACHE.
    if (evt.request.url.includes("/api/")) {
        // if this request does include "/api/"" in the URL, we want the browser to
        // respond with the following
        evt.respondWith(
            // open up the DATA_CACHE, and once it is open
            caches.open(DATA_CACHE_NAME).then(cache => {
                // actually make the request out to the server, and once it's returned
                return fetch(evt.request)
                    .then(response => {
                        // If the response was good, clone it and store it in the cache.
                        if (response.status === 200) {
                            // save the request in the cache for this particular URL
                            cache.put(evt.request.url, response.clone());
                        }

                        // return the response into the cache
                        return response;
                    })
                    // if the browser cannot make the request (offline), or an error was returned
                    // from the browser
                    .catch(err => {
                        // try to get a response from the DATA_CACHE for this request 
                        return cache.match(evt.request);

                    });
            }).catch(err => {
                // if an error was thrown opening the cache, or at any other point
                console.log(err)
            })
        );

        // we return here so that the code below this will not be run if the request
        // contained "/api/" in the URL
        return;
    }

    // if the request did not contain "api" in the URL, then this request was 
    // probably for a static asset, so we're going to check the static cache
    evt.respondWith(
        // open up the static cache, and once that is open
        caches.open(CACHE_NAME).then(cache => {
            // check if the item we are trying to fetch is in the cache
            return cache.match(evt.request).then(response => {
                // if the cache returned a response, return that, otherwise actually
                // fetch the resource from the server
                return response || fetch(evt.request);
            });
        })
    );
});
