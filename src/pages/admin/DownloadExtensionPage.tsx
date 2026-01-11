import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Chrome, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";

// Extension files content
const manifestContent = `{
  "manifest_version": 3,
  "name": "MVA Admin Panel",
  "version": "1.1.0",
  "description": "Acces rapid la panoul de administrare MVA - vizionări, clienți, proprietăți, contracte și notificări",
  "permissions": [
    "notifications",
    "alarms",
    "storage"
  ],
  "host_permissions": [
    "https://fdpandnzblzvamhsoukt.supabase.co/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    },
    "default_title": "MVA Admin Panel"
  },
  "background": {
    "service_worker": "background.js"
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}`;

const popupHtml = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MVA Admin</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 360px;
      max-height: 580px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
      color: #fff;
    }
    .header {
      padding: 14px 16px;
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.05));
      border-bottom: 1px solid rgba(212, 175, 55, 0.2);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header-left { display: flex; align-items: center; gap: 10px; }
    .logo {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #d4af37, #b8962e);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-weight: bold; font-size: 14px; color: #1a1a2e;
    }
    .header-text h1 { font-size: 15px; font-weight: 600; color: #d4af37; }
    .header-text p { font-size: 10px; color: rgba(255, 255, 255, 0.5); }
    .connection-status { display: flex; align-items: center; gap: 6px; font-size: 10px; color: rgba(255, 255, 255, 0.6); }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; animation: pulse 2s infinite; }
    .status-dot.offline { background: #ef4444; animation: none; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .content { padding: 12px; max-height: 480px; overflow-y: auto; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }
    .stat-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px; padding: 10px 6px; text-align: center;
      cursor: pointer; transition: all 0.2s;
    }
    .stat-card:hover { background: rgba(212, 175, 55, 0.1); border-color: rgba(212, 175, 55, 0.3); transform: translateY(-2px); }
    .stat-card .icon { font-size: 18px; margin-bottom: 2px; }
    .stat-card .value { font-size: 18px; font-weight: 700; color: #d4af37; }
    .stat-card .label { font-size: 9px; color: rgba(255, 255, 255, 0.5); line-height: 1.2; }
    .section-title { font-size: 11px; font-weight: 600; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; letter-spacing: 0.5px; margin: 12px 0 8px 4px; }
    .menu-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .menu-item {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 6px; padding: 12px 8px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px; cursor: pointer; transition: all 0.2s;
      text-decoration: none; color: #fff;
    }
    .menu-item:hover { background: rgba(212, 175, 55, 0.1); border-color: rgba(212, 175, 55, 0.3); transform: translateY(-2px); }
    .menu-item .icon { font-size: 20px; }
    .menu-item .label { font-size: 10px; text-align: center; color: rgba(255, 255, 255, 0.8); }
    .quick-actions { display: flex; gap: 8px; margin-top: 12px; }
    .btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; }
    .btn-primary { background: linear-gradient(135deg, #d4af37, #b8962e); color: #1a1a2e; }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3); }
    .btn-secondary { background: rgba(255, 255, 255, 0.08); color: #fff; border: 1px solid rgba(255, 255, 255, 0.15); }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.12); }
    .settings-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: rgba(255, 255, 255, 0.03); border-radius: 8px; margin-top: 12px; }
    .settings-label { font-size: 12px; display: flex; align-items: center; gap: 8px; }
    .toggle { width: 40px; height: 22px; background: rgba(255, 255, 255, 0.15); border-radius: 11px; position: relative; cursor: pointer; transition: background 0.2s; }
    .toggle.active { background: #d4af37; }
    .toggle::after { content: ''; position: absolute; width: 18px; height: 18px; background: #fff; border-radius: 50%; top: 2px; left: 2px; transition: transform 0.2s; }
    .toggle.active::after { transform: translateX(18px); }
    .footer { padding: 10px 16px; text-align: center; font-size: 10px; color: rgba(255, 255, 255, 0.3); border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: space-between; align-items: center; }
    .loading { display: none; text-align: center; padding: 6px; color: rgba(255, 255, 255, 0.5); font-size: 11px; }
    .loading.show { display: block; }
    .content::-webkit-scrollbar { width: 4px; }
    .content::-webkit-scrollbar-track { background: transparent; }
    .content::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.3); border-radius: 2px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <div class="logo">MVA</div>
      <div class="header-text">
        <h1>MVA Admin Panel</h1>
        <p>Acces rapid administrare</p>
      </div>
    </div>
    <div class="connection-status">
      <div class="status-dot" id="statusDot"></div>
      <span id="statusText">Online</span>
    </div>
  </div>
  <div class="content">
    <div class="stats">
      <div class="stat-card" data-url="/admin/vizionari">
        <div class="icon">📅</div>
        <div class="value" id="viewingsCount">-</div>
        <div class="label">Vizionări</div>
      </div>
      <div class="stat-card" data-url="/admin/clienti">
        <div class="icon">👤</div>
        <div class="value" id="clientsCount">-</div>
        <div class="label">Clienți</div>
      </div>
      <div class="stat-card" data-url="/admin/proprietati">
        <div class="icon">🏠</div>
        <div class="value" id="propertiesCount">-</div>
        <div class="label">Proprietăți</div>
      </div>
      <div class="stat-card" data-url="/admin/contracte">
        <div class="icon">📝</div>
        <div class="value" id="contractsCount">-</div>
        <div class="label">Contracte</div>
      </div>
    </div>
    <div class="section-title">📂 Meniu Principal</div>
    <div class="menu-grid">
      <div class="menu-item" data-url="/admin"><span class="icon">📊</span><span class="label">Dashboard</span></div>
      <div class="menu-item" data-url="/admin/analytics"><span class="icon">📈</span><span class="label">Analytics</span></div>
      <div class="menu-item" data-url="/admin/proprietati"><span class="icon">🏠</span><span class="label">Proprietăți</span></div>
      <div class="menu-item" data-url="/admin/complexe"><span class="icon">🏢</span><span class="label">Complexe</span></div>
      <div class="menu-item" data-url="/admin/regim-hotelier"><span class="icon">🏨</span><span class="label">Regim Hotelier</span></div>
      <div class="menu-item" data-url="/admin/comisioane"><span class="icon">💰</span><span class="label">Comisioane</span></div>
    </div>
    <div class="section-title">👥 CRM & Clienți</div>
    <div class="menu-grid">
      <div class="menu-item" data-url="/admin/vizionari"><span class="icon">📅</span><span class="label">Vizionări</span></div>
      <div class="menu-item" data-url="/admin/clienti"><span class="icon">👤</span><span class="label">Clienți CRM</span></div>
    </div>
    <div class="section-title">📄 Documente</div>
    <div class="menu-grid">
      <div class="menu-item" data-url="/admin/contracte"><span class="icon">📜</span><span class="label">Contracte</span></div>
      <div class="menu-item" data-url="/admin/inventar-presetat"><span class="icon">📦</span><span class="label">Inventar</span></div>
      <div class="menu-item" data-url="/admin/rapoarte"><span class="icon">📑</span><span class="label">Rapoarte</span></div>
    </div>
    <div class="section-title">🛠️ Instrumente</div>
    <div class="menu-grid">
      <div class="menu-item" data-url="/admin/virtual-staging"><span class="icon">✨</span><span class="label">Virtual Staging</span></div>
      <div class="menu-item" data-url="/admin/import"><span class="icon">📥</span><span class="label">Import XML</span></div>
      <div class="menu-item" data-url="/admin/facebook"><span class="icon">📱</span><span class="label">Facebook</span></div>
      <div class="menu-item" data-url="/admin/carti-vizita"><span class="icon">💳</span><span class="label">Cărți Vizită</span></div>
      <div class="menu-item" data-url="/admin/istoric"><span class="icon">🕐</span><span class="label">Istoric</span></div>
      <div class="menu-item" data-url="/admin/setari"><span class="icon">⚙️</span><span class="label">Setări</span></div>
    </div>
    <div class="quick-actions">
      <button class="btn btn-primary" id="openAdmin">🏠 Deschide Admin</button>
      <button class="btn btn-secondary" id="checkNow">🔄 Actualizează</button>
    </div>
    <div class="settings-row">
      <span class="settings-label">🔔 Notificări push</span>
      <div class="toggle active" id="notificationsToggle"></div>
    </div>
    <div class="loading" id="loading">Se încarcă...</div>
  </div>
  <div class="footer">
    <span>Ultima verificare: <span id="lastCheck">-</span></span>
    <span>v1.1.0</span>
  </div>
  <script src="popup.js"></script>
</body>
</html>`;

const popupJs = `const SUPABASE_URL = 'https://fdpandnzblzvamhsoukt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkcGFuZG56Ymx6dmFtaHNvdWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzM2ODUsImV4cCI6MjA3NzQ0OTY4NX0.RB-3XaeYVlmt4VpGTzh72hpAl1J4HUkbe-_u-NZjAsU';
const ADMIN_URL = 'https://mvaimobiliare.ro';

document.addEventListener('DOMContentLoaded', async () => {
  const settings = await chrome.storage.local.get(['notificationsEnabled', 'lastCheckTime']);
  const toggle = document.getElementById('notificationsToggle');
  if (settings.notificationsEnabled === false) toggle.classList.remove('active');
  if (settings.lastCheckTime) {
    const date = new Date(settings.lastCheckTime);
    document.getElementById('lastCheck').textContent = formatDate(date);
  }
  checkConnectionStatus();
  await loadStats();
  toggle.addEventListener('click', async () => {
    toggle.classList.toggle('active');
    await chrome.storage.local.set({ notificationsEnabled: toggle.classList.contains('active') });
  });
  document.getElementById('openAdmin').addEventListener('click', () => chrome.tabs.create({ url: ADMIN_URL + '/admin' }));
  document.querySelectorAll('.menu-item, .stat-card').forEach(item => {
    item.addEventListener('click', () => {
      const url = item.dataset.url;
      if (url) chrome.tabs.create({ url: ADMIN_URL + url });
    });
  });
  document.getElementById('checkNow').addEventListener('click', async () => {
    document.getElementById('loading').classList.add('show');
    await chrome.runtime.sendMessage({ action: 'checkNow' });
    await loadStats();
    const now = new Date();
    document.getElementById('lastCheck').textContent = formatDate(now);
    await chrome.storage.local.set({ lastCheckTime: now.toISOString() });
    document.getElementById('loading').classList.remove('show');
  });
});

function formatDate(date) {
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return 'Acum';
  if (diff < 3600000) return Math.floor(diff / 60000) + ' min';
  if (diff < 86400000) return Math.floor(diff / 3600000) + ' ore';
  return date.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

async function checkConnectionStatus() {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  try {
    const res = await fetch(SUPABASE_URL + '/rest/v1/', { method: 'HEAD', headers: { 'apikey': SUPABASE_ANON_KEY } });
    if (res.ok) { statusDot.classList.remove('offline'); statusText.textContent = 'Online'; }
    else throw new Error();
  } catch { statusDot.classList.add('offline'); statusText.textContent = 'Offline'; }
}

async function loadStats() {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const todayISO = today.toISOString().split('T')[0];
    const tomorrowISO = new Date(today.getTime() + 86400000).toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString();
    const headers = { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY };
    const [v, c, p, ct] = await Promise.all([
      fetch(SUPABASE_URL + '/rest/v1/viewing_appointments?preferred_date=gte.' + todayISO + '&preferred_date=lt.' + tomorrowISO + '&select=id', { headers }),
      fetch(SUPABASE_URL + '/rest/v1/clients?created_at=gte.' + weekAgo + '&select=id', { headers }),
      fetch(SUPABASE_URL + '/rest/v1/catalog_offers?availability_status=eq.disponibil&select=id', { headers }),
      fetch(SUPABASE_URL + '/rest/v1/contracts?created_at=gte.' + weekAgo + '&select=id', { headers })
    ]);
    if (v.ok) document.getElementById('viewingsCount').textContent = (await v.json()).length;
    if (c.ok) document.getElementById('clientsCount').textContent = (await c.json()).length;
    if (p.ok) document.getElementById('propertiesCount').textContent = (await p.json()).length;
    if (ct.ok) document.getElementById('contractsCount').textContent = (await ct.json()).length;
  } catch (e) { console.error(e); }
}`;

const backgroundJs = `const SUPABASE_URL = 'https://fdpandnzblzvamhsoukt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkcGFuZG56Ymx6dmFtaHNvdWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzM2ODUsImV4cCI6MjA3NzQ0OTY4NX0.RB-3XaeYVlmt4VpGTzh72hpAl1J4HUkbe-_u-NZjAsU';
const ADMIN_URL = 'https://mvaimobiliare.ro';
const CHECK_INTERVAL = 5;

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('checkNotifications', { periodInMinutes: CHECK_INTERVAL });
  checkForNewItems();
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'checkNotifications') checkForNewItems();
});

