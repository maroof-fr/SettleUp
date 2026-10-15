// ALL HTTP lives here. Change endpoints/shapes in this file only. Money is always integer paise.
// Real mode never falls back to mock data: failures surface as errors.
(function () {
  const C = window.SETTLEUP_CONFIG;
  async function http(method, path, body) {
    const h = { Accept: 'application/json' };
    if (body) h['Content-Type'] = 'application/json';
    const t = Auth.token(); if (t) h.Authorization = 'Bearer ' + t; // swap for cookies if backend uses them
    let res;
    try { res = await fetch(C.API_BASE_URL + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined }); }
    catch { throw new Error('Cannot reach the server. Check that the backend is running.'); }
    if (res.status === 401 && !path.startsWith('/auth/')) { Auth.handleUnauthorized(); throw new Error('Session expired.'); }
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) throw new Error((data && data.message) || 'Request failed (' + res.status + ').');
    return data;
  }
  const real = {
    login: b => http('POST', '/auth/login', b), register: b => http('POST', '/auth/register', b), me: () => http('GET', '/users/me'),
    friends: () => http('GET', '/friends'), addFriend: b => http('POST', '/friends', b), removeFriend: id => http('DELETE', '/friends/' + id),
    debts: () => http('GET', '/debts'), debt: id => http('GET', '/debts/' + id), createDebt: b => http('POST', '/debts', b),
    updateDebt: (id, b) => http('PUT', '/debts/' + id, b), deleteDebt: id => http('DELETE', '/debts/' + id),
    balances: () => http('GET', '/balances'), payments: id => http('GET', '/debts/' + id + '/payments'),
    addPayment: (id, b) => http('POST', '/debts/' + id + '/payments', b)
  };
  const Api = Object.assign({}, C.MODE === 'mock' ? window.MockApi : real);
  // Activity feed built from debts + payments (no dedicated endpoint assumed).
  Api.transactions = async () => {
    const debts = await Api.debts(), pays = await Promise.all(debts.map(d => Api.payments(d.id))), tx = [];
    debts.forEach((d, i) => {
      const base = { debtId: d.id, friendName: d.friendName, direction: d.direction, description: d.description };
      tx.push({ ...base, id: 'd' + d.id, type: 'DEBT', amountPaise: d.amountPaise, date: d.date });
      pays[i].forEach(p => tx.push({ ...base, id: 'p' + p.id, type: 'REPAYMENT', amountPaise: p.amountPaise, date: p.date }));
    });
    return tx.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  };
  window.Api = Api;
})();
