/**
 * Dynamic schema capabilities flag.
 * Keeps track of whether recent database migrations (like 009_report_address.sql)
 * have been executed in Supabase, preventing 400 Bad Request errors from unmigrated columns.
 */

// We initialize capabilities from localStorage or defaults
const STORAGE_KEY_ADDRESS = 'civic_db_has_address';
const STORAGE_KEY_PRIVACY = 'civic_db_has_privacy';

export const dbCapabilities = {
  hasAddressColumn: (() => {
    try {
      return localStorage.getItem(STORAGE_KEY_ADDRESS) === 'true';
    } catch {
      return false;
    }
  })(),

  hasPrivacyLockColumn: (() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PRIVACY);
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  })(),

  setHasAddressColumn(supported) {
    this.hasAddressColumn = Boolean(supported);
    try {
      localStorage.setItem(STORAGE_KEY_ADDRESS, String(this.hasAddressColumn));
    } catch {
      // ignore
    }
  },

  setHasPrivacyLockColumn(supported) {
    this.hasPrivacyLockColumn = Boolean(supported);
    try {
      localStorage.setItem(STORAGE_KEY_PRIVACY, String(this.hasPrivacyLockColumn));
    } catch {
      // ignore
    }
  },
};