async function checkForNewItems() {
  try {
    const settings = await chrome.storage.local.get(['lastCheckTime', 'notificationsEnabled']);
    if (settings.notificationsEnabled === false) return;
    const lastCheck = settings.lastCheckTime || new Date(Date.now() - 86400000).toISOString();
    const now = new Date().toISOString();
    const headers = { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY };
    
    const viewings = await fetch(SUPABASE_URL + '/rest/v1/viewing_appointments?created_at=gte.' + lastCheck + '&select=id,customer_name,property_title,preferred_date', { headers });
    if (viewings.ok) {
      for (const v of await viewings.json()) {
        chrome.notifications.create('viewing-' + v.id, {
          type: 'basic', iconUrl: 'icons/icon128.png',
          title: '📅 Vizionare Nouă',
          message: v.customer_name + ' - ' + v.property_title + '\\nData: ' + new Date(v.preferred_date).toLocaleDateString('ro-RO'),
          priority: 2
        });
      }
    }
    
    const clients = await fetch(SUPABASE_URL + '/rest/v1/clients?created_at=gte.' + lastCheck + '&select=id,name,phone', { headers });
    if (clients.ok) {
      for (const c of await clients.json()) {
        chrome.notifications.create('client-' + c.id, {
          type: 'basic', iconUrl: 'icons/icon128.png',
          title: '👤 Client Nou',
          message: c.name + '\\nTelefon: ' + c.phone,
          priority: 2
        });
      }
    }
    await chrome.storage.local.set({ lastCheckTime: now });
  } catch (e) { console.error(e); }
}

