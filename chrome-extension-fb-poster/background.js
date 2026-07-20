// MVA Facebook Group Poster - Background Service Worker (MV3 resilient)

const CONFIG_DEFAULTS = {
  edgeUrl: 'https://fdpandnzblzvamhsoukt.supabase.co/functions/v1/fb-queue',
  apiKey: '',
  minDelay: 4,
  maxDelay: 9,
  enabled: false,
  maxPerDay: 15,
};

const STATE_DEFAULTS = {
  busySince: 0,
  nextAllowedAt: 0,
  todayCount: 0,
  todayDate: '',
  lastLog: [],
};

const MAX_LOG = 50;
const BUSY_TIMEOUT_MS = 3 * 60 * 1000;
const ALARM_NAME = 'mva-tick';

async function getConfig() {
  const cfg = await chrome.storage.local.get(Object.keys(CONFIG_DEFAULTS));
  const merged = { ...CONFIG_DEFAULTS, ...cfg };
  merged.edgeUrl = String(merged.edgeUrl || '').trim().replace(/\/+$/, '');
  merged.apiKey = String(merged.apiKey || '').trim();
  return merged;
}

async function getState() {
  const st = await chrome.storage.local.get(Object.keys(STATE_DEFAULTS));
  return { ...STATE_DEFAULTS, ...st };
}

async function setState(patch) {
  await chrome.storage.local.set(patch);
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function log(entry) {
  const st = await getState();
  const ts = new Date().toLocaleString('ro-RO');
  const line = `[${ts}] ${entry}`;
  const lastLog = [line, ...(st.lastLog || [])].slice(0, MAX_LOG);
  await setState({ lastLog });
  console.log('[MVA-FB]', line);
}

function ensureAlarm() {
  chrome.alarms.get(ALARM_NAME, (a) => {
    if (!a) {
      chrome.alarms.create(ALARM_NAME, { periodInMinutes: 2 });
    }
  });
}

// Keepalive: apeluri periodice la API-uri chrome țin service worker-ul viu în timpul așteptării.
function startKeepalive() {
  const id = setInterval(() => {
    try { chrome.runtime.getPlatformInfo(() => {}); } catch (_) {}
    try { chrome.storage.local.get('busySince', () => {}); } catch (_) {}
  }, 20000);
  return () => clearInterval(id);
}

async function waitForResult(tabId, jobId, timeoutMs = 120000) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (val) => {
      if (done) return;
      done = true;
      chrome.runtime.onMessage.removeListener(listener);
      clearInterval(pollId);
      resolve(val);
    };
    const listener = (msg, sender) => {
      if (!sender.tab || sender.tab.id !== tabId) return;
      if (msg && msg.type === 'MVA_POST_RESULT') {
        finish({ ok: !!msg.ok, error: msg.error || null });
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    // Fallback: dacă worker-ul a fost repornit și mesajul s-a pierdut, citim din storage.
    const pollId = setInterval(async () => {
      try {
        const { lastPostResult } = await chrome.storage.local.get('lastPostResult');
        if (lastPostResult && lastPostResult.jobId === jobId) {
          await chrome.storage.local.remove('lastPostResult');
          finish({ ok: !!lastPostResult.ok, error: lastPostResult.error || null });
        }
      } catch (_) {}
    }, 3000);
    setTimeout(() => finish({ ok: false, error: 'Timeout așteptând rezultatul postării (120s).' }), timeoutMs);
  });
}

async function waitForReady(tabId, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    let done = false;
    const listener = (msg, sender) => {
      if (!sender.tab || sender.tab.id !== tabId) return;
      if (msg && msg.type === 'MVA_READY') {
        done = true;
        chrome.runtime.onMessage.removeListener(listener);
        resolve();
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    setTimeout(() => {
      if (!done) {
        chrome.runtime.onMessage.removeListener(listener);
        reject(new Error('Content script nu a răspuns (MVA_READY timeout).'));
      }
    }, timeoutMs);
  });
}

