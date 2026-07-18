// MVA Facebook Group Poster - Content Script

(function () {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

  const COMPOSER_PHRASES = [
    'scrie ceva',
    'scrieți ceva',
    'scrieti ceva',
    'write something',
    'creează o postare',
    'creaza o postare',
    'create a public post',
    'create post',
    'ce ai în minte',
    'ce ai in minte',
    "what's on your mind",
    'what is on your mind',
  ];

  function textMatchesComposer(txt) {
    if (!txt) return false;
    const t = txt.trim().toLowerCase();
    if (!t || t.length > 200) return false;
    return COMPOSER_PHRASES.some((p) => t.includes(p));
  }

  function isVisible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 20 || r.height < 10) return false;
    const st = window.getComputedStyle(el);
    return st.visibility !== 'hidden' && st.display !== 'none';
  }

  async function pollForComposer(timeoutMs = 30000) {
    const deadline = Date.now() + timeoutMs;
    let scrollTick = 0;
    while (Date.now() < deadline) {
      // 1) role=button whose text/aria-label contains a composer phrase
      const buttons = document.querySelectorAll('div[role="button"], span[role="button"]');
      for (const b of buttons) {
        if (!isVisible(b)) continue;
        const aria = (b.getAttribute('aria-label') || '').toLowerCase();
        if (textMatchesComposer(aria)) return b;
        const t = (b.innerText || b.textContent || '').trim();
        if (textMatchesComposer(t)) return b;
      }
      // 2) any span/div text node with the phrase → click nearest ancestor button
      const spans = document.querySelectorAll('span, div');
      for (const s of spans) {
        const t = (s.innerText || '').trim();
        if (!textMatchesComposer(t)) continue;
        if (!isVisible(s)) continue;
        const btn = s.closest('[role="button"]');
        if (btn) return btn;
        return s; // fallback — click the span itself
      }
      // 3) contenteditable placeholder at top of feed
      const editables = document.querySelectorAll('div[contenteditable="true"]');
      for (const e of editables) {
        if (!isVisible(e)) continue;
        const ph = (e.getAttribute('aria-placeholder') || e.getAttribute('data-placeholder') || '').toLowerCase();
        if (textMatchesComposer(ph)) return e;
      }
      // Nudge the page: scroll a bit to force lazy-render
      if (scrollTick++ % 4 === 3) {
        window.scrollBy({ top: 200, behavior: 'instant' });
        await sleep(300);
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      await sleep(600);
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
    let ok = false;
    try {
      ok = document.execCommand('insertText', false, text);
    } catch (_) {
      ok = false;
    }
    if (!ok || !(textbox.textContent || '').includes(text.slice(0, 20))) {
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
    // aria-label match
    const aria = dialog.querySelectorAll('[aria-label]');
    for (const el of aria) {
      const l = (el.getAttribute('aria-label') || '').trim().toLowerCase();
      if (labels.includes(l) && el.getAttribute('role') !== 'textbox') {
        return el;
      }
    }
    // div[role=button] with text
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

    const trigger = await pollForComposer(20000);
    if (!trigger) throw new Error('Nu am găsit butonul „Scrie ceva".');
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

  // Announce readiness after 3s
  setTimeout(() => {
    try {
      chrome.runtime.sendMessage({ type: 'MVA_READY' });
    } catch (_) {}
  }, 3000);

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'MVA_DO_POST') {
      (async () => {
        try {
          await doPost(msg.job || {});
          chrome.runtime.sendMessage({ type: 'MVA_POST_RESULT', ok: true });
        } catch (e) {
          chrome.runtime.sendMessage({
            type: 'MVA_POST_RESULT',
            ok: false,
            error: (e && e.message) ? e.message : String(e),
          });
        }
      })();
    }
  });
})();
