import { useEffect, useCallback, useState } from 'react';

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

  const showNewEmailNotification = useCallback((count: number) => {
    const title = count === 1 
      ? 'Email nou primit' 
      : `${count} emailuri noi primite`;
    
    const body = count === 1
      ? 'Aveți un email nou în inbox'
      : `Aveți ${count} emailuri noi în inbox`;

    return showNotification(title, {
      body,
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
