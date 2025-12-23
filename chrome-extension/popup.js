// MVA Admin Chrome Extension - Popup Script
const SUPABASE_URL = 'https://fdpandnzblzvamhsoukt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkcGFuZG56Ymx6dmFtaHNvdWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzM2ODUsImV4cCI6MjA3NzQ0OTY4NX0.RB-3XaeYVlmt4VpGTzh72hpAl1J4HUkbe-_u-NZjAsU';
const ADMIN_URL = 'https://a0228d82-898b-4546-9599-8fbda4644c54.lovableproject.com/admin';

document.addEventListener('DOMContentLoaded', async () => {
  // Load settings
  const settings = await chrome.storage.local.get(['notificationsEnabled', 'lastCheckTime']);
  
  // Set toggle state
  const toggle = document.getElementById('notificationsToggle');
  if (settings.notificationsEnabled === false) {
    toggle.classList.remove('active');
  }
  
  // Set last check time
  if (settings.lastCheckTime) {
    const date = new Date(settings.lastCheckTime);
    document.getElementById('lastCheck').textContent = date.toLocaleString('ro-RO');
  }
  
  // Load stats
  await loadStats();
  
  // Toggle notifications
  toggle.addEventListener('click', async () => {
    toggle.classList.toggle('active');
    const enabled = toggle.classList.contains('active');
    await chrome.storage.local.set({ notificationsEnabled: enabled });
  });
  
  // Open admin panel
  document.getElementById('openAdmin').addEventListener('click', () => {
    chrome.tabs.create({ url: ADMIN_URL });
  });
  
  // Check now button
  document.getElementById('checkNow').addEventListener('click', async () => {
    const loading = document.getElementById('loading');
    loading.classList.add('show');
    
    await chrome.runtime.sendMessage({ action: 'checkNow' });
    await loadStats();
    
    const now = new Date();
    document.getElementById('lastCheck').textContent = now.toLocaleString('ro-RO');
    await chrome.storage.local.set({ lastCheckTime: now.toISOString() });
    
    loading.classList.remove('show');
  });
});

async function loadStats() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();
    
    // Get today's viewings
    const viewingsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/viewing_appointments?preferred_date=gte.${todayISO.split('T')[0]}&preferred_date=lt.${new Date(today.getTime() + 86400000).toISOString().split('T')[0]}&select=id`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    
    if (viewingsResponse.ok) {
      const viewings = await viewingsResponse.json();
      document.getElementById('viewingsCount').textContent = viewings.length;
    }
    
    // Get clients from last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const clientsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/clients?created_at=gte.${weekAgo}&select=id`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    
    if (clientsResponse.ok) {
      const clients = await clientsResponse.json();
      document.getElementById('clientsCount').textContent = clients.length;
    }
    
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}
