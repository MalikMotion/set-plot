/* A small toolbar above a selected text label on the plan, matching the one on notes:
   Heading · Body · Bold · Italic · Underline · Duplicate · Delete.
   Plus a corner handle to resize the text. It snaps to the standard sizes and to the size of any other text on the
   plan, so labels are easy to keep the same size (hold Alt to resize freely).
   It talks to the app through window.__spText (set up inside the app bundle). */
(function () {
  var css = '#txtBar{position:fixed;z-index:59;display:flex;gap:2px;padding:4px;border-radius:10px;background:var(--card);box-shadow:var(--shadow);transform:translateX(-50%);animation:txtBarIn .16s ease}' +
    '#txtBar[hidden]{display:none}' +
    '#txtBar button{border:0;background:transparent;border-radius:7px;width:30px;height:28px;display:grid;place-items:center;color:var(--ink);cursor:pointer;font:600 14px/1 var(--sans);transition:background-color .2s ease,color .2s ease}' +
    '#txtBar button:hover{background:var(--hover)}' +
    '#txtBar button.on{background:var(--accent-soft,rgba(59,110,245,.14));color:var(--accent)}' +
    '#txtBar button.del:hover{color:var(--danger)}' +
    '#txtBar .fh{font-weight:800;font-size:13px}#txtBar .fp{font-weight:500;font-size:11.5px;letter-spacing:-.02em}' +
    '#txtBar i{font-family:Georgia,serif;font-size:15px}#txtBar u{text-underline-offset:2px}' +
    '#txtBar .sep{width:1px;align-self:stretch;margin:4px 3px;background:var(--line)}' +
    '#txtBar svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}' +
    '@keyframes txtBarIn{from{opacity:0;transform:translate(-50%,4px)}}' +
    'body.presenting #txtBar,body.view-only #txtBar{display:none!important}' +
    '#txtRz{position:fixed;z-index:58;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:3px;background:var(--paper,#fff);border:2px solid var(--accent);box-sizing:border-box;cursor:nwse-resize;touch-action:none}' +
    '#txtRz[hidden],#txtRzTip[hidden]{display:none}#txtRz:hover{transform:scale(1.25)}' +
    '#txtRzTip{position:fixed;z-index:61;padding:4px 8px;border-radius:7px;background:var(--ink);color:var(--card);font:600 11.5px/1.2 var(--sans);white-space:nowrap;pointer-events:none;transform:translate(14px,10px)}' +
    '#txtRzTip.snap{background:var(--accent);color:#fff}' +
    'body.presenting #txtRz,body.view-only #txtRz{display:none!important}';
  var mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent), M = mac ? '⌘' : 'Ctrl+';
  var B = [
    ['h1', '<span class="fh">H</span>', 'Heading'],
    ['body', '<span class="fp">Aa</span>', 'Body text'],
    0,
    ['b', '<b>B</b>', 'Bold (' + M + 'B)'],
    ['i', '<i>I</i>', 'Italic (' + M + 'I)'],
    ['u', '<u>U</u>', 'Underline (' + M + 'U)'],
    0,
    ['dup', '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/></svg>', 'Duplicate'],
    ['del', '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>', 'Delete']
  ];
  var bar, last = '';
  function make() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    bar = document.createElement('div'); bar.id = 'txtBar'; bar.hidden = true; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Text');
    bar.innerHTML = B.map(function (b) { return b ? '<button type="button" data-k="' + b[0] + '" title="' + b[2] + '" aria-label="' + b[2] + '"' + (b[0] === 'del' ? ' class="del"' : '') + '>' + b[1] + '</button>' : '<span class="sep"></span>'; }).join('');
    bar.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); });   /* keep the selection */
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button'), T = window.__spText; if (!b || !T) return; e.stopPropagation();
      var ed = document.querySelector('.txt-edit'); if (ed) ed.blur();   /* finish typing first */
      var k = b.dataset.k;
      setTimeout(function () { if (k === 'dup') T.dup(); else if (k === 'del') T.del(); else T.fmt(k); last = ''; }, 0);
    });
    document.body.appendChild(bar);
  }
  function tick() {
    var T = window.__spText, e = T && T.get();
    if (!e || document.querySelector('.bc.solo') || document.body.classList.contains('presenting')) { if (bar && !bar.hidden) bar.hidden = true; if (rz && !rz.hidden && !drag) rz.hidden = true; return; }
    placeRz(e, T.view(), !!T.editing());
    if (!bar) make();
    var v = T.view(), s = v.s, cx = v.W / 2 + (e.x - v.x) * s, cy = v.H / 2 + (e.y - v.y) * s;
    var r = (e.rot || 0) * Math.PI / 180, hw = (+e.w || 0) / 2 * s, hh = (+e.h || 0) / 2 * s;
    var ext = Math.abs(Math.sin(r)) * hw + Math.abs(Math.cos(r)) * hh;   /* half the height of the rotated box */
    var top = cy - ext - 40 - 46;   /* clear of the rotate handle */
    if (top < 64) top = cy + ext + 18;
    var st = T.st(e), heading = st.s >= .38, key = [Math.round(cx), Math.round(top), st.w, st.i, st.u, heading].join();
    if (key !== last) {
      last = key;
      bar.style.left = Math.round(Math.max(150, Math.min(window.innerWidth - 150, cx))) + 'px'; bar.style.top = Math.round(top) + 'px';
      var on = { h1: heading, body: !heading, b: st.w >= 700, i: st.i, u: st.u };
      [].forEach.call(bar.querySelectorAll('button'), function (b) { var k = b.dataset.k; if (k in on) { b.classList.toggle('on', !!on[k]); b.setAttribute('aria-pressed', on[k] ? 'true' : 'false'); } });
    }
    if (bar.hidden) bar.hidden = false;
  }
  /* ---- resize ---- */
  var PRESETS = [[.6, 'Heading'], [.4, 'Subheading'], [.25, 'Body'], [.18, 'Small']];
  var rz, tip, drag = null;
  function makeRz() {
    rz = document.createElement('div'); rz.id = 'txtRz'; rz.hidden = true; rz.title = 'Drag to resize · snaps to standard sizes and other text · hold Alt for free size';
    tip = document.createElement('div'); tip.id = 'txtRzTip'; tip.hidden = true;
    rz.addEventListener('pointerdown', function (ev) {
      var T = window.__spText, e = T && T.get(); if (!e) return; ev.preventDefault(); ev.stopPropagation();
      var v = T.view(), cx = v.W / 2 + (e.x - v.x) * v.s, cy = v.H / 2 + (e.y - v.y) * v.s;
      drag = { cx: cx, cy: cy, d0: Math.max(4, Math.hypot(ev.clientX - cx, ev.clientY - cy)), s0: T.st(e).s, others: T.sizes(), started: false };
      rz.setPointerCapture(ev.pointerId);
    });
    rz.addEventListener('pointermove', function (ev) {
      if (!drag) return; var T = window.__spText; if (!T || !T.get()) return;
      var d = Math.hypot(ev.clientX - drag.cx, ev.clientY - drag.cy), raw = Math.max(.05, Math.min(5, drag.s0 * d / drag.d0)), val = raw, lab = '', snap = false;
      if (!ev.altKey) {
        var best = null;
        drag.others.forEach(function (o) { if (Math.abs(o - raw) / o < .07 && (!best || Math.abs(o - raw) < Math.abs(best[0] - raw))) best = [o, 'Same as other text']; });
        PRESETS.forEach(function (p) { if (Math.abs(p[0] - raw) / p[0] < .07 && (!best || Math.abs(p[0] - raw) < Math.abs(best[0] - raw) - 1e-6)) best = [p[0], p[1] + ' size']; });
        if (best) { val = best[0]; snap = true; var pre = PRESETS.filter(function (p) { return Math.abs(p[0] - val) < 1e-3; })[0], same = drag.others.some(function (o) { return Math.abs(o - val) < 1e-3; });
          lab = pre && same ? pre[1] + ' · same as other text' : pre ? pre[1] + ' size' : 'Same as other text'; }
      }
      if (!drag.started) { drag.started = true; T.begin(); }
      T.size(val);
      tip.textContent = Math.round(val * 100) + ' cm' + (lab ? ' · ' + lab : ''); tip.classList.toggle('snap', snap);
      tip.style.left = ev.clientX + 'px'; tip.style.top = ev.clientY + 'px'; tip.hidden = false; last = '';
    });
    var stop = function () { if (!drag) return; var T = window.__spText; if (drag.started && T) T.end(); drag = null; tip.hidden = true; last = ''; };
    rz.addEventListener('pointerup', stop); rz.addEventListener('pointercancel', stop); rz.addEventListener('lostpointercapture', stop);
    document.body.appendChild(rz); document.body.appendChild(tip);
  }
  function placeRz(e, v, editing) {
    if (!rz) makeRz();
    if (editing) { rz.hidden = true; return; }
    var s = v.s, cx = v.W / 2 + (e.x - v.x) * s, cy = v.H / 2 + (e.y - v.y) * s, r = (e.rot || 0) * Math.PI / 180;
    var hx = (+e.w || 0) / 2 * s + 5, hy = (+e.h || 0) / 2 * s + 5;   /* bottom-right corner, just outside the selection */
    rz.style.left = (cx + hx * Math.cos(r) - hy * Math.sin(r)) + 'px'; rz.style.top = (cy + hx * Math.sin(r) + hy * Math.cos(r)) + 'px';
    rz.hidden = false;
  }

  (function loop() { try { tick(); } catch (e) {} requestAnimationFrame(loop); })();
})();
