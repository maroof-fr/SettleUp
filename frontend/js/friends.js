// Friends: list, search, add (local record only), history, remove with confirmation.
(async () => {
  if (!Auth.requireAuth()) return; UI.shell('friends');
  const { $, esc, money } = UI, app = $('#app'); let friends = [], bal = {};
  app.innerHTML = `<div class="head"><div><h1>Friends</h1><p>People you lend to or borrow from.</p></div><button class="btn green" id="add">Add friend</button></div>
    <div class="tools"><input id="q" type="search" placeholder="Search friends" aria-label="Search friends"></div><div id="list"></div>`;
  const list = $('#list');
  function render() {
    const q = $('#q').value.toLowerCase(), rows = friends.filter(f => (f.name + f.email).toLowerCase().includes(q));
    if (!friends.length) return UI.empty(list, 'No friends yet', 'Add someone to start recording debts.');
    if (!rows.length) return UI.empty(list, 'No matches', 'Try a different name.');
    list.innerHTML = `<div class="card">${rows.map(f => { const n = (bal[f.id] || {}).netPaise || 0; return `<div class="row">${UI.avatar(f.name)}
      <div class="grow"><strong>${esc(f.name)}</strong><div class="sub">${esc(f.email) || 'No email'}</div></div>
      <strong class="num ${n > 0 ? 'pos' : n < 0 ? 'neg' : ''}">${n > 0 ? 'Owes you ' + money(n) : n < 0 ? 'You owe ' + money(-n) : 'Settled up'}</strong>
      <button class="btn ghost sm" data-act="hist" data-id="${f.id}">History</button><button class="btn danger sm" data-act="rm" data-id="${f.id}">Remove</button></div>`; }).join('')}</div>`;
  }
  async function load() {
    UI.loading(list);
    try { const [f, b] = await Promise.all([Api.friends(), Api.balances()]); friends = f; bal = Object.fromEntries(b.map(x => [x.friendId, x])); render(); }
    catch (e) { UI.error(list, e.message, load); }
  }
  $('#q').addEventListener('input', render);
  $('#add').addEventListener('click', () => {
    const d = UI.modal('Add friend', `<form novalidate><div class="field"><label for="name">Name</label><input id="name" name="name" maxlength="80"></div>
      <div class="field"><label for="email">Email (optional)</label><input id="email" name="email" type="email"></div>
      <p class="sub">Placeholder: no invitation email is sent. This only saves a friend record until the backend supports invitations.</p>
      <p class="err" role="alert"></p><div class="actions"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn green" type="submit">Add friend</button></div></form>`);
    $('form', d).addEventListener('submit', async e => {
      e.preventDefault(); const fd = new FormData(e.target), er = $('.err', d), btn = $('[type=submit]', d), email = fd.get('email').trim();
      if (!fd.get('name').trim()) return er.textContent = 'Enter your friend\'s name.';
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return er.textContent = 'Enter a valid email or leave it empty.';
      btn.disabled = true; er.textContent = '';
      try { await Api.addFriend({ name: fd.get('name').trim(), email }); d.close(); UI.toast('Friend added.'); load(); } catch (x) { er.textContent = x.message; btn.disabled = false; }
    });
  });
  list.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]'); if (!b) return; const f = friends.find(x => x.id === Number(b.dataset.id));
    if (b.dataset.act === 'rm') {
      if (!await UI.confirm(`Remove ${f.name} from your friends?`, 'Remove')) return;
      try { await Api.removeFriend(f.id); UI.toast('Friend removed.'); load(); } catch (x) { UI.toast(x.message, 'error'); }
    } else {
      try {
        const ds = (await Api.debts()).filter(d => d.friendId === f.id), n = (bal[f.id] || {}).netPaise || 0;
        UI.modal(f.name, `<p class="sub">Net balance: <strong class="${n >= 0 ? 'pos' : 'neg'}">${money(n)}</strong>. Individual records stay separate below.</p>` + (ds.length ? ds.map(d => `<div class="row"><div class="grow"><strong>${esc(d.description)}</strong>
          <div class="sub">${d.direction === 'LENT' ? 'You lent' : 'You borrowed'} ${money(d.amountPaise)} on ${UI.date(d.date)}</div></div><div>${UI.badge(d.status)}</div>
          <strong class="num ${d.direction === 'LENT' ? 'pos' : 'neg'}">${money(d.outstandingPaise)}</strong></div>`).join('') : UI.emptyHtml('No debts', 'Nothing recorded with this friend yet.')));
      } catch (x) { UI.toast(x.message, 'error'); }
    }
  });
  load();
})();
