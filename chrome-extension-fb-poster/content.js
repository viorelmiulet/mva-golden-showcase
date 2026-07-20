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
    let inserted = false;
    try {
      inserted = document.execCommand('insertText', false, text);
    } catch (_) {
      inserted = false;
    }
    await sleep(300);
    if (!inserted || !(textbox.textContent || '').includes(text.slice(0, 20))) {
      try {
        const dt = new DataTransfer();
        dt.setData('text/plain', text);
        const evt = new ClipboardEvent('paste', {
          clipboardData: dt,
          bubbles: true,
          cancelable: true,
        });
        textbox.dispatchEvent(evt);
      } catch (e) {
        throw new Error('Nu am putut insera textul în composer.');
      }
    }
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

  async function fetchImagesAsFiles(urls) {
    const files = [];
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        const res = await fetch(url, { credentials: 'omit', mode: 'cors' });
        if (!res.ok) continue;
        const blob = await res.blob();
        if (!blob || blob.size === 0) continue;
        let type = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
        let ext = type.split('/')[1] || 'jpg';
        if (ext === 'jpeg') ext = 'jpg';
        const name = `photo_${Date.now()}_${i}.${ext}`;
        files.push(new File([blob], name, { type }));
      } catch (_) {
        // skip broken image
      }
    }
    return files;
  }

  async function findFileInput(dialog, timeoutMs = 8000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const inputs = dialog.querySelectorAll('input[type="file"]');
      for (const inp of inputs) {
        const accept = (inp.getAttribute('accept') || '').toLowerCase();
        if (!accept || accept.includes('image')) return inp;
      }
      await sleep(300);
    }
    return null;
  }

  async function clickPhotoVideoButton(dialog) {
    const labels = ['foto/video', 'photo/video', 'foto', 'photo', 'add photos', 'adaugă fotografii', 'adauga fotografii'];
    const nodes = dialog.querySelectorAll('div[role="button"], [aria-label]');
    for (const el of nodes) {
      const t = ((el.getAttribute('aria-label') || '') + ' ' + (el.textContent || '')).trim().toLowerCase();
      if (labels.some((l) => t === l || t.startsWith(l))) {
        el.click();
        return true;
      }
    }
    return false;
  }

  async function attachImages(dialog, urls) {
    if (!urls || urls.length === 0) return { attached: 0 };
    const files = await fetchImagesAsFiles(urls);
    if (files.length === 0) return { attached: 0 };

    let input = await findFileInput(dialog, 2000);
    if (!input) {
      await clickPhotoVideoButton(dialog);
      await sleep(1200);
      input = await findFileInput(dialog, 8000);
    }
    if (!input) throw new Error('Nu am găsit input-ul pentru fotografii.');

    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // Wait for thumbnails to actually render — up to 60s (upload can be slow).
    const started = Date.now();
    while (Date.now() - started < 60000) {
      const imgs = dialog.querySelectorAll('img');
      let ready = 0;
      for (const im of imgs) {
        const w = im.naturalWidth || 0;
        if (w > 40 && w < 800) ready += 1;
      }
      if (ready >= files.length) break;
      await sleep(1000);
    }
    // Extra buffer for Facebook to enable the Post button.
    await sleep(2500);
    return { attached: files.length };
  }

  async function doPost(job) {
    await sleep(rand(2000, 5000));

    const trigger = await findComposerTrigger(20000);
    if (!trigger) throw new Error('Nu am găsit butonul „Scrie ceva".');
    trigger.scrollIntoView({ block: 'center' });
    await sleep(400);
    trigger.click();

    const found = await waitForDialog(15000);
    if (!found) throw new Error('Nu s-a deschis dialogul de postare.');
    const { dialog, textbox } = found;

    await insertText(textbox, job.message || '');

    await sleep(rand(3000, 5000));

    // Attach photos if provided by the edge function.
    if (Array.isArray(job.image_urls) && job.image_urls.length > 0) {
      try {
        await attachImages(dialog, job.image_urls);
      } catch (e) {
        // Non-fatal: continue posting text-only if attach fails.
        console.warn('[MVA-FB] attach images failed:', e && e.message);
      }
    } else {
      await sleep(rand(3000, 4000));
    }

    const postBtn = findPostButton(dialog);
    if (!postBtn) throw new Error('Nu am găsit butonul „Postează".');
    if (postBtn.getAttribute('aria-disabled') === 'true') {
      throw new Error('Butonul „Postează" este dezactivat.');
    }
    postBtn.click();

    const gone = await waitDialogGone(dialog, 60000);
    if (!gone) throw new Error('Dialogul nu s-a închis după publicare.');

    return true;
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
          await doPost(msg.job || {});
          reportResult({ ok: true, jobId: msg.job && msg.job.id });
        } catch (e) {
          reportResult({
            ok: false,
            jobId: msg.job && msg.job.id,
            error: (e && e.message) ? e.message : String(e),
          });
        }
      })();
    }
  });
})();
