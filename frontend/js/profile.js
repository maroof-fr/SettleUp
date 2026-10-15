// Profile & settings. There is no update-profile endpoint yet, so edits stay in this browser tab and say so.
(async () => {
  if (!Auth.requireAuth()) return; UI.shell('profile');
  const { $, esc } = UI, app = $('#app'); UI.loading(app);
  let me; try { me = await Api.me(); } catch (e) { return UI.error(app, e.message, () => location.reload()); }
  const user = Auth.user() ? { ...me, ...Auth.user() } : me;
  app.innerHTML = `<div class="head"><div><h1>Profile</h1><p>${esc(user.name)}, ${esc(user.email)}</p></div></div>
    <div class="cols" style="grid-template-columns:1fr 1fr"><section class="card"><h2>Your details</h2><form id="pf" novalidate style="margin-top:14px">
      <div class="field"><label for="name">Full name</label><input id="name" name="name" value="${esc(user.name)}"></div>
      <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" value="${esc(user.email)}"></div>
      <p class="sub">Not saved to a server yet. The backend needs a profile update endpoint first, so changes last for this tab only.</p><p class="err" role="alert"></p>
      <button class="btn green" type="submit">Save changes</button></form></section>
    <section class="card"><h2>Preferences</h2><div class="field" style="margin-top:14px"><label class="seg"><input type="checkbox" id="hide"> Hide settled debts by default on My Debts</label></div>
      <p class="sub">Stored in this browser only.</p><h3>Session</h3><p class="sub">Logging out clears your session token from this tab.</p><button class="btn danger" id="lo">Log out</button></section></div>`;
  $('#hide').checked = localStorage.getItem('settleup_hide_settled') === '1';
  $('#hide').addEventListener('change', e => { localStorage.setItem('settleup_hide_settled', e.target.checked ? '1' : '0'); UI.toast('Preference saved in this browser.'); });
  $('#lo').addEventListener('click', Auth.logout);
  $('#pf').addEventListener('submit', e => {
    e.preventDefault(); const fd = new FormData(e.target), er = $('.err', app);
    if (!fd.get('name').trim()) return er.textContent = 'Enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fd.get('email'))) return er.textContent = 'Enter a valid email address.';
    er.textContent = ''; Auth.setSession(Auth.token(), { ...user, name: fd.get('name').trim(), email: fd.get('email') });
    UI.toast('Updated for this tab. Not saved to a server.');
  });
})();
