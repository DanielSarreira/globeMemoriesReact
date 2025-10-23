/**
 * Utilitários de Acessibilidade (a11y)
 * Funções para melhorar a acessibilidade da aplicação
 */
import React from 'react';

/**
 * Gerar ID único para labels de formulário
 */
export const generateId = (prefix = 'field') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Anunciar mensagem para screen readers
 */
export const announceToScreenReader = (message) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';
  
  document.body.appendChild(announcement);
  announcement.textContent = message;
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Focus trap para modais
 */
export const createFocusTrap = (element) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }
    
    if (e.key === 'Escape') {
      // Fechar modal ao pressionar Escape
      const closeButton = element.querySelector('[data-close-modal]');
      if (closeButton) {
        closeButton.click();
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);
  
  // Focar primeiro elemento
  if (firstFocusable) {
    firstFocusable.focus();
  }

  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
};

/**
 * Adicionar labels de acessibilidade a botões
 */
export const addAccessibilityLabels = () => {
  // Botões de like
  const likeButtons = document.querySelectorAll('[data-action="like"]');
  likeButtons.forEach(button => {
    if (!button.getAttribute('aria-label')) {
      button.setAttribute('aria-label', 'Dar like a esta viagem');
    }
  });

  // Botões de partilha
  const shareButtons = document.querySelectorAll('[data-action="share"]');
  shareButtons.forEach(button => {
    if (!button.getAttribute('aria-label')) {
      button.setAttribute('aria-label', 'Partilhar esta viagem');
    }
  });

  // Botões de comentário
  const commentButtons = document.querySelectorAll('[data-action="comment"]');
  commentButtons.forEach(button => {
    if (!button.getAttribute('aria-label')) {
      button.setAttribute('aria-label', 'Comentar esta viagem');
    }
  });

  // Botões de denúncia
  const reportButtons = document.querySelectorAll('[data-action="report"]');
  reportButtons.forEach(button => {
    if (!button.getAttribute('aria-label')) {
      button.setAttribute('aria-label', 'Denunciar conteúdo inadequado');
    }
  });
};

/**
 * Melhorar contraste de cores automaticamente
 */
export const enhanceColorContrast = () => {
  const elements = document.querySelectorAll('.low-contrast');
  elements.forEach(element => {
    element.style.filter = 'contrast(1.2)';
  });
};



/**
 * Validar e melhorar alt text de imagens
 */
export const improveImageAltText = () => {
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (!img.alt || img.alt.trim() === '') {
      // Tentar inferir alt text do contexto
      const title = img.getAttribute('title');
      const figcaption = img.closest('figure')?.querySelector('figcaption')?.textContent;
      const dataTitle = img.getAttribute('data-title');
      
      img.alt = title || figcaption || dataTitle || 'Imagem de viagem';
    }
  });
};

/**
 * Configurar regiões ARIA landmark
 */
export const setupARIALandmarks = () => {
  // Main content
  const mainContent = document.querySelector('.main-content');
  if (mainContent && !mainContent.getAttribute('role')) {
    mainContent.setAttribute('role', 'main');
    mainContent.id = 'main-content';
  }

  // Navigation
  const nav = document.querySelector('.navigation, .navbar, .nav');
  if (nav && !nav.getAttribute('role')) {
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Navegação principal');
  }

  // Sidebar
  const sidebar = document.querySelector('.sidebar');
  if (sidebar && !sidebar.getAttribute('role')) {
    sidebar.setAttribute('role', 'complementary');
    sidebar.setAttribute('aria-label', 'Conteúdo complementar');
  }

  // Footer
  const footer = document.querySelector('.footer');
  if (footer && !footer.getAttribute('role')) {
    footer.setAttribute('role', 'contentinfo');
  }
};

/**
 * Inicializar todas as melhorias de acessibilidade
 */
export const initializeAccessibility = () => {
  // Aguardar DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupARIALandmarks();
      addAccessibilityLabels();
      improveImageAltText();
    });
  } else {
    setupARIALandmarks();
    addAccessibilityLabels();
    improveImageAltText();
  }

  // Executar melhorias periodicamente para conteúdo dinâmico
  setInterval(() => {
    addAccessibilityLabels();
    improveImageAltText();
  }, 5000);
};

/**
 * Hook para componentes que precisam de acessibilidade
 */
export const useAccessibility = (ref) => {
  React.useEffect(() => {
    if (ref.current) {
      addAccessibilityLabels();
      improveImageAltText();
    }
  }, [ref]);
};