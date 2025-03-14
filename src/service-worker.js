const VERSION_SW = `v3`;
const KEY_LAST_CACHE = `My-Little-Organizer_${VERSION_SW}`;
const KEY_LAST_CACHE_FILES = `${KEY_LAST_CACHE}_files`;
const KEY_LAST_CACHE_NOTES = `${KEY_LAST_CACHE}_notes`;
const KEY_LAST_CACHE_IMAGES = `${KEY_LAST_CACHE}_images`;

const KEYS_CURRENT_CACHE = [
  KEY_LAST_CACHE_FILES,
  KEY_LAST_CACHE_NOTES,
  KEY_LAST_CACHE_IMAGES,
];

const REPEAT_REQUESTS = {
  NOTES: {
    timer: null,
    next: 0,
    delay: 5000,
    count: 0,
    limit: 10,
    location: null,
    clientId: null,
  },
};

const FILES_FOR_CACHE = [
  './',
  './index.html',
  './main.js',
  './main.css',
  './service-worker.js',
  './workers/createBlobUrl.web-worker.js',
  './img/ui/bg-2.jpg',
  './img/icons/032.png',
  './img/icons/042.png',
  './img/icons/052.png',
  './img/icons/062.png',
  './img/icons/072.png',
  './img/icons/082.png',
  './img/icons/102.png',
  './img/icons/123.png',
  './img/icons/133.png',
  './img/icons/143.png',
  './img/icons/153.png',
];

const HOST_NAMES = {
  FRONTEND: 'localhost',
  // FRONTEND: 'maxkrch.github.io'
};

self.addEventListener('install', (event) => {
  event.waitUntil(onInstall());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(onActivate());
});

self.addEventListener('message', (event) => {
  onMessage(event);
});

self.addEventListener('fetch', async (event) => {
  onFetch(event);
});

const onInstall = async (event) => {
  await saveFilesToCache(KEY_LAST_CACHE_FILES, FILES_FOR_CACHE);
};

const onActivate = async (event) => {
  await removeOldCache();
};

const onMessage = async (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
};

const onFetch = async (event) => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.hostname === HOST_NAMES.FRONTEND) {
    event.respondWith(requestFrontendFile(event));
    return;
  }

  if (requestUrl.pathname.startsWith(`/user/feed/notes`)) {
    event.respondWith(requestFeedNotes(event));
    return;
  }

  const regex = /^\/storage\/[\d\w\-]*\/image\/.*/;
  if (regex.test(requestUrl.pathname)) {
    event.respondWith(requestNotesImages(event));
    return;
  }
};

const requestFrontendFile = async (event) => {
  const cache = await caches.open(KEY_LAST_CACHE_FILES);
  const cachedFile = await cache.match(event.request);

  if (cachedFile) {
    return cachedFile;
  }

  return fetch(event.request).catch((err) =>
    postMessageToApp(
      {
        type: `fetchError`,
        data: err,
      },
      event.clientId,
    ),
  );
};

const requestNotesImages = async (event) => {
  const cachedImage = await getResponseFromCache(
    event.request.clone(),
    KEY_LAST_CACHE_IMAGES,
  );

  if (cachedImage) {
    return cachedImage;
  }

  const response = await fetch(event.request.clone()).catch((err) =>
    postMessageToApp(
      {
        type: `fetchError`,
        data: err,
      },
      event.clientId,
    ),
  );

  if (response?.status >= 200 && response?.status < 300) {
    event.waitUntil(
      saveRequestToCache(
        event.request,
        response.clone(),
        KEY_LAST_CACHE_IMAGES,
      ),
    );
  }

  return response;
};

const requestFeedNotes = async (event) => {
  try {
    const response = await fetch(event.request.clone()).catch((err) =>
      postMessageToApp(
        {
          type: `fetchError`,
          data: err,
        },
        event.clientId,
      ),
    );
    if (response?.status >= 200 && response?.status < 300) {
      event.waitUntil(
        saveRequestNotesToCache(
          event.request,
          response.clone(),
          KEY_LAST_CACHE_NOTES,
        ),
      );
      return response;
    }

    repeatRequestNotes(event.request.clone(), event.clientId);

    const cachedNotes = await getResponseNotesFromCache(
      event.request,
      KEY_LAST_CACHE_NOTES,
    );

    if (cachedNotes) {
      return cachedNotes;
    }

    return response;
  } catch (err) {
    const options = {
      status: 500,
    };
    const body = {
      success: false,
      error: `Server error`,
    };

    return new Response(JSON.stringify(body), options);
  }
};

