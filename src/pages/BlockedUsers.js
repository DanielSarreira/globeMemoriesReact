import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import defaultAvatar from '../images/assets/avatar.jpg';
// ...existing code...
import { FaBan, FaUnlock } from 'react-icons/fa';

const BlockedUsers = () => {
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data for blocked users - in real app this would come from backend
  const mockUsers = [
    { id: 1, username: 'tiago', name: 'Tiago', profilePicture: 'https://randomuser.me/api/portraits/men/1.jpg', bio: 'Amante de viagens e fotografia!' },
    { id: 2, username: 'AnaSilva', name: 'Ana Silva', profilePicture: 'https://randomuser.me/api/portraits/women/2.jpg', bio: 'Exploradora de montanhas.' },
    { id: 3, username: 'PedroCosta', name: 'Pedro Costa', profilePicture: 'https://randomuser.me/api/portraits/men/3.jpg', bio: 'Apaixonado por culturas.' },
    { id: 4, username: 'SofiaRamos', name: 'Sofia Ramos', profilePicture: 'https://randomuser.me/api/portraits/women/4.jpg', bio: 'Viajante urbana e foodie.' },
    { id: 5, username: 'JoaoPereira', name: 'João Pereira', profilePicture: 'https://randomuser.me/api/portraits/men/5.jpg', bio: 'A aventura é o meu lema!' },
  ];

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Simulate loading blocked users - in real app this would be an API call
    setTimeout(() => {
      // For demo purposes, let's say the first 2 users are blocked
      const blockedUsersList = mockUsers.slice(0, 2);
      setBlockedUsers(blockedUsersList);
      setLoading(false);
    }, 1000);
  }, [user]);

  const handleUnblockUser = (userToUnblock) => {
    setBlockedUsers(blockedUsers.filter(blockedUser => blockedUser.username !== userToUnblock.username));
  };

  if (!user) {
    return (
      <div className="blocked-users-page">
        <div className="auth-required" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          padding: '40px 20px'
        }}>
          <h2>Acesso Restrito</h2>
          <p>Inicie sessão para ver os viajantes que bloqueou.</p>
          <Link to="/login" style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            marginTop: '20px'
          }}>
            Fazer Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="blocked-users-page">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="blocked-users-page" style={{ padding: '20px', marginTop: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <header className="page-header" style={{ marginBottom: '30px',marginTop: '40px', textAlign: 'center', backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h1 style={{ color: '#333', marginBottom: '10px' }}>
          <FaBan style={{ marginRight: '10px', color: '#e74c3c' }} />
          Viajantes Bloqueados
        </h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
        Gere os viajantes que bloqueou. Pode desbloqueá-los a qualquer momento.
        </p>
      </header>

      {blockedUsers.length === 0 ? (
        <div className="no-blocked-users" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '40vh',
          textAlign: 'center',
          padding: '40px 20px'
        }}>
          <FaBan size={80} color="#ddd" style={{ marginBottom: '20px' }} />
          <h3 style={{ color: '#666', marginBottom: '10px' }}>Nenhum viajante bloqueado</h3>
          <p style={{ color: '#999' }}>
            Não bloqueou nenhum viajante ainda.
          </p>
        </div>
      ) : (
        <div className="blocked-users-list">
          {blockedUsers.map((blockedUser) => (
            <div key={blockedUser.id} className="blocked-user-item" style={{
              display: 'flex',
              alignItems: 'center',
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: '15px',
              border: '1px solid #eee'
            }}>
              <div className="blocked-user-avatar" style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                overflow: 'hidden',
                marginRight: '15px',
                position: 'relative'
              }}>
                <img
                  src={blockedUser.profilePicture || defaultAvatar}
                  alt={`${blockedUser.username}'s avatar`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'grayscale(100%)',
                    opacity: '0.6'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: 'rgba(231, 76, 60, 0.8)',
                  borderRadius: '50%',
                  padding: '5px'
                }}>
                  <FaBan size={16} color="white" />
                </div>
              </div>

              <div className="blocked-user-info" style={{ flex: 1 }}>
                <h3 style={{ 
                  margin: '0 0 5px 0', 
                  color: '#333',
                  fontSize: '18px',
                  fontWeight: '600'
                }}>
                  {blockedUser.name}
                </h3>
                <p style={{ 
                  margin: '0 0 5px 0', 
                  color: '#666',
                  fontSize: '14px'
                }}>
                  @{blockedUser.username}
                </p>
                <p style={{ 
                  margin: '0', 
                  color: '#999',
                  fontSize: '13px',
                  fontStyle: 'italic'
                }}>
                  Viajante bloqueado
                </p>
              </div>

              <div className="blocked-user-actions">
                <button
                  onClick={() => handleUnblockUser(blockedUser)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
                >
                  <FaUnlock size={14} />
                  Desbloquear
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="page-footer" style={{
        marginTop: '40px',
        textAlign: 'center',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <p style={{ color: '#666', margin: '0', fontSize: '14px' }}>
        Quando desbloqueia um viajante, este poderá voltar a ver o seu perfil e interagir consigo.
        </p>
      </div>
    </div>
  );
};

export default BlockedUsers;
