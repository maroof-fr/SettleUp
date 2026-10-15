# SettleUp

Debt tracker for friends. Frontend: HTML, CSS, vanilla JavaScript. Backend: Java 21, Spring Boot, Spring Data JPA (Hibernate), MySQL, Spring Security with JWT. Build tool: Maven.

```
SettleUp/
  frontend/   static site (see frontend/README.md)
  backend/    Spring Boot REST API (context path /api, port 8080)
  postman/    importable API collection
  .github/    CI workflow (mvn verify)
```

## 1\. Database (MySQL 8)

```sql
CREATE DATABASE settleup CHARACTER SET utf8mb4 COLLATE utf8mb4\_0900\_ai\_ci;
```

Tables are created by Hibernate (`ddl-auto=update`) on first start. For production switch to `validate` and add Flyway or Liquibase.

## 2\. Run the backend

Secrets come from environment variables; the app will not start without `DB\_PASSWORD` and `JWT\_SECRET`.

```
export DB\_PASSWORD='your-mysql-password'       # DB\_USER defaults to root, DB\_URL to localhost:3306/settleup
export JWT\_SECRET="$(openssl rand -base64 48)"  # 32+ characters
cd backend \&\& mvn spring-boot:run
```

In IntelliJ/Eclipse, set the same variables in the run configuration. Lombok is used, so enable annotation processing if your IDE asks.

## 3\. Run the frontend against it

In `frontend/js/config.js` set `MODE: 'api'` (and `API\_BASE\_URL` if you changed the port or context path), then:

```
cd frontend \&\& python3 -m http.server 5500
```

Allowed browser origins default to `http://localhost:5500` and `http://127.0.0.1:5500`. Override with `CORS\_ORIGINS` (comma separated).

## 4\. Test with Postman

Import `postman/SettleUp.postman\_collection.json`. Run **Register** (saves the JWT into `{{token}}`), then **Add friend** and **Create debt**, then repayments and balances. The "Overpay" request must return 409.

## 5\. Git and GitHub

```
git init \&\& git add . \&\& git commit -m "Initial SettleUp frontend and backend"
git branch -M main
git remote add origin https://github.com/<you>/SettleUp.git
git push -u origin main
```

`.gitignore` already excludes `target/`, IDE files and `.env`. Never commit passwords or the JWT secret.

## API summary

|Method|Path|Notes|
|-|-|-|
|POST|/auth/register, /auth/login|public; returns `{token, user}` (201 on register)|
|GET|/users/me||
|GET, POST|/friends||
|DELETE|/friends/{id}|409 if open debts; soft delete keeps history|
|GET, POST|/debts||
|GET, PUT, DELETE|/debts/{id}|PUT amount can't go below repaid; DELETE 409 if repayments exist|
|GET, POST|/debts/{id}/payments|409 if repayment exceeds remaining balance|
|GET|/balances|`\[{friendId, friendName, netPaise, openDebts}]`, positive = friend owes you|

All amounts are `long` paise. Errors are `{"message": "..."}` with 400 (validation), 401 (no/expired token), 404, 409 (business rule). Every query is scoped to the logged-in user (id taken from the JWT, never from the request).

## Security notes

* Passwords are BCrypt-hashed; login returns the same error for unknown email and wrong password.
* JWT lifetime is 120 minutes (`settleup.jwt.ttl-minutes`), no refresh tokens yet. The frontend keeps the token in `sessionStorage`; an XSS bug could steal it. HttpOnly cookies are safer but need CSRF protection; decide before production.
* Add HTTPS, rate limiting on `/auth/\*\*`, and a real database user (not root) before deploying.

