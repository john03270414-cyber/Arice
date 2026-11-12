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
    if (typeof window.ARICE_LOGIN === 'function') { window.ARICE_LOGIN(msg || ''); return; }
    var o = document.getElementById('ar-login');
    if (!o) {
      var slot = document.getElementById('ar-login-slot');
      o = document.createElement('div'); o.id = 'ar-login'; if (slot) o.className = 'inline';
      o.innerHTML = CSS + '<form autocomplete="on"><h1>登入</h1><p>學生：輸入你的帳號（例如 a11501）和密碼。<br>第一次登入請用老師給的「通行碼」當密碼。<br>老師：輸入你的 Email 和密碼。</p>'
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
        if (id.indexOf('@') < 0) { say('學生忘記密碼：請找老師幫你重設，再用通行碼登入、設定新密碼。老師忘記密碼：先在「帳號」輸入 Email，再按一次「忘記密碼？」。'); return; }
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
        lastPw = pw.value;
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
  /* ---- 學生第一次登入：把通行碼換成自己的密碼 ---- */
  var PWSET = 'pw-set', lastPw = '';
  function setPwUI(u, m, done) {
    var old = document.getElementById('ar-login'); if (old) old.remove();
    var slot = document.getElementById('ar-login-slot');
    var o = document.createElement('div'); o.id = 'ar-login'; if (slot) o.className = 'inline';
    var name = (m && m.name) || '';
    var par = m && m.role === 'parent';
    o.innerHTML = CSS + (par ? '<form autocomplete="on"><h1>設定家長密碼</h1><p>' + (name ? escH(name) + ' 的家長您好！' : '家長您好！') + '這是第一次登入。<br>請設定一組您自己的密碼，以後選好小孩後就用這組密碼登入。</p>' : '<form autocomplete="on"><h1>設定你自己的密碼</h1><p>' + (name ? escH(name) + '，歡迎！' : '歡迎！') + '這是你第一次登入。<br>請設定一組只有你知道的密碼，以後就用「帳號 <b>' + escH((m && m.code) || '') + '</b>」加上這組密碼登入。</p>')
      + '<input type="text" autocomplete="username" value="' + escH((m && m.code) || '') + '" hidden>'
      + '<div class="oldrow" hidden><label for="ar-old">' + (par ? '預設密碼 000000' : '老師給的通行碼') + '</label><input id="ar-old" type="password" autocomplete="current-password"></div>'
      + '<label for="ar-n1">新密碼（至少 6 個字，英文或數字都可以）</label><div class="pwrow"><input id="ar-n1" type="password" autocomplete="new-password" minlength="6" required><button type="button" class="eye" aria-pressed="false">顯示</button></div>'
      + '<label for="ar-n2">再輸入一次</label><input id="ar-n2" type="password" autocomplete="new-password" minlength="6" required>'
      + '<button type="submit" class="go">設定好了，進去</button><div class="err" role="alert"></div>'
      + '<button type="button" class="forgot">不是我，登出</button></form>';
    (slot || document.body).appendChild(o);
    var n1 = o.querySelector('#ar-n1'), n2 = o.querySelector('#ar-n2'), op = o.querySelector('#ar-old'), orow = o.querySelector('.oldrow'), er = o.querySelector('.err'), bt = o.querySelector('.go'), eye = o.querySelector('.eye');
    var say = function (t, ok) { er.textContent = t; er.className = ok ? 'err ok' : 'err'; };
    if (!slot) n1.focus();
    eye.addEventListener('click', function () { var show = n1.type === 'password'; n1.type = n2.type = show ? 'text' : 'password'; eye.textContent = show ? '隱藏' : '顯示'; eye.setAttribute('aria-pressed', show ? 'true' : 'false'); });
    o.querySelector('.forgot').addEventListener('click', function () { signOut(); });
    o.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault(); say('');
      var p = n1.value;
      if (p.length < 6) return say('密碼至少要 6 個字。');
      if (p !== n2.value) return say('兩次輸入的不一樣，請再打一次。');
      if ((lastPw && p === lastPw) || (par && p === '000000')) return say(par ? '不能用 000000，請換一組您自己的密碼。' : '不能跟老師給的通行碼一樣，請換一組只有你知道的。');
      if (!orow.hidden && op.value && p === op.value) return say('不能跟老師給的通行碼一樣，請換一組只有你知道的。');
      bt.disabled = true; bt.textContent = '設定中…';
      var re = (!orow.hidden && op.value) ? u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email, op.value)) : Promise.resolve();
      re.then(function () { return u.updatePassword(p); })
        .then(function () { return u.updateProfile({ displayName: PWSET }); })
        .then(function () {
          /* 讓老師的帳號頁知道這個學生已經自己設好密碼（資料庫規則不允許也沒關係） */
          fs.doc('members/' + u.uid).set({ pwSet: true, pwAt: Date.now() }, { merge: true }).catch(function () {});
          lastPw = ''; o.remove(); done();
        })
        .catch(function (x) {
          var c = x && x.code || ''; bt.disabled = false; bt.textContent = '設定好了，進去';
          if (/requires-recent-login/.test(c)) { orow.hidden = false; op.focus(); return say(par ? '為了安全，請先輸入一次預設密碼 000000，再按一次「設定好了」。' : '為了安全，請先輸入一次老師給的通行碼，再按一次「設定好了」。'); }
          say((/weak-password/.test(c) ? '這組密碼太簡單了，請換一組至少 6 個字的。' : /wrong-password|invalid-credential|invalid-login/.test(c) ? '通行碼不對，請再檢查一次。' : /network|unavailable/.test(c) ? '連不上網路，請檢查 Wi-Fi 再試一次。' : /too-many/.test(c) ? '試太多次了，請等幾分鐘再試。' : '沒有設定成功，請再試一次。') + (c ? '（' + c + '）' : ''));
        });
    });
  }
  /* 帳號走錯地方：家長進了學習島，或學生進了家長專區 */
  function wrongPlace(isPar) {
    var old = document.getElementById('ar-login'); if (old) old.remove();
    var o = document.createElement('div'); o.id = 'ar-login';
    var href = ROOT ? ROOT + (isPar ? 'parent.html' : '') : (isPar ? 'parent.html' : './');
    o.innerHTML = CSS + '<form><h1>' + (isPar ? '這是家長帳號' : '這是學生帳號') + '</h1><p>' + (isPar ? '家長帳號請到「家長專區」看小孩的學習情形。' : '家長專區要用家長帳號登入。學生請回到學習島。') + '</p>'
      + '<a class="go" style="display:block;text-align:center;text-decoration:none;line-height:48px" href="' + escH(href) + '">' + (isPar ? '前往家長專區' : '回到首頁') + '</a>'
      + '<button type="button" class="forgot">登出，換別的帳號</button></form>';
    document.body.appendChild(o);
    o.querySelector('.forgot').addEventListener('click', function () { signOut(); });
  }
  function escH(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
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
    try { if (ROOT && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.getRegistrations().then(function (rs) { rs.forEach(function (r) { r.unregister(); }); }).catch(function () {});
      try{if(navigator.audioSession&&navigator.audioSession.type!=='playback')navigator.audioSession.type='playback'}catch(e){} } catch (e) {}
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
      /* 不用瀏覽器的離線資料庫：iPad Safari 上它常常卡住，讓頁面一直停在「讀取中」。改成每次都直接連雲端。
         網路會自動偵測，必要時改用相容性較好的連線方式。 */
      try { fs.settings({ experimentalAutoDetectLongPolling: true, merge: true }); } catch (e) {}
      auth.onAuthStateChanged(function (u) {
        if (!u) { ME = { role: 'none' }; whenBody(function () { loginUI(); }); return; }
        var mail = (u.email || '').toLowerCase();
        if (EMAIL && mail === EMAIL) { ME = { role: 'teacher', uid: u.uid, name: '老師' }; done(); return; }
        getMember(u.uid, 0).then(function (s) {
          if (!s.exists) { auth.signOut(); whenBody(function () { loginUI('這個帳號已經停用，請找老師。'); }); return; }
          var m = s.data(); var isPar = m.role === 'parent';
          ME = { role: isPar ? 'parent' : 'student', uid: u.uid, sid: m.sid, name: m.name || '', code: m.code || '' };
          /* 家長帳號只能進家長專區；學生帳號不能進家長專區 */
          if (isPar !== (APP === 'parent') && APP !== 'home') { whenBody(function () { wrongPlace(isPar); }); return; }
          /* 第一次用老師給的通行碼登入：先設定自己的密碼才能進去（設好後 displayName 會標記 pw-set） */
          if (u.displayName !== PWSET) { whenBody(function () { setPwUI(u, m, done); }); return; }
          done();
        }).catch(function (x) {
          var c = (x && x.code) || (x && x.message) || 'unknown';
          /* 這台裝置的暫存可能壞了：自動清掉暫存、重新整理一次 */
          var tried = false; try { tried = sessionStorage.getItem('ar-fixcache') === '1'; } catch (e) {}
          if (!tried && c !== 'permission-denied') {
            try { sessionStorage.setItem('ar-fixcache', '1'); } catch (e) {}
            fs.terminate().then(function () { return fs.clearPersistence(); }).catch(function () {}).then(function () { location.reload(); });
            return;
          }
          whenBody(function () { loginUI((c === 'permission-denied' ? '這個帳號讀不到資料（沒有權限），請截圖給老師。' : '讀不到帳號資料，請確認 Wi-Fi 後重新整理；還是不行請截圖給老師。') + '（' + c + '）'); });
        });
        /* 讀帳號資料：失敗時等一下再試，最多 3 次 */
        function getMember(uid, n) {
          return fs.doc('members/' + uid).get(n ? { source: 'server' } : undefined).then(function (s) {
            try { sessionStorage.removeItem('ar-fixcache'); } catch (e) {} return s;
          }).catch(function (x) {
            if (n >= 2 || (x && x.code) === 'permission-denied') throw x;
            return new Promise(function (r) { setTimeout(r, 1500); }).then(function () { return getMember(uid, n + 1); });
          });
        }
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