chrome.notifications.onClicked.addListener(id => {
  if (id.startsWith('viewing-')) chrome.tabs.create({ url: ADMIN_URL + '/admin/vizionari' });
  else if (id.startsWith('client-')) chrome.tabs.create({ url: ADMIN_URL + '/admin/clienti' });
  else chrome.tabs.create({ url: ADMIN_URL + '/admin' });
});

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  if (msg.action === 'checkNow') {
    checkForNewItems().then(() => respond({ success: true }));
    return true;
  }
});`;

// SVG Icon for 16x16
const icon16Svg = `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gold16" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D4AF37" />
      <stop offset="50%" stop-color="#FFD700" />
      <stop offset="100%" stop-color="#B8860B" />
    </linearGradient>
  </defs>
  <path d="M8 1 L14 4 L14 12 L8 15 L2 12 L2 4 Z" fill="url(#gold16)"/>
  <path d="M8 2.5 L12.5 5 L12.5 11 L8 13.5 L3.5 11 L3.5 5 Z" fill="#1A1A1A"/>
  <path d="M5 5 L6 5 L8 8 L10 5 L11 5 L11 11 L10 11 L10 6.5 L8.5 9 L7.5 9 L6 6.5 L6 11 L5 11 Z" fill="url(#gold16)"/>
