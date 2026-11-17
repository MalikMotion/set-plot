/* Cookieless visitor counting, shown on the admin page (Traffic).
   Sends the page, where the visitor came from (referring site or ?utm_ tags), and their country (from the same
   lookup the price display uses). No cookies, nothing stored in the browser beyond this tab's session, and the
   server keeps no IP address. Visitors who ask browsers not to track them (Do Not Track / GPC) are not counted. */
(function () {
  try {
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl) return;
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && !/[?&]track=1/.test(location.search)) return;   /* don't count local testing */
  } catch (e) {}
  var END = 'https://jwpikfywijqdjfozzmpl.supabase.co/functions/v1/track';
  var GEO = 'https://jwpikfywijqdjfozzmpl.supabase.co/functions/v1/geo';
  var ss = function (k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } };

  /* campaign tags are kept for the rest of the visit, so a later sign-up click is credited to the campaign */
  var utm = {}; try { var q = new URLSearchParams(location.search); ['source', 'medium', 'campaign'].forEach(function (k) { var v = q.get('utm_' + k) || (k === 'source' ? q.get('ref') : null); if (v) utm[k] = v.slice(0, 80); }); } catch (e) {}
  if (utm.source || utm.campaign) ss('sp-utm', JSON.stringify(utm)); else { try { utm = JSON.parse(ss('sp-utm') || '{}') || {}; } catch (e) { utm = {}; } }
  var path = (location.pathname || '/').slice(0, 120);
  if (/^\/app(\.html)?$/.test(path)) path = '/app'; else if (/\/index\.html$/.test(path)) path = path.replace(/index\.html$/, '');
  var ref = ''; try { ref = document.referrer || ''; } catch (e) {}

  function send(kind, country) {
    var body = JSON.stringify({ k: kind, p: path, r: kind === 'view' ? ref : '', s: utm.source || '', m: utm.medium || '', c: utm.campaign || '', co: country || ss('sp-country') || '' });
    try { if (navigator.sendBeacon && navigator.sendBeacon(END, new Blob([body], { type: 'text/plain' }))) return; } catch (e) {}
    try { fetch(END, { method: 'POST', body: body, keepalive: true, credentials: 'omit', headers: { 'Content-Type': 'text/plain' } }).catch(function () {}); } catch (e) {}
  }
  /* the country: reuse what the price display found, or look it up once for this tab */
  function country(cb) {
    var c = ss('sp-country'); if (c) return cb(c);
    if (document.querySelector('script[src*="currency.js"]')) {   /* the front page is already asking; wait for it */
      var n = 0, iv = setInterval(function () { var c2 = ss('sp-country'); if (c2 || ++n > 14) { clearInterval(iv); cb(c2 || ''); } }, 250); return;
    }
    var done = false, fin = function (v) { if (done) return; done = true; cb(v || ''); };
    setTimeout(function () { fin(''); }, 3000);
    try { fetch(GEO, { credentials: 'omit' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { var v = j && /^[A-Z]{2}$/.test(j.c || '') ? j.c : ''; if (v) ss('sp-country', v); fin(v); }).catch(function () { fin(''); }); } catch (e) { fin(''); }
  }
  country(function (c) { send('view', c); });

  /* sign-up clicks on the website (the "Sign up" / "Join" buttons and the email form) */
  var joined = false;
  function join() { if (joined) return; joined = true; send('join'); }
  document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('[data-join], a[href*="app.html"], a[href="/app"]'); if (t) join(); }, true);
  document.addEventListener('submit', function (e) { if (e.target && e.target.querySelector && e.target.querySelector('input[type=email]')) join(); }, true);
})();
