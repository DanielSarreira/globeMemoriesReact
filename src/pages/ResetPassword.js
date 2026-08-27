import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Key, Eye, EyeOff, CheckCircle, AlertCircle, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "../components/ui";
import "../styles/pages/reset-password.css";

function validatePassword(password) {
  if (password.length < 8) return "A palavra-passe deve ter pelo menos 8 caracteres.";
  if (!/[A-Z]/.test(password)) return "A palavra-passe deve conter pelo menos uma letra maiúscula.";
  if (!/[a-z]/.test(password)) return "A palavra-passe deve conter pelo menos uma letra minúscula.";
  if (!/\d/.test(password)) return "A palavra-passe deve conter pelo menos um número.";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "A palavra-passe deve conter pelo menos um carácter especial.";
  return null;
}

const PASSWORD_RULES = [
  { label: "Pelo menos 8 caracteres", test: (p) => p.length >= 8 },
  { label: "Uma letra maiúscula", test: (p) => /[A-Z]/.test(p) },
  { label: "Uma letra minúscula", test: (p) => /[a-z]/.test(p) },
  { label: "Um número", test: (p) => /\d/.test(p) },
  { label: "Um carácter especial", test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    token: searchParams.get("token") || "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (formData.token) {
      validateToken(formData.token);
    } else {
      setTokenValid(false);
      setErrorMessage("Token de recuperação não encontrado. Solicite um novo link de recuperação.");
    }
  }, [formData.token]);

  const validateToken = async (token) => {
    // Simulation: tokens with 6+ chars are valid (backend hook-up to be done).
    await new Promise((r) => setTimeout(r, 800));
    if (token.length >= 6) {
      setTokenValid(true);
    } else {
      setTokenValid(false);
      setErrorMessage("Token inválido ou expirado. Solicite um novo link de recuperação.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errorMessage) setErrorMessage("");
  };

  const handleBlur = (e) => {
    setTouched((p) => ({ ...p, [e.target.name]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.newPassword.trim()) {
      setErrorMessage("Nova palavra-passe é obrigatória.");
      return;
    }
    const pwError = validatePassword(formData.newPassword);
    if (pwError) {
      setErrorMessage(pwError);
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMessage("As palavras-passe não coincidem.");
      return;
    }

    setLoading(true);
    try {
      // POST /reset-password will be wired to the backend
      await new Promise((r) => setTimeout(r, 1500));
      toast.success("Palavra-passe alterada! Redirecionando para o login...");
      setTimeout(() => {
        navigate("/login", {
          state: { message: "Palavra-passe alterada com sucesso! Inicie sessão." },
        });
      }, 1200);
    } catch {
      toast.danger("Erro ao alterar palavra-passe. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Token checking ─────────────────────────────────── */
  if (tokenValid === null) {
    return (
      <div className="gm-reset gm-reset--centered">
        <div className="gm-reset__state-card">
          <Loader2 size={32} strokeWidth={1.5} className="gm-reset__spin" />
          <h2>A verificar o link…</h2>
          <p>Estamos a validar o seu link de recuperação.</p>
        </div>      </div>
    );
  }

  /* ── Invalid token ──────────────────────────────────── */
  if (tokenValid === false) {
    return (
      <div className="gm-reset gm-reset--centered">
        <div className="gm-reset__state-card gm-reset__state-card--error">
          <div className="gm-reset__state-icon gm-reset__state-icon--error">
            <AlertCircle size={36} strokeWidth={1.5} />
          </div>
          <h2>Token inválido</h2>
          <p>{errorMessage}</p>
          <div className="gm-reset__state-actions">
            <Link to="/login" className="gm-profile__btn gm-profile__btn--ghost">
              <ArrowLeft size={14} strokeWidth={1.75} /> Voltar ao Login
            </Link>
            <Link to="/login" className="gm-profile__btn gm-profile__btn--primary">
              Solicitar novo link
            </Link>
          </div>
        </div>      </div>
    );
  }

  /* ── Main form ──────────────────────────────────────── */
  return (
    <div className="gm-reset">
      <div className="gm-reset__inner">
        <div className="gm-reset__card">
          <div className="gm-reset__head">
            <div className="gm-reset__head-icon">
              <Key size={20} strokeWidth={1.75} />
            </div>
            <div>
              <h1>Redefinir palavra-passe</h1>
              <p>Crie uma nova palavra-passe forte para a sua conta.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="gm-reset__form" noValidate>
            <div className="gm-reset__field">
              <label htmlFor="token">Token de recuperação</label>
              <div className="gm-reset__input-wrap">
                <Key size={15} className="gm-reset__input-icon" strokeWidth={1.75} />
                <input
                  id="token"
                  name="token"
                  type="text"
                  value={formData.token}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Token recebido por email"
                  className="gm-reset__input"
                  readOnly
                />
                <CheckCircle size={15} className="gm-reset__input-success" strokeWidth={2} />
              </div>
            </div>

            <div className="gm-reset__field">
              <label htmlFor="newPassword">Nova palavra-passe</label>
              <div className="gm-reset__input-wrap">
                <Lock size={15} className="gm-reset__input-icon" strokeWidth={1.75} />
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showNew ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Crie uma palavra-passe forte"
                  className="gm-reset__input"
                />
                <button
                  type="button"
                  className="gm-reset__input-eye"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={showNew ? "Esconder palavra-passe" : "Mostrar palavra-passe"}
                >
                  {showNew ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
                </button>
              </div>

              {/* Password strength checklist */}
              {touched.newPassword && formData.newPassword && (
                <ul className="gm-reset__rules">
                  {PASSWORD_RULES.map((rule) => {
                    const ok = rule.test(formData.newPassword);
                    return (
                      <li key={rule.label} className={ok ? "is-ok" : ""}>
                        <span className="gm-reset__rule-dot" aria-hidden="true" />
                        {rule.label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="gm-reset__field">
              <label htmlFor="confirmPassword">Confirmar palavra-passe</label>
              <div className="gm-reset__input-wrap">
                <Lock size={15} className="gm-reset__input-icon" strokeWidth={1.75} />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Repita a palavra-passe"
                  className="gm-reset__input"
                />
                <button
                  type="button"
                  className="gm-reset__input-eye"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Esconder palavra-passe" : "Mostrar palavra-passe"}
                >
                  {showConfirm ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="gm-reset__error" role="alert">
                <AlertCircle size={14} strokeWidth={1.75} />
                <span>{errorMessage}</span>
              </div>
            )}

            <button type="submit" className="gm-reset__submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={14} strokeWidth={1.75} className="gm-reset__spin" />
                  A alterar...
                </>
              ) : (
                <>
                  <Key size={14} strokeWidth={1.75} />
                  Alterar palavra-passe
                </>
              )}
            </button>
          </form>

          <div className="gm-reset__foot">
            <Link to="/login" className="gm-reset__back">
              <ArrowLeft size={13} strokeWidth={1.75} /> Lembrou-se? Voltar ao login
            </Link>
          </div>
        </div>

        {/* Side: security tips */}
        <aside className="gm-reset__side">
          <div className="gm-reset__side-card">
            <div className="gm-reset__side-icon">
              <ShieldCheck size={22} strokeWidth={1.5} />
            </div>
            <h2>Segurança em primeiro lugar</h2>
            <p>Estamos a ajudá-lo a redefinir a sua palavra-passe de forma segura. Siga as boas práticas para proteger a sua conta.</p>
            <ul className="gm-reset__tips">
              <li>Use uma palavra-passe única para a Globe Memories</li>
              <li>Combine letras, números e símbolos</li>
              <li>Evite informações pessoais óbvias</li>
              <li>Considere usar um gestor de palavras-passe</li>
            </ul>
          </div>
        </aside>
      </div>    </div>
  );
};

export default ResetPassword;
