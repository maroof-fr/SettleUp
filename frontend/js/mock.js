// MOCK BACKEND (development only). Lives in sessionStorage; resets when the tab closes.
// Mirrors the API shapes in api.js. Delete this file when the real backend is ready.
(function () {
  const KEY = 'settleup_mock_db', wait = (ms = 200) => new Promise(r => setTimeout(r, ms));
  const iso = n => { const d = new Date(); d.setDate(d.getDate() + n); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
  const seed = () => ({ seq: 100, user: { id: 1, name: 'Aarav Mehta', email: 'aarav@example.com' },
    friends: [{ id: 1, name: 'Rahul Sharma', email: 'rahul@example.com' }, { id: 2, name: 'Aisha Khan', email: 'aisha@example.com' },
      { id: 3, name: 'Aman Verma', email: 'aman@example.com' }, { id: 4, name: 'Priya Nair', email: 'priya@example.com' }],
    debts: [
      { id: 1, friendId: 1, direction: 'LENT', amountPaise: 200000, description: 'Goa trip hotel share', notes: '', date: iso(-20), dueDate: iso(10) },
      { id: 2, friendId: 2, direction: 'BORROWED', amountPaise: 45000, description: 'Dinner and cab', notes: '', date: iso(-6), dueDate: null },
      { id: 3, friendId: 3, direction: 'LENT', amountPaise: 80000, description: 'Concert tickets', notes: '', date: iso(-9), dueDate: iso(-1) },
      { id: 4, friendId: 4, direction: 'LENT', amountPaise: 30000, description: 'Books and lunch', notes: '', date: iso(-30), dueDate: null }],
    payments: [{ id: 1, debtId: 1, amountPaise: 50000, date: iso(-8), note: 'UPI' }, { id: 2, debtId: 4, amountPaise: 30000, date: iso(-25), note: 'Cash' }] });
  let db = JSON.parse(sessionStorage.getItem(KEY) || 'null') || seed();
  const save = () => sessionStorage.setItem(KEY, JSON.stringify(db));
  const fail = m => { throw new Error(m); };
  const sum = a => a.reduce((s, x) => s + x.amountPaise, 0);
  // The server (not the UI) owns these derived fields: repaid, outstanding, status.
  function enrich(d) {
    const rep = sum(db.payments.filter(p => p.debtId === d.id)), out = d.amountPaise - rep, f = db.friends.find(f => f.id === d.friendId);
    const status = out === 0 ? 'PAID' : d.dueDate && d.dueDate < iso(0) ? 'OVERDUE' : rep > 0 ? 'PARTIAL' : 'OPEN';
    return { ...d, friendName: f ? f.name : d.friendName || 'Former friend', repaidPaise: rep, outstandingPaise: out, status };
  }
  const find = id => db.debts.find(d => d.id === id) || fail('Debt not found.');
  const check = b => { if (!(b.amountPaise > 0)) fail('Amount must be greater than zero.'); if (!db.friends.some(f => f.id === b.friendId)) fail('Choose a friend.'); };
  window.MockApi = {
    async login({ email, password }) { await wait(); if (!email || !password || password.length < 6) fail('Enter a valid email and a password of 6+ characters.'); return { token: 'mock-token', user: db.user }; },
    async register({ name, email }) { await wait(); db = { seq: 100, user: { id: 1, name, email }, friends: [], debts: [], payments: [] }; save(); return { token: 'mock-token', user: db.user }; },
    async me() { await wait(80); return db.user; },
    async friends() { await wait(); return db.friends; },
    async addFriend({ name, email }) { await wait(); if (email && db.friends.some(f => f.email === email)) fail('You already added this friend.'); const f = { id: ++db.seq, name, email: email || '' }; db.friends.push(f); save(); return f; },
    async removeFriend(id) {
      await wait(); const mine = db.debts.filter(d => d.friendId === id);
      if (mine.some(d => enrich(d).outstandingPaise > 0)) fail('Settle open debts with this friend before removing them.');
      const f = db.friends.find(f => f.id === id); mine.forEach(d => d.friendName = f.name); // keep history readable
      db.friends = db.friends.filter(f => f.id !== id); save(); return null;
    },
    async debts() { await wait(); return db.debts.map(enrich); },
    async debt(id) { await wait(80); return enrich(find(id)); },
    async createDebt(b) { await wait(); check(b); const d = { ...b, id: ++db.seq }; db.debts.push(d); save(); return enrich(d); },
    async updateDebt(id, b) { await wait(); const d = find(id); check(b); if (b.amountPaise < enrich(d).repaidPaise) fail('Amount cannot be lower than what is already repaid.'); Object.assign(d, b); save(); return enrich(d); },
    async deleteDebt(id) { await wait(); find(id); if (db.payments.some(p => p.debtId === id)) fail('A debt with repayments cannot be deleted.'); db.debts = db.debts.filter(d => d.id !== id); save(); return null; },
    async balances() { // net per friend: + means they owe me. Original records are never merged.
      await wait(); return db.friends.map(f => { const ds = db.debts.filter(d => d.friendId === f.id).map(enrich);
        return { friendId: f.id, friendName: f.name, netPaise: ds.reduce((s, d) => s + (d.direction === 'LENT' ? 1 : -1) * d.outstandingPaise, 0), openDebts: ds.filter(d => d.outstandingPaise > 0).length }; });
    },
    async payments(id) { await wait(80); return db.payments.filter(p => p.debtId === id).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id); },
    async addPayment(id, b) {
      await wait(); const d = enrich(find(id));
      if (!(b.amountPaise > 0)) fail('Repayment must be greater than zero.');
      if (b.amountPaise > d.outstandingPaise) fail('Repayment cannot exceed the remaining balance of ' + (d.outstandingPaise / 100) + ' rupees.');
      const p = { id: ++db.seq, debtId: id, amountPaise: b.amountPaise, date: b.date, note: b.note || '' }; db.payments.push(p); save(); return p;
    }
  };
})();
