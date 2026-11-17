/* Shows the landing-page prices in the visitor's own currency, rounded to whole units.
   The country comes from the visitor's internet address (our Supabase "geo" function, which looks it up with
   country.is and returns only the country code). Until that answers, or if it fails, the browser's time zone and
   language are used. Rates are the ECB euro reference rates of 16 Nov 2026; update RATES now and then.
   Euro countries, and anyone we can't place, keep the euro prices. Add ?cur=USD to the address to preview a currency. */
(function () {
  var RATES = { USD: 1.1014, JPY: 175.78, CZK: 24.428, DKK: 7.4752, GBP: 0.8345, HUF: 364.35, PLN: 4.403, RON: 5.3493,
    SEK: 11.095, CHF: 0.9244, ISK: 136.8, NOK: 10.574, TRY: 55.502, AUD: 1.6301, BRL: 6.2838, CAD: 1.5734, CNY: 7.3425,
    HKD: 8.6427, IDR: 20110, ILS: 3.5509, INR: 103.452, KRW: 1470.23, MXN: 20.4429, MYR: 4.5102, NZD: 1.9971,
    PHP: 70.439, SGD: 1.4195, THB: 37.326, ZAR: 18.661 };

  /* time zone -> currency (only where it differs from the euro) */
  var TZ = {
    'Europe/Copenhagen': 'DKK', 'Atlantic/Faroe': 'DKK', 'America/Nuuk': 'DKK', 'America/Godthab': 'DKK',
    'Europe/Stockholm': 'SEK', 'Europe/Oslo': 'NOK', 'Arctic/Longyearbyen': 'NOK', 'Atlantic/Reykjavik': 'ISK',
    'Europe/London': 'GBP', 'Europe/Belfast': 'GBP', 'Europe/Guernsey': 'GBP', 'Europe/Jersey': 'GBP', 'Europe/Isle_of_Man': 'GBP',
    'Europe/Zurich': 'CHF', 'Europe/Vaduz': 'CHF', 'Europe/Warsaw': 'PLN', 'Europe/Prague': 'CZK', 'Europe/Budapest': 'HUF',
    'Europe/Bucharest': 'RON', 'Europe/Istanbul': 'TRY', 'Asia/Istanbul': 'TRY',
    'Asia/Tokyo': 'JPY', 'Asia/Seoul': 'KRW', 'Asia/Shanghai': 'CNY', 'Asia/Chongqing': 'CNY', 'Asia/Urumqi': 'CNY',
    'Asia/Hong_Kong': 'HKD', 'Asia/Singapore': 'SGD', 'Asia/Kuala_Lumpur': 'MYR', 'Asia/Kuching': 'MYR', 'Asia/Manila': 'PHP',
    'Asia/Bangkok': 'THB', 'Asia/Jakarta': 'IDR', 'Asia/Makassar': 'IDR', 'Asia/Jayapura': 'IDR', 'Asia/Pontianak': 'IDR',
    'Asia/Kolkata': 'INR', 'Asia/Calcutta': 'INR', 'Asia/Jerusalem': 'ILS', 'Asia/Tel_Aviv': 'ILS',
    'Africa/Johannesburg': 'ZAR', 'Pacific/Auckland': 'NZD', 'Pacific/Chatham': 'NZD',
    'America/Toronto': 'CAD', 'America/Montreal': 'CAD', 'America/Vancouver': 'CAD', 'America/Edmonton': 'CAD', 'America/Winnipeg': 'CAD',
    'America/Regina': 'CAD', 'America/Halifax': 'CAD', 'America/St_Johns': 'CAD', 'America/Moncton': 'CAD', 'America/Whitehorse': 'CAD',
    'America/Yellowknife': 'CAD', 'America/Iqaluit': 'CAD', 'America/Glace_Bay': 'CAD', 'America/Goose_Bay': 'CAD',
    'America/Sao_Paulo': 'BRL', 'America/Bahia': 'BRL', 'America/Fortaleza': 'BRL', 'America/Recife': 'BRL', 'America/Manaus': 'BRL', 'America/Belem': 'BRL',
    'America/Mexico_City': 'MXN', 'America/Monterrey': 'MXN', 'America/Tijuana': 'MXN', 'America/Cancun': 'MXN', 'America/Merida': 'MXN', 'America/Chihuahua': 'MXN', 'America/Mazatlan': 'MXN', 'America/Hermosillo': 'MXN'
  };
  var US = /^(America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Juneau|Sitka|Nome|Adak|Menominee|Metlakatla|Yakutat|Indiana\/.+|Kentucky\/.+|North_Dakota\/.+)|Pacific\/Honolulu|US\/.+)$/;
  /* language region -> currency, for when the time zone says nothing useful */
  var REGION = { DK: 'DKK', FO: 'DKK', GL: 'DKK', SE: 'SEK', NO: 'NOK', IS: 'ISK', GB: 'GBP', CH: 'CHF', LI: 'CHF', PL: 'PLN', CZ: 'CZK', HU: 'HUF',
    RO: 'RON', TR: 'TRY', JP: 'JPY', KR: 'KRW', CN: 'CNY', HK: 'HKD', SG: 'SGD', MY: 'MYR', PH: 'PHP', TH: 'THB', ID: 'IDR', IN: 'INR',
    IL: 'ILS', ZA: 'ZAR', AU: 'AUD', NZ: 'NZD', CA: 'CAD', US: 'USD', BR: 'BRL', MX: 'MXN' };
  var GEO = 'https://jwpikfywijqdjfozzmpl.supabase.co/functions/v1/geo';

  function guess() {
    try { var q = new URLSearchParams(location.search).get('cur'); if (q && (RATES[q.toUpperCase()] || q.toUpperCase() === 'EUR')) return q.toUpperCase(); } catch (e) {}
    var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    if (TZ[tz]) return TZ[tz];
    if (US.test(tz)) return 'USD';
    if (/^Australia\//.test(tz)) return 'AUD';
    if (/^(Europe|Atlantic|Africa|Asia|America|Pacific|Indian|Antarctica)\//.test(tz)) return 'EUR';   /* a known place without its own entry: keep euro */
    var langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']);
    for (var i = 0; i < langs.length; i++) { var m = /[-_]([A-Za-z]{2})\b/.exec(langs[i] || ''); if (m && REGION[m[1].toUpperCase()]) return REGION[m[1].toUpperCase()]; }
    return 'EUR';
  }

  var shown = 'EUR';
  function render(cur) {
    if (!cur || (cur !== 'EUR' && !RATES[cur]) || cur === shown) return;
    var sec = document.getElementById('pricing'); if (!sec) return;
    var rate = RATES[cur] || 1, loc = (navigator.language || 'en'), fmt;
    try { fmt = new Intl.NumberFormat(loc + '-u-nu-latn', { style: 'currency', currency: cur, maximumFractionDigits: 0, minimumFractionDigits: 0 }); }
    catch (e) { fmt = new Intl.NumberFormat('en', { style: 'currency', currency: cur, maximumFractionDigits: 0, minimumFractionDigits: 0 }); }
    var conv = function (t) { return cur === 'EUR' ? t : t.replace(/€\s?(\d+(?:[.,]\d+)?)/g, function (_, n) { return fmt.format(Math.round(parseFloat(n.replace(',', '.')) * rate)); }); };
    sec.querySelectorAll('.price b').forEach(function (b) {   /* always convert from the original euro text */
      if (b.dataset.eur == null) { b.dataset.eur = b.textContent; if (b.dataset.m) b.dataset.eurM = b.dataset.m; if (b.dataset.y) b.dataset.eurY = b.dataset.y; }
      if (b.dataset.eurM) b.dataset.m = conv(b.dataset.eurM);
      if (b.dataset.eurY) b.dataset.y = conv(b.dataset.eurY);
      var on = document.querySelector('[data-bill].on'), per = on ? on.dataset.bill : 'y';   /* the billing period showing right now */
      b.textContent = conv(per === 'm' && b.dataset.eurM ? b.dataset.eurM : per === 'y' && b.dataset.eurY ? b.dataset.eurY : b.dataset.eur);
    });
    var note = sec.querySelector('.pnote');
    if (note) {
      if (note.dataset.eur == null) note.dataset.eur = note.textContent;
      var name = cur; try { name = new Intl.DisplayNames(['en'], { type: 'currency' }).of(cur) || cur; } catch (e) {}
      note.textContent = cur === 'EUR' ? note.dataset.eur : conv(note.dataset.eur.replace('Prices in euro, excl. VAT.', 'Prices shown in ' + name + ', converted from euro and rounded, excl. VAT.'));
    }
    shown = cur; document.documentElement.setAttribute('data-currency', cur);
  }
  function fromCountry(c) { return REGION[c] || 'EUR'; }   /* euro countries and anywhere else: euro */
  function run() {
    var forced = null; try { var q = new URLSearchParams(location.search).get('cur'); if (q && (RATES[q.toUpperCase()] || q.toUpperCase() === 'EUR')) forced = q.toUpperCase(); } catch (e) {}
    if (forced) return render(forced);
    var saved = null; try { saved = sessionStorage.getItem('sp-country'); } catch (e) {}
    if (saved) return render(fromCountry(saved));
    render(guess());   /* right away, then refine from the internet address */
    var ctl = window.AbortController ? new AbortController() : null; var t = setTimeout(function () { if (ctl) ctl.abort(); }, 3000);
    fetch(GEO, { signal: ctl ? ctl.signal : undefined, credentials: 'omit' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      clearTimeout(t); var c = j && /^[A-Z]{2}$/.test(j.c || '') ? j.c : ''; if (!c) return;
      try { sessionStorage.setItem('sp-country', c); } catch (e) {}
      render(fromCountry(c));
    }).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
