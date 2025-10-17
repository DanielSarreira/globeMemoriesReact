

import React, { useState, useEffect, useRef } from 'react';
import { FaGlobe, FaLock, FaBell, FaUserShield, FaHistory, FaSignOutAlt, FaTrash, FaBan, FaUnlock, FaInfoCircle, FaCog } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import '../styles/pages/SettingsAndPrivacy.css';
import defaultAvatar from '../images/assets/avatar1.jpg';


const SettingsAndPrivacy = () => {
  const [activeTab, setActiveTab] = useState('settings');
  const { user } = useAuth();
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    language: 'pt',
    notifications: {
      newTravels: true,
      comments: true,
      followers: true,
      promotions: false
    },
    privacy: {
      profileVisibility: 'followers',
      travelVisibility: 'followers',
      showStatistics: 'all'
    }
  });


  // Mock data for blocked users - in real app this would come from backend
  const mockUsers = [
    { id: 1, username: 'tiago', name: 'Tiago', profilePicture: 'https://randomuser.me/api/portraits/men/1.jpg', bio: 'Amante de viagens e fotografia!' },
    { id: 2, username: 'AnaSilva', name: 'Ana Silva', profilePicture: 'https://randomuser.me/api/portraits/women/2.jpg', bio: 'Exploradora de montanhas.' },
    { id: 3, username: 'PedroCosta', name: 'Pedro Costa', profilePicture: 'https://randomuser.me/api/portraits/men/3.jpg', bio: 'Apaixonado por culturas.' },
    { id: 4, username: 'SofiaRamos', name: 'Sofia Ramos', profilePicture: 'https://randomuser.me/api/portraits/women/4.jpg', bio: 'Viajante urbana e foodie.' },
    { id: 5, username: 'JoaoPereira', name: 'João Pereira', profilePicture: 'https://randomuser.me/api/portraits/men/5.jpg', bio: 'A aventura é o meu lema!' },
  ];

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
    if (!user) {
      setLoadingBlocked(false);
      return;
    }
    setTimeout(() => {
      setBlockedUsers(mockUsers.slice(0, 2));
      setLoadingBlocked(false);
    }, 500);
  }, [user]);

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
      setSettings(prev => ({
        ...prev,
        privacy: {
          ...prev.privacy,
          [type]: value
        }
      }));
      // Simulação de chamada à API
      await new Promise(resolve => setTimeout(resolve, 500));
      showToast('Definições de privacidade atualizadas!', 'success');
    } catch (error) {
      showToast('Erro ao atualizar privacidade. Tente novamente.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!window.confirm('Tem a certeza que deseja terminar sessão em todos os dispositivos?')) return;
    
    setIsLoading(true);
    try {
      // Simulação de chamada à API
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast('Sessão terminada em todos os dispositivos!', 'success');
    } catch (error) {
      showToast('Erro ao terminar sessões. Tente novamente.', 'error');
    } finally {
      setIsLoading(false);
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

  const handleUnblockUser = async (userToUnblock) => {
    setIsLoading(true);
    try {
      setBlockedUsers(blockedUsers.filter(blockedUser => blockedUser.username !== userToUnblock.username));
      // Simulação de chamada à API
      await new Promise(resolve => setTimeout(resolve, 500));
      showToast(`${userToUnblock.name} foi desbloqueado com sucesso!`, 'success');
    } catch (error) {
      showToast('Erro ao desbloquear viajante. Tente novamente.', 'error');
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
          className={`tab-button ${activeTab === 'privacy' ? 'active' : ''}`}
          onClick={() => setActiveTab('privacy')}
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
                  onClick={() => showToast('Funcionalidade em desenvolvimento. Em breve disponível!', 'info')}
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
                <p>Controlar quem pode ver o seu perfil e as suas viagens.</p>
                <select 
                  className="privacy-select" 
                  value={settings.privacy.profileVisibility}
                  onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                  disabled={isLoading}
                >
                  <option value="public">Público</option>
                  <option value="followers">Apenas Seguidores</option>
                  <option value="private">Privado</option>
                </select>
              </div>
            </div>

            <div className="setting-item">
              <FaLock className="setting-icon" />
              <div className="setting-details">
                <h3>Privacidade das Viagens</h3>
                <p>Defina a visibilidade padrão das suas viagens e memórias partilhadas.</p>
                <select 
                  className="privacy-select" 
                  value={settings.privacy.travelVisibility}
                  onChange={(e) => handlePrivacyChange('travelVisibility', e.target.value)}
                  disabled={isLoading}
                >
                  <option value="public">Público</option>
                  <option value="followers">Apenas Seguidores</option>
                  <option value="private">Privado</option>
                </select>
              </div>
            </div>

            <div className="setting-item">
              <FaInfoCircle className="setting-icon" />
              <div className="setting-details">
                <h3>Estatísticas do Perfil</h3>
                <p>Controle quem pode ver as suas estatísticas de viagem (número de viagens, países visitados, etc.).</p>
                <select 
                  className="privacy-select" 
                  value={settings.privacy.showStatistics}
                  onChange={(e) => handlePrivacyChange('showStatistics', e.target.value)}
                  disabled={isLoading}
                >
                  <option value="all">Mostrar para Todos</option>
                  <option value="followers">Apenas Seguidores</option>
                  <option value="private">Apenas para Mim</option>
                  <option value="hidden">Ocultar Completamente</option>
                </select>
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

export default SettingsAndPrivacy;