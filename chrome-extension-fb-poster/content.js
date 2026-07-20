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

    await sleep(rand(6000, 9000));

    const postBtn = findPostButton(dialog);
    if (!postBtn) throw new Error('Nu am găsit butonul „Postează".');
    if (postBtn.getAttribute('aria-disabled') === 'true') {
      throw new Error('Butonul „Postează" este dezactivat.');
    }
    postBtn.click();

    const gone = await waitDialogGone(dialog, 20000);
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
