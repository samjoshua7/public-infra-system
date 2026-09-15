import { useNotificationContext } from '../app/providers/NotificationProvider';

export const useNotifications = () => {
  const context = useNotificationContext();
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
