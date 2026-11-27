/* PermitSetReady portal settings. apiUrl = the Google Apps Script web app URL (ends in /exec).
   Leave empty until the backend is deployed; the portal then shows a "being set up" note. */
window.PSR_CONFIG = {
  apiUrl: 'https://script.google.com/macros/s/AKfycbzTyVjoUpeilO8ROjLaw5FALdufLqfU8nOzWK31Upu9ETJbPSIsa3uB82lXAGCtWqLr/exec',
  helpChat: true, // true = the help panel takes typed questions (needs backend 1.12.0 or later deployed)
  scopeDdToCd: true // true = show the 'Design package to permit / construction set' scope (needs backend 1.12.1 or later deployed)
};
