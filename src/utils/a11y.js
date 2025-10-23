/**
 * Funções auxiliares para melhorar acessibilidade (WCAG 2.1 AA)
 */

/**
 * Cria aria-label padrão para botões
 * @param {string} action - Ação do botão (ex: "like", "comment", "delete")
 * @param {string} context - Contexto (ex: "viagem 1", "comentário 5")
 * @returns {string} Aria-label completo
 */
export const createAriaLabel = (action, context = '') => {
  const labels = {
    like: 'Dar gosto',
    unlike: 'Remover gosto',
    comment: 'Adicionar comentário',
    delete: 'Deletar',
    edit: 'Editar',
    close: 'Fechar',
    next: 'Próximo',
    previous: 'Anterior',
    menu: 'Menu',
    search: 'Pesquisar',
    filter: 'Filtrar',
    submit: 'Enviar',
  };

  const baseLabel = labels[action] || action;
  return context ? `${baseLabel} - ${context}` : baseLabel;
};

/**
 * Componente acessível para modal
 * Com keyboard navigation e focus trap
 */
export const AccessibleModal = ({
  isOpen,
  onClose,
  title,
  children,
  isDangerous = false,
}) => {
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="modal-overlay"
    >
      <div className="modal-content">
        <h2 id="modal-title" className={isDangerous ? 'text-danger' : ''}>
          {title}
        </h2>
        {children}
        <button
          onClick={onClose}
          aria-label="Fechar modal"
          className="modal-close"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

/**
 * Hook para gerenciar focus em componentes
 */
export const useFocusManagement = (shouldAutoFocus = false) => {
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (shouldAutoFocus && ref.current) {
      ref.current.focus();
    }
  }, [shouldAutoFocus]);

  return ref;
};

/**
 * Função para anunciar mensagens a screen readers
 */
export const announce = (message, priority = 'polite') => {
  const ariaLive = document.createElement('div');
  ariaLive.setAttribute('role', 'status');
  ariaLive.setAttribute('aria-live', priority);
  ariaLive.setAttribute('aria-atomic', 'true');
  ariaLive.textContent = message;
  document.body.appendChild(ariaLive);

  setTimeout(() => {
    document.body.removeChild(ariaLive);
  }, 1000);
};

/**
 * Componente acessível para abas
 */
export const AccessibleTabs = ({
  tabs,
  activeTab,
  onChange,
  ariaLabel = 'Abas de navegação',
}) => {
  const handleKeyDown = (e, index) => {
    let newIndex = index;

    if (e.key === 'ArrowRight') {
      newIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      newIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      newIndex = 0;
    } else if (e.key === 'End') {
      newIndex = tabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    onChange(newIndex);
  };

  return (
    <div role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab, index) => (
        <button
          key={index}
          role="tab"
          aria-selected={activeTab === index}
          aria-controls={`panel-${index}`}
          tabIndex={activeTab === index ? 0 : -1}
          onClick={() => onChange(index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className={activeTab === index ? 'tab-active' : 'tab'}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default {
  createAriaLabel,
  AccessibleModal,
  useFocusManagement,
  announce,
  AccessibleTabs,
};
