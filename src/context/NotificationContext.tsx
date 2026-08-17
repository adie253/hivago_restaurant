import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { signalRService } from '../api/signalrService';
import { fetchRestaurantSettings } from '../api/dashboardApi';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

interface NotificationContextType {
  lastOrderReceived: any | null;
  clearLastOrderReceived: () => void;
  isConnected: boolean;
  permissionStatus: NotificationPermissionStatus;
  playNotification: () => void;
  stopNotification: () => void;
  showBrowserNotification: (data: any) => void;
  requestBrowserPermission: () => Promise<NotificationPermission | undefined>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/1356/1356-preview.mp3';
const notificationAudio = typeof window !== 'undefined' ? new Audio(NOTIFICATION_SOUND_URL) : null;
let isAudioUnlocked = false;
let fallbackAudioInstance: HTMLAudioElement | null = null;

const unlockAudio = () => {
  if (isAudioUnlocked || !notificationAudio) return;

  notificationAudio.volume = 0;
  notificationAudio.play()
    .then(() => {
      notificationAudio.pause();
      notificationAudio.volume = 1;
      isAudioUnlocked = true;
      console.log('[Notification] Audio element successfully unlocked.');
      cleanupListeners();
    })
    .catch(err => {
      console.warn('[Notification] Failed to unlock audio (will retry on next user interaction):', err);
    });
};

const cleanupListeners = () => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('scroll', unlockAudio);
  }
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const [lastOrderReceived, setLastOrderReceived] = useState<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission as NotificationPermissionStatus;
    }
    return 'unsupported';
  });

  const titleIntervalRef = useRef<any>(null);
  const originalTitleRef = useRef<string>('');

  // Register Service Worker for robust background/OS desktop notifications
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('[Notification] Service Worker registered successfully with scope:', reg.scope);
      }).catch((err) => {
        console.warn('[Notification] Service Worker registration failed:', err);
      });
    }
  }, []);

  // Set up global user interaction listeners to unlock Audio Context & check Notification permission
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (notificationAudio && !isAudioUnlocked) {
        window.addEventListener('click', unlockAudio);
        window.addEventListener('touchstart', unlockAudio);
        window.addEventListener('keydown', unlockAudio);
        window.addEventListener('scroll', unlockAudio);
      }

      if ('Notification' in window) {
        setPermissionStatus(Notification.permission as NotificationPermissionStatus);
      }
    }

    return () => {
      cleanupListeners();
    };
  }, []);

  // Sync window focus & tab visibility for SignalR reconnection
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        if (isAuthenticated && user?.id && !signalRService.isConnected()) {
          console.log('[Notification] Tab became active. Reconnecting SignalR...');
          signalRService.start().then(() => setIsConnected(true)).catch(err => {
            console.error('[Notification] Reconnect error:', err);
          });
        }
      }
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityOrFocus);
      window.addEventListener('focus', handleVisibilityOrFocus);
    }
    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
        window.removeEventListener('focus', handleVisibilityOrFocus);
      }
    };
  }, [isAuthenticated, user?.id]);

  // Fetch settings to check if orderSound & browserNotifications are enabled
  useEffect(() => {
    if (isAuthenticated && user?.id && user?.role === 'restaurant') {
      fetchRestaurantSettings()
        .then(settings => {
          if (settings && settings.notifications) {
            setSoundEnabled(settings.notifications.orderSound !== false);
            setBrowserNotificationsEnabled(settings.notifications.browserNotifications !== false);
          }
        })
        .catch(err => {
          console.warn('[Notification] Failed to fetch settings in NotificationContext:', err);
        });
    }
  }, [isAuthenticated, user]);

  const requestBrowserPermission = async (): Promise<NotificationPermission | undefined> => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPermissionStatus(perm as NotificationPermissionStatus);
        return perm;
      } catch (err) {
        console.warn('[Notification] Error requesting browser notification permission:', err);
      }
    }
    return undefined;
  };

  const startTitleBlinking = (orderNumStr: string) => {
    if (typeof document === 'undefined') return;
    if (titleIntervalRef.current) clearInterval(titleIntervalRef.current);

    originalTitleRef.current = document.title || 'Hivago Restaurant';
    let toggle = false;

    titleIntervalRef.current = setInterval(() => {
      toggle = !toggle;
      document.title = toggle
        ? `🔔 NEW ORDER ${orderNumStr}!`
        : `🚨 ACTION REQUIRED - Hivago`;
    }, 1000);

    const stopTitleBlinking = () => {
      if (titleIntervalRef.current) {
        clearInterval(titleIntervalRef.current);
        titleIntervalRef.current = null;
      }
      if (originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }
      window.removeEventListener('focus', stopTitleBlinking);
      window.removeEventListener('click', stopTitleBlinking);
    };

    window.addEventListener('focus', stopTitleBlinking);
    window.addEventListener('click', stopTitleBlinking);
  };

  const showBrowserNotification = async (data: any) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (!browserNotificationsEnabled) {
      console.log('[Notification] Browser notifications are disabled in settings.');
      return;
    }

    const orderNum = data.orderNumber || data.orderNo || data.orderCode || data.id || '';
    const formattedNum = String(orderNum).startsWith('#') ? orderNum : `#${orderNum}`;
    const amount = data.totalAmount || data.price || data.grossAmount || data.pricing?.finalTotal;
    const bodyText = amount 
      ? `New order received for ₹${amount}. Click to open dashboard.` 
      : 'A new order has arrived on your dashboard. Click to view details.';

    // Start title blinking in browser tab bar if document is hidden or window is not focused
    if (document.hidden || !document.hasFocus()) {
      startTitleBlinking(formattedNum);
    }

    const triggerNativeNotification = async () => {
      try {
        const title = `🔔 New Order ${formattedNum}`;
        const options: NotificationOptions & { vibrate?: number[] } = {
          body: bodyText,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: `new-order-${data.orderId || data.id || orderNum}`,
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 200],
          data: { url: window.location.origin }
        };

        // Option 1: Use Service Worker registration if active (most reliable when minimized)
        if ('serviceWorker' in navigator) {
          try {
            const reg = await navigator.serviceWorker.ready;
            if (reg && reg.showNotification) {
              await reg.showNotification(title, options);
              return;
            }
          } catch (swErr) {
            console.warn('[Notification] SW showNotification failed, using fallback:', swErr);
          }
        }

        // Option 2: Fallback to standard window Notification constructor
        const notification = new Notification(title, options);
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (err) {
        console.error('[Notification] Error creating native browser notification:', err);
      }
    };

    if (Notification.permission === 'granted') {
      await triggerNativeNotification();
    } else if (Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        setPermissionStatus(permission as NotificationPermissionStatus);
        if (permission === 'granted') {
          await triggerNativeNotification();
        }
      } catch (e) {
        console.warn('[Notification] Automated requestPermission blocked by browser policies.', e);
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      console.log('[Notification] Starting SignalR connection for restaurant:', user.id);
      signalRService.start().then(() => {
        console.log('[Notification] SignalR connected successfully.');
        setIsConnected(true);
      }).catch(err => {
        console.error('[Notification] SignalR connection failed:', err);
      });

      const unsubscribe = signalRService.onNewOrder((data) => {
        console.log('[Notification] New order received via SignalR:', data);
        setLastOrderReceived(data);
        showToast(`New Order #${data.orderNumber} received!`, 'info');
        playNotification();
        showBrowserNotification(data);
      });

      return () => {
        unsubscribe();
        signalRService.stop();
        setIsConnected(false);
      };
    } else {
      signalRService.stop();
      setIsConnected(false);
    }
  }, [isAuthenticated, user?.id, browserNotificationsEnabled, soundEnabled]);

  const playNotification = () => {
    if (!soundEnabled) {
      console.log('[Notification] Sound notification is disabled in settings.');
      return;
    }

    // Stop any existing playing sound first to avoid overlapping double ringtones
    stopNotification();

    if (!notificationAudio) return;

    try {
      console.log('[Notification] Attempting to play sound. Unlocked:', isAudioUnlocked);
      notificationAudio.currentTime = 0;
      notificationAudio.volume = 1;
      notificationAudio.loop = true; // Loop continuously (like Zomato)

      const playPromise = notificationAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.warn('[Notification] Primary audio playback blocked or failed:', e);
          // Fallback: try to play a fresh Audio object and track it
          try {
            if (fallbackAudioInstance) {
              fallbackAudioInstance.pause();
              fallbackAudioInstance = null;
            }
            fallbackAudioInstance = new Audio(NOTIFICATION_SOUND_URL);
            fallbackAudioInstance.loop = true;
            fallbackAudioInstance.volume = 1;
            fallbackAudioInstance.play().catch(err => console.error('[Notification] Fallback audio playback failed:', err));
          } catch (fallbackErr) {
            console.error('[Notification] Failed to initialize fallback audio:', fallbackErr);
          }
        });
      }
    } catch (err) {
      console.error('[Notification] Failed to play notification sound', err);
    }
  };

  const stopNotification = () => {
    try {
      console.log('[Notification] Stopping looping notification sound.');
      if (notificationAudio) {
        notificationAudio.loop = false;
        notificationAudio.pause();
        notificationAudio.currentTime = 0;
      }
      if (fallbackAudioInstance) {
        fallbackAudioInstance.loop = false;
        fallbackAudioInstance.pause();
        fallbackAudioInstance.currentTime = 0;
        fallbackAudioInstance = null;
      }
      if (titleIntervalRef.current) {
        clearInterval(titleIntervalRef.current);
        titleIntervalRef.current = null;
      }
      if (originalTitleRef.current && typeof document !== 'undefined') {
        document.title = originalTitleRef.current;
      }
    } catch (err) {
      console.error('[Notification] Failed to stop notification sound:', err);
    }
  };

  const clearLastOrderReceived = () => {
    setLastOrderReceived(null);
  };

  return (
    <NotificationContext.Provider value={{
      lastOrderReceived,
      clearLastOrderReceived,
      isConnected,
      permissionStatus,
      playNotification,
      stopNotification,
      showBrowserNotification,
      requestBrowserPermission
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

