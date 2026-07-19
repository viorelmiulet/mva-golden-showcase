const toggle = document.getElementById('toggle');
const runBtn = document.getElementById('runNow');
const optionsLink = document.getElementById('openOptions');
const todayEl = document.getElementById('today');
const nextEl = document.getElementById('next');
const logEl = document.getElementById('log');

function pad(n) { return String(n).padStart(2, '0'); }

async function refresh() {
  const cfg = await chrome.storage.local.get([
    'enabled', 'maxPerDay', 'todayCount', 'todayDate', 'nextAllowedAt', 'lastLog',
  ]);
  toggle.classList.toggle('on', !!cfg.enabled);
  todayEl.textContent = `Azi: ${cfg.todayCount || 0}/${cfg.maxPerDay || 15} postări`;

  const now = Date.now();
  if (cfg.nextAllowedAt && cfg.nextAllowedAt > now) {
    const d = new Date(cfg.nextAllowedAt);
    nextEl.textContent = `Următoarea postare: ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } else {
    nextEl.textContent = '';
  }

  const lines = (cfg.lastLog || []).map((l) => `<div>${l.replace(/</g, '&lt;')}</div>`).join('');
  logEl.innerHTML = lines || '<div style="color:#666">Fără evenimente încă.</div>';
}

toggle.addEventListener('click', async () => {
  const { enabled } = await chrome.storage.local.get('enabled');
  await chrome.storage.local.set({ enabled: !enabled });
  refresh();
});

runBtn.addEventListener('click', async () => {
  runBtn.disabled = true;
  runBtn.textContent = 'Rulez...';
  try {
    await chrome.runtime.sendMessage({ type: 'MVA_RUN_NOW' });
  } catch (_) {}
  runBtn.disabled = false;
  runBtn.textContent = 'Rulează acum';
  refresh();
});

optionsLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

refresh();
setInterval(refresh, 3000);
