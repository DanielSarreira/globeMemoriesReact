/**
 * Utilidades para melhorar acessibilidade (a11y)
 * @module a11yUtils
 */

/**
 * Adiciona suporte de aria-label a elemento
 * @param {HTMLElement} element - Elemento
 * @param {string} label - Label acessível
 */
export const addAriaLabel = (element, label) => {
  if (element) {
    element.setAttribute('aria-label', label);
  }
};

/**
 * Adiciona suporte de aria-describedby
 * @param {HTMLElement} element - Elemento principal
 * @param {string} descriptionId - ID do elemento com descrição
 */
export const addAriaDescription = (element, descriptionId) => {
  if (element && descriptionId) {
    element.setAttribute('aria-describedby', descriptionId);
  }
};

/**
 * Marca elemento como disabled para screen readers
 * @param {HTMLElement} element - Elemento
 * @param {boolean} disabled - Se deve estar disabled
 */
export const setAriaDisabled = (element, disabled = true) => {
  if (element) {
    element.setAttribute('aria-disabled', disabled);
    if (disabled) {
      element.setAttribute('tabindex', '-1');
    }
  }
};

/**
 * Torna elemento focusable via tabindex
 * @param {HTMLElement} element - Elemento
 */
export const makeFocusable = (element) => {
  if (element && !element.hasAttribute('tabindex')) {
    element.setAttribute('tabindex', '0');
  }
};

/**
 * Adiciona role ARIA
 * @param {HTMLElement} element - Elemento
 * @param {string} role - Role ARIA (button, link, etc)
 */
export const addAriaRole = (element, role) => {
  if (element) {
    element.setAttribute('role', role);
  }
};

/**
 * Configuração de contraste mínimo WCAG AA
 * Retorna classe CSS para aplicar
 * @param {string} bgColor - Cor de fundo (hex)
 * @returns {string} Nome da classe a aplicar
 */
export const getContrastClass = (bgColor) => {
  // Implementação simplificada
  // Em produção, calcular luminância real
  return bgColor && bgColor.toLowerCase().includes('light') 
    ? 'dark-text' 
    : 'light-text';
};

/**
 * Keyboard event handler helper
 * @param {KeyboardEvent} event - Evento do teclado
 * @param {Object} handlers - Mapeamento de keys para handlers
 */
export const handleKeyboardEvent = (event, handlers) => {
  const key = event.key.toLowerCase();
  const handler = handlers[key];
  
  if (handler) {
    event.preventDefault();
    handler();
  }
};

/**
 * Torna elemento modal acessível
 * Trap focus dentro do modal
 * @param {HTMLElement} modalElement - Elemento modal
 */
export const makeModalAccessible = (modalElement) => {
  if (!modalElement) return;

  // Set role
  modalElement.setAttribute('role', 'dialog');
  modalElement.setAttribute('aria-modal', 'true');

  // Trap focus
  const focusableElements = modalElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  modalElement.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
    if (e.key === 'Escape') {
      // Close modal (implementar com callback)
      const closeEvent = new CustomEvent('closeModal');
      modalElement.dispatchEvent(closeEvent);
    }
  });

  // Focus first element
  if (firstElement) {
    setTimeout(() => firstElement.focus(), 100);
  }
};

/**
 * Announce message para screen readers
 * @param {string} message - Mensagem a anunciar
 * @param {string} priority - Prioridade: 'polite' ou 'assertive'
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.cssText = `
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  `;
  announcement.textContent = message;
  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

export default {
  addAriaLabel,
  addAriaDescription,
  setAriaDisabled,
  makeFocusable,
  addAriaRole,
  getContrastClass,
  handleKeyboardEvent,
  makeModalAccessible,
  announceToScreenReader
};
