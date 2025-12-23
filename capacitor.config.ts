import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a0228d82898b454695998fbda4644c54',
  appName: 'MVA Admin',
  webDir: 'dist',
  server: {
    url: 'https://a0228d82-898b-4546-9599-8fbda4644c54.lovableproject.com/admin?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
