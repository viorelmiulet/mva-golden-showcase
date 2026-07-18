// MVA Facebook Group Poster - Content Script

(function () {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

  function textMatchesComposer(txt) {
    if (!txt) return false;
    const t = txt.trim().toLowerCase();
    return (
      t.startsWith('scrie ceva') ||
      t.startsWith('write something') ||
      t.startsWith('creează o postare publică') ||
      t.startsWith('creaza o postare publica') ||
      t.startsWith('create a public post')
    );
  }

  async function pollForComposer(timeoutMs = 20000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const buttons = document.querySelectorAll('div[role="button"]');
      for (const b of buttons) {
        const t = (b.textContent || '').trim();
        if (textMatchesComposer(t)) return b;
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
