

## Fix: PDF download race condition on sign page

### Problem
In `SignContract.tsx`, `handleDownloadPdf` has a race condition:
1. It calls `await generatePdfPreview()` which sets `pdfBlobUrl`
2. Then immediately calls `setIsDownloading(false)` 
3. Both state updates batch together in React
4. The `useEffect` that auto-downloads checks `if (pdfBlobUrl && isDownloading)` — but `isDownloading` is already `false`
5. Result: first-time download silently fails

### Admin flow
The admin preview and download flows (`openPreviewDialog`, `downloadContract`) both generate PDFs in memory and look correct. No storage dependency issues.

### Fix (1 file)

**`src/pages/SignContract.tsx`** — Fix `handleDownloadPdf`:
- Remove the `isDownloading` state + `useEffect` pattern
- After `await generatePdfPreview()`, the `pdfBlobUrl` won't be available yet in the same render
- Instead: generate PDF inline, create blob URL, and download immediately without relying on state

```typescript
const handleDownloadPdf = useCallback(async () => {
  if (pdfBlobUrl) {
    const a = document.createElement('a');
    a.href = pdfBlobUrl;
    a.download = `contract-${contractInfo?.id || 'document'}.pdf`;
    a.click();
    return;
  }
  
  // Generate PDF directly and download
  if (!contractInfo || !contractType) return;
  setIsGeneratingPdf(true);
  try {
    let proprietarSig = null, chiriasSig = null;
    if (contractId) {
      const { data: allSigs } = await supabase
        .from('contract_signatures')
        .select('party_type, signature_data')
        .eq('contract_id', contractId);
      // ... extract sigs
    }
    const pdf = await generateSignedRentalContractPdf({ ... });
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);
    setPdfBlobUrl(url);
    // Download immediately
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract-${contractInfo?.id || 'document'}.pdf`;
    a.click();
  } catch { ... }
  finally { setIsGeneratingPdf(false); }
}, [...]);
```

- Remove `isDownloading` state variable
- Remove the auto-download `useEffect`

### Summary
- Admin flows: working correctly (generate in memory, no storage dependency)
- Sign page preview: working correctly
- Sign page download: **race condition bug** — fix by downloading directly after generation instead of relying on state + effect

