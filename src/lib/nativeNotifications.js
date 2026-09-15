/**
 * Native Browser & Mobile PWA Push Notification Utilities
 */

export const isNativeNotificationSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = () => {
  if (!isNativeNotificationSupported()) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
};

export const requestNotificationPermission = async () => {
  if (!isNativeNotificationSupported()) return 'unsupported';

  try {
    let permission;
    const promise = Notification.requestPermission((result) => {
      permission = result;
    });
    if (promise && typeof promise.then === 'function') {
      permission = await promise;
    }
    return permission || Notification.permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return Notification.permission || 'denied';
  }
};

/**
 * Dispatch a native operating system notification (Windows Action Center, Android shade, Chrome app)
 */
export const showNativePushNotification = async ({
  title,
  message,
  subtext,
  reportId,
  type = 'alert',
}) => {
  if (!isNativeNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const targetUrl = reportId ? `/report/${reportId}` : '/notifications';

  let body = message || '';
  if (subtext) {
    body = `${body}\n📌 ${subtext}`;
  }

  const notificationOptions = {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: reportId ? `report-${reportId}-${Date.now()}` : `civic-${Date.now()}`,
    data: { url: targetUrl },
    vibrate: [200, 100, 200],
    renotify: true,
  };

  const notificationTitle = title || 'Civic Voice Alert';

  // 1. Prefer Service Worker registration (required on Android and installed PWAs)
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(notificationTitle, notificationOptions);
        return true;
      }
    } catch (swErr) {
      console.warn('SW showNotification fallback to window.Notification:', swErr);
    }
  }

  // 2. Fallback to desktop window.Notification
  try {
    const nativeNotif = new Notification(notificationTitle, notificationOptions);
    nativeNotif.onclick = (event) => {
      event.preventDefault();
      window.focus();
      window.location.href = targetUrl;
      nativeNotif.close();
    };
    return true;
  } catch (err) {
    console.error('Failed to trigger window.Notification:', err);
    return false;
  }
};
