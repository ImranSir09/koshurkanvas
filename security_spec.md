# Firestore Security Rules Specification

## Data Invariants
1. A document or design project must have a valid ID matching `^[a-zA-Z0-9_\\-]+$`.
2. Title must be a string <= 200 characters.
3. Content or layers must not exceed volumetric boundaries.
4. Unauthenticated users cannot read or write private documents/designs without matching owner/public permissions.

## The Dirty Dozen Test Payloads
1. **Oversized Title**: `{ title: 'A'.repeat(500), content: 'test' }` -> DENIED
2. **Invalid ID Injection**: `documents/../../../etc/passwd` -> DENIED
3. **Invalid Type for Title**: `{ title: 12345, content: 'test' }` -> DENIED
4. **Missing Required Fields**: `{ content: 'test' }` -> DENIED
5. **Junk Ghost Fields**: `{ title: 'Valid', content: 'Valid', ghostField: 'hacked' }` -> DENIED
6. **Anonymous Mutate Admin Path**: Modifying `/users/` without auth -> DENIED
7. **Spoofed User ID**: `{ userId: 'other_user_id' }` -> DENIED
8. **Invalid Timestamp Type**: `{ createdAt: 'yesterday' }` -> DENIED
9. **SQL/Script Injection Title**: `{ title: '<script>alert(1)</script>' }` -> DENIED
10. **Null Payload**: `{}` -> DENIED
11. **Negative Dimensions in Design**: `{ width: -1080, height: 1080 }` -> DENIED
12. **Malicious Arrays**: Array containing unexpected object structures -> DENIED
