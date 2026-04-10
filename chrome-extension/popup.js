// MVA Admin Chrome Extension - Popup Script
const SUPABASE_URL = 'https://fdpandnzblzvamhsoukt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkcGFuZG56Ymx6dmFtaHNvdWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzM2ODUsImV4cCI6MjA3NzQ0OTY4NX0.RB-3XaeYVlmt4VpGTzh72hpAl1J4HUkbe-_u-NZjAsU';
const SITE_URL = 'https://mvaimobiliare.ro';

function getHeaders() {
  return {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  };
}

function formatDate(date) {
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return 'Acum';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} ore`;
  return date.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

document.addEventListener('DOMContentLoaded', async () => {
  const settings = await chrome.storage.local.get(['notificationsEnabled', 'lastCheckTime']);

  // Notifications toggle
  const toggle = document.getElementById('notificationsToggle');
  if (settings.notificationsEnabled === false) toggle.classList.remove('active');

  // Last check time
  if (settings.lastCheckTime) {
    document.getElementById('lastCheck').textContent = formatDate(new Date(settings.lastCheckTime));
  }

  checkConnectionStatus();
  await Promise.all([loadStats(), loadUnreadEmailsCount(), loadPendingSignatures()]);

  // Toggle notifications
  toggle.addEventListener('click', async () => {
    toggle.classList.toggle('active');
    await chrome.storage.local.set({ notificationsEnabled: toggle.classList.contains('active') });
  });

  // Open admin panel
  document.getElementById('openAdmin').addEventListener('click', () => {
    chrome.tabs.create({ url: `${SITE_URL}/admin` });
  });

  // Menu items click handlers
  document.querySelectorAll('.menu-item, .stat-card').forEach(item => {
    item.addEventListener('click', () => {
      const url = item.dataset.url;
      if (url) chrome.tabs.create({ url: `${SITE_URL}${url}` });
    });
  });

  // Check now button
  document.getElementById('checkNow').addEventListener('click', async () => {
    const loading = document.getElementById('loading');
    loading.classList.add('show');
    await chrome.runtime.sendMessage({ action: 'checkNow' });
    await Promise.all([loadStats(), loadUnreadEmailsCount(), loadPendingSignatures()]);
    const now = new Date();
    document.getElementById('lastCheck').textContent = formatDate(now);
    await chrome.storage.local.set({ lastCheckTime: now.toISOString() });
    loading.classList.remove('show');
  });
});

async function checkConnectionStatus() {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, { method: 'HEAD', headers: { 'apikey': SUPABASE_ANON_KEY } });
    if (response.ok) {
      statusDot.classList.remove('offline');
      statusText.textContent = 'Online';
    } else {
      throw new Error();
    }
  } catch {
    statusDot.classList.add('offline');
    statusText.textContent = 'Offline';
  }
}

async function loadStats() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString().split('T')[0];
    const tomorrowISO = new Date(today.getTime() + 86400000).toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [viewingsRes, propertiesRes, contractsRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/viewing_appointments?preferred_date=gte.${todayISO}&preferred_date=lt.${tomorrowISO}&select=id`, { headers: getHeaders() }),
      fetch(`${SUPABASE_URL}/rest/v1/catalog_offers?availability_status=eq.disponibil&select=id`, { headers: getHeaders() }),
      fetch(`${SUPABASE_URL}/rest/v1/contracts?created_at=gte.${weekAgo}&select=id`, { headers: getHeaders() })
    ]);

    if (viewingsRes.ok) document.getElementById('viewingsCount').textContent = (await viewingsRes.json()).length;
    if (propertiesRes.ok) document.getElementById('propertiesCount').textContent = (await propertiesRes.json()).length;
    if (contractsRes.ok) document.getElementById('contractsCount').textContent = (await contractsRes.json()).length;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function loadUnreadEmailsCount() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/received_emails?is_read=eq.false&is_deleted=eq.false&is_archived=eq.false&select=id`,
      { headers: getHeaders() }
    );
    if (response.ok) {
      const emails = await response.json();
      const badge = document.getElementById('unreadEmailsBadge');
      const countEl = document.getElementById('emailsCount');
      if (emails.length > 0) {
        badge.textContent = emails.length > 99 ? '99+' : emails.length;
        badge.style.display = 'inline';
      } else {
        badge.style.display = 'none';
      }
      if (countEl) countEl.textContent = emails.length;
    }
  } catch (error) {
    console.error('Error loading unread emails count:', error);
  }
}

async function loadPendingSignatures() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/contract_signatures?signed_at=is.null&select=id&limit=100`,
      { headers: getHeaders() }
    );
    if (response.ok) {
      const pending = await response.json();
      const countEl = document.getElementById('signaturesCount');
      if (countEl) countEl.textContent = pending.length;
    }
  } catch (error) {
    console.error('Error loading pending signatures:', error);
  }
}
