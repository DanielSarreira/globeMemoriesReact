// src/pages/ResetPassword.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { request } from '../axios_helper';
import { FaCheckCircle, FaExclamationCircle, FaEye, FaEyeSlash, FaLock, FaKey } from 'react-icons/fa';
// ...existing code...
import bgLoginImage from '../images/banners/bg_login.jpg';
import Toast from '../components/Toast';
import Toast from '../components/Toast';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    token: searchParams.get('token') || '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null); // null = checking, true = valid, false = invalid
  
  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Toast functions
  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 4000);
  };

  const closeToast = () => {
    setToast({ show: false, message: '', type: '' });
  };

  useEffect(() => {
    // Verificar se o token é válido quando a página carrega
    if (formData.token) {
      validateToken(formData.token);
    } else {
      setTokenValid(false);
      setErrorMessage('Token de recuperação não encontrado. Solicite um novo link de recuperação.');
    }
  }, [formData.token]);

  const validateToken = async (token) => {
    try {
      // Simular validação do token (será implementado no backend)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Por enquanto, simular que tokens com mais de 6 caracteres são válidos
      if (token.length >= 6) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        setErrorMessage('Token inválido ou expirado. Solicite um novo link de recuperação.');
        showToast('Token inválido ou expirado. Solicite um novo link de recuperação.', 'error');
      }
      
      // Em produção, seria algo como:
      // const response = await request('POST', '/validate-reset-token', { token });
      // setTokenValid(response.data.valid);
      
    } catch (error) {
      setTokenValid(false);
      setErrorMessage('Erro ao validar token. Tente novamente.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return 'A palavra-passe deve ter pelo menos 8 caracteres.';
    }
    if (!hasUpperCase) {
      return 'A palavra-passe deve conter pelo menos uma letra maiúscula.';
    }
    if (!hasLowerCase) {
      return 'A palavra-passe deve conter pelo menos uma letra minúscula.';
    }
    if (!hasNumbers) {
      return 'A palavra-passe deve conter pelo menos um número.';
    }
    if (!hasSpecialChar) {
      return 'A palavra-passe deve conter pelo menos um carácter especial.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validações
    if (!formData.token.trim()) {
      setErrorMessage('Token de recuperação é obrigatório.');
      showToast('Token de recuperação é obrigatório.', 'error');
      return;
    }

    if (!formData.newPassword.trim()) {
      setErrorMessage('Nova palavra-passe é obrigatória.');
      showToast('Nova palavra-passe é obrigatória.', 'error');
      return;
    }

    if (!formData.confirmPassword.trim()) {
      setErrorMessage('Confirmação da palavra-passe é obrigatória.');
      showToast('Confirmação da palavra-passe é obrigatória.', 'error');
      return;
    }

    // Validar força da palavra-passe
    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      setErrorMessage(passwordError);
      showToast(passwordError, 'error');
      return;
    }

    // Verificar se as palavras-passe coincidem
    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMessage('As palavras-passe não coincidem.');
      showToast('As palavras-passe não coincidem.', 'error');
      return;
    }

    setLoading(true);

    try {
      // Simular chamada para o backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular sucesso
      showToast('Palavra-passe alterada com sucesso! Redirecionando para o login...', 'success');
      
      // Em produção, seria algo como:
      // await request('POST', '/reset-password', {
      //   token: formData.token,
      //   newPassword: formData.newPassword
      // });
      
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Palavra-passe alterada com sucesso! Faça login com a sua nova palavra-passe.' 
          }
        });
      }, 3000);
      
    } catch (error) {
      showToast('Erro ao alterar palavra-passe. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Se ainda estiver a verificar o token
  if (tokenValid === null) {
    return (
      <div className="register-page" style={{
        minHeight: '100vh',
        background: `url('${bgLoginImage}') center center/cover no-repeat, linear-gradient(180deg, #004a94 0%, #e68a00 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '20px' }}>🔄</div>
          <h2>Verificando token...</h2>
          <p>Por favor, aguarde enquanto validamos o seu link de recuperação.</p>
        </div>
      </div>
    );
  }

  // Se o token for inválido
  if (tokenValid === false) {
    return (
      <div className="register-page" style={{
        minHeight: '100vh',
        background: `url('${bgLoginImage}') center center/cover no-repeat, linear-gradient(180deg, #004a94 0%, #e68a00 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          maxWidth: '500px'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>❌</div>
          <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>Token Inválido</h2>
          <p style={{ marginBottom: '30px', color: '#666' }}>{errorMessage}</p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <Link 
              to="/login" 
              style={{
                padding: '12px 25px',
                borderRadius: '25px',
                border: '2px solid #007bff',
                background: 'transparent',
                color: '#007bff',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'all 0.3s ease'
              }}
            >
              Voltar ao Login
            </Link>
            <button
              onClick={() => window.location.href = '/login'}
              style={{
                padding: '12px 25px',
                borderRadius: '25px',
                border: 'none',
                background: 'linear-gradient(135deg, #007bff, #0056b3)',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
            >
              Solicitar Novo Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <React.Fragment>
    <div className="register-page" style={{
      minHeight: '100vh',
      width: '',
      background: `url('${bgLoginImage}') center center/cover no-repeat, linear-gradient(180deg, #004a94 0%, #e68a00 100%)`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div className="register-wrapper">
        {/* Seção Esquerda: Formulário de Reset */}
        <div className="register-container">
          <div className="register-header">
            <h2>🔐 Redefinir Palavra-passe</h2>
            <p style={{ 
              color: '#fff', 
              fontSize: '0.9rem', 
              marginTop: '10px',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>
              Insira o seu token e defina uma nova palavra-passe segura.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-groupRegister">
              <label>Token de Recuperação:</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="token"
                  value={formData.token}
                  onChange={handleChange}
                  placeholder="Insira o token recebido por email"
                  required
                  style={{ paddingRight: '45px' }}
                />
                <FaKey style={{
                  position: 'absolute',
                  right: '15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  fontSize: '1.1rem'
                }} />
              </div>
            </div>

            <div className="form-groupRegister">
              <label>Nova Palavra-passe:</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Insira a sua nova palavra-passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: 'absolute',
                    right: '15px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    fontSize: '1.1rem',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-groupRegister">
              <label>Confirmar Nova Palavra-passe:</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirme a sua nova palavra-passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '15px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    fontSize: '1.1rem',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Requisitos da palavra-passe */}
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '10px',
              padding: '15px',
              margin: '15px 0',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <h4 style={{ 
                color: '#fff', 
                fontSize: '0.9rem', 
                marginBottom: '10px',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}>
                🛡️ Requisitos da Palavra-passe:
              </h4>
              <ul style={{ 
                color: '#fff', 
                fontSize: '0.8rem', 
                paddingLeft: '20px',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}>
                <li>Pelo menos 8 caracteres</li>
                <li>Uma letra maiúscula</li>
                <li>Uma letra minúscula</li>
                <li>Um número</li>
                <li>Um carácter especial (!@#$%^&*)</li>
              </ul>
            </div>

            {errorMessage && (
              <div className="error-message">
                <FaExclamationCircle /> {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="success-message">
                <FaCheckCircle /> {successMessage}
              </div>
            )}

            <button 
              type="submit" 
              className="register-button"
              disabled={loading}
              style={{
                background: loading ? '#ccc' : undefined,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '🔄 Alterando...' : '🔐 Alterar Palavra-passe'}
            </button>
          </form>
        </div>

        {/* Seção Direita: Informações de Segurança */}
        <div className="welcome-section-register">
          <h3>🛡️ Segurança em<br /> Primeiro Lugar</h3>
          <p className="app-description">
            Estamos a ajudá-lo a redefinir a sua palavra-passe de forma segura. 
            Certifique-se de criar uma palavra-passe forte e única para proteger 
            a sua conta Globe Memories.
          </p>
          
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '15px',
            padding: '20px',
            margin: '20px 0',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <h4 style={{ 
              color: '#fff', 
              fontSize: '1rem', 
              marginBottom: '15px',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>
              💡 Dicas de Segurança:
            </h4>
            <ul style={{ 
              color: '#fff', 
              fontSize: '0.9rem', 
              paddingLeft: '20px',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              lineHeight: '1.6'
            }}>
              <li>Use uma palavra-passe única</li>
              <li>Combine letras, números e símbolos</li>
              <li>Evite informações pessoais</li>
              <li>Considere usar um gestor de palavras-passe</li>
            </ul>
          </div>

          <div style={{
            marginTop: '30px',
            textAlign: 'center'
          }}>
            <p style={{
              color: '#fff',
              fontSize: '1rem',
              marginBottom: '15px',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>Lembrou-se da sua palavra-passe?</p>
            <Link 
              to="/login" 
              className="signup-button"
              style={{
                display: 'inline-block',
                padding: '12px 25px',
                background: 'transparent',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '25px',
                fontWeight: 'bold',
                fontSize: '1.05rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                border: '2px solid rgba(255,255,255,0.3)',
                textShadow: 'none'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
                e.target.style.background = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                e.target.style.background = 'transparent';
              }}
            >
              ← Voltar ao Login
            </Link>
          </div>
        </div>
      </div>
    </div>
    <Toast
      message={toast.message}
      type={toast.type}
      isVisible={toast.isVisible}
      onClose={hideToast}
    />
    </React.Fragment>
  );
};

export default ResetPassword;
