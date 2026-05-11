# Mass Assignment

Mass Assignment (also known as over-posting or autobinding) vulnerabilities arise when client-supplied parameters are bound directly to sensitive data models or database records without filtering out unauthorized fields.

## 1. Privilege Escalation during User Registration
- **File**: `routes/auth.js`
- **Endpoint**: `POST /register`
- **Mechanism**: The registration handler extracts user-submitted fields directly from `req.body`, including an optional `role` parameter:
  ```javascript
  var role = req.body.role || 'customer';
  ```
- **Exploitation**: While the client-side HTML form embeds `<input type="hidden" name="role" value="customer">`, an attacker can intercept the HTTP request or construct a custom cURL payload containing `role=admin`. The database blindly inserts this elevated role, granting administrative privileges immediately upon registration.

## 2. Arbitrary Starting Balance during Account Creation
- **File**: `routes/accounts.js`
- **Endpoint**: `POST /accounts/create`
- **Mechanism**: When opening a new bank account, the application trusts the client to supply the starting balance parameter:
  ```javascript
  var initialBalance = parseFloat(req.body.balance || 0.00);
  ```
- **Exploitation**: Attackers can submit a creation payload containing `balance=5000000` to initialize an account pre-loaded with millions of Thai Baht without any corresponding source deduction or physical currency deposit validation.

## Remediation Strategy
Explicitly define safe whitelists of acceptable input parameters (Data Transfer Objects / DTOs) for all write operations. System-controlled parameters like user authorization roles, internal account identifiers, or financial balances should never be populated from unvalidated request payloads.
