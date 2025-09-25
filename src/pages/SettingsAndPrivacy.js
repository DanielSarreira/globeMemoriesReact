

import React, { useState, useEffect, useRef } from 'react';
import { FaGlobe, FaLock, FaBell, FaUserShield, FaHistory, FaSignOutAlt, FaTrash, FaBan, FaUnlock, FaInfoCircle, FaCog } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import '../styles/pages/SettingsAndPrivacy.css';
import defaultAvatar from '../images/assets/avatar1.jpg';


const SettingsAndPrivacy = () => {
  const [activeTab, setActiveTab] = useState('settings');
  const { user } = useAuth();


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

  const handleUnblockUser = (userToUnblock) => {
    setBlockedUsers(blockedUsers.filter(blockedUser => blockedUser.username !== userToUnblock.username));
  };

  if (!user) {
    return null;
  }

  return (
    <div className="settings-privacy-container">

      <div className="settings-header">
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
                <select className="language-select" defaultValue="pt">
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
                    <input type="checkbox" defaultChecked /> Novas viagens de viajantes que sigo
                  </label>
                  <label>
                    <input type="checkbox" defaultChecked /> Comentários nas minhas viagens
                  </label>
                  <label>
                    <input type="checkbox" defaultChecked /> Novos seguidores
                  </label>
                  <label>
                    <input type="checkbox" /> Sugestões de destinos e promoções
                  </label>
                </div>
              </div>
            </div>

            <div className="setting-item">
              <FaHistory className="setting-icon" />
              <div className="setting-details">
                <h3>Atividade da Conta</h3>
                <p>Visualize o histórico de sessões, dispositivos ligados e ações recentes.</p>
                <button className="secondary-button">Ver Histórico</button>
              </div>
            </div>

            <div className="setting-item">
              <FaSignOutAlt className="setting-icon" />
              <div className="setting-details">
                <h3>Terminar Sessão em Todos os Dispositivos</h3>
                <p>Por segurança, pode terminar sessão em todos os dispositivos onde está autenticado.</p>
                <button className="secondary-button">Terminar Sessão Globalmente</button>
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
                <select className="privacy-select" defaultValue="followers">
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
                <select className="privacy-select" defaultValue="followers">
                  <option value="public">Público</option>
                  <option value="followers">Apenas Seguidores</option>
                  <option value="private">Privado</option>
                </select>
              </div>
            </div>

            <div className="setting-item">
              <FaTrash className="setting-icon" />
              <div className="setting-details">
                <h3>Dados da Conta</h3>
                <p>Faça download dos seus dados ou elimine a sua conta permanentemente.</p>
                <div className="data-management-buttons">
                  <button className="secondary-button">Transferir Dados</button>
                  <button className="danger-button">Eliminar Conta</button>
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
                            style={{padding:'8px 16px',backgroundColor:'#28a745',color:'white',border:'none',borderRadius:'6px',fontSize:'13px',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px'}}
                            onMouseEnter={e => e.target.style.backgroundColor = '#218838'}
                            onMouseLeave={e => e.target.style.backgroundColor = '#28a745'}
                          >
                            <FaUnlock size={12} /> Desbloquear
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
    </div>
  );
};

export default SettingsAndPrivacy;