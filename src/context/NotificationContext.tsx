import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { signalRService } from '../api/signalrService';

interface NotificationContextType {
  lastOrderReceived: any | null;
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [lastOrderReceived, setLastOrderReceived] = useState<any | null>(null);

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      console.log('[Notification] Starting SignalR connection...');
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
    }
  }, [isAuthenticated]);

  const playNotification = () => {
    try {
      // Using a friendly, standard notification sound
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.warn('Audio playback failed (interaction required):', e));
    } catch (err) {
      console.error('Failed to play notification sound', err);
    }
  };

  return (
    <NotificationContext.Provider value={{ lastOrderReceived, isConnected }}>
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
