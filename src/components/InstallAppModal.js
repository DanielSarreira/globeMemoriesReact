import React, { useMemo, useState, useEffect } from 'react';
import { FaAndroid, FaApple, FaChrome, FaTimes } from 'react-icons/fa';
// ...existing code...

const platformInfo = () => {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isChrome = /Chrome\//.test(ua) && !/Edg\//.test(ua) && !/OPR\//.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  return { isIOS, isAndroid, isChrome, isSafari };
};

export default function InstallAppModal({ open, onClose, deferredPrompt, showToast }) {
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const info = useMemo(platformInfo, []);

  // Register Escape shortcut. Guard by `open` to avoid unnecessary listeners.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const triggerNativeInstall = async () => {
    if (!deferredPrompt) return;
    try {
      setIsInstalling(true);
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setInstallSuccess(true);
        if (showToast) {
          showToast('✅ Instalação bem-sucedida! O ícone foi adicionado ao seu ecrã inicial.', 'success');
        }
        // Fecha o modal após 2 segundos
        setTimeout(() => {
          onClose();
          setInstallSuccess(false);
        }, 2000);
      } else {
        if (showToast) {
          showToast('ℹ️ Instalação cancelada.', 'info');
        }
      }
      // PWA install completed
    } catch (error) {
      console.error('Erro na instalação:', error);
      if (showToast) {
        showToast('❌ Erro ao instalar a app. Tente novamente.', 'error');
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const Steps = () => {
    if (info.isIOS) {
      return (
        <>
          <div className="install-info-badge ios">
            <FaApple /> iOS / iPadOS
          </div>
          <ol className="install-steps">
            <li>Abra o <strong>Safari</strong> no seu iPhone/iPad.</li>
            <li>Toque no ícone <strong>Partilhar</strong> (quadrado com seta para cima).</li>
            <li>Deslize para baixo e selecione <strong>"Adicionar ao Ecrã Principal"</strong>.</li>
            <li>Dê um nome (ex.: <em>Globe Memories</em>) e toque em <strong>"Adicionar"</strong>.</li>
            <li>✓ O atalho aparece no seu ecrã inicial! Toque para usar a app.</li>
          </ol>
          <div className="install-tips">
            <strong>💡 Dica:</strong> Adicione à sua pasta "Viagens" para manter organizado.
          </div>
        </>
      );
    }
    if (info.isAndroid) {
      return (
        <>
          <div className="install-info-badge android">
            <FaAndroid /> Android
          </div>
          <ol className="install-steps">
            <li>Abra o <strong>Chrome</strong> (ou seu navegador).</li>
            <li>Toque em <strong>⋮</strong> (três pontos) no canto superior direito.</li>
            <li>Escolha <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
            <li>Confirme a instalação.</li>
            <li>✓ A app agora está na sua tela inicial como um app nativo!</li>
          </ol>
          <div className="install-tips">
            <strong>💡 Benefícios:</strong> Carregamento mais rápido, funciona offline, sem barra de endereço.
          </div>
        </>
      );
    }
    return (
      <>
        <div className="install-info-badge generic">
          <FaChrome /> Navegador
        </div>
        <ol className="install-steps">
          <li>Abra este site no seu <strong>telemóvel</strong>.</li>
          <li>Procure a opção <strong>"Instalar app"</strong> ou <strong>"Adicionar ao ecrã inicial"</strong> no menu.</li>
          <li>Confirme a instalação.</li>
          <li>✓ A app agora está disponível na sua tela inicial!</li>
        </ol>
      </>
    );
  };

  return (
    <div className="install-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="install-title" onClick={onClose}>
      <div className="install-modal" onClick={(e) => e.stopPropagation()}>
        {installSuccess ? (
          // Tela de Sucesso
          <div className="install-success-container">
            <div className="success-animation">
              <span className="success-icon">✅</span>
            </div>
            <h2 className="success-title">Instalação Bem-Sucedida!</h2>
            <p className="success-message">
              🎉 A app <strong>Globe Memories</strong> foi adicionada ao seu ecrã inicial!
            </p>
            <div className="success-details">
              <div className="success-item">
                <span className="success-check">✓</span>
                <span>Ícone adicionado ao ecrã inicial</span>
              </div>
              <div className="success-item">
                <span className="success-check">✓</span>
                <span>Funciona offline com cache</span>
              </div>
              <div className="success-item">
                <span className="success-check">✓</span>
                <span>Carregamento mais rápido</span>
              </div>
            </div>
            <p className="success-next-steps">
              Feche este modal para começar a usar a app! O modal fechará automaticamente em alguns segundos.
            </p>
          </div>
        ) : (
          // Tela Normal de Instruções
          <>
            <div className="install-modal-header">
              <h3 id="install-title">🚀 Instale a Globe Memories</h3>
              <button className="install-modal-close" onClick={onClose} aria-label="Fechar" title="Fechar">
                <FaTimes />
              </button>
            </div>
            <div className="install-modal-body">
              <p className="install-modal-intro">
                Aceda à Globe Memories diretamente a partir do seu ecrã inicial para uma experiência mais rápida e imersiva!
              </p>
              <Steps />
              {deferredPrompt && info.isAndroid && (
                <div className="install-actions">
                  <button 
                    className="install-action-btn primary" 
                    onClick={triggerNativeInstall} 
                    disabled={isInstalling}
                  >
                    {isInstalling ? '⏳ A instalar...' : '⚡ Instalar Agora'}
                  </button>
                  <button 
                    className="install-action-btn secondary" 
                    onClick={onClose}
                  >
                    Mais Tarde
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
