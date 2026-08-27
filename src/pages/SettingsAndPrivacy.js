import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Globe, Bell, Shield, Lock, Eye, FileText, History, LogOut, Download, Trash2,
  Ban, Unlock, Smartphone, Monitor, Tablet, X as IconX, Info, ChevronRight,
  UserX, Check, Sun, Moon, HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api, { clearAllAuth, setAuthHeader, toFullMediaUrl } from "../axios_helper";
import { useToast, Avatar } from "../components/ui";
import { getDisplayName } from "../utils/userDisplay";
import TermsModal from "../components/TermsModal";
import "../styles/pages/SettingsAndPrivacy.css";

/* ── Visibility mappings (preserved) ──────────────────── */
const statsVisibilityToOption = (v) => {
  if (v === "FOLLOWERS") return "followers";
  if (v === "PRIVATE") return "private";
  return "all";
};
const optionToStatsVisibility = (v) => {
  if (v === "followers") return "FOLLOWERS";
  if (v === "private") return "PRIVATE";
  return "PUBLIC";
};

const PRIVACY_OPTIONS = [
  { value: "all", label: "Mostrar para Todos", description: "Qualquer pessoa vê" },
  { value: "followers", label: "Apenas Seguidores", description: "Só quem te segue" },
  { value: "private", label: "Apenas para Mim", description: "Privado para ti" },
];