</svg>`;

const icon48Svg = `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gold48" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D4AF37" />
      <stop offset="25%" stop-color="#FFD700" />
      <stop offset="50%" stop-color="#F4E5B1" />
      <stop offset="75%" stop-color="#FFD700" />
      <stop offset="100%" stop-color="#B8860B" />
    </linearGradient>
    <linearGradient id="inner48" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1A1A1A" />
      <stop offset="50%" stop-color="#2D2D2D" />
      <stop offset="100%" stop-color="#1A1A1A" />
    </linearGradient>
  </defs>
  <circle cx="24" cy="24" r="22" fill="none" stroke="url(#gold48)" stroke-width="2" opacity="0.7"/>
  <path d="M24 3 L42 13 L42 35 L24 45 L6 35 L6 13 Z" fill="url(#gold48)"/>
  <path d="M24 6 L39 15 L39 33 L24 42 L9 33 L9 15 Z" fill="url(#inner48)"/>
  <path d="M15 17 L19 17 L24 27 L29 17 L33 17 L33 31 L30 31 L30 21 L26 29 L22 29 L18 21 L18 31 L15 31 Z" fill="url(#gold48)"/>
  <circle cx="38" cy="10" r="2" fill="#FFD700" opacity="0.8"/>
</svg>`;

const icon128Svg = `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gold128" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D4AF37" />
      <stop offset="25%" stop-color="#FFD700" />
      <stop offset="50%" stop-color="#F4E5B1" />
      <stop offset="75%" stop-color="#FFD700" />
      <stop offset="100%" stop-color="#B8860B" />
    </linearGradient>
    <linearGradient id="inner128" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1A1A1A" />
      <stop offset="50%" stop-color="#2D2D2D" />
      <stop offset="100%" stop-color="#1A1A1A" />
    </linearGradient>
  </defs>
  <circle cx="64" cy="64" r="60" fill="none" stroke="url(#gold128)" stroke-width="4" opacity="0.9"/>
  <path d="M64 8 L112 34 L112 94 L64 120 L16 94 L16 34 Z" fill="url(#gold128)" opacity="0.95"/>
  <path d="M64 16 L104 38 L104 90 L64 112 L24 90 L24 38 Z" fill="url(#inner128)"/>
  <path d="M40 46 L52 46 L64 72 L76 46 L88 46 L88 82 L80 82 L80 56 L70 76 L58 76 L48 56 L48 82 L40 82 Z" fill="url(#gold128)"/>
  <circle cx="102" cy="26" r="4" fill="#FFD700" opacity="0.8"/>
  <circle cx="26" cy="102" r="3" fill="#D4AF37" opacity="0.6"/>
