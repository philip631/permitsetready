/* PermitSetReady: "Buy the guide" buttons ([data-buy="guide"]) open a Stripe checkout made by the backend.
   Without a backend (or on error) the link falls back to its href (/guide/). */
(function () {
  'use strict';
  var API = (window.PSR_CONFIG && window.PSR_CONFIG.apiUrl) || '';
  function go(el) {
    var label = el.textContent;
    el.setAttribute('aria-busy', 'true'); el.textContent = 'Opening checkout…';
    fetch(API, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: JSON.stringify({action: 'guide.checkout'})})
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j.ok || !j.url) throw new Error(j.error || 'Checkout unavailable'); location.href = j.url; })
      .catch(function (e) {
        el.removeAttribute('aria-busy'); el.textContent = label;
        alertBox(el, (e && e.message) || 'Checkout could not open. Please try again or email admin@permitsetready.ca.');
      });
  }
  function alertBox(el, msg) {
    var n = el.parentNode.querySelector('.buy-msg');
    if (!n) { n = document.createElement('p'); n.className = 'small buy-msg'; n.setAttribute('role', 'status'); el.parentNode.insertBefore(n, el.nextSibling); }
    n.textContent = msg;
  }
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest && ev.target.closest('[data-buy="guide"]');
    if (!el || !API) return;
    ev.preventDefault();
    if (el.getAttribute('aria-busy') !== 'true') go(el);
  });
})();
