# PulseCard

## Current State
- Backend has `getRecordsByProfileId` but it requires `#user` authentication, blocking public (QR-scan) access.
- `PublicProfilePage` (the doctor QR-scan view at `/patient/:id`) shows Emergency Info and QR Code tabs but does NOT display any medical records.
- `useGetMedicalSummary` is the only public query used on this page.

## Requested Changes (Diff)

### Add
- Backend: `getPublicRecordsByProfileId(profileId)` — a public `query` function (no auth check) that returns `[MedicalRecord]` for a given profileId, so the QR scan page can load records without login.
- Frontend hook: `useGetPublicRecords(profileId)` in `useQueries.ts` — calls the new public backend function.
- New "Medical Records" tab on `PublicProfilePage` showing each record's title, type, description/gist, and upload date.

### Modify
- `PublicProfilePage`: Change `grid-cols-2` tabs to `grid-cols-3`, add third tab "Records" that lists public records. Update footer disclaimer to reflect records are now visible.
- `useQueries.ts`: Add `useGetPublicRecords` hook.

### Remove
- Footer disclaimer sentence "Full records including medications require patient authorization" — records are now publicly visible via QR scan.

## Implementation Plan
1. Add `getPublicRecordsByProfileId` public query to `main.mo`.
2. Add `useGetPublicRecords` hook to `useQueries.ts` (no auth, uses actor in anonymous mode).
3. Update `PublicProfilePage.tsx`:
   - Import `useGetPublicRecords`.
   - Change tabs to 3 columns.
   - Add "Records" tab with a list of record cards (title, type badge, description, date).
   - Update footer disclaimer.
