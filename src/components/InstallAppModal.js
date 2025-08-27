import React, { useMemo, useState, useEffect } from 'react';
// ...existing code...

const platformInfo = () => {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isChrome = /Chrome\//.test(ua) && !/Edg\//.test(ua) && !/OPR\//.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  return { isIOS, isAndroid, isChrome, isSafari };
};

export default function InstallAppModal({ open, onClose, deferredPrompt }) {
  const [isInstalling, setIsInstalling] = useState(false);
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
      // We cannot persist the event after use; it becomes null by spec
      // The parent can decide to clear it if needed
      // eslint-disable-next-line no-console
      console.log('PWA install choice:', choiceResult);
    } finally {
      setIsInstalling(false);
      onClose();
    }
  };

  const Steps = () => {
    if (info.isIOS) {
      return (
        <ol className="install-steps">
          <li>Abra o Safari no seu iPhone/iPad.</li>
          <li>Toque no ícone Partilhar (quadrado com seta para cima).</li>
          <li>Deslize e selecione "Adicionar ao Ecrã Principal".</li>
          <li>Dê um nome (ex.: Globe Memories) e toque em "Adicionar".</li>
          <li>O atalho aparece no seu ecrã inicial.</li>
        </ol>
      );
    }
    if (info.isAndroid) {
      return (
        <ol className="install-steps">
          <li>Abra o Chrome no seu dispositivo Android.</li>
          <li>Toque em ⋮ no canto superior direito.</li>
          <li>Escolha "Adicionar à tela inicial" ou "Instalar app".</li>
          <li>Confirme para criar o atalho/app.</li>
        </ol>
      );
    }
    return (
      <ol className="install-steps">
        <li>Abra este site no seu telemóvel.</li>
        <li>Use o menu do navegador e escolha "Adicionar ao ecrã inicial".</li>
      </ol>
    );
  };

  return (
    <div className="install-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="install-title" onClick={onClose}>
      <div className="install-modal" onClick={(e) => e.stopPropagation()}>
        <div className="install-modal-header">
          <h3 id="install-title">Como instalar no seu telemóvel</h3>
          
        </div>
        <div className="install-modal-body">
          <Steps />
          {deferredPrompt && info.isAndroid && (
            <div className="install-actions">
              <button className="install-action-btn" onClick={triggerNativeInstall} disabled={isInstalling}>
                {isInstalling ? 'A instalar...' : 'Instalar agora'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
