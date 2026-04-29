# Reply-email Attachments — Manual Test Checklist

Quick verification that attachments sent via the inbox are uploaded to storage,
saved with valid metadata in `sent_emails`, and rendered/downloadable in the UI.

---

## 1. Setup

- Sign in to admin (`/admin`).
- Open **Inbox** → pick any received email (or use **Compose**).
- Prepare 2 small test files:
  - `test.pdf` (≤ 200 KB)
  - `test.png` (≤ 200 KB)

---

## 2. Send a reply with 1 attachment (PDF)

1. Click **Răspunde** on a received email.
2. Attach `test.pdf`.
3. Type a short body and **Trimite**.
4. ✅ Toast confirms the email was sent.

### Verify storage

In `email-attachments` bucket, a folder `<sent_email_id>/` should contain `test.pdf`.

### Verify DB

```sql
SELECT id, sent_at, attachments
FROM sent_emails
ORDER BY sent_at DESC
LIMIT 1;
```

Expected `attachments[0]` shape:
```json
{
  "name": "test.pdf",
  "type": "application/pdf",
  "size": 12345,
  "url": "https://.../email-attachments/<id>/test.pdf",
  "path": "<id>/test.pdf"
}
```

✅ `url` is a valid public URL (open in browser → file downloads/renders).

### Verify UI

- Open **Trimise** in Inbox → click the email.
- ✅ Attachment chip shows `test.pdf` with the document icon.
- ✅ Button is **enabled** (not greyed out).
- ✅ Click → file downloads with original filename.

---

## 3. Send a new compose with 2 attachments (PDF + PNG)

1. Click **Compune** → fill `to`, `subject`, body.
2. Attach `test.pdf` AND `test.png`.
3. **Trimite**.

### Verify storage

`email-attachments/<sent_email_id>/` contains both files.

### Verify UI

- Open **Trimise** → click the email.
- ✅ Both chips render (PDF icon + Image icon).
- ✅ Each downloads correctly.

---

## 4. Legacy fallback (base64-only attachments)

For old `sent_emails` rows where `attachments[i]` only has `{filename, content}`
(no `url`/`path`):

- ✅ Inbox UI still shows the chip (filename + icon).
- ✅ Click → browser decodes the base64 in-memory and downloads the file.

> Implemented in `src/components/inbox/attachment-download.ts` via
> `downloadFromBase64()` fallback.

---

## 5. Edge cases

| Case | Expected |
|---|---|
| Attachment with diacritics / spaces in filename | Uploaded with sanitized name (`[^a-zA-Z0-9.-] → _`); download keeps original filename |
| Attachment > 10 MB | Mailgun may reject — check `reply-email` logs |
| Storage upload fails | Email still sends; chip shows but button disabled (toast: "Atașamentul nu este disponibil") |
| Bucket not public | `url` returns 403; fallback derives URL from `path` via `supabase.storage.getPublicUrl` |

---

## 6. Quick log check

```bash
# Recent reply-email runs
supabase functions logs reply-email --tail
```

Look for:
- `Sending email to: ... with N attachments`
- `Sent attachment upload failed (...)` — if any storage issue
- `Sent email saved to database`
