/**
 * Dynamic schema capabilities flag.
 * Keeps track of whether recent database migrations (like 009_report_address.sql)
 * have been executed in Supabase, preventing 400 Bad Request errors from unmigrated columns.
 */

// We initialize hasAddressColumn from localStorage if previously confirmed, or false by default
const STORAGE_KEY = 'civic_db_has_address';

export const dbCapabilities = {
  hasAddressColumn: (() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  })(),

  setHasAddressColumn(supported) {
    this.hasAddressColumn = Boolean(supported);
    try {
      localStorage.setItem(STORAGE_KEY, String(this.hasAddressColumn));
    } catch {
      // ignore
    }
  },
};