const SettingsAndPrivacy = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("settings");
  const [isLoading, setIsLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsModalTab, setTermsModalTab] = useState("terms");
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [closingSessionId, setClosingSessionId] = useState(null);
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);
  const [confirmUnblock, setConfirmUnblock] = useState(null);

  const [settings, setSettings] = useState({
    language: "pt",
    notifications: {
      newTravels: true,
      comments: true,
      followers: true,
      promotions: false,
    },
    privacy: {
      profileVisibility: "public",
      showStatistics: "all",
      showMonetaryStatistics: "all",
    },
  });

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(true);
  const blockedUsersRef = useRef(null);

  /* ── Hash deep-link to blocked-users ─────────────────── */
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === "#blocked-users") {
        setActiveTab("privacy");
        setTimeout(() => {
          blockedUsersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 250);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  /* ── Load blocked users ──────────────────────────────── */
  useEffect(() => {
    const fetchBlocked = async () => {
      if (!user) {
        setLoadingBlocked(false);
        return;
      }
      setLoadingBlocked(true);
      try {
        const { data } = await api.get("/users-management/blocked-list");
        const list = Array.isArray(data) ? data : [];
        setBlockedUsers(
          list.map((u) => ({
            id: u.id,
            name: getDisplayName(u, u.username || "Utilizador"),
            username: u.username,
            profilePicture: u.profilePhoto || null,
          }))
        );
      } catch (err) {
        console.error("Erro ao carregar utilizadores bloqueados:", err);
        setBlockedUsers([]);
      } finally {
        setLoadingBlocked(false);
      }
    };
    fetchBlocked();
  }, [user]);

  /* ── Hydrate privacy settings from user ──────────────── */
  useEffect(() => {
    if (!user) return;
    setSettings((prev) => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        profileVisibility: user.privateProfile ? "private" : "public",
        showStatistics: statsVisibilityToOption(user.showStatistics),
        showMonetaryStatistics: statsVisibilityToOption(user.showMonetaryStatistics),
      },
    }));
  }, [user?.id, user?.privateProfile, user?.showStatistics, user?.showMonetaryStatistics]);

  /* ── Handlers ─────────────────────────────────────────── */
  const handleLanguageChange = async (newLanguage) => {
    setIsLoading(true);
    try {
      setSettings((p) => ({ ...p, language: newLanguage }));
      await new Promise((r) => setTimeout(r, 400));
      toast.success("Idioma atualizado.");
    } catch {
      toast.danger("Erro ao alterar idioma.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationChange = async (key) => {
    const next = !settings.notifications[key];
    setIsLoading(true);
    try {
      setSettings((p) => ({ ...p, notifications: { ...p.notifications, [key]: next } }));
      // Currently the backend has no per-flag endpoint — we still flip
      // locally so the UI feels instant and consistent.
      await new Promise((r) => setTimeout(r, 200));
    } catch {
      toast.danger("Erro ao atualizar notificações.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivacyChange = async (type, value) => {
    setIsLoading(true);
    try {
      const nextPrivateProfile =
        type === "profileVisibility" ? value === "private" : !!user?.privateProfile;
      const nextShowStatistics = optionToStatsVisibility(
        type === "showStatistics" ? value : settings.privacy.showStatistics
      );
      const nextShowMonetaryStatistics = optionToStatsVisibility(
        type === "showMonetaryStatistics" ? value : settings.privacy.showMonetaryStatistics
      );

      await api.patch("/users/update-privacy", {
        privateProfile: nextPrivateProfile,
        showStatistics: nextShowStatistics,
        showMonetaryStatistics: nextShowMonetaryStatistics,
      });

      if (setUser && user) {
        const updated = {
          ...user,
          privateProfile: nextPrivateProfile,
          showStatistics: nextShowStatistics,
          showMonetaryStatistics: nextShowMonetaryStatistics,
        };
        setUser(updated);
        try {
          localStorage.setItem("user", JSON.stringify(updated));
        } catch (e) {
          console.warn("Falha a persistir user:", e);
        }
      }
      setSettings((p) => ({ ...p, privacy: { ...p.privacy, [type]: value } }));
      toast.success("Privacidade atualizada.");
    } catch (err) {
      const msg = err?.response?.data?.message || "Erro ao atualizar privacidade.";
      toast.danger(msg);
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Sessions ─────────────────────────────────────────── */
  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const { data } = await api.get("/sessions");
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar sessões:", err);
      toast.danger("Não foi possível carregar o histórico de sessões.");
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleOpenSessionsModal = () => {
    setShowSessionsModal(true);
    fetchSessions();
  };

  const handleCloseSession = async (s) => {
    if (s.isCurrentSession) return;
    setClosingSessionId(s.id);
    try {
      await api.delete(`/sessions/${s.id}`);
      setSessions((prev) => prev.filter((x) => x.id !== s.id));
      toast.success("Sessão terminada.");
    } catch (err) {
      toast.danger(err?.response?.data?.message || "Erro ao terminar sessão.");
    } finally {
      setClosingSessionId(null);
    }
  };

  const confirmLogoutAll = async () => {
    setShowLogoutAllModal(false);
    setIsLoading(true);
    try {
      await api.post("/sessions/close-all-sessions");
      clearAllAuth();
      setUser(null);
      setAuthHeader(null);
      toast.success("Sessão terminada em todos os dispositivos.");
      setTimeout(() => navigate("/login"), 600);
    } catch (err) {
      toast.danger(err?.response?.data?.message || "Erro ao terminar sessões.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderDeviceIcon = (deviceType) => {
    const t = (deviceType || "").toLowerCase();
    if (t.includes("mobile") || t.includes("phone")) return <Smartphone size={18} strokeWidth={1.75} />;
    if (t.includes("tablet") || t.includes("ipad")) return <Tablet size={18} strokeWidth={1.75} />;
    return <Monitor size={18} strokeWidth={1.75} />;
  };

  const formatDateTime = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" });
    } catch {
      return iso;
    }
  };

  /* ── Data & account ───────────────────────────────────── */
  const handleDownloadData = async () => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      toast.success("Os seus dados foram preparados.");
    } catch {
      toast.danger("Erro ao preparar dados.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("ATENÇÃO: Esta ação é irreversível! Tem a certeza?")) return;
    if (!window.confirm("Confirme novamente que pretende eliminar a conta.")) return;
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      toast.success("Conta eliminada.");
    } catch {
      toast.danger("Erro ao eliminar conta.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Blocked users ────────────────────────────────────── */
  const confirmUnblockAction = async () => {
    const target = confirmUnblock;
    if (!target) return;
    setIsLoading(true);
    try {
      await api.delete(`/users-management/${target.id}/unblock`);
      setBlockedUsers((p) => p.filter((u) => u.id !== target.id));
      toast.success(`${target.name} foi desbloqueado.`);
      setConfirmUnblock(null);
    } catch (err) {
      toast.danger(err?.response?.data?.message || "Erro ao desbloquear.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="gm-settings">
      {/* ── Header (glass) — title block removed (Round 33 cleanup) ──── */}
      <div className="gm-settings__head">
        <div className="gm-settings__head-inner">
          <div className="gm-settings__head-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "settings"}
              className={`gm-settings__head-tab ${activeTab === "settings" ? "gm-settings__head-tab--active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              <Sun size={14} strokeWidth={1.75} />
              <span>Definições</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "privacy"}
              className={`gm-settings__head-tab ${activeTab === "privacy" ? "gm-settings__head-tab--active" : ""}`}
              onClick={() => setActiveTab("privacy")}
            >
              <Lock size={14} strokeWidth={1.75} />
              <span>Privacidade</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────── */}
      <div className="gm-settings__body">
        {activeTab === "settings" ? (
          <div className="gm-settings__grid">
            {/* Language */}
            <SettingCard icon={Globe} title="Idioma" subtitle="Idioma da interface" tag="settings">
              <div className="gm-settings__select-wrap">
                <select
                  className="gm-settings__select"
                  value={settings.language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="pt">Português (PT)</option>
                  <option value="en" disabled>English (Em breve)</option>
                  <option value="es" disabled>Español (Em breve)</option>
                </select>
              </div>
            </SettingCard>

            {/* Notifications */}
            <SettingCard
              icon={Bell}
              title="Notificações"
              subtitle="Email e notificações na app"
              tag="settings"
              full
            >
              <div className="gm-settings__switch-list">
                <SwitchRow
                  label="Novas viagens de viajantes que sigo"
                  description="Quando alguém que segues publica uma nova viagem"
                  checked={settings.notifications.newTravels}
                  onChange={() => handleNotificationChange("newTravels")}
                  disabled={isLoading}
                />
                <SwitchRow
                  label="Comentários nas minhas viagens"
                  description="Quando alguém comenta as tuas memórias"
                  checked={settings.notifications.comments}
                  onChange={() => handleNotificationChange("comments")}
                  disabled={isLoading}
                />
                <SwitchRow
                  label="Novos seguidores"
                  description="Quando alguém começa a seguir-te"
                  checked={settings.notifications.followers}
                  onChange={() => handleNotificationChange("followers")}
                  disabled={isLoading}
                />
                <SwitchRow
                  label="Sugestões de destinos e promoções"
                  description="Recomendações personalizadas e ofertas"
                  checked={settings.notifications.promotions}
                  onChange={() => handleNotificationChange("promotions")}
                  disabled={isLoading}
                />
              </div>
            </SettingCard>

            {/* Sessions */}
            <SettingCard
              icon={History}
              title="Atividade da Conta"
              subtitle="Dispositivos ligados e sessões"
              tag="settings"
            >
              <button type="button" className="gm-profile__btn gm-profile__btn--ghost" onClick={handleOpenSessionsModal}>
                Ver Histórico
                <ChevronRight size={14} strokeWidth={1.75} />
              </button>
            </SettingCard>

            {/* Logout all */}
            <SettingCard
              icon={LogOut}
              title="Terminar Sessão em Todo o Lado"
              subtitle="Fecha sessão em todos os dispositivos"
              tag="settings"
            >
              <button
                type="button"
                className="gm-profile__btn gm-profile__btn--ghost"
                onClick={() => setShowLogoutAllModal(true)}
                disabled={isLoading}
              >
                {isLoading ? "A processar..." : "Terminar Globalmente"}
                <ChevronRight size={14} strokeWidth={1.75} />
              </button>
            </SettingCard>

            {/* Help */}
            <SettingCard
              icon={HelpCircle}
              title="Ajuda e Suporte"
              subtitle="FAQ e contacto com a equipa"
              tag="settings"
            >
              <a className="gm-profile__btn gm-profile__btn--ghost" href="/help-support">
                Ir para Ajuda
                <ChevronRight size={14} strokeWidth={1.75} />
              </a>
            </SettingCard>
          </div>
        ) : (
          <div className="gm-settings__grid">
            {/* Profile visibility */}
            <SettingCard
              icon={UserX}
              title="Visibilidade do Perfil"
              subtitle="Define quem pode ver o teu perfil"
              tag="privacy"
            >
              <div className="gm-settings__segmented" role="radiogroup" aria-label="Visibilidade do perfil">
                <button
                  type="button"
                  role="radio"
                  aria-checked={settings.privacy.profileVisibility === "public"}
                  className={`gm-settings__seg ${settings.privacy.profileVisibility === "public" ? "gm-settings__seg--active" : ""}`}
                  onClick={() => handlePrivacyChange("profileVisibility", "public")}
                  disabled={isLoading}
                >
                  <Eye size={14} strokeWidth={1.75} />
                  <span>Público</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={settings.privacy.profileVisibility === "private"}
                  className={`gm-settings__seg ${settings.privacy.profileVisibility === "private" ? "gm-settings__seg--active" : ""}`}
                  onClick={() => handlePrivacyChange("profileVisibility", "private")}
                  disabled={isLoading}
                >
                  <Lock size={14} strokeWidth={1.75} />
                  <span>Privado</span>
                </button>
              </div>
            </SettingCard>

            {/* Statistics visibility */}
            <SettingCard
              icon={Eye}
              title="Estatísticas do Perfil"
              subtitle="Controlo separado para estatísticas gerais e monetárias"
              tag="privacy"
              full
            >
              <div className="gm-settings__optgroup">
                <div className="gm-settings__optgroup-label">Estatísticas gerais</div>
                <div className="gm-settings__optgroup-options">
                  {PRIVACY_OPTIONS.map((opt) => (
                    <OptionRow
                      key={`stats-${opt.value}`}
                      option={opt}
                      checked={settings.privacy.showStatistics === opt.value}
                      onChange={() => handlePrivacyChange("showStatistics", opt.value)}
                      disabled={isLoading}
                    />
                  ))}
                </div>
              </div>
              <div className="gm-settings__optgroup">
                <div className="gm-settings__optgroup-label">Estatísticas monetárias</div>
                <div className="gm-settings__optgroup-options">
                  {PRIVACY_OPTIONS.map((opt) => (
                    <OptionRow
                      key={`money-${opt.value}`}
                      option={opt}
                      checked={settings.privacy.showMonetaryStatistics === opt.value}
                      onChange={() => handlePrivacyChange("showMonetaryStatistics", opt.value)}
                      disabled={isLoading}
                    />
                  ))}
                </div>
              </div>
            </SettingCard>

            {/* Documents */}
            <SettingCard
              icon={FileText}
              title="Termos e Política"
              subtitle="Documentação legal"
              tag="privacy"
            >
              <div className="gm-settings__doc-actions">
                <button
                  type="button"
                  className="gm-profile__btn gm-profile__btn--ghost"
                  onClick={() => { setTermsModalTab("terms"); setShowTermsModal(true); }}
                >
                  <FileText size={14} strokeWidth={1.75} /> Termos
                </button>
                <button
                  type="button"
                  className="gm-profile__btn gm-profile__btn--ghost"
                  onClick={() => { setTermsModalTab("privacy"); setShowTermsModal(true); }}
                >
                  <Lock size={14} strokeWidth={1.75} /> Privacidade
                </button>
              </div>
            </SettingCard>

            {/* Data management */}
            <SettingCard
              icon={Download}
              title="Dados da Conta"
              subtitle="Download ou eliminação permanente"
              tag="privacy"
            >
              <div className="gm-settings__row-actions">
                <button type="button" className="gm-profile__btn gm-profile__btn--ghost" onClick={handleDownloadData} disabled={isLoading}>
                  <Download size={14} strokeWidth={1.75} /> {isLoading ? "A preparar..." : "Transferir"}
                </button>
                <button type="button" className="gm-profile__btn gm-profile__btn--danger" onClick={handleDeleteAccount} disabled={isLoading}>
                  <Trash2 size={14} strokeWidth={1.75} /> Eliminar
                </button>
              </div>
            </SettingCard>

            {/* Blocked users */}
            <SettingCard
              icon={Ban}
              title="Viajantes Bloqueados"
              subtitle="Utilizadores que bloqueaste"
              tag="privacy"
              danger
              full
              id="blocked-users"
              sectionRef={blockedUsersRef}
            >
              {loadingBlocked ? (
                <div className="gm-settings__loading">
                  <div className="gm-settings__spinner" />
                </div>
              ) : blockedUsers.length === 0 ? (
                <div className="gm-settings__empty">
                  <Ban size={32} strokeWidth={1.5} />
                  <p>Nenhum viajante bloqueado.</p>
                </div>
              ) : (
                <ul className="gm-settings__blocked-list">
                  {blockedUsers.map((b) => (
                    <li key={b.id} className="gm-settings__blocked-item">
                      <div className="gm-settings__blocked-avatar">
                      {b.profilePicture ? (
                          <img src={toFullMediaUrl(b.profilePicture)} alt={b.name} />
                        ) : (
                          <Avatar name={b.name} size="md" />
                        )}
                        <span className="gm-settings__blocked-overlay">
                          <Ban size={10} strokeWidth={2.5} />
                        </span>
                      </div>
                      <div className="gm-settings__blocked-info">
                        <strong>{b.name}</strong>
                        <span>@{b.username}</span>
                      </div>
                      <button
                        type="button"
                        className="gm-profile__btn gm-profile__btn--ghost"
                        onClick={() => setConfirmUnblock(b)}
                        disabled={isLoading}
                      >
                        <Unlock size={13} strokeWidth={1.75} /> Desbloquear
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="gm-settings__hint">
                Ao desbloquear, este viajante volta a poder ver o teu perfil e interagir contigo.
              </p>
            </SettingCard>

            {/* Security tips */}
            <SettingCard
              icon={Info}
              title="Dicas de Segurança"
              subtitle="Boas práticas para a tua conta"
              tag="privacy"
              full
            >
              <ul className="gm-settings__tips">
                <li>Utilize uma palavra-passe forte e única.</li>
                <li>Não partilhe dados pessoais sensíveis em público.</li>
                <li>Bloqueie utilizadores abusivos ou suspeitos.</li>
                <li>Consulte as <a href="/help-support">perguntas frequentes</a> para mais dicas.</li>
              </ul>
            </SettingCard>
          </div>
        )}
      </div>
      {/* ── Terms modal ──────────────────────────────────── */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        initialTab={termsModalTab}
      />

      {/* ── Unblock confirm modal (premium) ──────────────── */}
      <ConfirmModal
        open={!!confirmUnblock}
        onClose={() => setConfirmUnblock(null)}
        title="Desbloquear viajante"
        loading={isLoading}
        onConfirm={confirmUnblockAction}
        confirmLabel="Desbloquear"
        tone="success"
      >
        Tens a certeza que queres desbloquear <strong>{confirmUnblock?.name}</strong> (@{confirmUnblock?.username})?
        Esta pessoa voltará a poder ver o teu perfil e interagir contigo.
      </ConfirmModal>

      {/* ── Logout all confirm modal ─────────────────────── */}
      <ConfirmModal
        open={showLogoutAllModal}
        onClose={() => setShowLogoutAllModal(false)}
        title="Terminar sessão em todos os dispositivos"
        loading={isLoading}
        onConfirm={confirmLogoutAll}
        confirmLabel="Terminar tudo"
        tone="danger"
      >
        Vais terminar a sessão <strong>neste e em todos os outros dispositivos</strong>. Terás de iniciar sessão novamente.
      </ConfirmModal>

      {/* ── Sessions modal ───────────────────────────────── */}
      <AnimatePresence>
        {showSessionsModal && (
          <motion.div
            className="gm-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSessionsModal(false)}
          >
            <motion.div
              className="gm-modal__panel gm-sessions-modal"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="gm-modal__close"
                aria-label="Fechar"
                onClick={() => setShowSessionsModal(false)}
              >
                <IconX size={18} strokeWidth={1.75} />
              </button>
              <div className="gm-sessions-modal__head">
                <div className="gm-sessions-modal__head-icon">
                  <Shield size={20} strokeWidth={1.75} />
                </div>
                <div>
                  <h2>Sessões Ativas</h2>
                  <p>Dispositivos onde a tua conta está autenticada.</p>
                </div>
              </div>
              {loadingSessions ? (
                <div className="gm-sessions-modal__loading"><div className="gm-settings__spinner" /></div>
              ) : sessions.length === 0 ? (
                <div className="gm-sessions-modal__empty">Nenhuma sessão ativa encontrada.</div>
              ) : (
                <ul className="gm-sessions-modal__list">
                  {sessions.map((s) => (
                    <li key={s.id} className={`gm-session ${s.isCurrentSession ? "gm-session--current" : ""}`}>
                      <div className="gm-session__icon">
                        {renderDeviceIcon(s.deviceType)}
                      </div>
                      <div className="gm-session__info">
                        <div className="gm-session__name">
                          {s.deviceName || s.deviceType || "Dispositivo desconhecido"}
                          {s.isCurrentSession && <span className="gm-session__current-badge">Esta sessão</span>}
                        </div>
                        <div className="gm-session__meta">
                          {s.deviceType || "—"}{s.ipAddress && ` · IP ${s.ipAddress}`}
                        </div>
                        <div className="gm-session__meta-light">
                          Início: {formatDateTime(s.createdAt)}
                        </div>
                        <div className="gm-session__meta-light">
                          Última atividade: {formatDateTime(s.lastActivity)}
                        </div>
                        {s.expiresAt && (
                          <div className="gm-session__meta-light">
                            Expira: {formatDateTime(s.expiresAt)}
                          </div>
                        )}
                      </div>
                      <div className="gm-session__action">
                        {s.isCurrentSession ? (
                          <span className="gm-session__current">Atual</span>
                        ) : (
                          <button
                            type="button"
                            className="gm-profile__btn gm-profile__btn--ghost gm-session__btn"
                            onClick={() => handleCloseSession(s)}
                            disabled={closingSessionId === s.id}
                          >
                            {closingSessionId === s.id ? "A terminar..." : "Terminar"}
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="gm-sessions-modal__footer">
                <button
                  type="button"
                  className="gm-profile__btn gm-profile__btn--ghost"
                  onClick={() => setShowSessionsModal(false)}
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── SettingCard ─────────────────────────────────────────── */
function SettingCard({ icon: Icon, title, subtitle, children, full, danger, id, sectionRef }) {
  return (
    <motion.section
      id={id}
      ref={sectionRef}
      className={`gm-settings__card ${full ? "gm-settings__card--full" : ""} ${danger ? "gm-settings__card--danger" : ""}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="gm-settings__card-icon">
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <div className="gm-settings__card-body">
        <header className="gm-settings__card-head">
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </header>
        <div className="gm-settings__card-content">{children}</div>
      </div>
    </motion.section>
  );
}

/* ── Switch row (iOS-style) ──────────────────────────────── */
function SwitchRow({ label, description, checked, onChange, disabled }) {
  return (
    <label className={`gm-switch ${disabled ? "gm-switch--disabled" : ""}`}>
      <div className="gm-switch__body">
        <strong>{label}</strong>
        {description && <span>{description}</span>}
      </div>
      <span className="gm-switch__control">
        <input
          type="checkbox"
          checked={!!checked}
          onChange={onChange}
          disabled={disabled}
        />
        <span className="gm-switch__track" aria-hidden="true">
          <span className="gm-switch__thumb" />
        </span>
      </span>
    </label>
  );
}

/* ── Option row (radio) ──────────────────────────────────── */
function OptionRow({ option, checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      className={`gm-opt ${checked ? "gm-opt--active" : ""} ${disabled ? "gm-opt--disabled" : ""}`}
      onClick={onChange}
      disabled={disabled}
    >
      <div className="gm-opt__indicator">
        {checked && <Check size={12} strokeWidth={2.5} />}
      </div>
      <div className="gm-opt__body">
        <strong>{option.label}</strong>
        {option.description && <span>{option.description}</span>}
      </div>
    </button>
  );
}

/* ── Confirm modal (premium) ─────────────────────────────── */
function ConfirmModal({ open, onClose, title, children, onConfirm, confirmLabel, loading, tone }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="gm-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !loading && onClose()}
        >
          <motion.div
            className="gm-modal__panel gm-confirm-modal"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="gm-modal__close"
              aria-label="Fechar"
              onClick={onClose}
              disabled={loading}
            >
              <IconX size={18} strokeWidth={1.75} />
            </button>
            <h3>{title}</h3>
            <p>{children}</p>
            <div className="gm-confirm-modal__actions">
              <button
                type="button"
                className="gm-profile__btn gm-profile__btn--ghost"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={`gm-profile__btn ${tone === "danger" ? "gm-profile__btn--danger" : "gm-profile__btn--primary"}`}
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? "A processar..." : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SettingsAndPrivacy;
