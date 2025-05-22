import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/styles.css';
import defaultAvatar from '../images/assets/avatar1.jpg'; // Imagem de avatar padrão

const Profile = () => {
  const [editing, setEditing] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    bio: '',
    country: '',
    city: '',
    gender: '',
    birthday: '',
    profilePicture: '',
    privacy: 'public', // Valor padrão
  });
  const { user, setUser } = useAuth();

  // Estados para o sistema de seguidores
  const [followersCount, setFollowersCount] = useState(0); // Simula número de seguidores
  const [followingCount, setFollowingCount] = useState(0); // Número de seguindo

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleEditToggle = (e) => {
    e.preventDefault(); // Previne o comportamento padrão do botão
    setEditing(!editing);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Aqui você deve substituir pela URL correta do seu backend
      const response = await axios.put('https://your-backend-api.com/user/profile', formData, {
        headers: {
          'Content-Type': 'application/json',
          // Se necessário, adicione o token de autenticação
          // 'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.status === 200) {
        setSaveSuccess(true);
        setUser({ ...user, ...formData });
        setEditing(false);
        
        // Feedback visual temporário
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Erro ao guardar os dados:', error);
      setSaveError(
        error.response?.data?.message || 
        'Ocorreu um erro ao guardar os dados. Por favor, tente novamente.'
      );
      setErrorVisible(true);
      // Limpar a mensagem de erro após 5 segundos
      setTimeout(() => {
        setErrorVisible(false);
        // Aguardar a transição terminar antes de limpar a mensagem
        setTimeout(() => {
          setSaveError(null);
        }, 300);
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageLoad = (e) => {
    const img = e.target;
    const container = containerRef.current;
    if (img && container) {
      const scale = Math.max(container.offsetWidth / img.naturalWidth, container.offsetHeight / img.naturalHeight);
      setImageScale(scale);
    }
  };

  const handleMouseDown = (e) => {
    if (!editing) return;
    e.preventDefault(); // Previne o comportamento padrão
    setIsDragging(true);
    setDragStart({
      x: e.clientX - imagePosition.x,
      y: e.clientY - imagePosition.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !editing) return;
    e.preventDefault(); // Previne o comportamento padrão
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setImagePosition({ x: newX, y: newY });
  };

  const handleMouseUp = (e) => {
    if (!editing) return;
    e.preventDefault(); // Previne o comportamento padrão
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (!editing) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setImageScale(prevScale => Math.max(0.5, Math.min(2, prevScale + delta)));
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('https://your-backend-api.com/user/profile');
        if (response.status === 200) {
          setFormData(response.data);
          // Simulação de dados de seguidores até o backend estar pronto
          setFollowersCount(10); // Mock
          setFollowingCount(5); // Mock
        } else {
          console.error('Erro ao buscar os dados do perfil.');
        }
      } catch (error) {
        console.error('Erro na comunicação com o servidor:', error);
      }
    };

    fetchProfile();
  }, []);

  // Novo useEffect para atualizar formData quando o usuário mudar
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.email || '',
        password: '',
        bio: user.bio || '',
        country: user.nationality || '',
        city: user.city || '',
        gender: user.gender || '',
        birthday: user.birthDate || '',
        profilePicture: user.profilePicture || '',
        privacy: user.privacy || 'public'
      });
    }
  }, [user]);

  useEffect(() => {
    if (editing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [editing, isDragging]);

  return (
    <div className="profile-page">
      <div className="profile-container">
        {user ? (
          <>
            <form className="profile-form" onSubmit={handleSave}>
              <div className="button-group">
                {editing ? (
                  <>
                    <button 
                      type="submit" 
                      className="save-button"
                      disabled={isSaving}
                    >
                      {isSaving ? 'A Guardar...' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={handleEditToggle}
                      disabled={isSaving}
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="edit-button"
                    onClick={handleEditToggle}
                  >
                    Editar Perfil
                  </button>
                )}
              </div>

              {saveError && (
                <div className="error-message" style={{
                  color: 'red',
                  margin: '10px 0',
                  padding: '10px',
                  backgroundColor: '#ffebee',
                  borderRadius: '4px',
                  textAlign: 'center',
                  opacity: errorVisible ? 1 : 0,
                  transition: 'opacity 0.3s ease-in-out'
                }}>
                  {saveError}
                </div>
              )}

              {saveSuccess && (
                <div className="success-message" style={{
                  color: 'green',
                  margin: '10px 0',
                  padding: '10px',
                  backgroundColor: '#e8f5e9',
                  borderRadius: '4px',
                  textAlign: 'center'
                }}>
                  Dados salvos com sucesso!
                </div>
              )}

              <div className="form-section">
                {/* Informações Complementares (lado esquerdo) */}
                <div className="form-left">
                  <div 
                    className="profile-picture-containerEdit"
                    ref={containerRef}
                    style={{
                      position: 'relative',
                      width: '100%',
                      textAlign: 'center',
                      marginBottom: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <div
                      className="profile-picture-wrapper"
                      style={{
                        position: 'relative',
                        width: '100px',
                        height: '100px',
                        overflow: 'hidden',
                        borderRadius: '50%',
                        border: '4px solid var(--primary-color)',
                        boxShadow: '0 0 10px rgba(0, 123, 255, 0.3)',
                        cursor: editing ? 'move' : 'default'
                      }}
                    >
                      <img
                        ref={imageRef}
                        src={formData.profilePicture || defaultAvatar}
                        alt="Foto de perfil"
                        className="profile-picture-edit"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transform: `scale(${imageScale}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                          transition: isDragging ? 'none' : 'transform 0.1s ease',
                          cursor: editing ? 'move' : 'default',
                          userSelect: 'none',
                          WebkitUserDrag: 'none',
                          MozUserSelect: 'none',
                          msUserSelect: 'none',
                          WebkitUserSelect: 'none',
                          userDrag: 'none'
                        }}
                        onLoad={handleImageLoad}
                        onMouseDown={handleMouseDown}
                        onWheel={handleWheel}
                        draggable="false"
                      />
                    </div>
                    {editing && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px',
                        marginTop: '10px'
                      }}>
                        <input
                          type="file"
                          name="profilePicture"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setFormData((prevData) => ({
                                ...prevData,
                                profilePicture: URL.createObjectURL(file),
                              }));
                              setImageScale(1);
                              setImagePosition({ x: 0, y: 0 });
                            }
                          }}
                        />
                        <div style={{
                          display: 'flex',
                          gap: '10px',
                          marginTop: '5px'
                        }}>
                          <button
                            type="button"
                            onClick={() => setImageScale(prev => Math.max(0.5, prev - 0.1))}
                            style={{
                              backgroundColor: 'var(--primary-color)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '30px',
                              height: '30px',
                              fontSize: '18px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'background-color 0.3s ease, transform 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.backgroundColor = 'var(--button-primary-hover)';
                              e.target.style.transform = 'scale(1.1)';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.backgroundColor = 'var(--primary-color)';
                              e.target.style.transform = 'scale(1)';
                            }}
                            onMouseDown={(e) => {
                              e.target.style.transform = 'scale(0.95)';
                            }}
                            onMouseUp={(e) => {
                              e.target.style.transform = 'scale(1.1)';
                            }}
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageScale(prev => Math.min(2, prev + 0.1))}
                            style={{
                              backgroundColor: 'var(--primary-color)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '30px',
                              height: '30px',
                              fontSize: '18px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'background-color 0.3s ease, transform 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.backgroundColor = 'var(--button-primary-hover)';
                              e.target.style.transform = 'scale(1.1)';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.backgroundColor = 'var(--primary-color)';
                              e.target.style.transform = 'scale(1)';
                            }}
                            onMouseDown={(e) => {
                              e.target.style.transform = 'scale(0.95)';
                            }}
                            onMouseUp={(e) => {
                              e.target.style.transform = 'scale(1.1)';
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
<br></br>
                  {/* Contadores de seguidores */}
                  <div className="followers-section">
                    <span>{followersCount} Seguidores</span> |{' '}
                    <span>{followingCount} Seguindo</span>
                  </div>

                  {/* Removido o botão "Seguir" porque este é o perfil do usuário logado */}

                  <div className="form-group">
                    <div className="form-group-LeftPosition">
                      <label>Primeiro Nome:</label>
                      {editing ? (
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                        />
                      ) : (
                        <p>{user.firstName}</p>
                      )}
                    </div>
                    <div className="form-group-RightPosition">
                      <label>Último Nome:</label>
                      {editing ? (
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                        />
                      ) : (
                        <p>{user.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Sobre Mim:</label>
                    {editing ? (
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p>{user.bio}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <div className="form-group-LeftPosition">
                      <label>País:</label>
                      {editing ? (
                        <input
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                        />
                      ) : (
                        <p>{user.nationality}</p>
                      )}
                    </div>
                    <div className="form-group-RightPosition">
                      <label>Cidade:</label>
                      {editing ? (
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                        />
                      ) : (
                        <p>{user.city}</p>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="form-group-LeftPosition">
                      <label>Sexo:</label>
                      {editing ? (
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                        >
                          <option value="">Selecione</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Feminino">Feminino</option>
                          <option value="Outro">Outro</option>
                        </select>
                      ) : (
                        <p>{user.gender}</p>
                      )}
                    </div>
                    <div className="form-group-RightPosition">
                      <label>Aniversário:</label>
                      {editing ? (
                        <input
                          type="date"
                          name="birthday"
                          value={formData.birthday}
                          onChange={handleInputChange}
                        />
                      ) : (
                        <p>{user.birthDate}</p>
                      )}
                    </div>
                  </div>

                 
                </div>

                {/* Informações Obrigatórias (lado direito) */}
                <div className="form-right">
                  <h3>Informações Obrigatórias</h3>
                  <div className="form-group">
                    <label>Username:</label>
                    {editing ? (
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p>{user.username}</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Email:</label>
                    {editing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p>{user.email}</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label>{editing ? 'Alterar Palavra-Passe:' : 'Palavra-Passe:'}</label>
                    {editing ? (
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p>********</p>
                    )}
                  </div>
                  {editing && (
                    <div className="form-group">
                      <label>Confirmar Palavra-Passe</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                      />
                    </div>
                  )}
                   {/* Privacidade do perfil */}
                   <div className="form-group">
                    <label>Privacidade do Perfil:</label>
                    {editing ? (
                      <select
                        name="privacy"
                        value={formData.privacy}
                        onChange={handleInputChange}
                      >
                        <option value="public">Público</option>
                        <option value="private">Privado</option>
                      </select>
                    ) : (
                      <p>{formData.privacy === 'public' ? 'Público' : 'Privado'}</p>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default Profile;