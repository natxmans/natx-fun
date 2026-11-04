// Permet de jouer sans Internet aux pages déjà visitées.
// Toujours le réseau d'abord : on n'affiche jamais une vieille version quand Internet marche.
const CACHE = 'natx-v1';
const PAGES = [
  './', 'index.html', 'commun.css', 'commun.js', 'nouveautes.html', 'icone.svg',
  'college.html', 'sable.html', 'labo.html', 'bouton.html', 'cosmos.html', 'melodie.html',
  'patate.html', 'emojis.html', 'poids.html', 'pouvoirs.html', 'arbre.html', 'reflexe.html',
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PAGES)).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(cles => Promise.all(cles.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(reponse => {
        const copie = reponse.clone();
        caches.open(CACHE).then(c => c.put(e.request, copie));
        return reponse;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
