# Report: what reads the 7 exposed tables today

No code was changed for the security task, and no RLS policy was touched — the working tree is clean and the policies are exactly as they were. The editorial `head()` migration from the earlier task is untouched and stays.

This is a read-only inventory. Nothing below is applied.

## 1. Reads per finding, screen by screen

Note on a false positive: `ComodatContractPage.tsx` lines 205–218 match `from('contracts')` but that is the **storage bucket**, not the table.

### Finding 2 — `contract_signatures` (anon SELECT `true`)

| Screen / file | Route | What it reads |
|---|---|---|
| `src/pages/SignContract.tsx` (146, 202, 361, 506) | `/sign/$token` (public) | Looks up the signature row by `signature_token`, then all signatures of that contract to render the signed PDF |
| `src/pages/admin/ContractGeneratorPage.tsx` (729, 774, 791, 806, 816, 976, 1056) | `/admin/contracte` generator | Existing signature rows, tokens for signing links, signature images for the PDF |
| `src/pages/admin/GeneratedContractsPage.tsx` (506, 547) | Generated contracts list | Signature status per contract |

Public pages affected: the signing page only.

### Finding 7 — storage bucket `contracts` (public SELECT/INSERT/UPDATE/DELETE)

| Screen / file | Operation |
|---|---|
| `src/lib/storageUrl.ts` (`getSignedContractUrl`) | `createSignedUrl` with the browser client — used by the contract generator and the contracts list |
| `src/pages/admin/GeneratedContractsPage.tsx` (348) | `createSignedUrl` for download |
| `src/pages/admin/ContractGeneratorPage.tsx` (685–700) | Upload PDF + `getPublicUrl` |
| `src/pages/admin/ComodatContractPage.tsx` (205–218) | Upload PDF + `getPublicUrl` |

The signing page does **not** read the bucket — it regenerates the PDF in memory (`generateSignedRentalContractPdf`), so signing is unaffected by locking the bucket.

### Finding 1 — `contracts` (anon SELECT `true`)

| Screen / file | Route | What it reads |
|---|---|---|
| `src/pages/SignContract.tsx` (384, 490) | `/sign/$token` (public) | The single contract behind the token |
| `src/pages/admin/GeneratedContractsPage.tsx` (168, 494, 536) | Generated contracts list | Full contract list + detail |
| `src/pages/admin/ContractGeneratorPage.tsx` (275, 1024) | Contract generator | Load/refresh a contract |
| `src/pages/admin/IntermediationContractPage.tsx` (222, 236, 246, 271) | Intermediation contract | Load/refresh a contract |

### Finding 3 — `received_emails` / `sent_emails` (anon SELECT `true`)

| Screen / file | Route | What it reads |
|---|---|---|
| `src/pages/admin/InboxPage.tsx` (~20 call sites, 272–608) | `/admin/inbox` | Full mailbox: lists, threads, read/star/archive/trash views, sent list |
| `src/components/AdminSidebar.tsx` (133) | Every admin screen | Unread-count badge |

`/admin/monitorizare-email` does **not** read these tables directly — it goes through the Mailgun events server function already. No public page reads them.

### Finding 5 — `rental_properties`

| Screen / file | Route |
|---|---|
| `src/pages/admin/rental/RentalProperties.tsx` (43) | `/admin/gestiune-chirii/proprietati` |
| `src/pages/admin/rental/RentalDashboard.tsx` (12) | `/admin/gestiune-chirii` |
| `src/pages/admin/rental/RentalTenants.tsx` (45) | `/admin/gestiune-chirii/chiriasi` (property picker) |

### Finding 4 — `rental_payments`

| Screen / file | Route |
|---|---|
| `src/pages/admin/rental/RentalDashboard.tsx` (34) | `/admin/gestiune-chirii` |
| `src/pages/admin/rental/RentalCalendar.tsx` (32) | `/admin/gestiune-chirii/calendar` |

### Finding 6 — `rental_tickets`

| Screen / file | Route |
|---|---|
| `src/pages/admin/rental/RentalDashboard.tsx` (46) | `/admin/gestiune-chirii` |

No public page reads any rental table.

## 2. Does a server-function equivalent exist?

| Need | Status |
|---|---|
| Admin **writes** to any table | Exists — `adminDb` → `adminWriteFn` → `adminWrite.server.ts` (password verified server-side, service role) |
| Admin **reads** of any table | **Does not exist.** There is no read counterpart to `adminDb`. Every read above goes through the browser anon client |
| Token-validated write for signing | Exists — `signContract.functions.ts` → `signContract.server.ts` |
| Token-validated **read** of one contract + its signatures | **Does not exist.** `SignContract.tsx` reads both tables directly with the anon client |
| Signed URL for a contract PDF | **Does not exist server-side.** `storageUrl.ts` signs with the browser client, which needs the public bucket policy |
| Upload of a contract PDF | **Does not exist server-side.** Uploads go from the browser to the public bucket |

So three new pieces would be written, and everything else is a call-site swap:

1. `adminRead.server.ts` + `adminRead.functions.ts` + an `adminDb.from(...).select(...)` read builder mirroring the existing write builder (filters, `order`, `range`, `limit`, `single`/`maybeSingle`, `count`), failing loudly on error so a failed read never renders as an empty table.
2. An extension of `signContract.server.ts`: `getContractForToken(token)` returning exactly one contract plus its signatures — never a listable set.
3. Contract storage server functions: `signedContractUrl(path)` and `uploadContractPdf(...)`, both service-role, plus a rewrite of `getSignedContractUrl` to call the server function.

## 3. Proposed order, smallest blast radius first

Each step is independently verifiable in the admin before moving on.

| Step | Table / target | Screens touched | Why here |
|---|---|---|---|
| 0 | none | — | Build `adminRead` (server fn + client read builder) and prove it on one screen. No policy change yet |
| 1 | `rental_tickets` | 1 screen (dashboard) | Single read, single screen — smallest possible test of the new read path |
| 2 | `rental_payments` | 2 screens (dashboard, calendar) | Same shape, slightly wider |
| 3 | `rental_properties` | 3 screens | Completes the rental module; drop all three anon rental policies together after verifying |
| 4 | `received_emails` + `sent_emails` | Inbox (~20 reads) + sidebar badge | Bigger but self-contained; no public surface |
| 5 | storage `contracts` bucket | Generator, comodat, generated-contracts list | Must land **before** the contract tables, because download/upload has to work off signed URLs first |
| 6 | `contracts` + `contract_signatures` — admin | Generator, intermediation, generated-contracts list | Admin side moved to `adminRead` while the anon policies are still in place |
| 7 | `contracts` + `contract_signatures` — public signing | `/sign/$token` | Last, because it is the only public consumer; policies are dropped only after end-to-end signing is verified against the new token-scoped read |

Verification at each step: load the screen and confirm rows still render, then attempt an anon `SELECT` against the table with the publishable key and confirm it is denied.

One correction worth flagging before any work starts: the signing route in this codebase is `/sign/$token`, not `/semnare/:token`.
