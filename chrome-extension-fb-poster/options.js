const DEFAULT_EDGE_URL = 'https://fdpandnzblzvamhsoukt.supabase.co/functions/v1/fb-queue';
const fields = ['edgeUrl', 'apiKey', 'groups', 'minDelay', 'maxDelay', 'maxPerDay'];

function parseGroups(value) {
  return String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

async function load() {
  const s = await chrome.storage.local.get(fields);
  document.getElementById('edgeUrl').value = s.edgeUrl || DEFAULT_EDGE_URL;
  document.getElementById('apiKey').value = s.apiKey || '';
  document.getElementById('groups').value = Array.isArray(s.groups) ? s.groups.join('\n') : '';
  document.getElementById('minDelay').value = s.minDelay ?? 4;
  document.getElementById('maxDelay').value = s.maxDelay ?? 9;
  document.getElementById('maxPerDay').value = s.maxPerDay ?? 15;
}

document.getElementById('saveBtn').addEventListener('click', async () => {
  let edgeUrl = document.getElementById('edgeUrl').value.trim();
  if (!edgeUrl) edgeUrl = DEFAULT_EDGE_URL;
  edgeUrl = edgeUrl.replace(/\/+$/, '');
  const apiKey = document.getElementById('apiKey').value.trim();
  const groups = parseGroups(document.getElementById('groups').value);
  const minDelay = Math.max(1, parseInt(document.getElementById('minDelay').value, 10) || 4);
  let maxDelay = Math.max(1, parseInt(document.getElementById('maxDelay').value, 10) || 9);
  if (maxDelay < minDelay) maxDelay = minDelay;
  const maxPerDay = Math.max(1, parseInt(document.getElementById('maxPerDay').value, 10) || 15);

  await chrome.storage.local.set({ edgeUrl, apiKey, groups, minDelay, maxDelay, maxPerDay });
  const msg = document.getElementById('savedMsg');
  msg.style.display = 'inline';
  setTimeout(() => (msg.style.display = 'none'), 1800);
});

load();
