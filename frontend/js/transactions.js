// Transactions: chronological debt creations and repayments. Original records are never merged.
(async () => {
  if (!Auth.requireAuth()) return; UI.shell('transactions');
  const { $ } = UI, app = $('#app'); let tx = [];
  app.innerHTML = `<div class="head"><div><h1>Transactions</h1><p>Every debt and repayment, newest first. Select one to open its debt.</p></div></div>
    <div class="tools"><input id="q" type="search" placeholder="Search person or description" aria-label="Search transactions">
    <select id="type" aria-label="Type"><option value="">All types</option><option value="DEBT">Debts</option><option value="REPAYMENT">Repayments</option></select>
    <select id="dir" aria-label="Direction"><option value="">All directions</option><option value="LENT">I lent</option><option value="BORROWED">I borrowed</option></select></div><div id="list"></div>`;
  const list = $('#list');
  function render() {
    const q = $('#q').value.toLowerCase(), t = $('#type').value, d = $('#dir').value;
    const rows = tx.filter(x => (!q || (x.friendName + ' ' + x.description).toLowerCase().includes(q)) && (!t || x.type === t) && (!d || x.direction === d));
    if (!tx.length) return UI.empty(list, 'No transactions yet', 'Add a debt to see activity here.');
    if (!rows.length) return UI.empty(list, 'No matches', 'Try a different search or clear the filters.');
    list.innerHTML = `<div class="card">${rows.map(UI.txRow).join('')}</div>`;
  }
  async function load() { UI.loading(list); try { tx = await Api.transactions(); render(); } catch (e) { UI.error(list, e.message, load); } }
  ['q', 'type', 'dir'].forEach(id => $('#' + id).addEventListener('input', render));
  list.addEventListener('click', e => { const r = e.target.closest('[data-debt]'); if (r) Forms.details(Number(r.dataset.debt), load); });
  load();
})();