const saveFilesToCache = async (key, files) => {
  const cache = await caches.open(key);
  await cache.addAll(files);
};

const removeOldCache = async () => {
  const allCashes = await caches.keys();
  const cachesForDelete = allCashes.filter(
    (cache) => !KEYS_CURRENT_CACHE.includes(cache),
  );

  return Promise.all(cachesForDelete.map((cache) => caches.delete(cache)));
};

const saveRequestNotesToCache = async (request, response, key) => {
  const requestGET = new Request(request.url);
  const responseNotes = await saveRequestToCache(requestGET, response, key);
};

const getResponseNotesFromCache = async (request, key) => {
  const requestGET = new Request(request.url);
  const responseNotes = await getResponseFromCache(requestGET, key);
  if (responseNotes) {
    const body = await responseNotes.json();
    body.fromCache = true;
    const newResponse = new Response(JSON.stringify(body), {
      headers: {
        ...responseNotes.headers,
      },
    });
    return newResponse;
  }

  return responseNotes;
};

const saveRequestToCache = async (request, response, key) => {
  const cache = await caches.open(key);
  await cache.put(request, response);
};

const getResponseFromCache = async (request, key) => {
  const cache = await caches.open(key);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  return false;
};

const postReceivedFeedNotesToApp = async (data) => {
  const notesObj = await data.response.json();
  if (notesObj.success) {
    const message = {
      type: `receivedFeedNotes`,
      data: {
        location: data.location,
        feedNotes: notesObj.notes,
      },
    };
    postMessageToApp(message, data.clientId);
  }
};

const postMessageToApp = async (message, clientId) => {
  const clientsArray = await clients.matchAll();
  const client = clientsArray.find((client) => client.id === clientId);

  client.postMessage(message);
};

const repeatRequestNotes = async (request, clientId) => {
  if (REPEAT_REQUESTS.NOTES.timer) {
    clearTimeout(REPEAT_REQUESTS.NOTES.timer);
    clearRepeatRequestNotes();
  }

  if (REPEAT_REQUESTS.NOTES.count >= REPEAT_REQUESTS.NOTES.limit) {
    clearRepeatRequestNotes();
    return;
  }

  if (clientId) REPEAT_REQUESTS.NOTES.clientId = clientId;

  if (!REPEAT_REQUESTS.NOTES.location) {
    const bodyRequest = await request.clone().json();

    REPEAT_REQUESTS.NOTES.location = {
      section: bodyRequest.section,
    };

    REPEAT_REQUESTS.NOTES.location.section === `tag`
      ? (REPEAT_REQUESTS.NOTES.location.id = bodyRequest.tag)
      : (REPEAT_REQUESTS.NOTES.location.category = bodyRequest.category);
  }

  const response = await fetch(request.clone()).catch((err) =>
    postMessageToApp(
      {
        type: `fetchError`,
        data: err,
      },
      REPEAT_REQUESTS.NOTES.clientId,
    ),
  );

  if (response?.status >= 200 && response?.status < 300) {
    await saveRequestNotesToCache(
      request,
      response.clone(),
      KEY_LAST_CACHE_NOTES,
    );
    clearRepeatRequestNews();

    postReceivedFeedNotesToApp({
      location: REPEAT_REQUESTS.NOTES.location,
      response,
      cloendId: REPEAT_REQUESTS.NOTES.clientId,
    });

    return;
  }

  REPEAT_REQUESTS.NOTES.next += REPEAT_REQUESTS.NOTES.delay;
  REPEAT_REQUESTS.NOTES.count += 1;

  REPEAT_REQUESTS.NOTES.timer = setTimeout(
    (request) => {
      repeatRequestNotes(request);
    },
    REPEAT_REQUESTS.NOTES.next,
    request,
  );
};

const clearRepeatRequestNotes = () => {
  REPEAT_REQUESTS.NOTES = {
    timer: null,
    next: 0,
    delay: 5000,
    count: 0,
    limit: 10,
    location: null,
    clientId: null,
  };
};
