// Modals shared by several pages: add/edit debt, record repayment, debt details, delete.
// Validation here is for convenience only; the backend must re-validate everything.
(function () {
  const { $, esc, money, parseRupees } = UI, Forms = {}, rupees = p => (p / 100).toFixed(2);
  const field = (id, label, input) => `<div class="field"><label for="${id}">${label}</label>${input}</div>`;
  // Wires a form: fn throws Error(message) to show it inline; re-enables the button on failure.
  function bind(dlg, fn) {
    const f = $('form', dlg);
    f.addEventListener('submit', async e => {
      e.preventDefault(); const btn = $('[type=submit]', f), er = $('.err', f); er.textContent = ''; btn.disabled = true;
      try { await fn(new FormData(f)); } catch (x) { er.textContent = x.message; btn.disabled = false; }
    });
  }
  const tail = label => `<p class="err" role="alert"></p><div class="actions"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn green" type="submit">${label}</button></div>`;

  Forms.debtForm = async (debt, done) => {
    let friends; try { friends = await Api.friends(); } catch (e) { return UI.toast(e.message, 'error'); }
    if (!friends.length) return UI.toast('Add a friend first, then record a debt.', 'error');
    const d = debt || {}, opts = friends.map(f => `<option value="${f.id}" ${f.id === d.friendId ? 'selected' : ''}>${esc(f.name)}</option>`).join('');
    const dlg = UI.modal(debt ? 'Edit debt' : 'Add debt', `<form novalidate>
      ${field('friendId', 'Friend', `<select id="friendId" name="friendId">${opts}</select>`)}
      <div class="field"><label>Direction</label><div class="seg"><label><input type="radio" name="direction" value="LENT" ${d.direction !== 'BORROWED' ? 'checked' : ''}> They owe me</label>
        <label><input type="radio" name="direction" value="BORROWED" ${d.direction === 'BORROWED' ? 'checked' : ''}> I owe them</label></div></div>
      ${field('amount', 'Amount (₹)', `<input id="amount" name="amount" inputmode="decimal" placeholder="500" value="${d.amountPaise ? rupees(d.amountPaise) : ''}">`)}
      ${field('description', 'Description', `<input id="description" name="description" maxlength="120" value="${esc(d.description)}">`)}
      <div class="two">${field('date', 'Transaction date', `<input id="date" name="date" type="date" value="${d.date || UI.today()}">`)}
      ${field('dueDate', 'Due date (optional)', `<input id="dueDate" name="dueDate" type="date" value="${d.dueDate || ''}">`)}</div>
      ${field('notes', 'Notes (optional)', `<textarea id="notes" name="notes" rows="2">${esc(d.notes)}</textarea>`)}${tail('Save debt')}</form>`);
    bind(dlg, async fd => {
      const amountPaise = parseRupees(fd.get('amount')), description = fd.get('description').trim(), date = fd.get('date'), dueDate = fd.get('dueDate') || null;
      if (!amountPaise) throw new Error('Enter an amount above zero, like 500 or 499.50.');
      if (!description) throw new Error('Add a short description.');
      if (!date) throw new Error('Choose the transaction date.');
      if (dueDate && dueDate < date) throw new Error('The due date cannot be before the transaction date.');
      const body = { friendId: Number(fd.get('friendId')), direction: fd.get('direction'), amountPaise, description, date, dueDate, notes: fd.get('notes').trim() };
      debt ? await Api.updateDebt(debt.id, body) : await Api.createDebt(body);
      dlg.close(); UI.toast('Debt saved.'); done && done();
    });
  };

  Forms.repay = async (debt, done) => {
    let list; try { list = debt ? [debt] : (await Api.debts()).filter(x => x.outstandingPaise > 0); } catch (e) { return UI.toast(e.message, 'error'); }
    if (!list.length) return UI.toast('There are no outstanding debts to repay.', 'error');
    const opts = list.map(x => `<option value="${x.id}" data-out="${x.outstandingPaise}">${esc(x.friendName)}: ${x.direction === 'LENT' ? 'owes you' : 'you owe'} ${money(x.outstandingPaise)} for ${esc(x.description)}</option>`).join('');
    const dlg = UI.modal('Record repayment', `<form novalidate>${field('debtId', 'Debt', `<select id="debtId" name="debtId">${opts}</select>`)}
      ${field('amount', 'Amount (₹)', '<input id="amount" name="amount" inputmode="decimal"><small class="sub" id="hint"></small>')}
      <div class="two">${field('date', 'Date', `<input id="date" name="date" type="date" value="${UI.today()}">`)}${field('note', 'Note (optional)', '<input id="note" name="note" maxlength="80" placeholder="UPI, cash...">')}</div>${tail('Record repayment')}</form>`);
    const sel = $('#debtId', dlg), amt = $('#amount', dlg);
    const sync = () => { const o = +sel.selectedOptions[0].dataset.out; amt.value = rupees(o); $('#hint', dlg).textContent = 'Remaining balance: ' + money(o); };
    sel.addEventListener('change', sync); sync();
    bind(dlg, async fd => {
      const p = parseRupees(fd.get('amount')), out = +sel.selectedOptions[0].dataset.out;
      if (!p) throw new Error('Enter a repayment above zero.');
      if (p > out) throw new Error('A repayment cannot be more than the remaining ' + money(out) + '.');
      if (!fd.get('date')) throw new Error('Choose the repayment date.');
      await Api.addPayment(Number(fd.get('debtId')), { amountPaise: p, date: fd.get('date'), note: fd.get('note').trim() });
      dlg.close(); UI.toast('Repayment recorded.'); done && done();
    });
  };

  Forms.del = async (d, done) => {
    if (!await UI.confirm(`Delete "${d.description}" with ${d.friendName}? This cannot be undone.`)) return;
    try { await Api.deleteDebt(d.id); UI.toast('Debt deleted.'); done && done(); } catch (e) { UI.toast(e.message, 'error'); }
  };

  Forms.details = async (id, done) => {
    let d, p; try { [d, p] = await Promise.all([Api.debt(id), Api.payments(id)]); } catch (e) { return UI.toast(e.message, 'error'); }
    const lent = d.direction === 'LENT', open = d.outstandingPaise > 0, kv = (k, v) => `<div><span>${k}</span>${v}</div>`;
    const dlg = UI.modal('Debt details', `<p><strong>${esc(d.description)}</strong> ${UI.badge(d.status)}</p>
      <div class="kv">${kv('Original amount', money(d.amountPaise))}${kv('Repaid so far', money(d.repaidPaise))}
      ${kv('Remaining balance', `<b class="num ${lent ? 'pos' : 'neg'}">${money(d.outstandingPaise)}</b>`)}${kv('Created', UI.date(d.date))}
      ${kv('Lender', lent ? 'You' : esc(d.friendName))}${kv('Borrower', lent ? esc(d.friendName) : 'You')}${kv('Due date', UI.date(d.dueDate))}</div>
      <div class="bar" role="img" aria-label="${Math.round(d.repaidPaise / d.amountPaise * 100)}% repaid"><b style="width:${d.repaidPaise / d.amountPaise * 100}%"></b></div>
      ${d.notes ? `<p class="sub">Notes: ${esc(d.notes)}</p>` : ''}<h3>Repayment history</h3>
      ${p.length ? p.map(x => `<div class="row"><div class="grow">${UI.date(x.date)}<div class="sub">${esc(x.note) || 'No note'}</div></div><strong class="num">${money(x.amountPaise)}</strong></div>`).join('') : '<p class="sub">No repayments yet.</p>'}
      <div class="actions">${open ? '<button class="btn green" data-pay>Record repayment</button><button class="btn ghost" data-full>Mark as paid</button>' : ''}
      <button class="btn ghost" data-edit>Edit</button><button class="btn danger" data-del ${p.length ? 'disabled title="Debts with repayments cannot be deleted"' : ''}>Delete</button></div>`);
    const on = (s, fn) => { const b = $(s, dlg); b && b.addEventListener('click', fn); };
    on('[data-pay]', () => { dlg.close(); Forms.repay(d, done); });
    on('[data-edit]', () => { dlg.close(); Forms.debtForm(d, done); });
    on('[data-del]', async () => { await Forms.del(d, () => { dlg.close(); done && done(); }); });
    on('[data-full]', async () => {
      if (!await UI.confirm(`Mark the remaining ${money(d.outstandingPaise)} as paid?`, 'Mark as paid')) return;
      try { await Api.addPayment(d.id, { amountPaise: d.outstandingPaise, date: UI.today(), note: 'Marked as paid' }); dlg.close(); UI.toast('Debt settled.'); done && done(); }
      catch (e) { UI.toast(e.message, 'error'); }
    });
  };
  window.Forms = Forms;
})();
