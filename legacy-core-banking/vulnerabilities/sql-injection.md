# SQL Injection (SQLi)

The legacy core banking application relies heavily on dynamic SQL queries constructed via string concatenation rather than parameterized statements or prepared statements. This exposes the SQLite database to direct manipulation by attackers.

## 1. Authentication Bypass via Login Route
- **File**: `routes/auth.js`
- **Endpoint**: `POST /login`
- **Mechanism**: The username and password input parameters supplied in the request body are concatenated directly into the lookup statement:
  ```javascript
  var query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
  ```
- **Exploitation**: An attacker can inject a payload such as `' OR 1=1 --` into the username field to force the query to evaluate to true, successfully authenticating as the first returned user record (often the administrator).

## 2. Arbitrary User Insertion via Register Route
- **File**: `routes/auth.js`
- **Endpoint**: `POST /register`
- **Mechanism**: Values supplied during customer registration are placed unescaped into an `INSERT` statement.
- **Exploitation**: Malicious payloads embedded in fields like `fullName` or `username` can break out of the query structure to alter inserted column alignments or trigger syntax errors that reveal internal database schema details.

## 3. Account Enumeration and Data Exfiltration
- **Files**: `routes/accounts.js` and `routes/transfers.js`
- **Endpoints**: `GET /accounts/:accountNumber`, `POST /transfers`
- **Mechanism**: Account lookup statements directly construct strings using client-supplied route parameters or form parameters:
  ```javascript
  var accQuery = "SELECT * FROM accounts WHERE account_number = '" + accountNumber + "'";
  ```
- **Exploitation**: Attackers can append `UNION SELECT` statements to exfiltrate sensitive records from other database tables, such as user credentials or system audit logs.

## Remediation Strategy
All dynamic SQL query construction should be replaced with parameterized queries using placeholders (e.g., `db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password])`) to ensure input parameters are treated strictly as literal values rather than executable code.
