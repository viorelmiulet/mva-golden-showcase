// MVA Facebook Group Poster - Background Service Worker

const DEFAULTS = {
  edgeUrl: 'https://fdpandnzblzvamhsoukt.supabase.co/functions/v1/fb-queue',
  apiKey: '',
  groups: [],
  minDelay: 4,
  maxDelay: 9,
  enabled: false,
  maxPerDay: 15,
};

const STATE_DEFAULTS = {
  busy: false,
  todayCount: 0,
  todayDate: '',
  lastLog: [],
};

const MAX_LOG = 50;

async function getConfig() {
  const cfg = await chrome.storage.local.get(Object.keys(DEFAULTS));
  const merged = { ...DEFAULTS, ...cfg };
  if (!merged.edgeUrl) merged.edgeUrl = DEFAULTS.edgeUrl;
  merged.edgeUrl = String(merged.edgeUrl).trim().replace(/\/+$/, '');
  merged.apiKey = String(merged.apiKey || '').trim();
  merged.groups = Array.isArray(merged.groups)
    ? merged.groups.map((g) => String(g).trim()).filter(Boolean)
    : [];
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

async function log(entry) {
  const st = await getState();
  const ts = new Date().toLocaleString('ro-RO');
  const line = `[${ts}] ${entry}`;
  const lastLog = [line, ...(st.lastLog || [])].slice(0, MAX_LOG);
  await setState({ lastLog });
  console.log('[MVA-FB]', line);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function waitForContentReady(tabId, timeoutMs = 30000) {
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

async function waitForResult(tabId, timeoutMs = 90000) {
  return new Promise((resolve, reject) => {
    let done = false;
    const listener = (msg, sender) => {
      if (!sender.tab || sender.tab.id !== tabId) return;
      if (msg && msg.type === 'MVA_POST_RESULT') {
        done = true;
        chrome.runtime.onMessage.removeListener(listener);
        resolve(msg);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    setTimeout(() => {
      if (!done) {
        chrome.runtime.onMessage.removeListener(listener);
        reject(new Error('Timeout așteptând rezultatul postării.'));
      }
    }, timeoutMs);
  });
}

async function scheduleNextRun(cfg) {
  const minutes = randInt(cfg.minDelay, cfg.maxDelay);
  await chrome.alarms.create('mva-next-run', { delayInMinutes: minutes });
  await log(`Următoarea rulare programată în ~${minutes} min.`);
}

async function tick(opts = {}) {
  const force = !!opts.force;
  const cfg = await getConfig();
  let st = await getState();

  if (!cfg.enabled && !force) return;
  if (!cfg.edgeUrl || !cfg.apiKey) {
    await log(`Configurare lipsă: ${!cfg.edgeUrl ? 'edgeUrl' : ''}${!cfg.edgeUrl && !cfg.apiKey ? ' și ' : ''}${!cfg.apiKey ? 'apiKey' : ''}.`);
    return;
  }
  if (!cfg.groups.length) {
    await log('Configurare lipsă: adaugă URL-urile grupurilor în Setări.');
    return;
  }
  if (st.busy) {
    if (force) {
      await log('Reset stare „busy" blocată — forțez rularea.');
      await setState({ busy: false });
      st.busy = false;
    } else {
      return;
    }
  }

  // Reset daily counter
  const today = todayKey();
  if (st.todayDate !== today) {
    await setState({ todayDate: today, todayCount: 0 });
    st.todayCount = 0;
    st.todayDate = today;
  }
  if (st.todayCount >= cfg.maxPerDay) {
    await log(`Limita zilnică atinsă (${st.todayCount}/${cfg.maxPerDay}).`);
    return;
  }

  await setState({ busy: true });
  let openedTabId = null;

  try {
    // Fetch next job
    const nextRes = await fetch(`${cfg.edgeUrl}/next`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': cfg.apiKey,
      },
      body: JSON.stringify({ groups: cfg.groups }),
    });

    if (!nextRes.ok) {
      await log(`/next a răspuns HTTP ${nextRes.status}.`);
      return;
    }

    const job = await nextRes.json();
    if (!job || !job.id) {
      // nothing to do
      return;
    }

    await log(`Job primit: ${job.id} → ${job.group_url}`);

    // Open target group in inactive tab
    const tab = await chrome.tabs.create({ url: job.group_url, active: false });
    openedTabId = tab.id;

    let ok = false;
    let errorMsg = null;

    try {
      await waitForContentReady(openedTabId, 45000);
      chrome.tabs.sendMessage(openedTabId, { type: 'MVA_DO_POST', job });
      const result = await waitForResult(openedTabId, 90000);
      ok = !!result.ok;
      errorMsg = result.error || null;
    } catch (e) {
      ok = false;
      errorMsg = e && e.message ? e.message : String(e);
    }

    // Report result
    try {
      await fetch(`${cfg.edgeUrl}/result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': cfg.apiKey,
        },
        body: JSON.stringify({
          id: job.id,
          group_url: job.group_url,
          ok,
          error: errorMsg,
        }),
      });
    } catch (e) {
      await log(`Eroare la /result: ${e.message || e}`);
    }

    if (ok) {
      const st2 = await getState();
      await setState({ todayCount: (st2.todayCount || 0) + 1 });
      await log(`✅ Postat în ${job.group_url}`);
    } else {
      await log(`❌ Eșec ${job.group_url}: ${errorMsg}`);
    }

    // Close tab after 8s
    setTimeout(() => {
      if (openedTabId != null) {
        chrome.tabs.remove(openedTabId).catch(() => {});
      }
    }, 8000);

    await scheduleNextRun(cfg);
  } catch (e) {
    await log(`Eroare tick: ${e.message || e}`);
  } finally {
    await setState({ busy: false });
  }
}

function ensurePeriodicAlarm() {
  chrome.alarms.create('mva-periodic', { periodInMinutes: 2 });
}

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(Object.keys(DEFAULTS));
  const patch = {};
  for (const k of Object.keys(DEFAULTS)) {
    if (existing[k] === undefined) patch[k] = DEFAULTS[k];
  }
  if (!existing.edgeUrl) patch.edgeUrl = DEFAULTS.edgeUrl;
  if (!Array.isArray(existing.groups)) patch.groups = DEFAULTS.groups;
  if (Object.keys(patch).length) await chrome.storage.local.set(patch);
  await setState({ busy: false });
  ensurePeriodicAlarm();
});

chrome.runtime.onStartup.addListener(() => {
  ensurePeriodicAlarm();
  setState({ busy: false });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'mva-periodic' || alarm.name === 'mva-next-run') {
    tick();
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'MVA_RUN_NOW') {
    (async () => {
      try {
        await tick();
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, error: e.message || String(e) });
      }
    })();
    return true;
  }
});
