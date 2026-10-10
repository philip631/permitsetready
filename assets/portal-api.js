/* PermitSetReady portal — connects the project pages to the Google Workspace backend.
   Gives the page the same small database interface it used before (doc / collection / get / set),
   backed by the Apps Script web app named in /assets/config.js. */
(function () {
  'use strict';
  var API = (window.PSR_CONFIG && window.PSR_CONFIG.apiUrl) || '';
  var KEY = 'psr_token';
  function token() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }
  function setToken(t) { try { if (t) localStorage.setItem(KEY, t); else localStorage.removeItem(KEY); } catch (e) {} }
  function clone(x) { return x == null ? x : JSON.parse(JSON.stringify(x)); }

  function call(action, body) {
    if (!API) return Promise.reject(Object.assign(new Error('The client portal is being set up. Please email admin@permitsetready.ca.'), {code: 'not_configured'}));
    var payload = Object.assign({action: action, token: token()}, body || {});
    return fetch(API, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: JSON.stringify(payload)})
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.ok) {
          if (/log in/i.test(j.error || '')) setToken('');
          var e = new Error(j.error || 'Something went wrong'); e.code = j.error || 'error'; throw e;
        }
        return j;
      });
  }

  function newId() { var s = ''; var c = 'abcdefghijklmnopqrstuvwxyz0123456789'; for (var i = 0; i < 20; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }
  function snap(id, data) { return {id: id, exists: data != null, data: function () { return clone(data); }}; }

  function DocRef(path) {
    var parts = path.split('/');
    return {
      id: parts[parts.length - 1], path: path,
      get: function () { return call('db.get', {path: path}).then(function (j) { return snap(parts[parts.length - 1], j.exists ? j.data : null); }); },
      set: function (data, opts) { return call('db.set', {path: path, data: clone(data), merge: !!(opts && opts.merge)}).then(function () {}); },
      update: function (data) { return call('db.set', {path: path, data: clone(data), merge: true}).then(function () {}); },
      delete: function () { return call('db.delete', {path: path}).then(function () {}); },
      collection: function (name) { return CollRef(path + '/' + name); }
    };
  }
  function CollRef(path, opts) {
    opts = opts || {};
    var self = {
      path: path,
      doc: function (id) { return DocRef(path + '/' + (id || newId())); },
      orderBy: function (f, dir) { return CollRef(path, Object.assign({}, opts, {orderBy: f, dir: dir || 'asc'})); },
      limit: function (n) { return CollRef(path, Object.assign({}, opts, {limit: n})); },
      get: function () {
        return call('db.list', {path: path, orderBy: opts.orderBy, dir: opts.dir, limit: opts.limit}).then(function (j) {
          return {docs: (j.docs || []).map(function (d) { return snap(d.id, d.data); }), size: (j.docs || []).length, empty: !(j.docs || []).length};
        });
      },
      onSnapshot: function (cb, err) {
        var stop = false, t = null;
        var tick = function () { if (stop) return; self.get().then(function (q) { if (!stop) cb(q); }).catch(function (e) { if (err) err(e); }).then(function () { if (!stop) t = setTimeout(tick, 20000); }); };
        tick();
        return function () { stop = true; clearTimeout(t); };
      }
    };
    return self;
  }

  // Back from a Stripe payment (?paid=<session id>): confirm it before the page loads its data.
  var paidId = null; try { paidId = new URLSearchParams(location.search).get('paid'); } catch (e) {}
  var confirmed = (paidId && API) ? call('pay.confirm', {session: paidId}).catch(function () {}).then(function () {
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
  }) : Promise.resolve();

  var mePromise = null;
  function me() {
    if (!token()) return Promise.resolve(null);
    if (!mePromise) mePromise = confirmed.then(function () { return call('auth.me'); }).then(function (j) { return j.user; }).catch(function () { setToken(''); return null; });
    return mePromise;
  }

  var db = {doc: DocRef, collection: CollRef};

  window.PSR = {
    configured: !!API,
    call: call,
    token: token,
    me: me,
    startLogin: function (email) { return call('auth.start', {email: email}); },
    verifyLogin: function (email, code) { return call('auth.verify', {email: email, code: code}).then(function (j) { setToken(j.token); mePromise = null; return j.user; }); },
    logout: function () { var t = token(); setToken(''); mePromise = null; return API && t ? call('auth.logout', {token: t}).catch(function () {}) : Promise.resolve(); }
  };

  // The project pages ask for 'db', 'user' and 'sample'. Without a login, db and user are null.
  window.claude = {
    use: function (name) {
      if (name === 'sample') return Promise.resolve(null);
      return me().then(function (u) {
        if (!u) return null;
        if (name === 'db') return db;
        if (name === 'user') return {
          me: function () { return Promise.resolve({id: u.id, name: '', email: u.email}); },
          canEdit: function () { return Promise.resolve(!!u.isAdmin); },
          isOwner: function () { return Promise.resolve(u.role === 'admin'); },
          role: u.role, email: u.email
        };
        return null;
      });
    }
  };
})();
