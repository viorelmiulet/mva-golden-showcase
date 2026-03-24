// MVA Admin Chrome Extension - Background Service Worker
const SUPABASE_URL = 'https://fdpandnzblzvamhsoukt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkcGFuZG56Ymx6dmFtaHNvdWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzM2ODUsImV4cCI6MjA3NzQ0OTY4NX0.RB-3XaeYVlmt4VpGTzh72hpAl1J4HUkbe-_u-NZjAsU';
const SITE_URL = 'https://mvaimobiliare.ro';
const CHECK_INTERVAL_MINUTES = 1;

function getHeaders() {
  return {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  };
}

// Extract readable sender name
function extractSenderName(sender) {
  const match = sender.match(/^([^<]+)</);
  if (match) return match[1].trim();
  const emailMatch = sender.match(/([^@]+)@/);
  return emailMatch ? emailMatch[1] : sender;
}

// Initialize alarm for periodic checks
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('checkAll', { periodInMinutes: CHECK_INTERVAL_MINUTES });
  checkAll();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkAll') {
    checkAll();
  }
});

async function checkAll() {
  const settings = await chrome.storage.local.get([
    'notificationsEnabled',
    'lastEmailNotifiedAt',
    'lastViewingNotifiedAt'
  ]);

  if (settings.notificationsEnabled === false) {
    return;
  }

  await Promise.all([
    checkNewEmails(settings.lastEmailNotifiedAt),
    checkNewViewings(settings.lastViewingNotifiedAt)
  ]);

  await updateBadge();
}

// Check for new unread emails
async function checkNewEmails(lastNotifiedAt) {
  try {
    const since = lastNotifiedAt || new Date(Date.now() - 60000).toISOString();

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/received_emails?received_at=gt.${since}&is_read=eq.false&is_deleted=eq.false&is_archived=eq.false&select=id,sender,subject,stripped_text,received_at&order=received_at.desc&limit=10`,
      { headers: getHeaders() }
    );

    if (!response.ok) return;

    const emails = await response.json();
    if (emails.length === 0) return;

    // Update last notified timestamp to the newest email
    const newestAt = emails[0].received_at;
    await chrome.storage.local.set({ lastEmailNotifiedAt: newestAt });

    if (emails.length === 1) {
      const e = emails[0];
      const snippet = (e.stripped_text || e.subject || '').substring(0, 100);
      chrome.notifications.create(`email-${e.id}`, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: `📧 ${extractSenderName(e.sender)}`,
        message: `${e.subject || '(Fără subiect)'}\n${snippet}`,
        priority: 2
      });
    } else {
      const senders = emails.slice(0, 3).map(e => extractSenderName(e.sender)).join(', ');
      chrome.notifications.create(`emails-batch-${Date.now()}`, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: `📧 ${emails.length} emailuri noi`,
        message: senders + (emails.length > 3 ? ` și încă ${emails.length - 3}` : ''),
        priority: 2
      });
    }
  } catch (error) {
    console.error('Error checking emails:', error);
  }
}

// Check for new viewing appointments
async function checkNewViewings(lastNotifiedAt) {
  try {
    const since = lastNotifiedAt || new Date(Date.now() - 60000).toISOString();

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/viewing_appointments?created_at=gt.${since}&select=id,customer_name,property_title,preferred_date,preferred_time&order=created_at.desc&limit=10`,
      { headers: getHeaders() }
    );

    if (!response.ok) return;

    const viewings = await response.json();
    if (viewings.length === 0) return;

    // Update last notified timestamp
    // Use the first item's created_at as reference (newest first)
    const newestCreatedAt = new Date().toISOString(); // use current time as baseline
    await chrome.storage.local.set({ lastViewingNotifiedAt: newestCreatedAt });

    for (const v of viewings) {
      const dateStr = v.preferred_date
        ? new Date(v.preferred_date).toLocaleDateString('ro-RO')
        : '';
      chrome.notifications.create(`viewing-${v.id}`, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: '📅 Vizionare Nouă',
        message: `${v.customer_name} — ${v.property_title}\nData: ${dateStr} ${v.preferred_time || ''}`.trim(),
        priority: 2
      });
    }
  } catch (error) {
    console.error('Error checking viewings:', error);
  }
}

// Update badge with unread email count
async function updateBadge() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/received_emails?is_read=eq.false&is_deleted=eq.false&is_archived=eq.false&select=id`,
      { headers: getHeaders() }
    );

    if (!response.ok) return;

    const emails = await response.json();
    const count = emails.length;

    if (count > 0) {
      chrome.action.setBadgeText({ text: count > 99 ? '99+' : String(count) });
      chrome.action.setBadgeBackgroundColor({ color: '#DAA520' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.startsWith('email-') || notificationId.startsWith('emails-batch-')) {
    chrome.tabs.create({ url: `${SITE_URL}/admin/inbox` });
  } else if (notificationId.startsWith('viewing-')) {
    chrome.tabs.create({ url: `${SITE_URL}/admin/vizionari` });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkNow') {
    checkAll().then(() => sendResponse({ success: true }));
    return true;
  }
});
