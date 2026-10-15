// Dashboard: totals come from /balances (server-calculated net per friend), never from guesses in the UI.
(async () => {
  if (!Auth.requireAuth()) return; UI.shell('dashboard');
  const { $, esc, money } = UI, app = $('#app');
  async function load() {
    UI.loading(app);
    try {
      const [me, bal, tx, debts] = await Promise.all([Api.me(), Api.balances(), Api.transactions(), Api.debts()]);
      const owed = bal.filter(b => b.netPaise > 0).reduce((s, b) => s + b.netPaise, 0), owe = bal.filter(b => b.netPaise < 0).reduce((s, b) => s - b.netPaise, 0), net = owed - owe;
      const active = bal.filter(b => b.openDebts > 0).sort((a, b) => Math.abs(b.netPaise) - Math.abs(a.netPaise));
      const h = new Date().getHours(), hi = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
      const summary = !debts.length ? 'Add a friend and record your first debt to get started.' : net > 0 ? `Friends owe you ${money(net)} overall.` : net < 0 ? `You owe ${money(-net)} overall.` : 'You are all square.';
      app.innerHTML = `<div class="head"><div><h1>${hi}, ${esc(me.name.split(' ')[0])}</h1><p>${summary}</p></div>
        <div class="acts"><button class="btn ghost" id="repay">Record repayment</button><button class="btn green" id="add">Add debt</button></div></div>
        <div class="cards"><div class="card stat hero"><div class="sub">Net balance</div><div class="v num ${net < 0 ? 'neg' : 'pos'}">${money(net)}</div></div>
          <div class="card stat"><div class="sub">Owed to me</div><div class="v num pos">${money(owed)}</div></div>
          <div class="card stat"><div class="sub">I owe</div><div class="v num neg">${money(owe)}</div></div></div>
        <div class="cols"><section class="card"><h2>Outstanding balances</h2>${active.length ? active.map(b => `<a class="row" href="friends.html" style="text-decoration:none">${UI.avatar(b.friendName)}
          <div class="grow"><strong>${esc(b.friendName)}</strong><div class="sub">${b.openDebts} open ${b.openDebts === 1 ? 'debt' : 'debts'}</div></div>
          <strong class="num ${b.netPaise < 0 ? 'neg' : 'pos'}">${b.netPaise === 0 ? 'Even' : (b.netPaise > 0 ? 'Owes you ' : 'You owe ') + money(Math.abs(b.netPaise))}</strong></a>`).join('')
          : UI.emptyHtml('Nothing outstanding', 'Balances with friends will show up here.', '<a class="btn ghost" href="friends.html">Add a friend</a>')}</section>
        <section class="card"><h2>Recent activity</h2>${tx.length ? tx.slice(0, 6).map(UI.txRow).join('') + '<p class="sub"><a href="transactions.html">See all transactions</a></p>'
          : UI.emptyHtml('No activity yet', 'Debts and repayments will be listed here.')}</section></div>`;
      $('#add').addEventListener('click', () => Forms.debtForm(null, load));
      $('#repay').addEventListener('click', () => Forms.repay(null, load));
      app.addEventListener('click', e => { const r = e.target.closest('[data-debt]'); if (r) Forms.details(Number(r.dataset.debt), load); });
    } catch (e) { UI.error(app, e.message, load); }
  }
  load();
})();
