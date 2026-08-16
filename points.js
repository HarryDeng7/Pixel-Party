/* ============================================================
   Pixel Party - points memory (localStorage).
   Every player starts with 10 points. Each game costs 1 point,
   paid when the game ends. Balances are stored per user:
   - signed-in users: keyed by their Firebase uid
   - guests: a shared guest pool
   ============================================================ */
(function () {
  var KEY_USER = 'pixel-party-user';
  function userKey() {
    try {
      var u = JSON.parse(localStorage.getItem(KEY_USER) || 'null');
      if (u && u.uid) return 'pixel-party-points-' + u.uid;
    } catch (e) { }
    return 'pixel-party-points-guest';
  }
  function balance() {
    try {
      var raw = localStorage.getItem(userKey());
      if (raw === null) return 10;
      var v = Number(raw);
      return isFinite(v) && v >= 0 ? Math.floor(v) : 10;
    } catch (e) { return 10; }
  }
  function setBalance(n) {
    try { localStorage.setItem(userKey(), String(Math.max(0, Math.floor(n)))); } catch (e) { }
  }
  var session = false, spent = false;
  function afterGame() {
    if (!session || spent) return;
    spent = true;
    setBalance(balance() - 1);
    render();
  }
  function render() {
    var chip = document.getElementById('pgPointsChip');
    if (chip) chip.textContent = 'POINTS: ' + balance();
    var line = document.getElementById('pgPts');
    if (line) line.textContent = 'POINTS LEFT: ' + balance();
  }
  var toastTimer = null;
  function toast(msg) {
    var t = document.getElementById('pgToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'pgToast';
      t.style.cssText = 'position:fixed;top:64px;left:50%;transform:translateX(-50%);background:#3b2b5e;color:#ffd34a;border:2px solid #ffd34a;padding:10px 18px;font:800 13px "Courier New",monospace;z-index:99;display:none;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.style.display = 'none'; }, 1800);
  }
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.id || (t.id !== 'startBtn' && t.id !== 'restartBtn' && t.id !== 'rematchBtn')) return;
    if (balance() <= 0) {
      e.preventDefault();
      e.stopImmediatePropagation();
      toast('OUT OF POINTS - 0 LEFT');
      return;
    }
    session = true;
    spent = false;
  }, true);
  function addLine() {
    var host = document.getElementById('startOverlay') || document.getElementById('overlay');
    if (!host || document.getElementById('pgPts')) return;
    var d = document.createElement('div');
    d.id = 'pgPts';
    d.style.cssText = 'margin-top:10px;font:700 12px "Courier New",monospace;color:#39ff14;';
    d.textContent = 'POINTS LEFT: ' + balance();
    host.appendChild(d);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { addLine(); render(); });
  } else {
    addLine();
    render();
  }
  window.addEventListener('storage', function () { render(); });
  window.PGPoints = { balance: balance, afterGame: afterGame, render: render };
})();
