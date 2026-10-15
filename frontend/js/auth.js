// Authentication helpers + login/register form wiring.
// Token storage: sessionStorage is a placeholder. Coordinate with the backend: if it issues
// HttpOnly cookies, delete token handling here and add `credentials: 'include'` in api.js instead.
// Passwords are never stored or logged.
(function () {
  const TK = 'settleup_token', UK = 'settleup_user';
  const Auth = {
    token: () => sessionStorage.getItem(TK),
    isLoggedIn: () => !!sessionStorage.getItem(TK),
    user() { try { return JSON.parse(sessionStorage.getItem(UK)); } catch { return null; } },
    setSession(token, user) { sessionStorage.setItem(TK, token); if (user) sessionStorage.setItem(UK, JSON.stringify(user)); },
    clear() { sessionStorage.removeItem(TK); sessionStorage.removeItem(UK); },
    requireAuth() { if (!Auth.isLoggedIn()) { location.replace('login.html'); return false; } return true; },
    handleUnauthorized() { Auth.clear(); location.replace('login.html?expired=1'); },
    logout() { Auth.clear(); location.href = 'login.html'; }
  };
  window.Auth = Auth;

  const $ = s => document.querySelector(s);
  const lf = $('#login-form'), rf = $('#register-form');
  if (!lf && !rf) return; // not an auth page
  if (Auth.isLoggedIn()) location.replace('dashboard.html');
  const box = $('#alert'), show = m => { box.textContent = m; box.hidden = !m; };
  if (new URLSearchParams(location.search).has('expired')) show('Your session expired. Log in again.');
  if (window.SETTLEUP_CONFIG.MODE === 'mock') $('#devnote').textContent = 'Development mode: any valid email and a password of 6+ characters works. This is not real security.';
  document.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', () => {
    const i = b.previousElementSibling, hidden = i.type === 'password';
    i.type = hidden ? 'text' : 'password'; b.textContent = hidden ? 'Hide' : 'Show';
    b.setAttribute('aria-label', hidden ? 'Hide password' : 'Show password');
  }));
  const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  function wire(form, validate, call) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(form)), msg = validate(f);
      if (msg) return show(msg);
      const btn = form.querySelector('[type=submit]'), label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Please wait...'; show('');
      try { const r = await call(f); Auth.setSession(r.token, r.user); location.href = 'dashboard.html'; }
      catch (x) { show(x.message); btn.disabled = false; btn.textContent = label; }
    });
  }
  if (lf) wire(lf, f => !emailOk(f.email) ? 'Enter a valid email address.' : !f.password ? 'Enter your password.' : '',
    f => Api.login({ email: f.email, password: f.password }));
  if (rf) wire(rf, f => !f.name.trim() ? 'Enter your full name.' : !emailOk(f.email) ? 'Enter a valid email address.'
      : f.password.length < 8 ? 'Use a password of at least 8 characters.' : f.password !== f.confirm ? 'Passwords do not match.' : '',
    f => Api.register({ name: f.name.trim(), email: f.email, password: f.password }));
})();
