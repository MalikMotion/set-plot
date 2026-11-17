/* Shows the landing-page prices in the visitor's own currency, rounded to whole units.
   The country is guessed in the browser from its time zone (falling back to the language's region), so nothing is
   sent anywhere. Rates are the ECB euro reference rates of 16 Nov 2026; update RATES now and then.
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

  function run() {
    var cur = guess(); if (cur === 'EUR' || !RATES[cur]) return;
    var rate = RATES[cur], loc = (navigator.language || 'en');
    var fmt; try { fmt = new Intl.NumberFormat(loc + '-u-nu-latn', { style: 'currency', currency: cur, maximumFractionDigits: 0, minimumFractionDigits: 0 }); }
    catch (e) { fmt = new Intl.NumberFormat('en', { style: 'currency', currency: cur, maximumFractionDigits: 0, minimumFractionDigits: 0 }); }
    var conv = function (s) { return s.replace(/€\s?(\d+(?:[.,]\d+)?)/g, function (_, n) { return fmt.format(Math.round(parseFloat(n.replace(',', '.')) * rate)); }); };
    var sec = document.getElementById('pricing'); if (!sec) return;
    sec.querySelectorAll('.price b').forEach(function (b) {
      if (b.dataset.m) b.dataset.m = conv(b.dataset.m);
      if (b.dataset.y) b.dataset.y = conv(b.dataset.y);
      b.textContent = conv(b.textContent);
    });
    var note = sec.querySelector('.pnote');
    if (note) {
      var name = cur; try { name = new Intl.DisplayNames(['en'], { type: 'currency' }).of(cur) || cur; } catch (e) {}
      note.textContent = conv(note.textContent.replace('Prices in euro, excl. VAT.', 'Prices shown in ' + name + ', converted from euro and rounded, excl. VAT.'));
    }
    document.documentElement.setAttribute('data-currency', cur);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
