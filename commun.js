// Outils partagés par toutes les pages de natx.fun : son, partage, plein écran, notifications, confettis…
(function () {
  const fichier = location.pathname.split('/').pop().replace(/\.html$/, '');
  const page = fichier || 'index';
  const JEUX = ['college', 'sable', 'labo', 'bouton', 'cosmos', 'melodie', 'patate', 'emojis', 'poids', 'pouvoirs', 'arbre', 'reflexe'];

  function lire(cle, defaut) {
    try { const v = localStorage.getItem(cle); return v === null ? defaut : JSON.parse(v); } catch { return defaut; }
  }
  function ecrire(cle, valeur) {
    try { localStorage.setItem(cle, JSON.stringify(valeur)); } catch {}
  }

  // On retient les jeux déjà essayés (pour l'accueil)
  if (JEUX.includes(page)) {
    const visites = lire('natx-visites', {});
    visites[page] = (visites[page] || 0) + 1;
    ecrire('natx-visites', visites);
  }

  /* ---------- Son ---------- */
  let muet = lire('natx-muet', false), audio = null;
  function contexte() {
    if (muet) return null;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      return audio;
    } catch { return null; }
  }
  function bip(freq = 440, duree = .12, type = 'sine', volume = .12, freqFin) {
    const ac = contexte();
    if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (freqFin) o.frequency.exponentialRampToValueAtTime(freqFin, t + duree);
    g.gain.setValueAtTime(volume, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + duree);
    o.connect(g); g.connect(ac.destination);
    o.start(t); o.stop(t + duree + .02);
  }
  const SONS = {
    bon: () => { bip(660, .1, 'triangle'); setTimeout(() => bip(990, .16, 'triangle'), 90); },
    rate: () => bip(220, .3, 'sawtooth', .07, 110),
    pop: () => bip(500 + Math.random() * 300, .07, 'sine', .1, 900),
    tada: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => bip(f, .18, 'triangle', .1), i * 90)),
    swish: () => bip(900, .12, 'sine', .05, 300),
  };
  function son(nom) { if (SONS[nom]) SONS[nom](); }
  function vibrer(motif) {
    if (!muet && navigator.vibrate) { try { navigator.vibrate(motif); } catch {} }
  }

  /* ---------- Notifications et confettis ---------- */
  let boite = null, minuteur = null;
  function toast(texte, duree = 2400) {
    if (!boite) {
      boite = document.createElement('div');
      boite.className = 'natx-toast';
      boite.setAttribute('role', 'status');
      document.body.appendChild(boite);
    }
    boite.textContent = texte;
    boite.classList.add('visible');
    clearTimeout(minuteur);
    minuteur = setTimeout(() => boite.classList.remove('visible'), duree);
  }

  function confettis(nombre = 110) {
    const couleurs = ['#ff5a36', '#ffd23f', '#3ddc97', '#38bdf8', '#a78bfa', '#ff8fab'];
    for (let i = 0; i < nombre; i++) {
      const c = document.createElement('i');
      c.className = 'natx-confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = couleurs[i % couleurs.length];
      c.style.animationDuration = 2 + Math.random() * 2.5 + 's';
      c.style.animationDelay = Math.random() * .7 + 's';
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 6000);
    }
  }

  // Partage du téléphone si possible, sinon on copie le lien
  async function partager(texte, url = location.href) {
    if (navigator.share) {
      try { await navigator.share({ title: document.title, text: texte, url }); return; }
      catch (e) { if (e.name === 'AbortError') return; }
    }
    try {
      await navigator.clipboard.writeText(texte ? texte + ' ' + url : url);
      toast('🔗 Copié ! Tu peux le coller où tu veux.');
    } catch { toast('😕 Impossible de copier le lien'); }
  }

  function bouton(texte, titre, action) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = texte;
    b.title = titre;
    b.setAttribute('aria-label', titre);
    b.addEventListener('click', action);
    return b;
  }

  // Petits boutons ronds en haut à droite de chaque jeu
  function installerOutils() {
    const retour = document.querySelector('.retour');
    if (retour) {
      retour.title = "Retour à l'accueil";
      retour.setAttribute('aria-label', "Retour à l'accueil de natx.fun");
    }
    if (!JEUX.includes(page)) return;
    const barre = document.createElement('div');
    barre.className = 'natx-outils';
    const bSon = bouton(muet ? '🔇' : '🔊', 'Couper ou remettre le son', () => {
      muet = !muet;
      ecrire('natx-muet', muet);
      bSon.textContent = muet ? '🔇' : '🔊';
      toast(muet ? '🔇 Son coupé' : '🔊 Son activé');
      document.dispatchEvent(new CustomEvent('natx-son', { detail: { muet } }));
    });
    barre.append(bSon, bouton('🔗', 'Partager ce jeu', () => partager('Essaie ce jeu sur natx.fun :')));
    if (document.documentElement.requestFullscreen) {
      barre.append(bouton('⛶', 'Plein écran', () => {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen().catch(() => {});
      }));
    }
    document.body.appendChild(barre);
  }

  // Code secret : ↑ ↑ ↓ ↓ ← → ← → B A
  const SECRET = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let position = 0;
  addEventListener('keydown', e => {
    const touche = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    position = touche === SECRET[position] ? position + 1 : (touche === SECRET[0] ? 1 : 0);
    if (position === SECRET.length) {
      position = 0;
      confettis(160);
      son('tada');
      toast('🎉 Code secret trouvé ! Tu es un vrai gamer.', 3500);
      ecrire('natx-code-secret', true);
    }
  });

  // Mode hors ligne (seulement sur le vrai site, pas en test local)
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  document.addEventListener('DOMContentLoaded', installerOutils);

  window.natx = { page, JEUX, lire, ecrire, bip, son, vibrer, toast, confettis, partager, estMuet: () => muet };
})();
