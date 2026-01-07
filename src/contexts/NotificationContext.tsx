import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Docket, Pickup, DeliveryRunSheet, StockLevel, Product, POD } from '@/types';
import { initialDockets, initialPickups, initialStockLevels, initialProducts } from '@/data/initialData';

export interface Notification {
  id: string;
  type: 'pickup' | 'delivery' | 'stock' | 'pod' | 'docket' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  entityId?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useLocalStorage<Notification[]>('notifications', []);
  const [dockets] = useLocalStorage<Docket[]>('dockets', initialDockets);
  const [pickups] = useLocalStorage<Pickup[]>('pickups', initialPickups);
  const [stockLevels] = useLocalStorage<StockLevel[]>('stockLevels', initialStockLevels);
  const [products] = useLocalStorage<Product[]>('products', initialProducts);
  const [deliveryRunSheets] = useLocalStorage<DeliveryRunSheet[]>('deliveryRunSheets', []);
  const [pods] = useLocalStorage<POD[]>('pods', []);
  
  const [lastPickupCount, setLastPickupCount] = useState(pickups.length);
  const [lastDocketCount, setLastDocketCount] = useState(dockets.length);
  const [lastPODCount, setLastPODCount] = useState(pods.length);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
  }, [setNotifications]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, [setNotifications]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [setNotifications]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, [setNotifications]);

  // Monitor for new pickups
  useEffect(() => {
    if (pickups.length > lastPickupCount) {
      const newPickup = pickups[pickups.length - 1];
      addNotification({
        type: 'pickup',
        title: 'New Pickup Request',
        message: `Pickup ${newPickup.pickupNumber} scheduled for ${newPickup.customerName}`,
        entityId: newPickup.id,
      });
    }
    setLastPickupCount(pickups.length);
  }, [pickups.length, lastPickupCount, addNotification, pickups]);

  // Monitor for new dockets
  useEffect(() => {
    if (dockets.length > lastDocketCount) {
      const newDocket = dockets[dockets.length - 1];
      addNotification({
        type: 'docket',
        title: 'New Docket Created',
        message: `Docket ${newDocket.docketNumber} booked for ${newDocket.consigneeName}`,
        entityId: newDocket.id,
      });
    }
    setLastDocketCount(dockets.length);
  }, [dockets.length, lastDocketCount, addNotification, dockets]);

  // Monitor for POD updates
  useEffect(() => {
    if (pods.length > lastPODCount) {
      const newPOD = pods[pods.length - 1];
      addNotification({
        type: 'pod',
        title: 'Delivery Completed',
        message: `POD recorded for docket ${newPOD.docketNumber}`,
        entityId: newPOD.id,
      });
    }
    setLastPODCount(pods.length);
  }, [pods.length, lastPODCount, addNotification, pods]);

  // Check for low stock alerts periodically
  useEffect(() => {
    const checkLowStock = () => {
      stockLevels.forEach(stock => {
        const product = products.find(p => p.id === stock.productId);
        if (product && stock.availableQty <= product.reorderPoint) {
          // Check if we already have an unread low stock notification for this product
          const existingNotification = notifications.find(
            n => n.type === 'stock' && 
                 n.entityId === stock.productId && 
                 !n.read &&
                 new Date(n.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000 // Within 24h
          );
          
          if (!existingNotification) {
            addNotification({
              type: 'stock',
              title: 'Low Stock Alert',
              message: `${stock.productName} is below reorder point (${stock.availableQty} remaining)`,
              entityId: stock.productId,
            });
          }
        }
      });
    };

    // Check on mount
    checkLowStock();

    // Check every 5 minutes
    const interval = setInterval(checkLowStock, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [stockLevels, products, notifications, addNotification]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
