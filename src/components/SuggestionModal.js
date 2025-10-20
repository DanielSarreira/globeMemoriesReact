import React, { useState, useEffect } from 'react';
import { FaTimes, FaPaperPlane, FaExclamationTriangle, FaLightbulb } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { request } from '../axios_helper';
import '../styles/components/suggestion-modal.css';

const SuggestionModal = ({ isOpen, onClose, showToast }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    type: 'error', // 'error' ou 'suggestion'
    page: '',
    title: '',
    description: '',
    steps: '',
    screenshot: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Obter página atual
  useEffect(() => {
    if (isOpen) {
      const currentPage = window.location.pathname;
      setFormData(prev => ({
        ...prev,
        page: currentPage || '/home'
      }));
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Fechar com ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast('Ficheiro demasiado grande. Máximo 5MB.', 'error');
        return;
      }
      setFormData(prev => ({
        ...prev,
        screenshot: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      showToast('Por favor, preencha os campos obrigatórios.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('userId', user.id);
      submitData.append('username', user.username);
      submitData.append('type', formData.type);
      submitData.append('page', formData.page);
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('steps', formData.steps);
      
      if (formData.screenshot) {
        submitData.append('screenshot', formData.screenshot);
      }

      // Enviar para backend
      const response = await request(
        'post',
        '/api/suggestions/create',
        submitData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Atualizar pontos de conquista
      if (response.data.achievementPoints) {
        showToast(`✨ +${response.data.achievementPoints} pontos de conquista!`, 'success');
      }

      setSuccessMessage('Obrigado! A sua sugestão foi registada com sucesso.');
      showToast('Sugestão enviada com sucesso! 🎉', 'success');

      // Limpar formulário
      setTimeout(() => {
        setFormData({
          type: 'error',
          page: window.location.pathname || '/home',
          title: '',
          description: '',
          steps: '',
          screenshot: null,
        });
        setSuccessMessage('');
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Erro ao enviar sugestão:', error);
      showToast('Erro ao enviar sugestão. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="suggestion-modal-overlay" onClick={handleOverlayClick}>
      <div className="suggestion-modal">
        <div className="suggestion-modal-header">
          <h2 className="suggestion-modal-title">
            {formData.type === 'error' ? (
              <>
                <FaExclamationTriangle className="suggestion-modal-icon error-icon" />
                Reportar um Erro
              </>
            ) : (
              <>
                <FaLightbulb className="suggestion-modal-icon suggestion-icon" />
                Sugerir uma Melhoria
              </>
            )}
          </h2>
          <button className="suggestion-modal-close" onClick={onClose} aria-label="Fechar modal">
            <FaTimes />
          </button>
        </div>

        {successMessage ? (
          <div className="suggestion-modal-success">
            <div className="success-message">
              <h3>✅ {successMessage}</h3>
              <p>Os nossos moderadores vão analisar a sua contribuição em breve.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="suggestion-form">
            <div className="suggestion-form-section">
              <label className="suggestion-form-label">Tipo de Feedback</label>
              <div className="suggestion-type-selector">
                <button
                  type="button"
                  className={`suggestion-type-btn ${formData.type === 'error' ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, type: 'error' }))}
                >
                  <FaExclamationTriangle /> Erro
                </button>
                <button
                  type="button"
                  className={`suggestion-type-btn ${formData.type === 'suggestion' ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, type: 'suggestion' }))}
                >
                  <FaLightbulb /> Sugestão
                </button>
              </div>
            </div>

            <div className="suggestion-form-section">
              <label className="suggestion-form-label">Página Afetada</label>
              <input
                type="text"
                className="suggestion-form-input"
                value={formData.page}
                disabled
                readOnly
              />
              <small className="suggestion-form-help">Detetada automaticamente</small>
            </div>

            <div className="suggestion-form-section">
              <label className="suggestion-form-label">Título</label>
              <input
                type="text"
                name="title"
                className="suggestion-form-input"
                placeholder={formData.type === 'error' ? 'Ex: Botão não funciona' : 'Ex: Adicionar modo escuro'}
                value={formData.title}
                onChange={handleInputChange}
                maxLength={100}
                required
              />
              <small className="suggestion-form-help">{formData.title.length}/100</small>
            </div>

            <div className="suggestion-form-section">
              <label className="suggestion-form-label">Descrição</label>
              <textarea
                name="description"
                className="suggestion-form-textarea"
                placeholder={formData.type === 'error' 
                  ? 'Descreva o erro com detalhe: o que esperava que acontecesse e o que realmente aconteceu.' 
                  : 'Descreva a melhoria que sugere e por que acha que seria benéfica.'}
                value={formData.description}
                onChange={handleInputChange}
                rows="5"
                maxLength={1000}
                required
              />
              <small className="suggestion-form-help">{formData.description.length}/1000</small>
            </div>

            {formData.type === 'error' && (
              <div className="suggestion-form-section">
                <label className="suggestion-form-label">Passos para Reproduzir</label>
                <textarea
                  name="steps"
                  className="suggestion-form-textarea"
                  placeholder="Ex: 1. Clique em 'Minha Viagens'&#10;2. Selecione uma viagem&#10;3. Clique no botão X..."
                  value={formData.steps}
                  onChange={handleInputChange}
                  rows="3"
                  maxLength={500}
                />
                <small className="suggestion-form-help">{formData.steps.length}/500</small>
              </div>
            )}

            <div className="suggestion-form-section">
              <label className="suggestion-form-label suggestion-form-label-optional">Adicionar Captura de Ecrã (Opcional)</label>
              <div className="suggestion-file-input-wrapper">
                <input
                  type="file"
                  id="screenshot-input"
                  className="suggestion-file-input"
                  onChange={handleFileChange}
                  accept="image/png,image/jpeg,image/gif"
                />
                <label htmlFor="screenshot-input" className="suggestion-file-label">
                  {formData.screenshot ? (
                    <>✓ {formData.screenshot.name}</>
                  ) : (
                    <>📸 Selecionar Imagem</>
                  )}
                </label>
              </div>
              <small className="suggestion-form-help">PNG, JPEG ou GIF. Máximo 5MB.</small>
            </div>

            <div className="suggestion-form-info">
              <p>💡 <strong>Dica:</strong> Quanto mais detalhe fornecer, mais rápido conseguiremos resolver a sua sugestão ou erro.</p>
            </div>

            <div className="suggestion-form-actions">
              <button 
                type="button" 
                className="suggestion-btn-cancel"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="suggestion-btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <FaPaperPlane /> 
                    {formData.type === 'error' ? 'Enviar Erro' : 'Enviar Sugestão'}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SuggestionModal;
