# Security Specification for Servexa Firestore Security Rules

## 1. Data Invariants
1. **User Identity Invariant**: A user document at `/users/{userId}` can only be modified by the matching authenticated user `request.auth.uid == userId` or an authenticated administrator. A user cannot unilaterally elevate their role to `admin` or mark `walletStatus` as `active` without verification approval.
2. **Booking Invariant**: Bookings can only be created by an authenticated customer where `incoming().customerId == request.auth.uid`. Status updates can only be executed by the designated customer, provider, or administrator.
3. **Transaction Invariant**: Wallet ledger transactions at `/transactions/{txId}` represent audited financial records. Only the associated user or platform admin can read their specific transactions. Direct client writes to transactions are restricted to verified operations.
4. **Complaint Invariant**: A complaint must have `incoming().userId == request.auth.uid`. Terminal states (`resolved`, `dismissed`) can only be set by an administrator.

## 2. The Dirty Dozen Payloads
1. **Payload 1 (Self-Role Elevation)**: User attempts to write `{ "role": "admin" }` to their own profile. Expected: PERMISSION_DENIED.
2. **Payload 2 (Ghost Field Injection)**: User attempts to write an unauthorized `isAdmin: true` or `shadowField: "exploit"`. Expected: PERMISSION_DENIED.
3. **Payload 3 (Spoofed Booking Customer)**: Attacker with UID `user-A` tries creating a booking with `customerId: "user-B"`. Expected: PERMISSION_DENIED.
4. **Payload 4 (Oversized ID Injection)**: Attacker sends a 2KB junk string as document ID. Expected: PERMISSION_DENIED by `isValidId()`.
5. **Payload 5 (Unauthenticated Read of PII)**: Unauthenticated visitor queries `/users/{userId}`. Expected: PERMISSION_DENIED.
6. **Payload 6 (Unauthorized Wallet Activation)**: User writes `walletStatus: "active"` to bypass admin KYC approval. Expected: PERMISSION_DENIED.
7. **Payload 7 (Tampering with Transaction Amounts)**: Customer submits a transaction modifying another user's balance. Expected: PERMISSION_DENIED.
8. **Payload 8 (Arbitrary Booking Cancellation)**: Third party attempts to cancel a booking where they are neither customer nor assigned provider. Expected: PERMISSION_DENIED.
9. **Payload 9 (Terminal State Reversal)**: Non-admin attempts to reopen or edit a `resolved` complaint ticket. Expected: PERMISSION_DENIED.
10. **Payload 10 (Denial of Wallet String Bomb)**: User sends a 100KB string in `serviceName` or `description`. Expected: PERMISSION_DENIED by size constraints.
11. **Payload 11 (Unauthenticated Ledger Scraping)**: Unauthenticated user calls `list` on `/transactions`. Expected: PERMISSION_DENIED.
12. **Payload 12 (Blanket Read Bypass)**: Authenticated user calls `list` on `/bookings` without filtering to their own bookings. Expected: PERMISSION_DENIED.
