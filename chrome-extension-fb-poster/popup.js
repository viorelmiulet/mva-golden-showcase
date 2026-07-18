const toggleBtn = document.getElementById('toggleBtn');
const runBtn = document.getElementById('runBtn');
const settingsLink = document.getElementById('settingsLink');
const statsEl = document.getElementById('stats');
const logEl = document.getElementById('log');

async function refresh() {
  const s = await chrome.storage.local.get([
    'enabled', 'todayCount', 'maxPerDay', 'lastLog',
  ]);
  const enabled = !!s.enabled;
  toggleBtn.textContent = enabled ? 'Oprește' : 'Pornește';
  toggleBtn.style.background = enabled ? '#c0392b' : '#DAA520';
  toggleBtn.style.color = enabled ? '#fff' : '#1a1a1a';
  statsEl.textContent = `Azi: ${s.todayCount || 0}/${s.maxPerDay || 0} postări`;
  const log = Array.isArray(s.lastLog) ? s.lastLog : [];
  logEl.textContent = log.length ? log.join('\n') : '— fără activitate —';
}

toggleBtn.addEventListener('click', async () => {
  const { enabled } = await chrome.storage.local.get('enabled');
  await chrome.storage.local.set({ enabled: !enabled });
  refresh();
});

runBtn.addEventListener('click', async () => {
  runBtn.disabled = true;
  runBtn.textContent = 'Se rulează…';
  try {
    await chrome.runtime.sendMessage({ type: 'MVA_RUN_NOW' });
  } catch (_) {}
  runBtn.disabled = false;
  runBtn.textContent = 'Rulează acum';
  refresh();
});

settingsLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

refresh();
setInterval(refresh, 3000);
