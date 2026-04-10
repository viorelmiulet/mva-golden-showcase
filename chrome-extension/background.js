// MVA Admin Chrome Extension - Background Service Worker
importScripts('auth.js');

const SUPABASE_URL = 'https://fdpandnzblzvamhsoukt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkcGFuZG56Ymx6dmFtaHNvdWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzM2ODUsImV4cCI6MjA3NzQ0OTY4NX0.RB-3XaeYVlmt4VpGTzh72hpAl1J4HUkbe-_u-NZjAsU';
const SITE_URL = 'https://mvaimobiliare.ro';
const CHECK_INTERVAL_MINUTES = 1;

async function getHeaders() {
  return Auth.getHeaders();
}

function extractSenderName(sender) {
  const match = sender.match(/^([^<]+)</);
  if (match) return match[1].trim();
  const emailMatch = sender.match(/([^@]+)@/);
  return emailMatch ? emailMatch[1] : sender;
}

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  const now = new Date().toISOString();
  chrome.storage.local.set({
    notificationsEnabled: true,
    lastEmailNotifiedAt: now,
    lastViewingNotifiedAt: now,
    lastSignatureNotifiedAt: now,
    lastCheckTime: now
  });
  chrome.alarms.create('checkAll', { periodInMinutes: CHECK_INTERVAL_MINUTES });
  setTimeout(() => checkAll(), 10000);
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create('checkAll', { periodInMinutes: CHECK_INTERVAL_MINUTES });
  checkAll();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkAll') checkAll();
});

async function checkAll() {
  try {
    const isAuth = await Auth.isAuthenticated();
    if (!isAuth) return; // Don't check if not logged in

    const settings = await chrome.storage.local.get([
      'notificationsEnabled',
      'lastEmailNotifiedAt',
      'lastViewingNotifiedAt',
      'lastSignatureNotifiedAt'
    ]);

    if (settings.notificationsEnabled === false) return;

    await Promise.all([
      checkNewEmails(settings.lastEmailNotifiedAt),
      checkNewViewings(settings.lastViewingNotifiedAt),
      checkNewSignatures(settings.lastSignatureNotifiedAt)
    ]);

    await updateBadge();
    await chrome.storage.local.set({ lastCheckTime: new Date().toISOString() });
  } catch (error) {
    console.error('checkAll error:', error);
  }
}

async function checkNewEmails(lastNotifiedAt) {
  try {
    const since = lastNotifiedAt || new Date(Date.now() - 120000).toISOString();
    const headers = await getHeaders();
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/received_emails?received_at=gt.${since}&is_read=eq.false&is_deleted=eq.false&is_archived=eq.false&select=id,sender,subject,stripped_text,received_at&order=received_at.desc&limit=10`,
      { headers }
    );
    if (!response.ok) return;

    const emails = await response.json();
    if (emails.length === 0) return;

    await chrome.storage.local.set({ lastEmailNotifiedAt: emails[0].received_at });

    if (emails.length === 1) {
      const e = emails[0];
      chrome.notifications.create(`email-${e.id}`, {
        type: 'basic', iconUrl: 'icons/icon128.png',
        title: `📧 ${extractSenderName(e.sender)}`,
        message: `${e.subject || '(Fără subiect)'}\n${(e.stripped_text || '').substring(0, 100)}`,
        priority: 2
      });
    } else {
      const senders = emails.slice(0, 3).map(e => extractSenderName(e.sender)).join(', ');
      chrome.notifications.create(`emails-batch-${Date.now()}`, {
        type: 'basic', iconUrl: 'icons/icon128.png',
        title: `📧 ${emails.length} emailuri noi`,
        message: senders + (emails.length > 3 ? ` și încă ${emails.length - 3}` : ''),
        priority: 2
      });
    }
  } catch (error) {
    console.error('Error checking emails:', error);
  }
}

async function checkNewViewings(lastNotifiedAt) {
  try {
    const since = lastNotifiedAt || new Date(Date.now() - 120000).toISOString();
    const headers = await getHeaders();
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/viewing_appointments?created_at=gt.${since}&select=id,customer_name,property_title,preferred_date,preferred_time,created_at&order=created_at.desc&limit=10`,
      { headers }
    );
    if (!response.ok) return;

    const viewings = await response.json();
    if (viewings.length === 0) return;

    await chrome.storage.local.set({ lastViewingNotifiedAt: viewings[0].created_at });

    for (const v of viewings) {
      const dateStr = v.preferred_date ? new Date(v.preferred_date).toLocaleDateString('ro-RO') : '';
      chrome.notifications.create(`viewing-${v.id}`, {
        type: 'basic', iconUrl: 'icons/icon128.png',
        title: '📅 Vizionare Nouă',
        message: `${v.customer_name} — ${v.property_title || 'Proprietate'}\nData: ${dateStr} ${v.preferred_time || ''}`.trim(),
        priority: 2
      });
    }
  } catch (error) {
    console.error('Error checking viewings:', error);
  }
}

async function checkNewSignatures(lastNotifiedAt) {
  try {
    const since = lastNotifiedAt || new Date(Date.now() - 120000).toISOString();
    const headers = await getHeaders();
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/contract_signatures?signed_at=gt.${since}&signed_at=not.is.null&select=id,signer_name,signer_email,party_type,signed_at,contract_id&order=signed_at.desc&limit=10`,
      { headers }
    );
    if (!response.ok) return;

    const signatures = await response.json();
    if (signatures.length === 0) return;

    await chrome.storage.local.set({ lastSignatureNotifiedAt: signatures[0].signed_at });

    for (const s of signatures) {
      const partyLabel = s.party_type === 'proprietar' ? 'Proprietar' : 'Chiriaș';
      chrome.notifications.create(`signature-${s.id}`, {
        type: 'basic', iconUrl: 'icons/icon128.png',
        title: '✍️ Contract Semnat',
        message: `${s.signer_name || s.signer_email || 'Necunoscut'} (${partyLabel}) a semnat contractul`,
        priority: 2
      });
    }
  } catch (error) {
    console.error('Error checking signatures:', error);
  }
}

async function updateBadge() {
  try {
    const headers = await getHeaders();
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/received_emails?is_read=eq.false&is_deleted=eq.false&is_archived=eq.false&select=id`,
      { headers }
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
  } else if (notificationId.startsWith('signature-')) {
    chrome.tabs.create({ url: `${SITE_URL}/admin/contracte` });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkNow') {
    checkAll().then(() => sendResponse({ success: true }));
    return true;
  }
});
