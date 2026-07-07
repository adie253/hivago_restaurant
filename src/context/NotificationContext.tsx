import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { signalRService } from '../api/signalrService';
import { fetchRestaurantSettings } from '../api/dashboardApi';

interface NotificationContextType {
  lastOrderReceived: any | null;
  clearLastOrderReceived: () => void;
  isConnected: boolean;
  playNotification: () => void;
  stopNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/1356/1356-preview.mp3';
const notificationAudio = typeof window !== 'undefined' ? new Audio(NOTIFICATION_SOUND_URL) : null;
let isAudioUnlocked = false;

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
  }
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const [lastOrderReceived, setLastOrderReceived] = useState<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Set up global user interaction listeners to unlock Audio Context / Audio Element
  useEffect(() => {
    if (typeof window !== 'undefined' && notificationAudio && !isAudioUnlocked) {
      window.addEventListener('click', unlockAudio);
      window.addEventListener('touchstart', unlockAudio);
      window.addEventListener('keydown', unlockAudio);
    }
    return () => {
      cleanupListeners();
    };
  }, []);

  // Fetch settings to check if orderSound is enabled
  useEffect(() => {
    if (isAuthenticated && user?.id && user?.role === 'restaurant') {
      fetchRestaurantSettings()
        .then(settings => {
          if (settings && settings.notifications) {
            setSoundEnabled(settings.notifications.orderSound !== false);
          }
        })
        .catch(err => {
          console.warn('[Notification] Failed to fetch settings in NotificationContext:', err);
        });
    }
  }, [isAuthenticated, user]);

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
  }, [isAuthenticated, user?.id]);

  const playNotification = () => {
    if (!soundEnabled) {
      console.log('[Notification] Sound notification is disabled in settings.');
      return;
    }

    if (!notificationAudio) return;

    try {
      console.log('[Notification] Attempting to play sound. Unlocked:', isAudioUnlocked);
      notificationAudio.currentTime = 0;
      notificationAudio.volume = 1;
      notificationAudio.loop = true; // Loop continuously (like Zomato)
      notificationAudio.play().catch(e => {
        console.warn('[Notification] Audio playback blocked or failed:', e);
        // Fallback: try to play a fresh Audio object in case the global one failed
        try {
          const fallbackAudio = new Audio(NOTIFICATION_SOUND_URL);
          fallbackAudio.loop = true;
          fallbackAudio.play().catch(err => console.error('[Notification] Fallback audio playback failed:', err));
        } catch (fallbackErr) {
          console.error('[Notification] Failed to initialize fallback audio:', fallbackErr);
        }
      });
    } catch (err) {
      console.error('[Notification] Failed to play notification sound', err);
    }
  };

  const stopNotification = () => {
    if (!notificationAudio) return;
    try {
      console.log('[Notification] Stopping looping notification sound.');
      notificationAudio.loop = false;
      notificationAudio.pause();
      notificationAudio.currentTime = 0;
    } catch (err) {
      console.error('[Notification] Failed to stop notification sound:', err);
    }
  };

  const clearLastOrderReceived = () => {
    setLastOrderReceived(null);
  };

  return (
    <NotificationContext.Provider value={{ lastOrderReceived, clearLastOrderReceived, isConnected, playNotification, stopNotification }}>
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

