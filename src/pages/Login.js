// src/pages/Login.js — v3.5 Auth redesign
// Premium, open, comfortable. No sidebar, no topbar — AuthLayout provides chrome.
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  ArrowRight,
  Shield,
  Sparkles,
  X as IconX,
  Check,
  KeyRound,
} from 'lucide-react';
import { request, setAuthHeader } from '../axios_helper';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui';
import { LegalSheet } from '../components/LegalSheet';
import '../styles/pages/auth5.css';

const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 min
const MAX_ATTEMPTS = 5;

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot / reset password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState(null);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetData, setResetData] = useState({ token: '', newPassword: '', confirmPassword: '' });
  const [resetMessage, setResetMessage] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const toast = useToast();
  const { setUser } = useAuth();
  const navigate = useNavigate();

  // ── Remember me + initial mount ────────────────────────────────
  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedUsername');
    const wasRemembered = localStorage.getItem('rememberMe') === 'true';
    if (savedUsername && wasRemembered) {
      setFormData((prev) => ({ ...prev, username: savedUsername }));
      setRememberMe(true);
    }

    // Round 57 — if we just got kicked out by the ban filter on another
    // tab, the AuthContext stashed the server message in sessionStorage.
    // Surface it here as a danger toast so the user knows why they're
    // back at the login page.
    try {
      const bannedMsg = sessionStorage.getItem('gm:banned-message');
      if (bannedMsg) {
        sessionStorage.removeItem('gm:banned-message');
        // Defer one tick so the toast provider is mounted.
        setTimeout(() => {
          toast.danger(bannedMsg, { duration: 10000 });
        }, 50);
      }
    } catch {}
  }, []);

  // ── Rate limit timer ──────────────────────────────────────────
  useEffect(() => {
    const checkBlockStatus = () => {
      const lastFailed = localStorage.getItem('lastFailedLoginAttempt');
      const count = parseInt(localStorage.getItem('loginAttemptCount') || '0', 10);

      if (lastFailed && count >= MAX_ATTEMPTS) {
        const elapsed = Date.now() - parseInt(lastFailed, 10);
        if (elapsed < BLOCK_DURATION_MS) {
          setIsBlocked(true);
          setBlockTimeRemaining(Math.ceil((BLOCK_DURATION_MS - elapsed) / 1000));
          setLoginAttempts(count);
          return;
        }
        localStorage.removeItem('lastFailedLoginAttempt');
        localStorage.removeItem('loginAttemptCount');
        setIsBlocked(false);
        setBlockTimeRemaining(0);
        setLoginAttempts(0);
      }
    };

    checkBlockStatus();
    const interval = setInterval(checkBlockStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Validation helpers ────────────────────────────────────────
  const validateUsername = (value) => {
    if (!value || !value.trim()) return 'O nome de utilizador é obrigatório';
    if (value.length > 50) return 'O nome de utilizador é demasiado longo';
    if (value.length < 3) return 'O nome de utilizador deve ter pelo menos 3 caracteres';
    if (/\s/.test(value)) return 'O nome de utilizador não pode conter espaços';
    if (!/^[a-zA-Z0-9._]+$/.test(value)) {
      return 'O nome de utilizador deve conter apenas letras, números, pontos ou underscore';
    }
    return '';
  };

  const validatePasswordLogin = (value) => {
    if (!value) return 'A palavra-passe é obrigatória';
    if (value.length < 8) return 'A palavra-passe deve ter pelo menos 8 caracteres';
    if (value.length > 128) return 'A palavra-passe é demasiado longa';
    return '';
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'username':
        return validateUsername(value);
      case 'password':
        return validatePasswordLogin(value);
      default:
        return '';
    }
  };

  const validateAllFields = () => {
    const errors = {};
    Object.keys(formData).forEach((key) => {
      const err = validateField(key, formData[key]);
      if (err) errors[key] = err;
    });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Rate-limit helpers ────────────────────────────────────────
  const handleFailedLogin = () => {
    const current = loginAttempts + 1;
    setLoginAttempts(current);
    localStorage.setItem('loginAttemptCount', String(current));
    localStorage.setItem('lastFailedLoginAttempt', String(Date.now()));

    if (current >= MAX_ATTEMPTS) {
      setIsBlocked(true);
      setBlockTimeRemaining(15 * 60);
      toast.danger('Muitas tentativas falhadas. Conta bloqueada por 15 minutos.');
    } else {
      toast.danger(`Credenciais incorretas. ${MAX_ATTEMPTS - current} tentativa(s) restante(s).`);
    }
  };

  const resetLoginAttempts = () => {
    setLoginAttempts(0);
    setIsBlocked(false);
    setBlockTimeRemaining(0);
    localStorage.removeItem('loginAttemptCount');
    localStorage.removeItem('lastFailedLoginAttempt');
  };

  const formatBlockTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // ── Change handlers ───────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    // eslint-disable-next-line no-control-regex
    const sanitized = value.replace(/[ -]/g, '');
    setFormData((prev) => ({ ...prev, [name]: sanitized }));
    const err = validateField(name, sanitized);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || isBlocked) return;

    if (!validateAllFields()) {
      toast.danger('Por favor, corrija os erros no formulário antes de continuar.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onLogin(formData.username, formData.password);
    } catch (err) {
      console.error('Erro no login:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onLogin = async (username, password) => {
    try {
      const response = await request('POST', '/auth/login', { username, password });
      setAuthHeader(response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));

      resetLoginAttempts();

      if (rememberMe) {
        localStorage.setItem('rememberedUsername', username);
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberMeToken', response.data.token);
      } else {
        localStorage.removeItem('rememberedUsername');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberMeToken');
      }

      setUser(response.data);
      toast.success(`Bem-vindo, ${response.data.firstName || username}!`);

      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      setAuthHeader(null);
      console.error('Erro no login:', error);
      handleFailedLogin();

      const serverMsg = error.response?.data?.message;
      if (error.response?.status === 401) {
        setFieldErrors({});
      } else if (error.response?.status === 403) {
        // Round 57 — banned account. Backend now returns a precise reason
        // ("Conta suspensa: <motivo>") so we surface it to the user.
        const bannedMsg = serverMsg && serverMsg.toLowerCase().includes('suspensa')
          ? serverMsg
          : 'Conta suspensa. Contacta o suporte para mais informações.';
        toast.danger(bannedMsg, { duration: 10000 });
      } else if (error.response?.status === 429) {
        toast.danger('Demasiadas tentativas. Tente novamente mais tarde.');
      } else if (error.response?.status === 400) {
        toast.danger('Dados inválidos. Verifique as informações inseridas.');
      } else if (error.response?.status === 500) {
        toast.danger('Erro no servidor. Tente novamente mais tarde.');
      } else if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        toast.danger('Erro de ligação. Verifique a sua ligação à internet e tente novamente.');
      } else {
        toast.danger('Erro ao iniciar sessão. Tente novamente mais tarde.');
      }
    }
  };

  // ── Forgot password ───────────────────────────────────────────
  const openForgotPassword = () => {
    setShowForgotModal(true);
    setForgotEmail('');
    setForgotMessage(null);
  };

  const closeForgotPassword = () => {
    setShowForgotModal(false);
    setForgotEmail('');
    setForgotMessage(null);
    setForgotLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      setForgotMessage({ kind: 'error', text: 'Por favor, insira o seu nome de utilizador ou email.' });
      return;
    }
    setForgotLoading(true);
    setForgotMessage(null);

    // Simulated — the real `/forgot-password` endpoint isn't wired yet on the backend.
    await new Promise((r) => setTimeout(r, 2000));
    setForgotMessage({ kind: 'success', text: 'Email de recuperação enviado! Verifique a sua caixa de entrada.' });

    setTimeout(() => {
      setShowForgotModal(false);
      setForgotEmail('');
      setForgotMessage(null);
      setShowResetModal(true);
    }, 2000);
    setForgotLoading(false);
  };

  // ── Reset password ────────────────────────────────────────────
  const closeResetModal = () => {
    setShowResetModal(false);
    setResetData({ token: '', newPassword: '', confirmPassword: '' });
    setResetMessage(null);
    setResetLoading(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleResetPasswordChange = (e) => {
    const { name, value } = e.target;
    // eslint-disable-next-line no-control-regex
    const sanitized = value.replace(/[ -]/g, '');
    setResetData((prev) => ({ ...prev, [name]: sanitized }));
  };

  const validatePasswordStrength = (password) => {
    if (password.length < 8) return 'A palavra-passe deve ter pelo menos 8 caracteres.';
    if (!/[A-Z]/.test(password)) return 'A palavra-passe deve conter pelo menos uma letra maiúscula.';
    if (!/[a-z]/.test(password)) return 'A palavra-passe deve conter pelo menos uma letra minúscula.';
    if (!/\d/.test(password)) return 'A palavra-passe deve conter pelo menos um número.';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'A palavra-passe deve conter pelo menos um carácter especial.';
    }
    return null;
  };

  const handleResetPassword = async () => {
    setResetMessage(null);
    if (!resetData.token.trim()) {
      setResetMessage({ kind: 'error', text: 'Código de recuperação é obrigatório.' });
      return;
    }
    if (!resetData.newPassword.trim()) {
      setResetMessage({ kind: 'error', text: 'Nova palavra-passe é obrigatória.' });
      return;
    }
    if (!resetData.confirmPassword.trim()) {
      setResetMessage({ kind: 'error', text: 'Confirmação da palavra-passe é obrigatória.' });
      return;
    }
    const pwdError = validatePasswordStrength(resetData.newPassword);
    if (pwdError) {
      setResetMessage({ kind: 'error', text: pwdError });
      return;
    }
    if (resetData.newPassword !== resetData.confirmPassword) {
      setResetMessage({ kind: 'error', text: 'As palavras-passe não coincidem.' });
      return;
    }

    setResetLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    setResetMessage({ kind: 'success', text: 'Palavra-passe alterada com sucesso!' });

    setTimeout(() => {
      closeResetModal();
      toast.success('Palavra-passe alterada com sucesso! Inicie sessão com a sua nova palavra-passe.');
    }, 1500);
    setResetLoading(false);
  };

  // ── Render ────────────────────────────────────────────────────
  const submitLabel = isSubmitting
    ? 'A entrar…'
    : isBlocked
    ? `Bloqueado (${formatBlockTime(blockTimeRemaining)})`
    : 'Entrar';

  return (
    <div className="gm-auth5">
      <header className="gm-auth5__header">
        <span className="gm-auth5__eyebrow">
          <Sparkles size={12} strokeWidth={2} /> Viaje · Explore · Lembre
        </span>
        {/* Round 59+ — Logo removed from this header. The bigger
            brand mark now lives in the AuthLayout (gm-auth-layout
            __logo-wrap) so it's consistent between /login and
            /register and isn't duplicated. */}
      </header>

      <div className="gm-auth5__card">
        <form onSubmit={handleSubmit} className="gm-auth5__form" noValidate>
          {/* Username */}
          <div className="gm-auth5__field">
            <label htmlFor="login-username" className="gm-auth5__label">
              <Mail size={12} strokeWidth={2} />
              Nome de utilizador
              <span className="gm-auth5__required" aria-hidden="true">*</span>
            </label>
            <div className={`gm-auth5__input-wrap${fieldErrors.username ? ' gm-auth5__input-wrap--error' : ''}`}>
              <span className="gm-auth5__input-icon">
                <Mail size={18} strokeWidth={1.75} />
              </span>
              <input
                id="login-username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Insira o seu nome de utilizador"
                autoComplete="username"
                disabled={isBlocked}
                aria-invalid={Boolean(fieldErrors.username)}
                aria-describedby={fieldErrors.username ? 'login-username-error' : undefined}
              />
            </div>
            {fieldErrors.username && (
              <div id="login-username-error" className="gm-auth5__error" role="alert">
                <AlertCircle size={12} strokeWidth={2} />
                {fieldErrors.username}
              </div>
            )}
          </div>

          {/* Password */}
          <div className="gm-auth5__field">
            <label htmlFor="login-password" className="gm-auth5__label">
              <Lock size={12} strokeWidth={2} />
              Palavra-passe
              <span className="gm-auth5__required" aria-hidden="true">*</span>
            </label>
            <div className={`gm-auth5__input-wrap${fieldErrors.password ? ' gm-auth5__input-wrap--error' : ''}`}>
              <span className="gm-auth5__input-icon">
                <Lock size={18} strokeWidth={1.75} />
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Insira a sua palavra-passe"
                autoComplete="current-password"
                disabled={isBlocked}
                className="has-icon-right"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
              />
              <button
                type="button"
                className="gm-auth5__toggle"
                onClick={() => setShowPassword((v) => !v)}
                disabled={isBlocked}
                aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
              </button>
            </div>
            {fieldErrors.password && (
              <div id="login-password-error" className="gm-auth5__error" role="alert">
                <AlertCircle size={12} strokeWidth={2} />
                {fieldErrors.password}
              </div>
            )}
          </div>

          {/* Remember + forgot */}
          <div className="gm-auth5__row">
            <label className="gm-auth5__check">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isBlocked}
              />
              Lembrar-me
            </label>
            <button
              type="button"
              className="gm-auth5__link"
              onClick={openForgotPassword}
              disabled={isBlocked}
            >
              Esqueci-me da palavra-passe
            </button>
          </div>

          {/* Attempts warning */}
          {loginAttempts > 0 && loginAttempts < MAX_ATTEMPTS && (
            <div className="gm-auth5__notice gm-auth5__notice--warning" role="status">
              <AlertCircle size={14} strokeWidth={2} />
              {MAX_ATTEMPTS - loginAttempts} tentativa(s) restante(s) antes do bloqueio.
            </div>
          )}

          {/* Block notice */}
          {isBlocked && (
            <div className="gm-auth5__notice gm-auth5__notice--danger" role="status">
              <Shield size={14} strokeWidth={2} />
              Conta bloqueada por excesso de tentativas. Tempo restante: {formatBlockTime(blockTimeRemaining)}
            </div>
          )}

          <button
            type="submit"
            className="gm-auth5__submit"
            disabled={isSubmitting || isBlocked}
          >
            {isSubmitting && <Loader2 size={18} className="gm-spinner" strokeWidth={2} />}
            <span>{submitLabel}</span>
            {!isSubmitting && !isBlocked && <ArrowRight size={18} strokeWidth={2} />}
          </button>
        </form>

        <div className="gm-auth5__footer">
          <span>Não tens conta?</span>
          <Link to="/register" className="gm-auth5__footer-link">
            Regista-te <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      {/* ── Forgot password modal ──────────────────────────────── */}
      {showForgotModal && (
        <div
          className="gm-auth5__modal-overlay"
          onClick={closeForgotPassword}
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-modal-title"
        >
          <div className="gm-auth5__modal-panel" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="gm-auth5__modal-close"
              onClick={closeForgotPassword}
              aria-label="Fechar"
            >
              <IconX size={18} strokeWidth={2} />
            </button>

            <div className="gm-auth5__modal-header">
              <div className="gm-auth5__modal-icon">
                <Shield size={22} strokeWidth={1.75} />
              </div>
              <h2 id="forgot-modal-title" className="gm-auth5__modal-title">
                Recuperar palavra-passe
              </h2>
              <p className="gm-auth5__modal-sub">
                Insira o seu nome de utilizador ou email para receber as instruções de recuperação.
              </p>
            </div>

            <div className="gm-auth5__modal-body">
              <div className="gm-auth5__field">
                <label htmlFor="forgot-email" className="gm-auth5__label">
                  <Mail size={12} strokeWidth={2} />
                  Nome de utilizador ou email
                </label>
                <div className="gm-auth5__input-wrap">
                  <span className="gm-auth5__input-icon">
                    <Mail size={18} strokeWidth={1.75} />
                  </span>
                  <input
                    id="forgot-email"
                    type="text"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Nome de utilizador ou email"
                    autoComplete="off"
                  />
                </div>
              </div>

              {forgotMessage && (
                <div
                  className={`gm-auth5__modal-msg gm-auth5__modal-msg--${forgotMessage.kind}`}
                  role={forgotMessage.kind === 'error' ? 'alert' : 'status'}
                >
                  {forgotMessage.kind === 'success' ? <Check size={14} strokeWidth={2} /> : <AlertCircle size={14} strokeWidth={2} />}
                  {forgotMessage.text}
                </div>
              )}
            </div>

            <div className="gm-auth5__modal-actions">
              <button
                type="button"
                className="gm-auth5__btn gm-auth5__btn--ghost"
                onClick={closeForgotPassword}
                disabled={forgotLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="gm-auth5__btn gm-auth5__btn--primary"
                onClick={handleForgotPassword}
                disabled={forgotLoading}
              >
                {forgotLoading ? <Loader2 size={16} className="gm-spinner" strokeWidth={2} /> : <Mail size={16} strokeWidth={1.75} />}
                {forgotLoading ? 'A enviar…' : 'Enviar email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset password modal ───────────────────────────────── */}
      {showResetModal && (
        <div
          className="gm-auth5__modal-overlay"
          onClick={closeResetModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
        >
          <div className="gm-auth5__modal-panel" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="gm-auth5__modal-close"
              onClick={closeResetModal}
              aria-label="Fechar"
            >
              <IconX size={18} strokeWidth={2} />
            </button>

            <div className="gm-auth5__modal-header">
              <div className="gm-auth5__modal-icon">
                <KeyRound size={22} strokeWidth={1.75} />
              </div>
              <h2 id="reset-modal-title" className="gm-auth5__modal-title">
                Redefinir palavra-passe
              </h2>
              <p className="gm-auth5__modal-sub">
                Insira o código recebido por email e defina a sua nova palavra-passe.
              </p>
            </div>

            <div className="gm-auth5__modal-body">
              <div className="gm-auth5__field">
                <label htmlFor="reset-token" className="gm-auth5__label">
                  <KeyRound size={12} strokeWidth={2} />
                  Código de recuperação
                </label>
                <div className="gm-auth5__input-wrap gm-auth5__input-wrap--no-leading">
                  <input
                    id="reset-token"
                    type="text"
                    name="token"
                    value={resetData.token}
                    onChange={handleResetPasswordChange}
                    placeholder="Insira o código recebido por email"
                    style={{ textAlign: 'center', letterSpacing: '0.2em', fontWeight: 700 }}
                  />
                </div>
              </div>

              <div className="gm-auth5__field">
                <label htmlFor="reset-new" className="gm-auth5__label">
                  <Lock size={12} strokeWidth={2} />
                  Nova palavra-passe
                </label>
                <div className="gm-auth5__input-wrap">
                  <span className="gm-auth5__input-icon">
                    <Lock size={18} strokeWidth={1.75} />
                  </span>
                  <input
                    id="reset-new"
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={resetData.newPassword}
                    onChange={handleResetPasswordChange}
                    placeholder="Insira a sua nova palavra-passe"
                    className="has-icon-right"
                  />
                  <button
                    type="button"
                    className="gm-auth5__toggle"
                    onClick={() => setShowNewPassword((v) => !v)}
                    aria-label={showNewPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
                  </button>
                </div>
              </div>

              <div className="gm-auth5__field">
                <label htmlFor="reset-confirm" className="gm-auth5__label">
                  <Lock size={12} strokeWidth={2} />
                  Confirmar nova palavra-passe
                </label>
                <div className="gm-auth5__input-wrap">
                  <span className="gm-auth5__input-icon">
                    <Lock size={18} strokeWidth={1.75} />
                  </span>
                  <input
                    id="reset-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={resetData.confirmPassword}
                    onChange={handleResetPasswordChange}
                    placeholder="Confirme a sua nova palavra-passe"
                    className="has-icon-right"
                  />
                  <button
                    type="button"
                    className="gm-auth5__toggle"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
                  </button>
                </div>
              </div>

              <div className="gm-auth5__req">
                <div className="gm-auth5__req-title">
                  <Shield size={12} strokeWidth={2} />
                  Requisitos da palavra-passe
                </div>
                <ul className="gm-auth5__req-list">
                  <li>Pelo menos 8 caracteres</li>
                  <li>Uma letra maiúscula</li>
                  <li>Uma letra minúscula</li>
                  <li>Um número</li>
                  <li>Um carácter especial (!@#$%^&amp;*)</li>
                </ul>
              </div>

              {resetMessage && (
                <div
                  className={`gm-auth5__modal-msg gm-auth5__modal-msg--${resetMessage.kind}`}
                  role={resetMessage.kind === 'error' ? 'alert' : 'status'}
                >
                  {resetMessage.kind === 'success' ? <Check size={14} strokeWidth={2} /> : <AlertCircle size={14} strokeWidth={2} />}
                  {resetMessage.text}
                </div>
              )}
            </div>

            <div className="gm-auth5__modal-actions">
              <button
                type="button"
                className="gm-auth5__btn gm-auth5__btn--ghost"
                onClick={closeResetModal}
                disabled={resetLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="gm-auth5__btn gm-auth5__btn--primary"
                onClick={handleResetPassword}
                disabled={resetLoading}
              >
                {resetLoading ? <Loader2 size={16} className="gm-spinner" strokeWidth={2} /> : <Lock size={16} strokeWidth={1.75} />}
                {resetLoading ? 'A alterar…' : 'Alterar palavra-passe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
