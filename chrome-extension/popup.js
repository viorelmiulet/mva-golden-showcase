// MVA Admin Chrome Extension - Popup Script
const SUPABASE_URL = 'https://fdpandnzblzvamhsoukt.supabase.co';
const SITE_URL = 'https://mvaimobiliare.ro';

function formatDate(date) {
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return 'Acum';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} ore`;
  return date.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

document.addEventListener('DOMContentLoaded', async () => {
  const loginScreen = document.getElementById('loginScreen');
  const mainApp = document.getElementById('mainApp');

  const isAuth = await Auth.isAuthenticated();

  if (isAuth) {
    await showMainApp();
  } else {
    loginScreen.style.display = 'block';
    mainApp.style.display = 'none';
  }

  // Login form
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');

    btn.disabled = true;
    btn.textContent = '⏳ Se conectează...';
    errorEl.classList.remove('show');

    try {
      await Auth.signIn(email, password);
      await showMainApp();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.add('show');
    } finally {
      btn.disabled = false;
      btn.textContent = '🔐 Autentificare';
    }
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await Auth.signOut();
    loginScreen.style.display = 'block';
    mainApp.style.display = 'none';
  });
});

async function showMainApp() {
  const loginScreen = document.getElementById('loginScreen');
  const mainApp = document.getElementById('mainApp');

  loginScreen.style.display = 'none';
  mainApp.style.display = 'block';

  // Show user email
  const { auth_user_email } = await chrome.storage.local.get('auth_user_email');
  document.getElementById('userEmail').textContent = auth_user_email || '-';

  // Load settings
  const settings = await chrome.storage.local.get(['notificationsEnabled', 'lastCheckTime']);
  const toggle = document.getElementById('notificationsToggle');
  if (settings.notificationsEnabled === false) toggle.classList.remove('active');
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

  // Open admin
  document.getElementById('openAdmin').addEventListener('click', () => {
    chrome.tabs.create({ url: `${SITE_URL}/admin` });
  });

  // Menu items
  document.querySelectorAll('.menu-item, .stat-card').forEach(item => {
    item.addEventListener('click', () => {
      const url = item.dataset.url;
      if (url) chrome.tabs.create({ url: `${SITE_URL}${url}` });
    });
  });

  // Check now
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
}

async function checkConnectionStatus() {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  try {
    const headers = await Auth.getHeaders();
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, { method: 'HEAD', headers });
    if (response.ok) {
      statusDot.classList.remove('offline');
      statusText.textContent = 'Online';
    } else throw new Error();
  } catch {
    statusDot.classList.add('offline');
    statusText.textContent = 'Offline';
  }
}

async function loadStats() {
  try {
    const headers = await Auth.getHeaders();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString().split('T')[0];
    const tomorrowISO = new Date(today.getTime() + 86400000).toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const [viewingsRes, propertiesRes, contractsRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/viewing_appointments?preferred_date=gte.${todayISO}&preferred_date=lt.${tomorrowISO}&select=id`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/catalog_offers?availability_status=eq.disponibil&select=id`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/contracts?created_at=gte.${weekAgo}&select=id`, { headers })
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
    const headers = await Auth.getHeaders();
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/received_emails?is_read=eq.false&is_deleted=eq.false&is_archived=eq.false&select=id`,
      { headers }
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
    const headers = await Auth.getHeaders();
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/contract_signatures?signed_at=is.null&select=id&limit=100`,
      { headers }
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
