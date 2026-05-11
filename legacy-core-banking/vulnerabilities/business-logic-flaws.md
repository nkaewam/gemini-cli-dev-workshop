# Business Logic Flaws

Business logic vulnerabilities represent flaws in the application's design and intended workflow execution rather than syntax injection or memory safety bugs. They occur when an application trusts that users will only follow standard operating workflows.

## Reverse Money Siphoning via Negative Amounts
- **File**: `routes/transfers.js`
- **Endpoint**: `POST /transfers`
- **Mechanism**: The fund wire execution route parses the supplied amount parameter to a floating-point integer and verifies that it is not `NaN`. However, it omits positive integer boundary validation (`amount <= 0`):
  ```javascript
  var amount = parseFloat(req.body.amount);
  if (isNaN(amount)) {
      return res.redirect('/transfers?error=Invalid amount');
  }
  // Missing boundary check: if (amount <= 0) { ... }
  ```
  The subsequent mathematical calculations apply standard arithmetic substitution directly:
  ```javascript
  var newSourceBalance = sourceAcc.balance - amount;
  var newDestBalance = destAcc.balance + amount;
  ```
- **Exploitation**: If an attacker submits a transfer request specifying an amount of `-50000`, the resulting math evaluates as:
  - `newSourceBalance = sourceAcc.balance - (-50000)` (Increases source balance by 50,000 THB)
  - `newDestBalance = destAcc.balance + (-50000)` (Deducts 50,000 THB from destination balance)
  
  This effectively enables malicious actors to siphon funds out of external accounts into their own accounts while simultaneously logging standard transaction success states.

## Remediation Strategy
Strictly define and enforce robust input bounds and sanity validation checks tailored to business rules at the gateway of service processing handlers. Financial transaction amounts must always be strictly positive values greater than zero.
