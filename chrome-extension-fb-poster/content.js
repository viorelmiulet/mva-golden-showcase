// MVA Facebook Group Poster - Content Script

(function () {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

  const COMPOSER_PREFIXES = [
    'scrie ceva',
    'write something',
    'creează o postare publică',
    'creaza o postare publica',
    'create a public post',
  ];

  function matchesComposer(text) {
    if (!text) return false;
    const t = text.trim().toLowerCase();
    return COMPOSER_PREFIXES.some((p) => t.startsWith(p));
  }

  function isVisible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 10 || r.height < 5) return false;
    const st = window.getComputedStyle(el);
    return st.visibility !== 'hidden' && st.display !== 'none';
  }

  async function findComposerTrigger(timeoutMs = 20000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const btns = document.querySelectorAll('div[role="button"]');
      for (const b of btns) {
        if (!isVisible(b)) continue;
        const txt = (b.textContent || '').trim();
        if (matchesComposer(txt)) return b;
      }
      await sleep(500);
    }
    return null;
  }

  async function waitForDialog(timeoutMs = 15000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const dialogs = document.querySelectorAll('div[role="dialog"]');
      for (const d of dialogs) {
        const tb = d.querySelector('div[contenteditable="true"][role="textbox"]');
        if (tb) return { dialog: d, textbox: tb };
      }
      await sleep(400);
    }
    return null;
  }

  async function insertText(textbox, text) {
    textbox.focus();
    await sleep(1000);
    // Paste-first: preserves blank lines between blocks (\n\n) exactly.
    // execCommand('insertText') collapses/rewraps newlines in FB's Lexical editor,
    // breaking the block alignment of the MVA template.
    let pasted = false;
    try {
      const dt = new DataTransfer();
      dt.setData('text/plain', text);
      const evt = new ClipboardEvent('paste', {
        clipboardData: dt,
        bubbles: true,
        cancelable: true,
      });
      pasted = textbox.dispatchEvent(evt);
    } catch (_) {
      pasted = false;
    }
    await sleep(400);
    const probe = text.slice(0, 20);
    if (!(textbox.textContent || '').includes(probe)) {
      // Fallback: insert line by line, using an explicit line break between
      // lines so blank lines survive as real empty paragraphs.
      textbox.focus();
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].length) {
          document.execCommand('insertText', false, lines[i]);
        }
        if (i < lines.length - 1) {
          document.execCommand('insertLineBreak');
        }
      }
    }
    await sleep(300);
  }

  function findPostButton(dialog) {
    const labels = ['postează', 'posteaza', 'post', 'publică', 'publica'];
    const aria = dialog.querySelectorAll('[aria-label]');
    for (const el of aria) {
      const l = (el.getAttribute('aria-label') || '').trim().toLowerCase();
      if (labels.includes(l) && el.getAttribute('role') !== 'textbox') return el;
    }
    const btns = dialog.querySelectorAll('div[role="button"]');
    for (const b of btns) {
      const t = (b.textContent || '').trim().toLowerCase();
      if (labels.includes(t)) return b;
    }
    return null;
  }

  async function waitDialogGone(dialog, timeoutMs = 20000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (!document.body.contains(dialog)) return true;
      await sleep(500);
    }
    return false;
  }

  function fetchImageViaBackground(url) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ type: 'MVA_FETCH_IMAGE', url }, (resp) => {
          if (chrome.runtime.lastError || !resp || !resp.ok) {
            resolve(null);
            return;
          }
          try {
            const bin = atob(resp.base64);
            const arr = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
            resolve({ blob: new Blob([arr], { type: resp.type || 'image/jpeg' }), type: resp.type || 'image/jpeg' });
          } catch (_) {
            resolve(null);
          }
        });
      } catch (_) {
        resolve(null);
      }
    });
  }

  async function fetchImagesAsFiles(urls) {
    const files = [];
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      let got = null;
      try {
        const res = await fetch(url, { credentials: 'omit', mode: 'cors' });
        if (res.ok) {
          const blob = await res.blob();
          if (blob && blob.size > 0) got = { blob, type: blob.type };
        }
      } catch (_) { /* fall through */ }
      if (!got) got = await fetchImageViaBackground(url);
      if (!got || !got.blob || got.blob.size === 0) {
        console.warn('[MVA-FB] image fetch failed:', url);
        continue;
      }
      let type = got.type && got.type.startsWith('image/') ? got.type : 'image/jpeg';
      let ext = type.split('/')[1] || 'jpg';
      if (ext === 'jpeg') ext = 'jpg';
      files.push(new File([got.blob], `photo_${Date.now()}_${i}.${ext}`, { type }));
    }
    return files;
  }

  function listFileInputs() {
    const all = Array.from(document.querySelectorAll('input[type="file"]'));
    return all.filter((inp) => {
      const accept = (inp.getAttribute('accept') || '').toLowerCase();
      // Skip inputs that clearly aren't for images (e.g., .csv, application/*)
      if (accept && !accept.includes('image') && !accept.includes('video') && !accept.includes('*')) {
        return false;
      }
      return true;
    });
  }

  async function waitForNewInput(existingSet, timeoutMs = 12000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const inputs = listFileInputs();
      // Prefer an input that wasn't there before clicking Foto/video.
      const fresh = inputs.find((i) => !existingSet.has(i));
      if (fresh) return fresh;
      await sleep(250);
    }
    // Fallback: return the LAST image input on the page (usually the composer's).
    const inputs = listFileInputs();
    return inputs.length ? inputs[inputs.length - 1] : null;
  }

  async function clickPhotoVideoButton(dialog) {
    const labels = ['foto/video', 'photo/video', 'foto', 'photo', 'add photos', 'adaugă fotografii', 'adauga fotografii', 'adaugă foto', 'adauga foto', 'add to your post', 'adaugă la postare', 'adauga la postare'];
    const scopes = [dialog, document];
    for (const scope of scopes) {
      const nodes = scope.querySelectorAll('div[role="button"], [aria-label]');
      for (const el of nodes) {
        if (!isVisible(el)) continue;
        const aria = (el.getAttribute('aria-label') || '').trim().toLowerCase();
        const txt = (el.textContent || '').trim().toLowerCase();
        if (labels.some((l) => aria === l || aria.startsWith(l) || txt === l || txt.startsWith(l))) {
          el.click();
          return true;
        }
      }
    }
    return false;
  }

  async function fetchFallbackFile() {
    try {
      const url = chrome.runtime.getURL('fallback.png');
      const res = await fetch(url);
      const blob = await res.blob();
      return new File([blob], `mva_fallback_${Date.now()}.png`, { type: 'image/png' });
    } catch (e) {
      console.warn('[MVA-FB] fallback fetch failed:', e && e.message);
      return null;
    }
  }

  async function attachImages(dialog, urls, diag) {
    const capped = Array.isArray(urls) ? urls.slice(0, 7) : [];
    diag.requested = capped.length;
    console.log('[MVA-FB] fetching', capped.length, 'images (max 7)');
    let files = capped.length ? await fetchImagesAsFiles(capped) : [];
    diag.fetched = files.length;
    console.log('[MVA-FB] fetched', files.length, 'of', capped.length);

    if (files.length === 0) {
      console.warn('[MVA-FB] using fallback cover image');
      const fb = await fetchFallbackFile();
      if (fb) { files = [fb]; diag.usedFallback = true; }
    }
    if (files.length === 0) {
      diag.step = 'no-files';
      throw new Error(`Nicio imagine disponibilă (${diag.requested} URL-uri primite, 0 descărcate, fallback indisponibil).`);
    }

    diag.step = 'click-photo-button';
    const before = new Set(listFileInputs());
    const clicked = await clickPhotoVideoButton(dialog);
    diag.photoButtonClicked = clicked;
    console.log('[MVA-FB] photo/video button clicked:', clicked);
    if (!clicked) {
      throw new Error(`Nu am găsit butonul „Foto/video" (${files.length} imagini pregătite, dar nu s-au putut atașa).`);
    }

    diag.step = 'wait-file-input';
    await sleep(800);
    const input = await waitForNewInput(before, 12000);
    if (!input) {
      throw new Error(`Nu am găsit input-ul pentru fotografii după click pe „Foto/video" (${files.length} imagini pregătite).`);
    }
    diag.inputAccept = input.getAttribute('accept') || '';
    console.log('[MVA-FB] using input; accept =', diag.inputAccept);

    diag.step = 'inject-files';
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));

    diag.step = 'wait-thumbnails';
    const started = Date.now();
    let ready = 0;
    while (Date.now() - started < 60000) {
      const imgs = dialog.querySelectorAll('img');
      ready = 0;
      for (const im of imgs) {
        const w = im.naturalWidth || 0;
        if (w > 40 && w < 800) ready += 1;
      }
      if (ready >= files.length) break;
      await sleep(1000);
    }
    diag.thumbnailsReady = ready;
    if (ready === 0) {
      throw new Error(`Facebook nu a randat niciun thumbnail după injectarea a ${files.length} imagini (accept="${diag.inputAccept}").`);
    }
    await sleep(3000);
    diag.step = 'done';
    diag.attached = files.length;
    return { attached: files.length };
  }



  async function doPost(job) {
    const diag = {
      step: 'start',
      requested: 0,
      fetched: 0,
      usedFallback: false,
      photoButtonClicked: false,
      inputAccept: '',
      thumbnailsReady: 0,
      attached: 0,
      attachError: null,
    };

    await sleep(rand(2000, 5000));

    diag.step = 'find-composer';
    const trigger = await findComposerTrigger(20000);
    if (!trigger) { const e = new Error('Nu am găsit butonul „Scrie ceva".'); e.diag = diag; throw e; }
    trigger.scrollIntoView({ block: 'center' });
    await sleep(400);
    trigger.click();

    diag.step = 'wait-dialog';
    const found = await waitForDialog(15000);
    if (!found) { const e = new Error('Nu s-a deschis dialogul de postare.'); e.diag = diag; throw e; }
    const { dialog, textbox } = found;

    diag.step = 'insert-text';
    await insertText(textbox, job.message || '');

    await sleep(rand(3000, 5000));

    // Attach photos: try offer images (max 7); if none work, fallback cover image.
    // Never abort the post on attach errors — publish text-only as last resort.
    try {
      await attachImages(dialog, job.image_urls || [], diag);
    } catch (e) {
      diag.attachError = (e && e.message) ? e.message : String(e);
      console.warn('[MVA-FB] attach images failed, posting without photos:', diag.attachError, diag);
      await sleep(rand(1500, 2500));
    }

    diag.step = 'find-post-button';
    const postBtn = findPostButton(dialog);
    if (!postBtn) { const e = new Error(buildErr('Nu am găsit butonul „Postează".', diag)); e.diag = diag; throw e; }
    if (postBtn.getAttribute('aria-disabled') === 'true') {
      const e = new Error(buildErr('Butonul „Postează" este dezactivat.', diag)); e.diag = diag; throw e;
    }
    postBtn.click();

    diag.step = 'wait-dialog-gone';
    const gone = await waitDialogGone(dialog, 60000);
    if (!gone) { const e = new Error(buildErr('Dialogul nu s-a închis după publicare.', diag)); e.diag = diag; throw e; }

    diag.step = 'success';
    return { ok: true, diag };
  }

  function buildErr(base, d) {
    const parts = [
      `imagini: ${d.fetched}/${d.requested} descărcate${d.usedFallback ? ' + fallback' : ''}`,
      `atașate: ${d.attached}`,
      `thumbnails: ${d.thumbnailsReady}`,
      `pas: ${d.step}`,
    ];
    if (d.attachError) parts.push(`attach: ${d.attachError}`);
    return `${base} [${parts.join(' • ')}]`;
  }


  setTimeout(() => {
    try { chrome.runtime.sendMessage({ type: 'MVA_READY' }); } catch (_) {}
  }, 3000);

  function reportResult(payload) {
    // Dublu-canal: mesaj + storage, ca să nu se piardă rezultatul dacă service worker-ul MV3 a murit.
    try { chrome.runtime.sendMessage({ type: 'MVA_POST_RESULT', ...payload }); } catch (_) {}
    try {
      chrome.storage.local.set({
        lastPostResult: { ...payload, ts: Date.now(), url: location.href },
      });
    } catch (_) {}
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'MVA_DO_POST') {
      (async () => {
        try {
          const res = await doPost(msg.job || {});
          reportResult({ ok: true, jobId: msg.job && msg.job.id, diag: res && res.diag });
        } catch (e) {
          reportResult({
            ok: false,
            jobId: msg.job && msg.job.id,
            error: (e && e.message) ? e.message : String(e),
            diag: e && e.diag,
          });
        }
      })();
    }
  });
})();
