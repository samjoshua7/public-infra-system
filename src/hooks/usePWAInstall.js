import { useState, useEffect, useCallback } from 'react';

const SNOOZE_STORAGE_KEY = 'civic_pwa_dismissed_at';
const SNOOZE_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days snooze

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // Default true until checked

  useEffect(() => {
    // 1. Check if running in standalone mode (already installed)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(Boolean(isStandaloneMode));
      return Boolean(isStandaloneMode);
    };

    const standalone = checkStandalone();

    // 2. Check if user recently dismissed the prompt
    const lastDismissed = localStorage.getItem(SNOOZE_STORAGE_KEY);
    if (lastDismissed) {
      const timeSinceDismiss = Date.now() - parseInt(lastDismissed, 10);
      setIsDismissed(timeSinceDismiss < SNOOZE_DURATION_MS);
    } else {
      setIsDismissed(false);
    }

    // 3. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
    // Check if it is Safari on iOS (not Chrome/Firefox on iOS, which cannot add to home screen)
    const isSafari = /safari/.test(ua) && !/crios|fxios|opios|mercury/.test(ua);
    setIsIOS(Boolean(isIosDevice && isSafari && !standalone));

    // 4. Listen for beforeinstallprompt on Chromium/Android
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // 5. Listen for appinstalled
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      localStorage.removeItem(SNOOZE_STORAGE_KEY);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (outcome === 'accepted') {
      setIsStandalone(true);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  const dismissPrompt = useCallback(() => {
    localStorage.setItem(SNOOZE_STORAGE_KEY, Date.now().toString());
    setIsDismissed(true);
  }, []);

  // Show prompt if:
  // - Not running in standalone mode
  // - Not snoozed/dismissed
  // - Either deferredPrompt is available (Android/Chrome/Edge) OR it's iOS Safari
  const canPrompt = !isStandalone && !isDismissed && (Boolean(deferredPrompt) || isIOS);

  return {
    isInstallable: Boolean(deferredPrompt) || isIOS,
    isStandalone,
    isIOS,
    showPrompt: canPrompt,
    promptInstall,
    dismissPrompt,
  };
};
