// MVA Chrome Extension - Auth Module
const SUPABASE_URL = 'https://fdpandnzblzvamhsoukt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkcGFuZG56Ymx6dmFtaHNvdWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzM2ODUsImV4cCI6MjA3NzQ0OTY4NX0.RB-3XaeYVlmt4VpGTzh72hpAl1J4HUkbe-_u-NZjAsU';

const Auth = {
  async signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error_description || err.msg || 'Autentificare eșuată');
    }
    const data = await res.json();
    await chrome.storage.local.set({
      auth_access_token: data.access_token,
      auth_refresh_token: data.refresh_token,
      auth_expires_at: Date.now() + (data.expires_in * 1000),
      auth_user_email: data.user?.email || email
    });
    return data;
  },

  async refreshSession() {
    const { auth_refresh_token } = await chrome.storage.local.get('auth_refresh_token');
    if (!auth_refresh_token) return null;

    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token: auth_refresh_token })
    });

    if (!res.ok) {
      await Auth.signOut();
      return null;
    }

    const data = await res.json();
    await chrome.storage.local.set({
      auth_access_token: data.access_token,
      auth_refresh_token: data.refresh_token,
      auth_expires_at: Date.now() + (data.expires_in * 1000),
      auth_user_email: data.user?.email
    });
    return data;
  },

  async getValidToken() {
    const stored = await chrome.storage.local.get(['auth_access_token', 'auth_expires_at']);
    if (!stored.auth_access_token) return null;

    // Refresh if expires in less than 60s
    if (stored.auth_expires_at && Date.now() > stored.auth_expires_at - 60000) {
      const refreshed = await Auth.refreshSession();
      return refreshed?.access_token || null;
    }
    return stored.auth_access_token;
  },

  async isAuthenticated() {
    const token = await Auth.getValidToken();
    return !!token;
  },

  async signOut() {
    await chrome.storage.local.remove([
      'auth_access_token', 'auth_refresh_token',
      'auth_expires_at', 'auth_user_email'
    ]);
  },

  async getHeaders() {
    const token = await Auth.getValidToken();
    if (token) {
      return {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    }
    return {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    };
  }
};

// Make available globally
if (typeof globalThis !== 'undefined') globalThis.Auth = Auth;
