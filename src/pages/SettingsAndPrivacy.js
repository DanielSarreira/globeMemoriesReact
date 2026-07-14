

import React, { useState, useEffect, useRef } from 'react';
import { FaGlobe, FaLock, FaBell, FaUserShield, FaHistory, FaSignOutAlt, FaTrash, FaBan, FaUnlock, FaInfoCircle, FaCog, FaFileAlt, FaDesktop, FaMobileAlt, FaTabletAlt, FaTimes, FaShieldAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { request, clearAllAuth, setAuthHeader } from '../axios_helper';
import Toast from '../components/Toast';
import TermsModal from '../components/TermsModal';
import '../styles/pages/SettingsAndPrivacy.css';
import defaultAvatar from '../images/assets/avatar1.jpg';


/**
 * Map backend StatsVisibility enum value to the local option id used by
 * the settings dropdowns. The backend can return:
 *   - 'PUBLIC'    → everyone sees the stats
 *   - 'FOLLOWERS' → only followers (and the owner) see the stats
 *   - 'PRIVATE'   → only the owner sees the stats
 *   - null / missing / unknown → default to 'all' (PUBLIC) so legacy users
 *     who pre-date the V4 migration still see their own stats.
 */
const statsVisibilityToOption = (v) => {
  if (v === 'FOLLOWERS') return 'followers';
  if (v === 'PRIVATE') return 'private';
  return 'all';
};

/**
 * Reverse mapping — send the dropdown value back to the backend.
 * Kept as a small explicit table so adding a new visibility level later
 * is a one-line change here.
 */
const optionToStatsVisibility = (v) => {
  if (v === 'followers') return 'FOLLOWERS';
  if (v === 'private') return 'PRIVATE';
  return 'PUBLIC';
};


const SettingsAndPrivacy = () => {
  const [activeTab, setActiveTab] = useState('settings');
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const [isLoading, setIsLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsModalTab, setTermsModalTab] = useState('terms');
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [closingSessionId, setClosingSessionId] = useState(null);
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);
  const [settings, setSettings] = useState({
    language: 'pt',
    notifications: {
      newTravels: true,
      comments: true,
      followers: true,
      promotions: false
    },
    privacy: {
      profileVisibility: 'public',
      // Maps the backend StatsVisibility enum:
      //   'PUBLIC'    → 'all'   (show to everyone)
      //   'FOLLOWERS' → 'followers'  (only followers + own)
      //   'PRIVATE'   → 'private'  (only me)
      showStatistics: 'all',
      showMonetaryStatistics: 'all',
    }
  });


  // Utilizadores bloqueados - serão carregados do backend
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(true);
  const blockedUsersRef = useRef(null);
  // Scroll e ativação da tab "Privacidade" sempre que o hash mudar
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#blocked-users') {
        setActiveTab('privacy');
        setTimeout(() => {
          if (blockedUsersRef.current) {
            blockedUsersRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 250);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      if (!user) {
        setLoadingBlocked(false);
        return;
      }
      setLoadingBlocked(true);
      try {
        const resp = await request('GET', '/users-management/blocked-list');
        const list = Array.isArray(resp.data) ? resp.data : [];
        // Map backend UserBasicDto → frontend shape
        const mapped = list.map((u) => ({
          id: u.id,
          name: [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.username || 'Utilizador',
          username: u.username,
          profilePicture: u.profilePhoto || null,
        }));
        setBlockedUsers(mapped);
      } catch (err) {
        console.error('Erro ao carregar utilizadores bloqueados:', err);
        setBlockedUsers([]);
      } finally {
        setLoadingBlocked(false);
      }
    };
    fetchBlockedUsers();
  }, [user]);

  // Load current privacy settings from the backend on mount (so the UI
  // reflects the real persisted state, not a hardcoded default).
  useEffect(() => {
    if (!user) return;
    setSettings((prev) => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        // Backend only has a boolean privateProfile (no "followers" tier).
        // Map: true → 'private' (only followers + own can see), false → 'public'.
        profileVisibility: user.privateProfile ? 'private' : 'public',
        // Map backend StatsVisibility enum to our internal option ids.
        // Unknown / missing values default to 'all' (PUBLIC).
        showStatistics: statsVisibilityToOption(user.showStatistics),
        showMonetaryStatistics: statsVisibilityToOption(user.showMonetaryStatistics),
      },
    }));
  }, [user?.id, user?.privateProfile, user?.showStatistics, user?.showMonetaryStatistics]);

  const showToast = (message, type) => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 2600);
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  // Função para sanitizar conteúdo contra XSS
  const sanitizeContent = (content) => {
    if (!content) return '';
    
    const dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
      /<link[^>]*>/gi,
      /<meta[^>]*>/gi,
      /<style[^>]*>.*?<\/style>/gi
    ];
    
    let sanitized = content;
    dangerousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    return sanitized.trim();
  };

  // Função para validar inputs
  const validateInput = (value, type, maxLength = 500) => {
    if (!value) return { isValid: true, sanitized: '' };
    
    if (value.length > maxLength) {
      showToast(`Texto não pode exceder ${maxLength} caracteres!`, 'error');
      return { isValid: false, sanitized: value };
    }

    const sanitized = sanitizeContent(value);
    
    if (sanitized !== value.trim()) {
      showToast('Conteúdo contém elementos não permitidos que foram removidos!', 'error');
    }

    return { isValid: true, sanitized };
  };

  const handleLanguageChange = async (newLanguage) => {
    setIsLoading(true);
    try {
      setSettings(prev => ({ ...prev, language: newLanguage }));
      // Simulação de chamada à API
      await new Promise(resolve => setTimeout(resolve, 500));
      showToast('Idioma alterado com sucesso!', 'success');
    } catch (error) {
      showToast('Erro ao alterar idioma. Tente novamente.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationChange = async (notificationType) => {
    setIsLoading(true);
    try {
      setSettings(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [notificationType]: !prev.notifications[notificationType]
        }
      }));
      // Simulação de chamada à API
      await new Promise(resolve => setTimeout(resolve, 500));
      showToast('Preferências de notificações atualizadas!', 'success');
    } catch (error) {
      showToast('Erro ao atualizar notificações. Tente novamente.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivacyChange = async (type, value) => {
    setIsLoading(true);
    try {
      // Compute the next "to-be-persisted" snapshot of the three privacy
      // fields. We always send the full triplet so the backend stays the
      // single source of truth — sending partial updates would leave
      // the other fields in whatever state the form was last in.
      const nextPrivateProfile =
        type === 'profileVisibility' ? value === 'private' : !!user?.privateProfile;
      const nextShowStatistics = optionToStatsVisibility(
        type === 'showStatistics' ? value : settings.privacy.showStatistics
      );
      const nextShowMonetaryStatistics = optionToStatsVisibility(
        type === 'showMonetaryStatistics' ? value : settings.privacy.showMonetaryStatistics
      );

      await request('PATCH', '/users/update-privacy', {
        privateProfile: nextPrivateProfile,
        showStatistics: nextShowStatistics,
        showMonetaryStatistics: nextShowMonetaryStatistics,
      });

      // Keep the local AuthContext in sync so the rest of the app reflects
      // the new value immediately (used by /users/{id}/detailed, etc.).
      if (setUser && user) {
        const updatedUser = {
          ...user,
          privateProfile: nextPrivateProfile,
          showStatistics: nextShowStatistics,
          showMonetaryStatistics: nextShowMonetaryStatistics,
        };
        setUser(updatedUser);
        // CRITICAL: also persist to localStorage. AuthContext.loadAuth()
        // only runs on mount, so without this update, refreshing the page
        // would re-read the stale value from localStorage and revert the UI
        // (and the rest of the app) to the old privacy setting.
        try {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (e) {
          console.warn('Não foi possível persistir user no localStorage:', e);
        }
      }
      setSettings(prev => ({
        ...prev,
        privacy: {
          ...prev.privacy,
          [type]: value,
        },
      }));
      showToast('Definições de privacidade atualizadas!', 'success');
    } catch (error) {
      const msg = error.response?.data?.message || 'Erro ao atualizar privacidade. Tente novamente.';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const resp = await request('GET', '/sessions');
      const list = Array.isArray(resp.data) ? resp.data : [];
      setSessions(list);
    } catch (err) {
      console.error('Erro ao carregar sessões:', err);
      showToast('Não foi possível carregar o histórico de sessões.', 'error');
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleOpenSessionsModal = () => {
    setShowSessionsModal(true);
    fetchSessions();
  };

  const handleCloseSession = async (sessionToClose) => {
    if (sessionToClose.isCurrentSession) return;
    setClosingSessionId(sessionToClose.id);
    try {
      await request('DELETE', `/sessions/${sessionToClose.id}`);
      setSessions(sessions.filter((s) => s.id !== sessionToClose.id));
      showToast('Sessão terminada com sucesso.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Erro ao terminar sessão.', 'error');
    } finally {
      setClosingSessionId(null);
    }
  };

  const handleLogoutAllDevices = () => {
    setShowLogoutAllModal(true);
  };

  const confirmLogoutAll = async () => {
    setShowLogoutAllModal(false);
    setIsLoading(true);
    try {
      await request('POST', '/sessions/close-all-sessions');
      // The current session is also killed — log the user out client-side
      clearAllAuth();
      setUser(null);
      setAuthHeader(null);
      showToast('Sessão terminada em todos os dispositivos!', 'success');
      setTimeout(() => navigate('/login'), 600);
    } catch (err) {
      showToast(err.response?.data?.message || 'Erro ao terminar sessões. Tente novamente.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderDeviceIcon = (deviceType) => {
    const t = (deviceType || '').toLowerCase();
    if (t.includes('mobile') || t.includes('phone')) return <FaMobileAlt />;
    if (t.includes('tablet') || t.includes('ipad')) return <FaTabletAlt />;
    return <FaDesktop />;
  };

  const formatDateTime = (iso) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });
    } catch (e) {
      return iso;
    }
  };

  const handleDownloadData = async () => {
    setIsLoading(true);
    try {
      // Simulação de preparação dos dados
      await new Promise(resolve => setTimeout(resolve, 2000));
      showToast('Os seus dados foram preparados! Verifique os downloads.', 'success');
    } catch (error) {
      showToast('Erro ao preparar dados. Tente novamente.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm('ATENÇÃO: Esta ação é irreversível! Tem a certeza que deseja eliminar a sua conta permanentemente?');
    if (!confirmation) return;
    
    const finalConfirmation = window.confirm('Digite "ELIMINAR" para confirmar:');
    if (!finalConfirmation) return;

    setIsLoading(true);
    try {
      // Simulação de eliminação da conta
      await new Promise(resolve => setTimeout(resolve, 1500));
      showToast('Conta eliminada com sucesso. Lamentamos vê-lo partir.', 'success');
      // Aqui redirecionaria para página de logout
    } catch (error) {
      showToast('Erro ao eliminar conta. Contacte o suporte.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const [confirmUnblock, setConfirmUnblock] = useState(null);

  const handleUnblockUser = (userToUnblock) => {
    setConfirmUnblock(userToUnblock);
  };

  const confirmUnblockAction = async () => {
    const userToUnblock = confirmUnblock;
    if (!userToUnblock) return;
    setIsLoading(true);
    try {
      await request('DELETE', `/users-management/${userToUnblock.id}/unblock`);
      setBlockedUsers(blockedUsers.filter((u) => u.id !== userToUnblock.id));
      showToast(`${userToUnblock.name} foi desbloqueado com sucesso!`, 'success');
      setConfirmUnblock(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao desbloquear viajante. Tente novamente.';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="settings-privacy-container">

      <div className="settings-header">
        <br></br>
        <h1><FaCog style={{marginRight:8}}/>Definições e Privacidade</h1>
        <p className="settings-description"><FaInfoCircle style={{marginRight:6}}/>Personalize a sua experiência, privacidade e segurança na Globe Memories.</p>
      </div>

      <div className="settings-navigation">
        <button
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Definições
        </button>
        <button
          className={`tab-button ${activeTab === 'terms' ? 'active' : ''}`}
          onClick={() => setActiveTab('terms')}
        >
          Privacidade
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'settings' ? (
          <div className="settings-section">
            <div className="setting-item">
              <FaGlobe className="setting-icon" />
              <div className="setting-details">
                <h3>Idioma</h3>
                <p>Escolha o idioma da aplicação. Em breve poderá alternar entre Português, Inglês e Espanhol.</p>
                <select 
                  className="language-select" 
                  value={settings.language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="pt">Português (PT)</option>
                  <option value="en" disabled>English (Em breve)</option>
                  <option value="es" disabled>Español (Em breve)</option>
                </select>
              </div>
            </div>

            <div className="setting-item">
              <FaBell className="setting-icon" />
              <div className="setting-details">
                <h3>Notificações</h3>
                <p>Gerir preferências de notificações recebidas por email e na app.</p>
                <div className="notification-options">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={settings.notifications.newTravels}
                      onChange={() => handleNotificationChange('newTravels')}
                      disabled={isLoading}
                    /> Novas viagens de viajantes que sigo
                  </label>
                  <label>
                    <input 
                      type="checkbox" 
                      checked={settings.notifications.comments}
                      onChange={() => handleNotificationChange('comments')}
                      disabled={isLoading}
                    /> Comentários nas minhas viagens
                  </label>
                  <label>
                    <input 
                      type="checkbox" 
                      checked={settings.notifications.followers}
                      onChange={() => handleNotificationChange('followers')}
                      disabled={isLoading}
                    /> Novos seguidores
                  </label>
                  <label>
                    <input 
                      type="checkbox" 
                      checked={settings.notifications.promotions}
                      onChange={() => handleNotificationChange('promotions')}
                      disabled={isLoading}
                    /> Sugestões de destinos e promoções
                  </label>
                </div>
              </div>
            </div>

            <div className="setting-item">
              <FaHistory className="setting-icon" />
              <div className="setting-details">
                <h3>Atividade da Conta</h3>
                <p>Visualize o histórico de sessões, dispositivos ligados e ações recentes.</p>
                <button
                  className="button"
                  onClick={handleOpenSessionsModal}
                  disabled={isLoading}
                >
                  Ver Histórico
                </button>
              </div>
            </div>

            <div className="setting-item">
              <FaSignOutAlt className="setting-icon" />
              <div className="setting-details">
                <h3>Terminar Sessão em Todos os Dispositivos</h3>
                <p>Por segurança, pode terminar sessão em todos os dispositivos onde está autenticado.</p>
                <button 
                  className="button"
                  onClick={handleLogoutAllDevices}
                  disabled={isLoading}
                >
                  {isLoading ? 'A processar...' : 'Terminar Sessão Globalmente'}
                </button>
              </div>
            </div>

            <div className="setting-item">
              <FaInfoCircle className="setting-icon" />
              <div className="setting-details">
                <h3>Ajuda e Suporte</h3>
                <p>Consulte as <a href="/help-support" style={{color:'#007bff'}}>perguntas frequentes</a> ou contacte o suporte para dúvidas sobre privacidade, segurança ou funcionalidades.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="privacy-section">
            <div className="setting-item">
              <FaUserShield className="setting-icon" />
              <div className="setting-details">
                <h3>Visibilidade do Perfil</h3>
                <p>Público: qualquer pessoa pode ver o seu perfil. Privado: apenas os seus seguidores podem ver.</p>
                <select
                  className="privacy-select"
                  value={settings.privacy.profileVisibility}
                  onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                  disabled={isLoading}
                >
                  <option value="public">Público</option>
                  <option value="private">Privado (apenas seguidores)</option>
                </select>
              </div>
            </div>

            <div className="setting-item">
              <FaInfoCircle className="setting-icon" />
              <div className="setting-details">
                <h3>Estatísticas do Perfil</h3>
                <p>
                  Controle quem pode ver as suas estatísticas de viagem. As estatísticas
                  gerais (viagens, países e cidades) e as estatísticas monetárias (gastos
                  e médias em €) são controladas de forma independente.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                      Estatísticas gerais
                    </label>
                    <select
                      className="privacy-select"
                      value={settings.privacy.showStatistics}
                      onChange={(e) => handlePrivacyChange('showStatistics', e.target.value)}
                      disabled={isLoading}
                      style={{ width: '100%' }}
                    >
                      <option value="all">Mostrar para Todos</option>
                      <option value="followers">Apenas Seguidores</option>
                      <option value="private">Apenas para Mim</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                      Estatísticas monetárias
                    </label>
                    <select
                      className="privacy-select"
                      value={settings.privacy.showMonetaryStatistics}
                      onChange={(e) => handlePrivacyChange('showMonetaryStatistics', e.target.value)}
                      disabled={isLoading}
                      style={{ width: '100%' }}
                    >
                      <option value="all">Mostrar para Todos</option>
                      <option value="followers">Apenas Seguidores</option>
                      <option value="private">Apenas para Mim</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="setting-item">
              <FaTrash className="setting-icon" />
              <div className="setting-details">
                <h3>Dados da Conta</h3>
                <p>Faça download dos seus dados ou elimine a sua conta permanentemente.</p>
                <div className="data-management-buttons">
                  <button 
                    className="button"
                    onClick={handleDownloadData}
                    disabled={isLoading}
                  >
                    {isLoading ? 'A preparar dados...' : 'Transferir Dados'}
                  </button>
                  <button 
                    className="danger-button"
                    onClick={handleDeleteAccount}
                    disabled={isLoading}
                  >
                    {isLoading ? 'A processar...' : 'Eliminar Conta'}
                  </button>
                </div>
              </div>
            </div>

            {/* Secção de Viajantes Bloqueados */}
            <div className="setting-item blocked-users-section" id="blocked-users" ref={blockedUsersRef}>
              <FaBan className="setting-icon" style={{color:'#e74c3c'}} />
              <div className="setting-details" style={{width:'100%'}}>
                <h3>Viajantes Bloqueados</h3>
                <p>Gira os viajantes que bloqueou. Pode desbloqueá-los a qualquer momento.</p>
                {loadingBlocked ? (
                  <div className="loading-spinner" style={{margin:'30px auto'}}></div>
                ) : blockedUsers.length === 0 ? (
                  <div className="no-blocked-users" style={{textAlign:'center',padding:'20px'}}>
                    <FaBan size={50} color="#ddd" style={{marginBottom:'10px'}} />
                    <div>Nenhum viajante bloqueado</div>
                  </div>
                ) : (
                  <div className="blocked-users-list">
                    {blockedUsers.map((blockedUser) => (
                      <div key={blockedUser.id} className="blocked-user-item" style={{display:'flex',alignItems:'center',marginBottom:'15px',background:'#fafbfc',borderRadius:'8px',padding:'10px 15px',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                        <div className="blocked-user-avatar" style={{width:'48px',height:'48px',borderRadius:'50%',overflow:'hidden',marginRight:'15px',position:'relative'}}>
                          <img
                            src={blockedUser.profilePicture || defaultAvatar}
                            alt={`${blockedUser.username}'s avatar`}
                            style={{width:'100%',height:'100%',objectFit:'cover',filter:'grayscale(100%)',opacity:'0.7'}}
                          />
                          <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',backgroundColor:'rgba(231,76,60,0.8)',borderRadius:'50%',padding:'3px'}}>
                            <FaBan size={12} color="white" />
                          </div>
                        </div>
                        <div className="blocked-user-info" style={{flex:1}}>
                          <div style={{fontWeight:600,color:'#333'}}>{blockedUser.name}</div>
                          <div style={{color:'#666',fontSize:'13px'}}>@{blockedUser.username}</div>
                          <div style={{color:'#999',fontSize:'12px',fontStyle:'italic'}}>Viajante bloqueado</div>
                        </div>
                        <div className="blocked-user-actions">
                          <button
                            onClick={() => handleUnblockUser(blockedUser)}
                            disabled={isLoading}
                            style={{
                              padding:'8px 16px',
                              backgroundColor: isLoading ? '#6c757d' : '#28a745',
                              color:'white',
                              border:'none',
                              borderRadius:'6px',
                              fontSize:'13px',
                              cursor: isLoading ? 'not-allowed' : 'pointer',
                              display:'flex',
                              alignItems:'center',
                              gap:'6px'
                            }}
                            onMouseEnter={e => !isLoading && (e.target.style.backgroundColor = '#218838')}
                            onMouseLeave={e => !isLoading && (e.target.style.backgroundColor = '#28a745')}
                          >
                            <FaUnlock size={12} /> {isLoading ? 'A processar...' : 'Desbloquear'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{marginTop:'18px',fontSize:'13px',color:'#888',textAlign:'center'}}>
                  Quando desbloqueia um viajante, este poderá voltar a ver o seu perfil e interagir consigo.
                </div>
              </div>
            </div>

            <div className="setting-item">
              <FaInfoCircle className="setting-icon" />
              <div className="setting-details">
                <h3>Dicas de Segurança</h3>
                <ul style={{margin:'8px 0 0 0',padding:'0 0 0 18px',color:'#666',fontSize:'14px'}}>
                  <li>Utilize uma palavra-passe forte e única.</li>
                  <li>Não partilhe dados pessoais sensíveis em público.</li>
                  <li>Bloqueie utilizadores abusivos ou suspeitos.</li>
                  <li>Consulte as <a href="/help-support" style={{color:'#007bff'}}>perguntas frequentes</a> para mais dicas.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Aba de Termos e Documentos */}
      {activeTab === 'terms' && (
        <div className="terms-documents-section">
          <div className="terms-container">
            <div className="document-card">
              <div className="document-header">
                <FaFileAlt className="document-icon" style={{color: '#008cba'}} />
                <div>
                  <h3>Termos e Condições</h3>
                  <p>Lê os termos e condições de uso do Globe Memories</p>
                </div>
              </div>
              <button 
                className="button"
                onClick={() => {
                  setTermsModalTab('terms');
                  setShowTermsModal(true);
                }}
              >
                Ver Termos Completos
              </button>
            </div>

            <div className="document-card">
              <div className="document-header">
                <FaLock className="document-icon" style={{color: '#28a745'}} />
                <div>
                  <h3>Política de Privacidade</h3>
                  <p>Entende como proteges os teus dados e privacidade</p>
                </div>
              </div>
              <button 
                className="button"
                onClick={() => {
                  setTermsModalTab('privacy');
                  setShowTermsModal(true);
                }}
              >
                Ver Política Completa
              </button>
            </div>

            
          </div>
        </div>
      )}

      {/* Modal de Termos */}
      <TermsModal 
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        initialTab={termsModalTab}
      />

      {/* Toast para feedback */}
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={closeToast}
      />

      {/* Modal de confirmação para desbloquear */}
      {confirmUnblock && (
        <div className="confirm-modal-overlay" onClick={() => !isLoading && setConfirmUnblock(null)}>
          <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Desbloquear viajante</h3>
            <p>
              Tens a certeza que queres desbloquear <strong>{confirmUnblock.name}</strong>{' '}
              (@{confirmUnblock.username})? Esta pessoa poderá voltar a ver o teu perfil e interagir contigo.
            </p>
            <div className="confirm-modal-actions">
              <button
                className="button button-secondary"
                onClick={() => setConfirmUnblock(null)}
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                className="button button-primary"
                onClick={confirmUnblockAction}
                disabled={isLoading}
              >
                {isLoading ? 'A processar...' : 'Desbloquear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de histórico de sessões */}
      {showSessionsModal && (
        <div className="confirm-modal-overlay" onClick={() => setShowSessionsModal(false)}>
          <div
            className="confirm-modal-content sessions-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sessions-modal-header">
              <h3>
                <FaShieldAlt style={{ marginRight: 8 }} />
                Sessões Ativas
              </h3>
              <button
                className="icon-close-button"
                onClick={() => setShowSessionsModal(false)}
                aria-label="Fechar"
              >
                <FaTimes />
              </button>
            </div>
            <p className="sessions-modal-subtitle">
              Estes são os dispositivos e sessões onde a sua conta está ativa.
              Pode terminar sessões individuais ou todas de uma vez.
            </p>

            {loadingSessions ? (
              <div className="loading-spinner" style={{ margin: '40px auto' }}></div>
            ) : sessions.length === 0 ? (
              <div className="no-sessions-message">
                Nenhuma sessão ativa encontrada.
              </div>
            ) : (
              <div className="sessions-list">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className={`session-item ${s.isCurrentSession ? 'is-current' : ''}`}
                  >
                    <div className="session-device-icon">
                      {renderDeviceIcon(s.deviceType)}
                    </div>
                    <div className="session-info">
                      <div className="session-device-name">
                        {s.deviceName || s.deviceType || 'Dispositivo desconhecido'}
                        {s.isCurrentSession && (
                          <span className="current-session-badge">Esta sessão</span>
                        )}
                      </div>
                      <div className="session-meta">
                        <span>{s.deviceType || '—'}</span>
                        {s.ipAddress && <span> · IP: {s.ipAddress}</span>}
                      </div>
                      <div className="session-meta-light">
                        Início de sessão: {formatDateTime(s.createdAt)}
                      </div>
                      <div className="session-meta-light">
                        Última atividade: {formatDateTime(s.lastActivity)}
                      </div>
                      {s.expiresAt && (
                        <div className="session-meta-light">
                          Expira: {formatDateTime(s.expiresAt)}
                        </div>
                      )}
                    </div>
                    <div className="session-action">
                      {s.isCurrentSession ? (
                        <span className="session-current-label">Atual</span>
                      ) : (
                        <button
                          className="button button-secondary session-close-button"
                          onClick={() => handleCloseSession(s)}
                          disabled={closingSessionId === s.id}
                        >
                          {closingSessionId === s.id ? 'A terminar...' : 'Terminar'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="sessions-modal-footer">
              <button
                className="button button-secondary"
                onClick={() => setShowSessionsModal(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação para terminar sessão em TODOS os dispositivos */}
      {showLogoutAllModal && (
        <div className="confirm-modal-overlay" onClick={() => setShowLogoutAllModal(false)}>
          <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Terminar sessão em todos os dispositivos</h3>
            <p>
              Tens a certeza que queres terminar a sessão <strong>neste e em todos os outros dispositivos</strong>?
              Terás de iniciar sessão novamente.
            </p>
            <div className="confirm-modal-actions">
              <button
                className="button button-secondary"
                onClick={() => setShowLogoutAllModal(false)}
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                className="button button-primary"
                onClick={confirmLogoutAll}
                disabled={isLoading}
              >
                {isLoading ? 'A terminar...' : 'Terminar tudo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsAndPrivacy;