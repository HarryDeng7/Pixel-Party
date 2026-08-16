/* ============================================================
   Firebase init + Firestore + user accounts (vanilla module)
   Loaded only by the hub page (index.html).

   NOTE: Firebase API keys are public by design for web apps.
   Real security comes from Firestore rules and Auth settings
   in the Firebase console - not from hiding this file.

   One-time console setup:
   1. Authentication > Sign-in method > enable Email/Password.
   2. Firestore Database > Rules:
      match /users/{uid} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.2.0/firebase-analytics.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.2.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/12.2.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCYYUdmUELaNenSXByWtfiOCI_pt__THiQ",
  authDomain: "pixel-party-e34b3.firebaseapp.com",
  projectId: "pixel-party-e34b3",
  storageBucket: "pixel-party-e34b3.firebasestorage.app",
  messagingSenderId: "978682682842",
  appId: "1:978682682842:web:f3364f0c7877efafdd34e3",
  measurementId: "G-906DRM70TK"
};

let app, db, auth;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  try { getAnalytics(app); } catch (e) { /* analytics is optional */ }
  window.__pgFirebase = { ok: true };
} catch (e) {
  window.__pgFirebase = { ok: false, error: String(e) };
}/* ---------------- accounts UI (hub only) ---------------- */
(function () {
  const F = window.__pgFirebase;
  if (!F || !F.ok) return; // Firebase unreachable - the arcade still works

  const $ = function (id) { return document.getElementById(id); };
  const mask = $('authMask'), emailEl = $('authEmail'), passEl = $('authPass');
  const submit = $('authSubmit'), errEl = $('authErr');
  const tabIn = $('tabIn'), tabUp = $('tabUp');
  const btn = $('accountBtn'), userEl = $('accountUser'), outBtn = $('signOutBtn');
  if (!mask || !btn || !emailEl || !passEl || !submit || !errEl) return;

  let mode = 'in';

  const MSGS = {
    'auth/email-already-in-use': 'Email already registered - switch to SIGN IN.',
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/invalid-email': 'That email address is not valid.',
    'auth/weak-password': 'Password is too weak (at least 6 characters).',
    'auth/operation-not-allowed': 'Email/password sign-in is not enabled in the Firebase console.',
    'auth/network-request-failed': 'Network error - check your connection.',
    'auth/too-many-requests': 'Too many attempts - wait a moment and retry.',
    'auth/missing-password': 'Enter a password.'
  };

  function setMode(m) {
    mode = m;
    tabIn.classList.toggle('active', m === 'in');
    tabUp.classList.toggle('active', m === 'up');
    submit.textContent = m === 'in' ? 'SIGN IN' : 'CREATE ACCOUNT';
    errEl.textContent = '';
  }
  function showErr(code) {
    errEl.textContent = MSGS[code] || ('Sign-in failed: ' + (code || 'unknown error'));
  }
  function showState(u) {
    if (u) {
      btn.classList.add('hidden');
      userEl.textContent = u.email;
      userEl.classList.remove('hidden');
      outBtn.classList.remove('hidden');
      mask.classList.remove('open');
    } else {
      btn.classList.remove('hidden');
      userEl.classList.add('hidden');
      outBtn.classList.add('hidden');
    }
  }
  function saveProfile(u) {
    return setDoc(doc(db, 'users', u.uid), {
      email: u.email,
      displayName: u.displayName || (u.email || 'player').split('@')[0],
      lastLogin: serverTimestamp()
    }, { merge: true }).catch(function (e) {
      console.warn('Firestore profile write skipped:', e.code || e);
    });
  }

  btn.addEventListener('click', function () {
    setMode('in');
    mask.classList.add('open');
    emailEl.focus();
  });
  mask.addEventListener('click', function (e) { if (e.target === mask) mask.classList.remove('open'); });
  tabIn.addEventListener('click', function () { setMode('in'); });
  tabUp.addEventListener('click', function () { setMode('up'); });
  outBtn.addEventListener('click', function () {
    signOut(auth).catch(function (e) { console.warn('signOut:', e.code || e); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') mask.classList.remove('open'); });

  submit.addEventListener('click', function () {
    const email = emailEl.value.trim();
    const pass = passEl.value;
    if (!email || !pass) { errEl.textContent = 'Enter email and password.'; return; }
    submit.disabled = true;
    errEl.textContent = 'Working...';
    const done = function () { submit.disabled = false; };
    const p = mode === 'up'
      ? createUserWithEmailAndPassword(auth, email, pass).then(function (cred) {
          if (cred.user) {
            return updateProfile(cred.user, { displayName: email.split('@')[0] });
          }
        })
      : signInWithEmailAndPassword(auth, email, pass);
    p.then(function () { mask.classList.remove('open'); })
     .catch(function (e) { showErr(e.code); })
     .then(done);
  });

  onAuthStateChanged(auth, function (u) {
    showState(u);
    if (u) {
      saveProfile(u);
      try { localStorage.setItem('pixel-party-user', JSON.stringify({ uid: u.uid, email: u.email })); } catch (e) { }
    } else {
      try { localStorage.removeItem('pixel-party-user'); } catch (e) { }
    }
    window.PGPoints && PGPoints.render();
  });
})();