</svg>`;

export default function DownloadExtensionPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [iconPreviews, setIconPreviews] = useState<{[key: string]: string}>({});

  // Generate icon previews on mount
  useState(() => {
    const generatePreviews = async () => {
      const previews: {[key: string]: string} = {};
      
      // Create data URLs for previews
      const svg16Blob = new Blob([icon16Svg], { type: 'image/svg+xml' });
      const svg48Blob = new Blob([icon48Svg], { type: 'image/svg+xml' });
      const svg128Blob = new Blob([icon128Svg], { type: 'image/svg+xml' });
      
      previews['16'] = URL.createObjectURL(svg16Blob);
      previews['48'] = URL.createObjectURL(svg48Blob);
      previews['128'] = URL.createObjectURL(svg128Blob);
      
      setIconPreviews(previews);
    };
    generatePreviews();
  });

  const svgToPng = async (svgString: string, size: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      // Use higher resolution for better quality
      const scale = size < 48 ? 4 : size < 128 ? 2 : 1;
      canvas.width = size * scale;
      canvas.height = size * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.drawImage(img, 0, 0, size * scale, size * scale);
        URL.revokeObjectURL(url);
        
        // Create final canvas at correct size
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = size;
        finalCanvas.height = size;
        const finalCtx = finalCanvas.getContext('2d');
        if (finalCtx) {
          finalCtx.imageSmoothingEnabled = true;
          finalCtx.imageSmoothingQuality = 'high';
          finalCtx.drawImage(canvas, 0, 0, size, size);
          finalCanvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Could not create blob'));
          }, 'image/png');
        } else {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Could not create blob'));
          }, 'image/png');
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not load SVG'));
      };

      img.src = url;
    });
  };

  const generateZip = async () => {
    setIsGenerating(true);
    try {
      const zip = new JSZip();

      // Add main files
      zip.file('manifest.json', manifestContent);
      zip.file('popup.html', popupHtml);
      zip.file('popup.js', popupJs);
      zip.file('background.js', backgroundJs);

      // Create icons folder and add PNG icons
      const iconsFolder = zip.folder('icons');
      if (iconsFolder) {
        const icon16Png = await svgToPng(icon16Svg, 16);
        const icon48Png = await svgToPng(icon48Svg, 48);
        const icon128Png = await svgToPng(icon128Svg, 128);
        
        iconsFolder.file('icon16.png', icon16Png);
        iconsFolder.file('icon48.png', icon48Png);
        iconsFolder.file('icon128.png', icon128Png);
      }

      // Add README
      const readme = `# MVA Admin Chrome Extension

