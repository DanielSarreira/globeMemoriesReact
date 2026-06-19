import React, { useState, useEffect } from 'react';
import { FaTimes, FaPaperPlane, FaExclamationTriangle, FaLightbulb } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { request } from '../axios_helper';
import '../styles/components/suggestion-modal.css';

// Reads a File object and returns a base64 data-URL string
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Falha ao ler o ficheiro.'));
    reader.readAsDataURL(file);
  });

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
  const [fileInputKey, setFileInputKey] = useState(0); // forces file input reset after submit

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
      // Convert screenshot to base64 if provided
      let imageUrl = null;
      if (formData.screenshot) {
        imageUrl = await fileToBase64(formData.screenshot);
      }

      // Map form fields to backend CreateFeedbackDto
      const payload = {
        feedbackType: formData.type === 'error' ? 'ERROR_REPORT' : 'SUGGESTION',
        title: formData.title.trim(),
        description: formData.description.trim(),
        stepsToReproduce: formData.steps.trim() || null,
        imageUrl,
      };

      await request('POST', '/feedback', payload);

      setSuccessMessage('Obrigado! O seu feedback foi registado com sucesso.');
      showToast('Feedback enviado com sucesso! 🎉', 'success');

      setTimeout(() => {
        setFormData({
          type: 'error',
          page: window.location.pathname || '/home',
          title: '',
          description: '',
          steps: '',
          screenshot: null,
        });
        setFileInputKey(k => k + 1); // reset file input element
        setSuccessMessage('');
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      showToast('Erro ao enviar feedback. Tente novamente.', 'error');
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
                  key={fileInputKey}
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
