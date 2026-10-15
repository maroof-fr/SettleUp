# SettleUp frontend

Vanilla HTML/CSS/JS (no build step, no frameworks, no external services).

## Run locally
```
cd SettleUp/frontend
python3 -m http.server 5500      # or: npx serve .
```
Open http://localhost:5500. In mock mode any valid email and a password of 6+ characters logs in
(sample user "Aarav Mehta" with demo data). Registering a new account starts with empty data so you can see empty states.
Mock data lives in sessionStorage and resets when the tab closes. Mock login is NOT real security.

## Layout
- `js/config.js` - the single switch: `MODE: 'mock' | 'api'` and `API_BASE_URL`
- `js/api.js` - every HTTP call (Fetch, JSON, bearer token, 401 handling, error messages)
- `js/mock.js` - fake backend used only in mock mode (delete when done)
- `js/auth.js` - session helpers, login/register forms
- `js/ui.js` / `js/forms.js` - shared helpers, shell, modals (debt form, repayment, details)
- `js/<page>.js` - one file per page. `css/style.css`, `css/auth.css`

## Money rules
Amounts are integer **paise** everywhere (`150000` = ₹1,500). The UI converts only for display/input (no floats).
Records are never merged: net balances are a separate view (`/balances`). Repayments reduce `outstandingPaise`, never `amountPaise`.
The frontend validates for convenience only. **The backend must validate and calculate everything.**

## Assumed endpoints (provisional; edit `js/api.js` to match the real spec)
| Method | Path | Request | Response |
|---|---|---|---|
| POST | /auth/register | `{name,email,password}` | `{token,user}` |
| POST | /auth/login | `{email,password}` | `{token,user}` |
| GET | /users/me | | `{id,name,email}` |
| GET | /friends | | `[{id,name,email}]` |
| POST | /friends | `{name,email}` | `{id,name,email}` |
| DELETE | /friends/{id} | | 204 (reject if open debts) |
| GET | /debts, /debts/{id} | | debt (below) |
| POST, PUT | /debts, /debts/{id} | `{friendId,direction,amountPaise,description,date,dueDate,notes}` | debt |
| DELETE | /debts/{id} | | 204 |
| GET | /balances | | `[{friendId,friendName,netPaise,openDebts}]` (`netPaise` > 0: friend owes you) |
| GET | /debts/{id}/payments | | `[{id,amountPaise,date,note}]` |
| POST | /debts/{id}/payments | `{amountPaise,date,note}` | payment (reject if > outstanding) |

Debt: `{id,friendId,friendName,direction:"LENT"|"BORROWED",amountPaise,repaidPaise,outstandingPaise,status:"OPEN"|"PARTIAL"|"PAID"|"OVERDUE",description,date,dueDate,notes}`
(`LENT` = they owe me, `BORROWED` = I owe them; dates are `YYYY-MM-DD`). Errors: non-2xx with `{"message":"..."}`.
The transactions page is built from `/debts` + `/debts/{id}/payments`; add a `/transactions` endpoint later to avoid N+1 calls.

## Connecting Spring Boot
1. Set `MODE: 'api'` and `API_BASE_URL` in `js/config.js`.
2. Enable CORS for the frontend origin (e.g. `http://localhost:5500`) including the `Authorization` header and `credentials` if using cookies.
3. Return derived fields (`repaidPaise`, `outstandingPaise`, `status`) from the server; use `long` paise (or `BigDecimal` mapped to paise) in JPA.
4. Auth: the token is kept in `sessionStorage` as a placeholder. If the backend uses HttpOnly cookies (preferred), remove token handling in `auth.js`/`api.js` and add `credentials: 'include'` to `fetch`.
5. Return 401 for expired sessions (the app redirects to login). Adjust paths/field names in `js/api.js` only.