async function tick(force = false) {
  const cfg = await getConfig();
  if (!cfg.enabled && !force) return;
  if (!cfg.edgeUrl || !cfg.apiKey) {
    await log('Configurare lipsă: edgeUrl sau apiKey.');
    return;
  }

  const st = await getState();
  const now = Date.now();

  // busySince guard — treat old values as dead worker
  if (st.busySince && (now - st.busySince) < BUSY_TIMEOUT_MS) {
    return;
  }

  // spacing
  if (!force && now < (st.nextAllowedAt || 0)) return;

  // daily cap
  const today = todayKey();
  let todayCount = st.todayDate === today ? (st.todayCount || 0) : 0;
  if (st.todayDate !== today) {
    await setState({ todayDate: today, todayCount: 0 });
  }
  if (todayCount >= cfg.maxPerDay) {
    await log(`Limita zilnică atinsă (${todayCount}/${cfg.maxPerDay}).`);
    return;
  }

  await setState({ busySince: now });
  let openedTabId = null;

  try {
    const nextRes = await fetch(`${cfg.edgeUrl}/next`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': cfg.apiKey,
      },
      body: JSON.stringify({}),
    });

    if (!nextRes.ok) {
      await log(`/next a răspuns HTTP ${nextRes.status}.`);
      return;
    }

    const raw = await nextRes.text();
    if (!raw || raw === 'null') return;
    let job;
    try { job = JSON.parse(raw); } catch { await log('Răspuns invalid la /next.'); return; }
    if (!job || !job.id) return;

    await log(`Job primit: ${job.id} → ${job.group_url}`);

    const tab = await chrome.tabs.create({ url: job.group_url, active: false });
    openedTabId = tab.id;

    let ok = false;
    let errorMsg = null;

    try {
      await waitForReady(openedTabId, 45000);
      chrome.tabs.sendMessage(openedTabId, { type: 'MVA_DO_POST', job });
      const result = await waitForResult(openedTabId, 90000);
      ok = result.ok;
      errorMsg = result.error;
    } catch (e) {
      ok = false;
      errorMsg = e && e.message ? e.message : String(e);
    }

    try {
      await fetch(`${cfg.edgeUrl}/result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': cfg.apiKey,
        },
        body: JSON.stringify({ id: job.id, group_url: job.group_url, ok, error: errorMsg }),
      });
    } catch (e) {
      await log(`Eroare la /result: ${e.message || e}`);
    }

    if (ok) {
      const st2 = await getState();
      const newCount = (st2.todayDate === today ? (st2.todayCount || 0) : 0) + 1;
      await setState({ todayDate: today, todayCount: newCount });
      await log(`✅ Postat în ${job.group_url}`);
    } else {
      await log(`❌ Eșec ${job.group_url}: ${errorMsg}`);
    }

    setTimeout(() => {
      if (openedTabId != null) {
        chrome.tabs.remove(openedTabId).catch(() => {});
      }
    }, 8000);

    const delayMin = randInt(cfg.minDelay, cfg.maxDelay);
    await setState({ nextAllowedAt: Date.now() + delayMin * 60 * 1000 });
    await log(`Următoarea postare permisă în ~${delayMin} min.`);
  } catch (e) {
    await log(`Eroare tick: ${e.message || e}`);
  } finally {
    await setState({ busySince: 0 });
  }
}

// Top-level alarm registration — runs whenever worker wakes
ensureAlarm();

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(Object.keys(CONFIG_DEFAULTS));
  const patch = {};
  for (const k of Object.keys(CONFIG_DEFAULTS)) {
    if (existing[k] === undefined) patch[k] = CONFIG_DEFAULTS[k];
  }
  if (Object.keys(patch).length) await chrome.storage.local.set(patch);
  await setState({ busySince: 0 });
  ensureAlarm();
});

chrome.runtime.onStartup.addListener(async () => {
  await setState({ busySince: 0 });
  ensureAlarm();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) tick(false);
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === 'MVA_RUN_NOW') {
    (async () => {
      try {
        await tick(true);
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, error: e.message || String(e) });
      }
    })();
    return true;
  }
});
