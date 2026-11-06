/* PermitSetReady site analytics (Google Analytics 4, consent mode)
   - No analytics cookies until the visitor clicks "OK" on the notice.
   - Choice is remembered in localStorage for 12 months.
   - Tracks CTA clicks (book, guide, review, email) as GA4 events. */
(function () {
  var GA_ID = 'G-2ZEH7TVVMC';
  var KEY = 'psr_consent';
  var ONE_YEAR = 365 * 24 * 60 * 60 * 1000;

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  var stored = null;
  try { stored = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  if (stored && (Date.now() - stored.t) > ONE_YEAR) stored = null;
  var granted = !!(stored && stored.v === 'granted');

  gtag('consent', 'default', {
    analytics_storage: granted ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });

  if (GA_ID.indexOf('G-') === 0 && GA_ID.indexOf('X') === -1) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true });
  }

  function remember(v) {
    try { localStorage.setItem(KEY, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {}
  }

  function showNotice() {
    var bar = document.createElement('div');
    bar.id = 'psr-consent';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Cookie notice');
    bar.innerHTML =
      '<style>' +
      '#psr-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:560px;margin:0 auto;' +
      'background:var(--navy,#1F3A5F);color:var(--on-dark,#D3DCE8);border-radius:12px;padding:14px 16px;' +
      'box-shadow:0 8px 24px rgba(0,0,0,.25);font:14px/1.45 var(--f-body,Inter,system-ui,sans-serif);' +
      'display:flex;gap:12px;align-items:center;flex-wrap:wrap}' +
      '#psr-consent p{margin:0;flex:1 1 260px}' +
      '#psr-consent button{border:0;border-radius:8px;padding:8px 14px;font:inherit;font-weight:700;cursor:pointer}' +
      '#psr-consent .ok{background:var(--amber,#E0A030);color:var(--ink,#0E1F36)}' +
      '#psr-consent .no{background:transparent;color:#fff;text-decoration:underline;font-weight:500}' +
      '</style>' +
      '<p>We use Google Analytics to count visits and see which pages help. No ads, no selling data.</p>' +
      '<button type="button" class="no">No thanks</button>' +
      '<button type="button" class="ok">OK</button>';
    bar.querySelector('.ok').onclick = function () {
      remember('granted');
      gtag('consent', 'update', { analytics_storage: 'granted' });
      bar.remove();
    };
    bar.querySelector('.no').onclick = function () {
      remember('denied');
      bar.remove();
    };
    document.body.appendChild(bar);
  }

  function trackCtas() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a');
      if (!a) return;
      var h = a.getAttribute('href') || '';
      var name = null;
      if (h.indexOf('/start/') === 0) name = h.indexOf('#new') > -1 ? 'book_job' : 'portal_login';
      else if (h.indexOf('/guide/') === 0) name = 'guide_page';
      else if (h.indexOf('/review/') === 0) name = 'review_page';
      else if (h.indexOf('/feasibility/') === 0) name = 'feasibility_page';
      else if (h.indexOf('/find-a-designer/') === 0) name = 'find_designer';
      else if (h.indexOf('mailto:') === 0) name = 'email_click';
      else if (h.indexOf('instagram.com') > -1) name = 'instagram_click';
      if (name) gtag('event', 'cta_click', { cta: name, link_text: (a.textContent || '').trim().slice(0, 60), page: location.pathname });
    });
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn();
  }
  ready(function () {
    if (!stored) showNotice();
    trackCtas();
  });
})();
