/**
 * Welcome modal localStorage utility
 * Determines whether the welcome modal should be shown based on the stored version.
 */

const STORAGE_KEY = 'welcome_modal_dismissed_version';
export const CURRENT_MODAL_VERSION = '1.0.0';

export const shouldShowWelcomeModal = (version) => {
  if (typeof window === 'undefined') return false;
  try {
    const dismissedVersion = window.localStorage.getItem(STORAGE_KEY);
    return dismissedVersion !== version;
  } catch (e) {
    return false;
  }
};

export const markWelcomeModalAsViewed = (version) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, version || CURRENT_MODAL_VERSION);
  } catch (e) {
    // ignore
  }
};

export const resetWelcomeModalState = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // ignore
  }
};
