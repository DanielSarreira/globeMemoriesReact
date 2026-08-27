// Utilitários para gerenciar modais de boas-vindas das páginas

// Chaves de localStorage para cada modal
const MODAL_KEYS = {
  TRAVELS: 'travelsModalDismissed',
  USERS: 'usersModalDismissed',
  INTERACTIVE_MAP: 'interactiveMapModalDismissed',
  QANDA: 'qandaModalDismissed',
  FUTURE_TRAVELS: 'futureTravelsModalDismissed',
  WEATHER: 'weatherModalDismissed',
  ACHIEVEMENTS: 'achievementsModalDismissed'
};

/**
 * Round 55 — admin kill switch. When the value 'true' is stored
 * under {@code admin_welcome_modal_disabled}, every welcome modal
 * is hidden site-wide. The WelcomeModalManagement page is the only
 * place that writes to this key.
 */
const KILL_SWITCH_KEY = 'admin_welcome_modal_disabled';
const PER_PAGE_KILL_PREFIX = 'admin_welcome_modal_disabled_';

/**
 * Map of modalKey -> the corresponding per-page kill-switch suffix.
 * If the admin disables a specific page, only that modal is hidden.
 */
const PER_PAGE_KILL_MAP = {
  [MODAL_KEYS.QANDA]:        'qanda',
  [MODAL_KEYS.USERS]:        'users',
  [MODAL_KEYS.ACHIEVEMENTS]: 'achievements',
};

const isModalsKilled = () => {
  try {
    return window.localStorage.getItem(KILL_SWITCH_KEY) === 'true';
  } catch (_) { return false; }
};

const isPageKilled = (modalKey) => {
  const suffix = PER_PAGE_KILL_MAP[modalKey];
  if (!suffix) return false;
  try {
    return window.localStorage.getItem(PER_PAGE_KILL_PREFIX + suffix) === 'true';
  } catch (_) { return false; }
};

// Função genérica para verificar se o modal deve ser mostrado
export const shouldShowModal = (modalKey) => {
  if (isModalsKilled()) return false;
  if (isPageKilled(modalKey)) return false;
  try {
    const dismissed = localStorage.getItem(modalKey);
    return dismissed !== 'true';
  } catch (error) {
    console.error('Erro ao verificar estado do modal:', error);
    return true; // Mostra o modal por padrão se houver erro
  }
};

// Função genérica para marcar modal como não mostrar novamente
export const dismissModal = (modalKey) => {
  try {
    localStorage.setItem(modalKey, 'true');
  } catch (error) {
    console.error('Erro ao salvar estado do modal:', error);
  }
};

// Função para resetar todos os modais (útil para desenvolvimento/testes)
export const resetAllModals = () => {
  try {
    Object.values(MODAL_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Erro ao resetar modais:', error);
  }
};

// Exportar as chaves para uso nas páginas
export { MODAL_KEYS };

// Funções específicas para cada página (para facilitar o uso)
export const travelsModalUtils = {
  shouldShow: () => shouldShowModal(MODAL_KEYS.TRAVELS),
  dismiss: () => dismissModal(MODAL_KEYS.TRAVELS)
};

export const usersModalUtils = {
  shouldShow: () => shouldShowModal(MODAL_KEYS.USERS),
  dismiss: () => dismissModal(MODAL_KEYS.USERS)
};

export const interactiveMapModalUtils = {
  shouldShow: () => shouldShowModal(MODAL_KEYS.INTERACTIVE_MAP),
  dismiss: () => dismissModal(MODAL_KEYS.INTERACTIVE_MAP)
};

export const qandaModalUtils = {
  shouldShow: () => shouldShowModal(MODAL_KEYS.QANDA),
  dismiss: () => dismissModal(MODAL_KEYS.QANDA)
};

export const futureTravelsModalUtils = {
  shouldShow: () => shouldShowModal(MODAL_KEYS.FUTURE_TRAVELS),
  dismiss: () => dismissModal(MODAL_KEYS.FUTURE_TRAVELS)
};

export const weatherModalUtils = {
  shouldShow: () => shouldShowModal(MODAL_KEYS.WEATHER),
  dismiss: () => dismissModal(MODAL_KEYS.WEATHER)
};

export const achievementsModalUtils = {
  shouldShow: () => shouldShowModal(MODAL_KEYS.ACHIEVEMENTS),
  dismiss: () => dismissModal(MODAL_KEYS.ACHIEVEMENTS)
};