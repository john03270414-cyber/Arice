/* Arice 平台橋接：讓原本寫給 Claude artifact 的頁面（claude.use('db') 等）改用自己的 Firebase。
   - 每個 app 的資料放在自己的前綴底下（isl_ / brv_）。
   - 登入：老師用 Email；學生用老師發的帳號（代號）＋密碼。登入一次後裝置會記住。
   - 學生登入時，ARICE.me = {role:'student', sid, name}，app 會直接進到他自己的頁面。 */
(function () {
  'use strict';
  var me = document.currentScript;
  var APP = (me && me.dataset.app) || 'app';
  var PRE = (me && me.dataset.prefix != null) ? me.dataset.prefix : (APP + '_');
  var CFG = window.ARICE_FIREBASE || null;
  var EMAIL = (window.ARICE_TEACHER || '').trim().toLowerCase();
  var ME = { role: 'none' };

  /* ---- Firestore can't store arrays directly inside arrays, or undefined: encode on write, decode on read ---- */
  function enc(v, inArr) {
    if (v === undefined) return null;
    if (v === null || typeof v !== 'object') return (typeof v === 'number' && !isFinite(v)) ? null : v;
    if (Array.isArray(v)) { var a = v.map(function (x) { return enc(x, true); }); return inArr ? { __arr: a } : a; }
    if (v instanceof Date) return v.getTime();
    var o = {}; Object.keys(v).forEach(function (k) { if (v[k] !== undefined && typeof v[k] !== 'function') o[k] = enc(v[k], false); }); return o;
  }
  function dec(v) {
    if (v === null || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map(dec);
    if (typeof v.toMillis === 'function') return v.toMillis();
    var ks = Object.keys(v);
    if (ks.length === 1 && ks[0] === '__arr' && Array.isArray(v.__arr)) return v.__arr.map(dec);
    var o = {}; ks.forEach(function (k) { if (k !== '_uid') o[k] = dec(v[k]); }); return o;
  }
  /* students' writes carry their uid so the database rules can tell whose record it is */
  function clean(d) { var o = enc(JSON.parse(JSON.stringify(d === undefined ? {} : d)), false); if (ME.role === 'student' && ME.uid) o._uid = ME.uid; return o; }

  /* ---- snapshots shaped like the Claude db's ---- */
  function meta(s) { var m = s.metadata || {}; return { fromCache: !!m.fromCache, hasPendingWrites: !!m.hasPendingWrites }; }
  function dsnap(s) { return { id: s.id, exists: !!s.exists, metadata: meta(s), data: function () { return s.exists ? dec(s.data()) : undefined; } }; }
  function qsnap(q) { var docs = q.docs.map(dsnap); return { docs: docs, size: docs.length, empty: !docs.length, metadata: meta(q), forEach: function (f) { docs.forEach(f); } }; }

  var fs = null, auth = null, ready = null;
  function path(p) { p = String(p || '').replace(/^\/+|\/+$/g, ''); var i = p.indexOf('/'); return i < 0 ? PRE + p : PRE + p.slice(0, i) + p.slice(i); }

  function wrapQ(q) {
    return {
      where: function (f, op, v) { return wrapQ(q.where(f, op === '=' ? '==' : op, enc(JSON.parse(JSON.stringify({ v: v })), false).v)); },
      orderBy: function (f, d) { return wrapQ(q.orderBy(f, d || 'asc')); },
      limit: function (n) { return wrapQ(q.limit(n)); },
      get: function () { return q.get().then(qsnap); },
      onSnapshot: function (next, err) { return q.onSnapshot(function (s) { next(qsnap(s)); }, function (e) { if (err) err(e); else console.warn('snapshot', e); }); }
    };
  }
  function wrapD(r) {
    return {
      id: r.id, path: r.path,
      get: function () { return r.get().then(dsnap); },
      set: function (d, o) { return (o && o.merge) ? r.set(clean(d), { merge: true }) : r.set(clean(d)); },
      update: function (d) { var c = clean(d); return r.update(c).catch(function (e) { if (e && e.code === 'not-found') return r.set(c, { merge: true }); throw e; }); },
      delete: function () { return r.delete(); },
      onSnapshot: function (next, err) { return r.onSnapshot(function (s) { next(dsnap(s)); }, function (e) { if (err) err(e); else console.warn('snapshot', e); }); }
    };
  }
  function wrapC(c) {
    var q = wrapQ(c);
    q.id = c.id;
    q.doc = function (id) { return wrapD(id === undefined ? c.doc() : c.doc(String(id))); };
    q.add = function (d) { return c.add(clean(d)).then(wrapD); };
    return q;
  }
  var DB = {
    doc: function (p) { return wrapD(fs.doc(path(p))); },
    collection: function (p) { return wrapC(fs.collection(path(p))); },
    batch: function (writes) { var b = fs.batch(); writes.forEach(function (w) { var r = fs.doc(path(w.path)); if (w.op === 'delete') b.delete(r); else b.set(r, clean(w.data), w.merge ? { merge: true } : undefined); }); return b.commit(); }
  };

  /* ---- login screen (teacher Email, or a student's account code) ---- */
  var CSS = '<style>#ar-login{position:fixed;inset:0;z-index:100000;display:grid;place-items:center;padding:20px;background:radial-gradient(circle at 50% 30%,#2a1a2e,#0b0710);font-family:system-ui,-apple-system,"PingFang TC","Noto Sans TC",sans-serif;color:#F0E6DA;overflow:auto}'
    + '#ar-login.inline{position:static;display:block;padding:0;background:none;overflow:visible}'
    + '#ar-login form{width:100%;max-width:380px;background:#17111B;border:1px solid #3A2C38;border-radius:22px;padding:26px;box-shadow:0 30px 80px rgba(0,0,0,.5)}'
    + '#ar-login.inline form{max-width:none;box-shadow:none}'
    + '#ar-login h1{margin:0 0 4px;font-size:24px}#ar-login p{margin:0 0 14px;color:#A8998F;font-size:15px;line-height:1.6}'
    + '#ar-login label{display:block;font-size:14px;color:#A8998F;margin:12px 0 6px}'
    + '#ar-login input{width:100%;box-sizing:border-box;font-size:20px;padding:12px 14px;border-radius:12px;border:1.5px solid #3A2C38;background:#0f0a12;color:#F0E6DA}'
    + '#ar-login input:focus{outline:none;border-color:#E2513F}'
    + '#ar-login .pwrow{position:relative}#ar-login .pwrow input{padding-right:84px}'
    + '#ar-login .eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);min-height:40px;padding:0 12px;border:0;border-radius:10px;background:#2A1F30;color:#F0E6DA;font-size:15px}'
    + '#ar-login .go{margin-top:18px;width:100%;min-height:54px;border:0;border-radius:14px;background:#E2513F;color:#fff;font-size:19px;font-weight:700}'
    + '#ar-login .go:disabled{opacity:.7}'
    + '#ar-login .forgot{display:block;margin:12px auto 0;min-height:40px;padding:0 10px;border:0;background:none;color:#F0B341;font-size:15px;text-decoration:underline}'
    + '#ar-login .err{color:#FF8A7E;min-height:22px;margin-top:10px;font-size:15px;line-height:1.6}#ar-login .err.ok{color:#8FD9A8}'
    + '#ar-home{position:fixed;left:calc(12px + env(safe-area-inset-left,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:5;display:inline-flex;align-items:center;min-height:40px;padding:0 14px;border-radius:999px;background:rgba(23,17,27,.88);border:1px solid rgba(255,255,255,.18);color:#F0E6DA;font:15px system-ui,-apple-system,"PingFang TC","Noto Sans TC",sans-serif;text-decoration:none}'
    + 'html:not(.ar-student) #ar-home{bottom:calc(60px + env(safe-area-inset-bottom,0px))}'
    + '#tlock[hidden]~#ar-home,body.ingame #ar-home,body.induel #ar-home,body.inteach #ar-home{display:none}'
    + 'html.ar-student #tlock,html.ar-student .tlock{display:none!important}</style>';
  function loginUI(msg) {
    var o = document.getElementById('ar-login');
    if (!o) {
      var slot = document.getElementById('ar-login-slot');
      o = document.createElement('div'); o.id = 'ar-login'; if (slot) o.className = 'inline';
      o.innerHTML = CSS + '<form autocomplete="on"><h1>登入</h1><p>學生：輸入老師給你的帳號和密碼。<br>老師：輸入你的 Email 和密碼。</p>'
        + '<label for="ar-em">帳號</label><input id="ar-em" type="text" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required>'
        + '<label for="ar-pw">密碼</label><div class="pwrow"><input id="ar-pw" type="password" autocomplete="current-password" required>'
        + '<button type="button" class="eye" aria-pressed="false">顯示</button></div>'
        + '<button type="submit" class="go">登入</button><div class="err" role="alert"></div>'
        + '<button type="button" class="forgot">忘記密碼？</button></form>';
      (slot || document.body).appendChild(o);
      var em = o.querySelector('#ar-em'), pw = o.querySelector('#ar-pw'), er = o.querySelector('.err'), bt = o.querySelector('.go'), eye = o.querySelector('.eye');
      var say = function (t, ok) { er.textContent = t; er.className = ok ? 'err ok' : 'err'; };
      try { em.value = localStorage.getItem('ar-last') || ''; } catch (e) {}
      if (!slot) (em.value ? pw : em).focus();
      eye.addEventListener('click', function () {
        var show = pw.type === 'password'; pw.type = show ? 'text' : 'password';
        eye.textContent = show ? '隱藏' : '顯示'; eye.setAttribute('aria-pressed', show ? 'true' : 'false'); pw.focus();
      });
      o.querySelector('.forgot').addEventListener('click', function () {
        var id = em.value.trim().toLowerCase();
        if (id.indexOf('@') < 0) { say('學生忘記密碼：請找老師，老師可以幫你查。老師忘記密碼：先在「帳號」輸入 Email，再按一次「忘記密碼？」。'); return; }
        if (!EMAIL || id !== EMAIL) { say('只有老師的 Email 可以用信箱重設密碼。學生請找老師。'); return; }
        say('寄信中…', true);
        try { auth.languageCode = 'zh-TW'; } catch (e) {}
        auth.sendPasswordResetEmail(id).then(function () {
          say('已經寄出重設密碼的信到 ' + id + '。請打開信箱點信裡的連結設定新密碼（沒看到的話找找垃圾郵件）。', true);
        }).catch(function (x) {
          var c = x && x.code || '';
          say((/network|unavailable/.test(c) ? '連不上網路，請檢查 Wi-Fi 再試一次。' : /too-many/.test(c) ? '試太多次了，請等幾分鐘再試。' : '信寄不出去，請再試一次。') + (c ? '（' + c + '）' : ''));
        });
      });
      o.querySelector('form').addEventListener('submit', function (e) {
        e.preventDefault(); say(''); bt.disabled = true; bt.textContent = '登入中…';
        var id = em.value.trim().toLowerCase();
        var fail = function (t) { say(t); bt.disabled = false; bt.textContent = '登入'; };
        var toEmail = id.indexOf('@') >= 0 ? Promise.resolve(id)
          : fs.doc('login/' + id.replace(/[^a-z0-9_-]/g, '')).get().then(function (s) { if (!s.exists) throw { code: 'no-account' }; return s.data().email; });
        toEmail.then(function (mail) { return auth.signInWithEmailAndPassword(mail, pw.value); })
          .then(function () { try { localStorage.setItem('ar-last', id); } catch (e) {} })
          .catch(function (x) {
            var c = x && x.code || '';
            fail((c === 'no-account' ? '沒有這個帳號，請檢查一下，或問老師。' : /network|unavailable/.test(c) ? '連不上網路，請檢查 Wi-Fi 再試一次。' : /too-many/.test(c) ? '試太多次了，請等幾分鐘再試。' : /operation-not-allowed/.test(c) ? 'Firebase 還沒開啟「電子郵件/密碼」登入。' : /api-key|app-not-authorized|unauthorized-domain/.test(c) ? '網站設定有問題，請截圖給 Claude。' : '帳號或密碼不對。可以按「顯示」檢查有沒有打錯，再試一次。') + (c && c !== 'no-account' ? '（' + c + '）' : ''));
          });
      });
    }
    if (msg) { var d = o.querySelector('.err'); d.textContent = msg; d.className = 'err'; }
  }
  /* 遊戲裡的「🏠 首頁」：從平台首頁進來、或用瀏覽器分頁開的時候才出現（單獨裝在主畫面的遊戲圖示不顯示） */
  var ROOT = (function () { try { return new URL('../', me.src).href; } catch (e) { return null; } })();
  function homeLink() {
    if (!ROOT || (APP !== 'island' && APP !== 'brave') || document.getElementById('ar-home')) return;
    var alone = false, hub = false;
    try { alone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; } catch (e) {}
    try { hub = sessionStorage.getItem('ar-hub') === '1'; } catch (e) {}
    if (alone && !hub) return;
    if (!document.getElementById('ar-css')) { var st = document.createElement('div'); st.id = 'ar-css'; st.innerHTML = CSS; document.body.appendChild(st); }
    var a = document.createElement('a'); a.id = 'ar-home'; a.href = ROOT; a.textContent = '🏠 首頁';
    var t = document.getElementById('tlock');
    if (t && t.parentNode) t.parentNode.insertBefore(a, t.nextSibling); else document.body.appendChild(a);
  }
  /* 離線快取：網路慢或斷線時，頁面和題庫還是打得開 */
  function offline() {
    try { if (ROOT && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register(new URL('sw.js', ROOT).href, { scope: new URL(ROOT).pathname }).catch(function () {}); } catch (e) {}
  }
  offline();
  function studentBar() {
    if (ME.role !== 'student' || document.documentElement.classList.contains('ar-student')) return;
    document.documentElement.classList.add('ar-student');
    if (!document.getElementById('ar-css')) { var st = document.createElement('div'); st.id = 'ar-css'; st.innerHTML = CSS; document.body.appendChild(st); }
    /* 學生自己登入時，「換人」按鈕改成「登出」 */
    var fix = function () { var l = document.querySelectorAll('[data-act="home"]'); for (var i = 0; i < l.length; i++) if (/換人/.test(l[i].textContent)) { l[i].textContent = l[i].textContent.replace('換人', '登出'); l[i].setAttribute('data-act', 'arLogout'); } };
    fix(); new MutationObserver(fix).observe(document.body, { childList: true, subtree: true });
    document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('[data-act="arLogout"]'); if (!t) return; e.stopPropagation(); e.preventDefault(); if (confirm((ME.name || '') + '，要登出嗎？登出後要重新輸入帳號密碼。')) signOut(); }, true);
  }
  function whenBody(f) { if (document.body) f(); else document.addEventListener('DOMContentLoaded', f); }
  function signOut() { return auth.signOut().then(function () { location.reload(); }); }
  function boot() {
    if (ready) return ready;
    ready = new Promise(function (resolve) {
      if (!CFG || !window.firebase) { console.warn('Firebase 沒有設定'); resolve(false); return; }
      if (!firebase.apps.length) firebase.initializeApp(CFG);
      auth = firebase.auth(); fs = firebase.firestore();
      try { fs.enablePersistence({ synchronizeTabs: true }).catch(function () {}); } catch (e) {}
      auth.onAuthStateChanged(function (u) {
        if (!u) { ME = { role: 'none' }; whenBody(function () { loginUI(); }); return; }
        var mail = (u.email || '').toLowerCase();
        if (EMAIL && mail === EMAIL) { ME = { role: 'teacher', uid: u.uid, name: '老師' }; done(); return; }
        fs.doc('members/' + u.uid).get().then(function (s) {
          if (!s.exists) { auth.signOut(); whenBody(function () { loginUI('這個帳號已經停用，請找老師。'); }); return; }
          var m = s.data(); ME = { role: 'student', uid: u.uid, sid: m.sid, name: m.name || '', code: m.code || '' }; done();
        }).catch(function () { whenBody(function () { loginUI('連不上網路，請檢查 Wi-Fi 再重新整理。'); }); });
        function done() { var l = document.getElementById('ar-login'); if (l) l.remove(); whenBody(studentBar); whenBody(homeLink); resolve(true); }
      });
    });
    return ready;
  }
  function user() {
    var ok = ME.role === 'teacher';
    return {
      isOwner: function () { return Promise.resolve(ok); }, canEdit: function () { return Promise.resolve(ok); },
      can: function () { return Promise.resolve(ok || ME.role === 'student'); }, id: function () { return Promise.resolve(ME.uid || null); },
      me: function () { return Promise.resolve({ id: ME.uid || null, name: ME.name || '' }); },
      profiles: function () { return Promise.resolve({}); }
    };
  }
  var downloads = {
    save: function (o) {
      return new Promise(function (res) {
        var data = o && o.data; var blob = data instanceof Blob ? data : new Blob([String(data == null ? '' : data)], { type: 'text/plain;charset=utf-8' });
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = (o && o.filename) || 'file.txt';
        document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000); res({ ok: true });
      });
    }
  };
  window.claude = {
    use: function (name) {
      if (name === 'db') return boot().then(function (ok) { return ok ? DB : null; });
      if (name === 'user') return boot().then(function (ok) { return ok ? user() : null; });
      if (name === 'downloads') return Promise.resolve(downloads);
      return Promise.resolve(null);   /* sample（AI）等功能在自架版本沒有 */
    }
  };
  window.ARICE = {
    boot: boot, db: function () { return DB; }, raw: function () { return fs; }, auth: function () { return auth; },
    get me() { return ME; }, prefix: PRE, signOut: signOut, cfg: CFG, teacher: EMAIL, root: ROOT
  };
})();