## Instalare

1. Dezarhivați acest fișier ZIP
2. Deschideți Chrome și navigați la: chrome://extensions/
3. Activați "Developer mode" (colțul din dreapta sus)
4. Click pe "Load unpacked"
5. Selectați folderul dezarhivat
6. Extensia este gata de utilizare!

## Funcționalități

- Acces rapid la toate secțiunile admin
- Statistici în timp real
- Notificări pentru vizionări și clienți noi
- Actualizări automate la fiecare 5 minute

## Versiune: 1.1.0
`;
      zip.file('README.txt', readme);

      // Generate and download
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mva-chrome-extension-v1.1.0.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsDownloaded(true);
      toast.success('Extensia a fost descărcată cu succes!');
    } catch (error) {
      console.error('Error generating ZIP:', error);
      toast.error('Eroare la generarea arhivei');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className="border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center mb-4">
            <Chrome className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Extensie Chrome MVA Admin</CardTitle>
          <CardDescription>
            Descarcă extensia pentru acces rapid la panoul de administrare
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Icon Preview */}
          <div className="flex items-center justify-center gap-6 p-4 bg-muted/30 rounded-lg">
            <div className="text-center">
              {iconPreviews['16'] && (
                <img src={iconPreviews['16']} alt="Icon 16x16" className="w-4 h-4 mx-auto mb-1" />
              )}
              <span className="text-xs text-muted-foreground">16px</span>
            </div>
            <div className="text-center">
              {iconPreviews['48'] && (
                <img src={iconPreviews['48']} alt="Icon 48x48" className="w-12 h-12 mx-auto mb-1" />
              )}
              <span className="text-xs text-muted-foreground">48px</span>
            </div>
            <div className="text-center">
              {iconPreviews['128'] && (
                <img src={iconPreviews['128']} alt="Icon 128x128" className="w-24 h-24 mx-auto mb-1" />
              )}
              <span className="text-xs text-muted-foreground">128px</span>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Acces rapid meniu admin</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Statistici în timp real</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Notificări push</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Iconițe PNG generate</span>
            </div>
          </div>

          {/* Download Button */}
          <Button 
            onClick={generateZip} 
            disabled={isGenerating}
            className="w-full h-12 text-lg gap-2"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Se generează iconițele PNG...
              </>
            ) : isDownloaded ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Descărcat! Click pentru a descărca din nou
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Descarcă Extensia (.zip)
              </>
            )}
          </Button>

          {/* What's included */}
          <div className="text-xs text-center text-muted-foreground bg-muted/30 rounded-lg p-3">
            <strong>Arhiva include:</strong> manifest.json, popup.html, popup.js, background.js, icons/icon16.png, icons/icon48.png, icons/icon128.png, README.txt
          </div>

          {/* Installation Instructions */}
          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-semibold">Instrucțiuni de instalare:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Dezarhivează fișierul ZIP descărcat</li>
              <li>Deschide Chrome și navighează la <code className="bg-muted px-1.5 py-0.5 rounded">chrome://extensions/</code></li>
              <li>Activează <strong>"Developer mode"</strong> (colțul din dreapta sus)</li>
              <li>Click pe <strong>"Load unpacked"</strong></li>
              <li>Selectează folderul dezarhivat</li>
              <li>Fixează extensia în toolbar pentru acces rapid</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
