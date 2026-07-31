const FIELDS = ['edgeUrl', 'apiKey', 'minDelay', 'maxDelay', 'maxPerDay'];

async function load() {
  const cfg = await chrome.storage.local.get(FIELDS);
  document.getElementById('edgeUrl').value = cfg.edgeUrl || 'https://mvaimobiliare.ro/api/public/fb-queue';
  document.getElementById('apiKey').value = cfg.apiKey || '';
  document.getElementById('minDelay').value = cfg.minDelay ?? 4;
  document.getElementById('maxDelay').value = cfg.maxDelay ?? 9;
  document.getElementById('maxPerDay').value = cfg.maxPerDay ?? 15;
}

document.getElementById('save').addEventListener('click', async () => {
  const edgeUrl = String(document.getElementById('edgeUrl').value || '').trim().replace(/\/+$/, '');
  const apiKey = String(document.getElementById('apiKey').value || '').trim();
  const minDelay = Math.max(1, parseInt(document.getElementById('minDelay').value, 10) || 4);
  const maxDelayRaw = Math.max(1, parseInt(document.getElementById('maxDelay').value, 10) || 9);
  const maxDelay = Math.max(minDelay, maxDelayRaw);
  const maxPerDay = Math.max(1, parseInt(document.getElementById('maxPerDay').value, 10) || 15);

  await chrome.storage.local.set({ edgeUrl, apiKey, minDelay, maxDelay, maxPerDay });
  const s = document.getElementById('status');
  s.textContent = 'Setări salvate.';
  setTimeout(() => { s.textContent = ''; }, 2500);
});

load();
