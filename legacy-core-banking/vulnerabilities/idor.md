# Insecure Direct Object Reference (IDOR)

Insecure Direct Object Reference (IDOR) occurs when an application provides direct access to objects based on user-supplied input without properly verifying if the authenticated user has permission to access or modify the requested resource.

## 1. Unauthorized Account Registry Listing
- **File**: `routes/accounts.js`
- **Endpoint**: `GET /accounts`
- **Mechanism**: The route accepts an optional query parameter `userId` to specify whose accounts to list, defaulting to the authenticated user's session cookie if absent:
  ```javascript
  var targetUserId = req.query.userId || req.cookies.userId;
  var query = "SELECT * FROM accounts WHERE user_id = " + targetUserId;
  ```
- **Exploitation**: Any logged-in user can append `?userId=1` to the URL to view the master operating accounts of the system administrator, or enumerate integers to expose account numbers and balances belonging to other customers.

## 2. Unauthorized Ledger Inspection
- **File**: `routes/accounts.js`
- **Endpoint**: `GET /accounts/:accountNumber`
- **Mechanism**: The details route fetches the account mapping and transaction records directly by the requested `accountNumber` path parameter without matching `account.user_id` against the currently authenticated user's session identifier.
- **Exploitation**: Attackers can iterate or discover valid account numbers (e.g., `ACC-000001`) and view full financial transaction histories of third parties.

## 3. Unauthorized Wire Transfers from Arbitrary Source Accounts
- **File**: `routes/transfers.js`
- **Endpoint**: `POST /transfers`
- **Mechanism**: The funds wire handler trusts the client-provided `fromAccount` parameter submitted in the request body as the authoritative source for deducting funds. It performs no backend check to ensure the account belongs to the session owner.
- **Exploitation**: An attacker can modify the form payload to set `fromAccount` to a high-value victim account (e.g., `ACC-000001`) and set `toAccount` to their own personal account, effectively stealing money without needing the victim's credentials.

## Remediation Strategy
Implement robust authorization validation checks on the server side before fetching or modifying any resource. Always ensure that the retrieved object's metadata (such as `user_id`) explicitly matches the trusted identifier associated with the validated authentication context.
