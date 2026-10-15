// Shared UI helpers: formatting, toasts, modals, confirm dialog, and the page shell (sidebar + mobile tabs).
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const UI = { $, esc,
    // Money is integer paise; format only at display time.
    money: p => (p < 0 ? '-' : '') + '₹' + (Math.abs(p) / 100).toLocaleString('en-IN', { minimumFractionDigits: p % 100 ? 2 : 0, maximumFractionDigits: 2 }),
    // "499.50" -> 49950 without floating-point math. Returns null if invalid.
    parseRupees(s) { const m = String(s).trim().replace(/,/g, '').match(/^(\d+)(?:\.(\d{1,2}))?$/); return m ? +m[1] * 100 + +(m[2] || '').padEnd(2, '0') : null; },
    date: d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
    today() { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); },
    avatar: n => `<div class="av" aria-hidden="true">${esc(n.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase())}</div>`,
    STATUS: { OPEN: 'Open', PARTIAL: 'Partly paid', PAID: 'Settled', OVERDUE: 'Overdue' },
    badge: s => `<span class="badge b-${s}">${UI.STATUS[s]}</span>`,
    txText: t => t.type === 'DEBT' ? (t.direction === 'LENT' ? `You lent ${t.friendName}` : `${t.friendName} lent you`)
      : (t.direction === 'LENT' ? `${t.friendName} repaid you` : `You repaid ${t.friendName}`),
    txRow: t => `<button class="row" data-debt="${t.debtId}">${UI.avatar(t.friendName)}<div class="grow"><strong>${esc(UI.txText(t))}</strong>
      <div class="sub">${esc(t.description)}, ${UI.date(t.date)}</div></div><strong class="num ${t.direction === 'LENT' ? 'pos' : 'neg'}">${UI.money(t.amountPaise)}</strong></button>`,
    toast(msg, type = '') { const t = document.createElement('div'); t.className = 'toast ' + type; t.textContent = msg; $('#toasts').append(t); setTimeout(() => t.remove(), 3500); },
    loading: el => { el.innerHTML = '<div class="spin" role="status" aria-label="Loading"></div>'; },
    emptyHtml: (title, msg, action = '') => `<div class="empty"><h3>${title}</h3><p>${msg}</p>${action}</div>`,
    empty(el, title, msg, action) { el.innerHTML = UI.emptyHtml(title, msg, action); },
    error(el, msg, retry) { el.innerHTML = UI.emptyHtml('Could not load this page', esc(msg), '<button class="btn ghost" id="retry">Try again</button>'); $('#retry', el).addEventListener('click', retry); },
    modal(title, body) {
      const d = document.createElement('dialog'); d.setAttribute('aria-labelledby', 'mt');
      d.innerHTML = `<div class="mh"><h2 id="mt">${esc(title)}</h2><button class="btn ghost sm" data-close aria-label="Close">Close</button></div><div class="mb">${body}</div>`;
      document.body.append(d);
      d.addEventListener('click', e => { if (e.target.closest('[data-close]')) d.close(); });
      d.addEventListener('close', () => d.remove()); d.showModal(); return d;
    },
    confirm(msg, ok = 'Delete') { // resolves true only when the person confirms
      return new Promise(res => {
        const d = UI.modal('Are you sure?', `<p>${esc(msg)}</p><div class="actions"><button class="btn ghost" data-close>Cancel</button><button class="btn danger" data-ok>${esc(ok)}</button></div>`);
        let yes = false; $('[data-ok]', d).addEventListener('click', () => { yes = true; d.close(); });
        d.addEventListener('close', () => res(yes));
      });
    },
    shell(active) {
      const nav = [['dashboard', 'Dashboard', '▦'], ['debts', 'My Debts', '₹'], ['friends', 'Friends', '☺'], ['transactions', 'Transactions', '⇄'], ['profile', 'Profile', '⚙']];
      const links = nav.map(([k, l, i]) => `<a href="${k}.html" ${k === active ? 'class="on" aria-current="page"' : ''}><span class="ic" aria-hidden="true">${i}</span>${l}</a>`).join('');
      const dev = window.SETTLEUP_CONFIG.MODE === 'mock' ? '<div class="devstrip">Development mode: sample data kept in this browser tab. Nothing is sent to a server.</div>' : '';
      document.body.insertAdjacentHTML('afterbegin', `${dev}<div class="layout"><aside class="side"><a class="logo" href="dashboard.html"><span class="mark">₹</span>SettleUp</a>
        <nav class="nav" aria-label="Main">${links}</nav><button class="btn out" id="logout">Log out</button></aside><main id="app" class="main"></main></div>
        <nav class="tabs" aria-label="Main">${links}</nav><div id="toasts" aria-live="polite"></div>`);
      $('#logout').addEventListener('click', Auth.logout);
    }
  };
  window.UI = UI;
})();
