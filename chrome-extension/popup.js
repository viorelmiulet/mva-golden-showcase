// MVA Admin Chrome Extension - Popup Script
const SUPABASE_URL = 'https://fdpandnzblzvamhsoukt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkcGFuZG56Ymx6dmFtaHNvdWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzM2ODUsImV4cCI6MjA3NzQ0OTY4NX0.RB-3XaeYVlmt4VpGTzh72hpAl1J4HUkbe-_u-NZjAsU';
const ADMIN_URL = 'https://a0228d82-898b-4546-9599-8fbda4644c54.lovableproject.com';

document.addEventListener('DOMContentLoaded', async () => {
  // Load settings
  const settings = await chrome.storage.local.get(['notificationsEnabled', 'emailNotificationsEnabled', 'lastCheckTime']);
  
  // Set toggle state
  const toggle = document.getElementById('notificationsToggle');
  if (settings.notificationsEnabled === false) {
    toggle.classList.remove('active');
  }
  
  // Set email notifications toggle state
  const emailToggle = document.getElementById('emailNotificationsToggle');
  if (settings.emailNotificationsEnabled === false) {
    emailToggle.classList.remove('active');
  }
  
  // Set last check time
  if (settings.lastCheckTime) {
    const date = new Date(settings.lastCheckTime);
    document.getElementById('lastCheck').textContent = formatDate(date);
  }
  
  // Check connection status
  checkConnectionStatus();
  
  // Load stats
  await loadStats();
  
  // Load unread emails count
  await loadUnreadEmailsCount();
  
  // Toggle notifications
  toggle.addEventListener('click', async () => {
    toggle.classList.toggle('active');
    const enabled = toggle.classList.contains('active');
    await chrome.storage.local.set({ notificationsEnabled: enabled });
  });
  
  // Toggle email notifications
  emailToggle.addEventListener('click', async () => {
    emailToggle.classList.toggle('active');
    const enabled = emailToggle.classList.contains('active');
    await chrome.storage.local.set({ emailNotificationsEnabled: enabled });
  });
  
  // Open admin panel
  document.getElementById('openAdmin').addEventListener('click', () => {
    chrome.tabs.create({ url: `${ADMIN_URL}/admin` });
  });
  
  // Menu items click handlers
  document.querySelectorAll('.menu-item, .stat-card').forEach(item => {
    item.addEventListener('click', () => {
      const url = item.dataset.url;
      if (url) {
        chrome.tabs.create({ url: `${ADMIN_URL}${url}` });
      }
    });
  });
  
  // Check now button
  document.getElementById('checkNow').addEventListener('click', async () => {
    const loading = document.getElementById('loading');
    loading.classList.add('show');
    
    await chrome.runtime.sendMessage({ action: 'checkNow' });
    await loadStats();
    await loadUnreadEmailsCount();
    
    const now = new Date();
    document.getElementById('lastCheck').textContent = formatDate(now);
    await chrome.storage.local.set({ lastCheckTime: now.toISOString() });
    
    loading.classList.remove('show');
  });
});

function formatDate(date) {
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Acum';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} ore`;
  
  return date.toLocaleDateString('ro-RO', { 
    day: '2-digit', 
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function checkConnectionStatus() {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    if (response.ok) {
      statusDot.classList.remove('offline');
      statusText.textContent = 'Online';
    } else {
      throw new Error('Connection failed');
    }
  } catch (error) {
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
    
    // Parallel requests for better performance
    const [viewingsRes, clientsRes, propertiesRes, contractsRes] = await Promise.all([
      // Today's viewings
      fetch(
        `${SUPABASE_URL}/rest/v1/viewing_appointments?preferred_date=gte.${todayISO}&preferred_date=lt.${tomorrowISO}&select=id`,
        { headers: getHeaders() }
      ),
      // Clients from last 7 days
      fetch(
        `${SUPABASE_URL}/rest/v1/clients?created_at=gte.${weekAgo}&select=id`,
        { headers: getHeaders() }
      ),
      // Active properties count
      fetch(
        `${SUPABASE_URL}/rest/v1/catalog_offers?availability_status=eq.disponibil&select=id`,
        { headers: getHeaders() }
      ),
      // Recent contracts
      fetch(
        `${SUPABASE_URL}/rest/v1/contracts?created_at=gte.${weekAgo}&select=id`,
        { headers: getHeaders() }
      )
    ]);
    
    // Update stats
    if (viewingsRes.ok) {
      const viewings = await viewingsRes.json();
      document.getElementById('viewingsCount').textContent = viewings.length;
    }
    
    if (clientsRes.ok) {
      const clients = await clientsRes.json();
      document.getElementById('clientsCount').textContent = clients.length;
    }
    
    if (propertiesRes.ok) {
      const properties = await propertiesRes.json();
      document.getElementById('propertiesCount').textContent = properties.length;
    }
    
    if (contractsRes.ok) {
      const contracts = await contractsRes.json();
      document.getElementById('contractsCount').textContent = contracts.length;
    }
    
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

function getHeaders() {
  return {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  };
}

async function loadUnreadEmailsCount() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/received_emails?is_read=eq.false&is_deleted=eq.false&select=id`,
      { headers: getHeaders() }
    );
    
    if (response.ok) {
      const emails = await response.json();
      const badge = document.getElementById('unreadEmailsBadge');
      if (emails.length > 0) {
        badge.textContent = emails.length > 99 ? '99+' : emails.length;
        badge.style.display = 'inline';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Error loading unread emails count:', error);
  }
}