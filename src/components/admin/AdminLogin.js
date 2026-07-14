// src/components/admin/AdminLogin.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaExclamationCircle } from 'react-icons/fa';
import Toast from '../Toast';
import { request, setAuthHeader, clearAuthToken, STORAGE_KEYS } from '../../axios_helper';
import logo from '../../images/Globe-Memories.png';
import '../../styles/Admin.css';

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const navigate = useNavigate();

  // Track local attempts to give UI feedback (backend also enforces the rate-limit)
  useEffect(() => {
    const checkLoginBlock = () => {
      const attempts = parseInt(localStorage.getItem('adminLoginAttempts') || '0', 10);
      const lastAttemptTime = parseInt(localStorage.getItem('adminLastFailedLogin') || '0', 10);
      const blockDuration = 15 * 60 * 1000;

      setLoginAttempts(attempts);

      if (attempts >= 5) {
        const timeElapsed = Date.now() - lastAttemptTime;
        if (timeElapsed < blockDuration) {
          setIsBlocked(true);
          setBlockTimeRemaining(Math.ceil((blockDuration - timeElapsed) / 1000));
        } else {
          localStorage.removeItem('adminLoginAttempts');
          localStorage.removeItem('adminLastFailedLogin');
          setLoginAttempts(0);
        }
      }
    };

    checkLoginBlock();
  }, []);

  useEffect(() => {
    let timer;
    if (isBlocked && blockTimeRemaining > 0) {
      timer = setInterval(() => {
        setBlockTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsBlocked(false);
            setLoginAttempts(0);
            localStorage.removeItem('adminLoginAttempts');
            localStorage.removeItem('adminLastFailedLogin');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isBlocked, blockTimeRemaining]);

  const showToast = (message, type) => setToast({ message, type, show: true });
  const closeToast = () => setToast({ ...toast, show: false });

  const validateEmail = (email) => {
    if (!email.trim()) return 'Email é obrigatório';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Formato de email inválido';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Palavra-passe é obrigatória';
    if (password.length < 6) return 'Palavra-passe deve ter pelo menos 6 caracteres';
    return '';
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value);
      default:
        return '';
    }
  };

  const validateAllFields = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFailedLogin = () => {
    const currentAttempts = loginAttempts + 1;
    setLoginAttempts(currentAttempts);
    localStorage.setItem('adminLoginAttempts', currentAttempts.toString());
    localStorage.setItem('adminLastFailedLogin', Date.now().toString());

    if (currentAttempts >= 5) {
      setIsBlocked(true);
      setBlockTimeRemaining(15 * 60);
      showToast('Muitas tentativas falhadas. Acesso bloqueado por 15 minutos.', 'error');
    } else {
      const remaining = 5 - currentAttempts;
      showToast(`Credenciais inválidas. ${remaining} tentativa${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}.`, 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (isSubmitting || isBlocked) return;

    if (!validateAllFields()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Backend endpoint: POST /admin/auth/login
      // CredentialsDto expects { username, password (char[]) } but axios serialises strings fine.
      const response = await request('POST', '/admin/auth/login', {
        username: formData.email, // backend uses username field, frontend calls it "email"
        password: formData.password,
      });

      const userData = response.data;
      if (!userData || !userData.token) {
        throw new Error('Resposta inválida do servidor');
      }

      // Verify role from the response
      if (userData.role !== 'ADMIN') {
        throw new Error('Utilizador sem permissões de administrador');
      }

      // Persist admin token in a separate localStorage key
      setAuthHeader(userData.token, STORAGE_KEYS.ADMIN);
      window.localStorage.setItem(STORAGE_KEYS.ADMIN_DATA, JSON.stringify(userData));

      // Clear failed attempts on success
      localStorage.removeItem('adminLoginAttempts');
      localStorage.removeItem('adminLastFailedLogin');

      showToast('Login realizado com sucesso! A redirecionar...', 'success');
      setTimeout(() => navigate('/admin'), 1200);
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      if (status === 429) {
        showToast(msg || 'Demasiadas tentativas. Tente novamente mais tarde.', 'error');
      } else if (status === 401) {
        handleFailedLogin();
      } else {
        showToast(msg || 'Erro ao iniciar sessão. Tente novamente.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-login-admin">
      <img src={logo} alt="Globe Memories Logo" className="sidebar-logo-login" />

      {isBlocked && (
        <div
          style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px',
            textAlign: 'center',
            border: '1px solid #f5c6cb',
          }}
        >
          <strong>Acesso Bloqueado</strong>
          <br />
          Tempo restante: {Math.floor(blockTimeRemaining / 60)}:
          {(blockTimeRemaining % 60).toString().padStart(2, '0')}
        </div>
      )}

      <form onSubmit={handleLogin}>
        <div className="form-group-admin">
          <label>
            Email de Administrador: <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="admin@globememories.com"
            className={errors.email ? 'input-error' : ''}
            disabled={isBlocked}
            required
          />
          {errors.email && (
            <div className="field-error" style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
              <FaExclamationCircle style={{ marginRight: '5px' }} />
              {errors.email}
            </div>
          )}
        </div>

        <div className="form-group-admin">
          <label>
            Palavra-passe: <span style={{ color: 'red' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Introduza a palavra-passe de administrador"
              className={errors.password ? 'input-error' : ''}
              disabled={isBlocked}
              style={{ paddingRight: '45px' }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isBlocked}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: isBlocked ? 'not-allowed' : 'pointer',
                color: '#666',
              }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {errors.password && (
            <div className="field-error" style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
              <FaExclamationCircle style={{ marginRight: '5px' }} />
              {errors.password}
            </div>
          )}
        </div>

        {loginAttempts > 0 && loginAttempts < 5 && (
          <div
            style={{
              background: '#fff3cd',
              color: '#856404',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '14px',
              marginBottom: '15px',
              border: '1px solid #ffeaa7',
            }}
          >
            ⚠️ {loginAttempts} tentativa{loginAttempts !== 1 ? 's' : ''} falhada
            {loginAttempts !== 1 ? 's' : ''}. {5 - loginAttempts} restante
            {5 - loginAttempts !== 1 ? 's' : ''}.
          </div>
        )}

        <button
          type="submit"
          className="btn-primary-admin"
          disabled={isSubmitting || isBlocked}
          style={{
            opacity: isSubmitting || isBlocked ? 0.6 : 1,
            cursor: isSubmitting || isBlocked ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? 'A entrar...' : 'Entrar como Administrador'}
        </button>
      </form>

      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={closeToast} />
    </div>
  );
};

export default AdminLogin;
