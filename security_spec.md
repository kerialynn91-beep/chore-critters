# Security Specification for Chore Champ

## 1. Data Invariants
- **Kid**: `stars` balance must always be a number. `avatar` must be a valid string (max 100 chars).
- **Chore**: `points` must be positive. `assignedTo` must be a non-empty list of Kid IDs.
- **TaskInstance**: `status` must be 'pending' or 'completed'. `pointsValue` must match the Chore's points at creation time.
- **Reward**: `cost` must be positive.
- **Transaction**: `amount` must be non-zero. `kidId` must exist. `timestamp` must be server-validated.

## 2. The "Dirty Dozen" Payloads (Denial Expected)
1. **Kid Spoofing**: Attempt to update `stars` balance directly without a transaction record.
2. **Kid Creation**: Anonymous user attempting to create a Kid profile.
3. **Chore Injection**: Kid mode attempting to create a 0-point chore for themselves.
4. **ID Poisoning**: Creating a Chore with a 2MB string as ID.
5. **Timestamp Fraud**: Setting `completedAt` to a future date in the past.
6. **Task Hijacking**: Kid A marking Kid B's task as completed.
7. **Negative Stars**: Spending more stars than owned (if enforced).
8. **Shadow Fields**: Adding `isAdmin: true` to a Kid document.
9. **Reward Price Drop**: Kid mode attempting to change Reward `cost` to 0.
10. **Transaction Spam**: Creating 1000 transactions in a second.
11. **Relational Orphan**: Creating a TaskInstance for a non-existent Chore.
12. **PII Leak**: Reading all Kids' data without being authenticated as a family member.

## 3. Test Runner (Conceptual)
Tests would verify `PERMISSION_DENIED` for the above payloads using the Firebase emulator or rules unit testing library.
