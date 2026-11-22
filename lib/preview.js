/* Arice 新版本預覽：老師登入首頁後按「🧪 試玩新版本」，這台裝置就會先看到還沒上線的新功能；學生、家長看不到。
   - 新功能一律寫成「上線時間到了 || window.ARPV」才出現，這樣可以先合併上線、讓老師先試。
   - 學習島、勇者衝鋒、學生帳號管理裡，老師登入後左下角也有「🧪 試玩新版本」（從各自的主畫面圖示打開也能用）。
   - 學生或家長帳號在這台裝置登入時，lib/shim.js 會自動把預覽關掉。
   - 這個檔案要放在每一頁其他 Arice 腳本前面載入（同步，不要 defer）。 */
(function () {
  var KEY = 'arice-preview', on = false;
  try { on = localStorage.getItem(KEY) === '1'; } catch (e) {}
  window.ARPV = on;
  window.ARPREVIEW = {
    on: on,
    set: function (v) {
      try { if (v) localStorage.setItem(KEY, '1'); else localStorage.removeItem(KEY); } catch (e) {}
      location.reload();
    },
    /* 學習島、勇者衝鋒裡也能開：老師登入後左下角「🔒 老師」上面出現一顆小按鈕（lib/shim.js 呼叫） */
    teacherButton: function () {
      if (on || document.getElementById('ar-pv-t')) return;
      var b = document.createElement('button');
      b.id = 'ar-pv-t'; b.type = 'button'; b.textContent = '🧪 試玩新版本';
      b.style.cssText = 'position:fixed;left:calc(12px + env(safe-area-inset-left,0px));bottom:calc(62px + env(safe-area-inset-bottom,0px));z-index:2147483000;'
        + 'min-height:36px;padding:0 12px;border-radius:999px;border:0;background:#6b3fd1;color:#fff;font:700 13px system-ui,-apple-system,"PingFang TC","Noto Sans TC",sans-serif;'
        + 'box-shadow:0 4px 14px rgba(0,0,0,.3);cursor:pointer;opacity:.9';
      b.addEventListener('click', function () { window.ARPREVIEW.set(true); });
      document.body.appendChild(b);
    }
  };
  if (!on) return;
  document.documentElement.classList.add('ar-preview');
  function badge() {
    if (document.getElementById('ar-pv')) return;
    var d = document.createElement('div');
    d.id = 'ar-pv';
    d.setAttribute('role', 'status');
    d.innerHTML = '<style>#ar-pv{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 6px);transform:translateX(-50%);z-index:2147483000;display:flex;align-items:center;gap:8px;'
      + 'padding:4px 6px 4px 12px;border-radius:999px;background:#6b3fd1;color:#fff;font:700 13px/1.4 system-ui,-apple-system,"PingFang TC","Noto Sans TC",sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.3)}'
      + '#ar-pv button{font:inherit;border:0;border-radius:999px;padding:3px 10px;background:#fff;color:#4b2a9e;cursor:pointer}'
      + '#ar-pv button:focus-visible{outline:3px solid #ffd23f;outline-offset:2px}</style>'
      + '<span>🧪 新版本預覽中（只有這台看得到）</span><button type="button">關掉</button>';
    d.querySelector('button').addEventListener('click', function () { window.ARPREVIEW.set(false); });
    document.body.appendChild(d);
  }
  if (document.body) badge(); else document.addEventListener('DOMContentLoaded', badge);
})();
