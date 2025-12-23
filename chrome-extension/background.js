// MVA Admin Chrome Extension - Background Service Worker
const SUPABASE_URL = 'https://fdpandnzblzvamhsoukt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkcGFuZG56Ymx6dmFtaHNvdWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzM2ODUsImV4cCI6MjA3NzQ0OTY4NX0.RB-3XaeYVlmt4VpGTzh72hpAl1J4HUkbe-_u-NZjAsU';
const CHECK_INTERVAL_MINUTES = 5;

// Initialize alarm for periodic checks
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('checkNotifications', {
    periodInMinutes: CHECK_INTERVAL_MINUTES
  });
  
  // Initial check
  checkForNewItems();
});

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkNotifications') {
    checkForNewItems();
  }
});

// Check for new viewing appointments and clients
async function checkForNewItems() {
  try {
    const settings = await chrome.storage.local.get(['lastCheckTime', 'notificationsEnabled']);
    
    if (settings.notificationsEnabled === false) {
      return;
    }
    
    const lastCheck = settings.lastCheckTime || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();
    
    // Check new viewing appointments
    const viewingsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/viewing_appointments?created_at=gte.${lastCheck}&select=id,customer_name,property_title,preferred_date,status`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    
    if (viewingsResponse.ok) {
      const viewings = await viewingsResponse.json();
      
      for (const viewing of viewings) {
        chrome.notifications.create(`viewing-${viewing.id}`, {
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: '📅 Vizionare Nouă',
          message: `${viewing.customer_name} - ${viewing.property_title}\nData: ${new Date(viewing.preferred_date).toLocaleDateString('ro-RO')}`,
          priority: 2
        });
      }
    }
    
    // Check new clients
    const clientsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/clients?created_at=gte.${lastCheck}&select=id,name,phone`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    
    if (clientsResponse.ok) {
      const clients = await clientsResponse.json();
      
      for (const client of clients) {
        chrome.notifications.create(`client-${client.id}`, {
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: '👤 Client Nou',
          message: `${client.name}\nTelefon: ${client.phone}`,
          priority: 2
        });
      }
    }
    
    // Update last check time
    await chrome.storage.local.set({ lastCheckTime: now });
    
  } catch (error) {
    console.error('Error checking for notifications:', error);
  }
}

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  const adminUrl = 'https://a0228d82-898b-4546-9599-8fbda4644c54.lovableproject.com/admin';
  
  if (notificationId.startsWith('viewing-')) {
    chrome.tabs.create({ url: `${adminUrl}/vizionari` });
  } else if (notificationId.startsWith('client-')) {
    chrome.tabs.create({ url: `${adminUrl}/clienti` });
  } else {
    chrome.tabs.create({ url: adminUrl });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkNow') {
    checkForNewItems().then(() => sendResponse({ success: true }));
    return true;
  }
});
