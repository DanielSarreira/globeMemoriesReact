import React, { useState } from 'react';
import Toast from '../components/Toast';
import { FaUser, FaEnvelope, FaCommentDots, FaPaperPlane } from 'react-icons/fa';
// ...existing code...

const HelpSupport = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const showToast = (message, type) => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'name':
        if (!value.trim()) {
          error = 'Nome é obrigatório';
        } else if (value.trim().length < 2) {
          error = 'Nome deve ter pelo menos 2 caracteres';
        } else if (!/^[A-Za-zÀ-ÿ\s]+$/.test(value)) {
          error = 'Nome deve conter apenas letras';
        }
        break;
      case 'email':
        if (!value.trim()) {
          error = 'Email é obrigatório';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Formato de email inválido';
        }
        break;
      case 'message':
        if (!value.trim()) {
          error = 'Mensagem é obrigatória';
        } else if (value.trim().length < 10) {
          error = 'Mensagem deve ter pelo menos 10 caracteres';
        } else if (value.trim().length > 1000) {
          error = 'Mensagem deve ter no máximo 1000 caracteres';
        }
        break;
      default:
        break;
    }
    return error;
  };

  const validateAllFields = () => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validação em tempo real
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    // Validar todos os campos
    if (!validateAllFields()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulação de envio do formulário
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showToast('Mensagem enviada com sucesso! Responderemos em breve.', 'success');
      
      // Limpar formulário
      setFormData({
        name: '',
        email: '',
        message: ''
      });
      setErrors({});
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      showToast('Erro ao enviar mensagem. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="help-support-container">      
     <section className="faq-section">
  <h2>Perguntas Frequentes (FAQ)</h2>
  <div className="faq-item">
    <h3>1. Como posso criar uma conta?</h3>
    <p>Podes criar a tua conta clicando no botão "Registar" no menu principal e preenchendo os dados solicitados.</p>
  </div>
  <div className="faq-item">
    <h3>2. Como editar o meu perfil?</h3>
    <p>Acede à secção "O Meu Perfil" no menu e seleciona "Editar Perfil". Faz as alterações desejadas e clica em "Guardar".</p>
  </div>
  <div className="faq-item">
    <h3>3. Como posso criar uma nova viagem?</h3>
    <p>Na secção "As Minhas Viagens", clica no botão "Criar Viagem" e preenche os detalhes da tua viagem.</p>
  </div>
  <div className="faq-item">
    <h3>4. O que devo fazer se encontrar um erro na aplicação?</h3>
    <p>Contacta-nos através do formulário abaixo ou envia um email para <a href="mailto:suporte@aplicacao.com">suporte@aplicacao.com</a>.</p>
  </div>
</section>
<br></br>

      <section className="contact-section">
        <h2>Fala Connosco</h2>
<p>Se não encontraste resposta à tua questão, preenche o formulário abaixo e entraremos em contacto contigo o mais brevemente possível.</p>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">
              <FaUser style={{ marginRight: '8px' }} />
              Nome <span style={{ color: 'red' }}>*</span>
            </label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              value={formData.name}
              onChange={handleChange}
              placeholder="O seu nome completo..." 
              className={errors.name ? 'input-error' : ''}
              required 
            />
            {errors.name && (
              <div className="field-error" style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
                ⚠️ {errors.name}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">
              <FaEnvelope style={{ marginRight: '8px' }} />
              Email <span style={{ color: 'red' }}>*</span>
            </label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              value={formData.email}
              onChange={handleChange}
              placeholder="O seu email de contacto..." 
              className={errors.email ? 'input-error' : ''}
              required 
            />
            {errors.email && (
              <div className="field-error" style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
                ⚠️ {errors.email}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="message">
              <FaCommentDots style={{ marginRight: '8px' }} />
              Mensagem <span style={{ color: 'red' }}>*</span>
            </label>
            <textarea 
              id="message" 
              name="message" 
              value={formData.message}
              onChange={handleChange}
              placeholder="Descreva detalhadamente a sua questão ou problema..." 
              rows="6" 
              className={errors.message ? 'input-error' : ''}
              required
            />
            <div style={{ 
              fontSize: '12px', 
              color: '#666', 
              marginTop: '5px',
              textAlign: 'right'
            }}>
              {formData.message.length}/1000
            </div>
            {errors.message && (
              <div className="field-error" style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
                ⚠️ {errors.message}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting}
            style={{
              padding: '12px 24px',
              backgroundColor: isSubmitting ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              marginTop: '20px'
            }}
          >
            <FaPaperPlane /> 
            {isSubmitting ? 'A enviar mensagem...' : 'Enviar Mensagem'}
          </button>
        </form>
      </section>

      {/* Toast para feedback */}
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={closeToast}
      />
    </div>
  );
};

export default HelpSupport;
