# Legacy Core Banking Application - Vulnerabilities Overview

This folder contains detailed documentation of the security vulnerabilities intentionally embedded within the KTB Legacy Core Banking application for workshop and training purposes.

To simulate a realistic audit and training scenario, explicit in-code comments and UI hint boxes pointing directly to vulnerable code snippets have been removed. Participants are encouraged to review the codebase, analyze data flows, and identify the root causes of these classic web security flaws using this documentation as a reference guide.

## Documented Vulnerabilities

- **[SQL Injection (SQLi)](./sql-injection.md)**: Unsafe string concatenation in authentication, account lookup, and transaction endpoints.
- **[Insecure Direct Object Reference (IDOR)](./idor.md)**: Missing authorization checks on user identifiers and account ownership verification.
- **[Mass Assignment](./mass-assignment.md)**: Unsanitized user-controlled input mapping directly to internal database entity attributes.
- **[Cross-Site Scripting (XSS)](./cross-site-scripting.md)**: Unescaped output rendering leading to both Reflected and Stored client-side code execution.
- **[Business Logic Flaws](./business-logic-flaws.md)**: Absence of boundary validation on transaction amounts enabling reverse money siphoning.

Use these guides to explore how the vulnerabilities are structured, identify the affected files and routes, and develop secure remediation strategies.
