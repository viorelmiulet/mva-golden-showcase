import { useEffect, useCallback, useState } from 'react';

export interface EmailPreview {
  sender: string;
  subject: string | null;
}

export const useBrowserNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) {
      return null;
    }

    if (Notification.permission !== 'granted') {
      return null;
    }

    // Only show notification if the page is not visible (user is on another tab/window)
    if (document.visibilityState === 'visible') {
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon-mva.png',
        badge: '/favicon-mva.png',
        tag: 'mva-email-notification',
        ...options,
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Focus the window when clicked
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }, []);

  const extractSenderName = (sender: string): string => {
    // Extract name from "Name <email@example.com>" format
    const match = sender.match(/^([^<]+)</);
    if (match) {
      return match[1].trim();
    }
    // If no name, extract email username
    const emailMatch = sender.match(/([^@]+)@/);
    return emailMatch ? emailMatch[1] : sender;
  };

  const showNewEmailNotification = useCallback((emails: EmailPreview[]) => {
    if (emails.length === 0) return null;

    if (emails.length === 1) {
      const email = emails[0];
      const senderName = extractSenderName(email.sender);
      return showNotification(`📧 ${senderName}`, {
        body: email.subject || '(Fără subiect)',
        tag: 'mva-new-email',
        requireInteraction: false,
      });
    }

    // Multiple emails
    const title = `📧 ${emails.length} emailuri noi`;
    const body = emails
      .slice(0, 3)
      .map(e => `${extractSenderName(e.sender)}: ${e.subject || '(Fără subiect)'}`)
      .join('\n');
    
    return showNotification(title, {
      body: emails.length > 3 ? `${body}\n...și încă ${emails.length - 3}` : body,
      tag: 'mva-new-email',
      requireInteraction: false,
    });
  }, [showNotification]);

  return {
    permission,
    requestPermission,
    showNotification,
    showNewEmailNotification,
    isSupported: 'Notification' in window,
  };
};
