// My Debts: every individual record (never merged), with search, filters, sorting and actions.
(async () => {
  if (!Auth.requireAuth()) return; UI.shell('debts');
  const { $, esc, money } = UI, app = $('#app'); let all = [];
  const hide = localStorage.getItem('settleup_hide_settled') === '1';
  app.innerHTML = `<div class="head"><div><h1>My Debts</h1><p>Each loan and borrowing, with what is still outstanding.</p></div><button class="btn green" id="add">Add debt</button></div>
    <div class="tools"><input id="q" type="search" placeholder="Search friend or description" aria-label="Search debts">
    <select id="dir" aria-label="Direction"><option value="">All directions</option><option value="LENT">They owe me</option><option value="BORROWED">I owe them</option></select>
    <select id="st" aria-label="Status"><option value="">All statuses</option><option value="ACTIVE" ${hide ? 'selected' : ''}>Active only</option><option value="OPEN">Open</option><option value="PARTIAL">Partly paid</option><option value="OVERDUE">Overdue</option><option value="PAID">Settled</option></select>
    <select id="sort" aria-label="Sort"><option value="date-desc">Newest first</option><option value="date-asc">Oldest first</option><option value="amt-desc">Largest amount</option><option value="amt-asc">Smallest amount</option></select></div><div id="list"></div>`;
  const list = $('#list');
  function render() {
    const q = $('#q').value.toLowerCase(), dir = $('#dir').value, st = $('#st').value, [k, o] = $('#sort').value.split('-');
    const rows = all.filter(d => (!q || (d.friendName + ' ' + d.description).toLowerCase().includes(q)) && (!dir || d.direction === dir) && (!st || (st === 'ACTIVE' ? d.status !== 'PAID' : d.status === st)))
      .sort((a, b) => (k === 'amt' ? a.amountPaise - b.amountPaise : a.date.localeCompare(b.date)) * (o === 'asc' ? 1 : -1));
    if (!all.length) return UI.empty(list, 'No debts yet', 'Record money you lent or borrowed to start tracking it.');
    if (!rows.length) return UI.empty(list, 'No matches', 'Try a different search or clear the filters.');
    list.innerHTML = `<div class="card"><table class="tbl"><thead><tr><th>Friend</th><th>Direction</th><th>Amount</th><th>Outstanding</th><th>Created</th><th>Due</th><th>Status</th><th></th></tr></thead><tbody>${rows.map(d => `<tr>
      <td data-label="Friend"><strong>${esc(d.friendName)}</strong><div class="sub">${esc(d.description)}</div></td>
      <td data-label="Direction">${d.direction === 'LENT' ? 'Owes me' : 'I owe'}</td><td data-label="Amount" class="num">${money(d.amountPaise)}</td>
      <td data-label="Outstanding" class="num ${d.direction === 'LENT' ? 'pos' : 'neg'}"><strong>${money(d.outstandingPaise)}</strong></td>
      <td data-label="Created">${UI.date(d.date)}</td><td data-label="Due">${UI.date(d.dueDate)}</td><td data-label="Status">${UI.badge(d.status)}</td>
      <td class="acts"><button class="btn ghost sm" data-act="view" data-id="${d.id}">View</button><button class="btn ghost sm" data-act="edit" data-id="${d.id}">Edit</button>
      <button class="btn danger sm" data-act="del" data-id="${d.id}" ${d.repaidPaise ? 'disabled title="Debts with repayments cannot be deleted"' : ''}>Delete</button></td></tr>`).join('')}</tbody></table></div>`;
  }
  async function load() { UI.loading(list); try { all = await Api.debts(); render(); } catch (e) { UI.error(list, e.message, load); } }
  ['q', 'dir', 'st', 'sort'].forEach(id => $('#' + id).addEventListener('input', render));
  $('#add').addEventListener('click', () => Forms.debtForm(null, load));
  list.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const d = all.find(x => x.id === Number(b.dataset.id));
    if (b.dataset.act === 'view') Forms.details(d.id, load); else if (b.dataset.act === 'edit') Forms.debtForm(d, load); else Forms.del(d, load);
  });
  load();
})();
