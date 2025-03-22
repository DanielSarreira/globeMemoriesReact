import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/styles.css';
import defaultAvatar from '../images/assets/avatar1.jpg'; // Imagem de avatar padrão

const Profile = () => {
  const [editing, setEditing] = useState(false);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleEditToggle = () => {
    setEditing(!editing);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put('https://your-backend-api.com/user/profile', formData);
      if (response.status === 200) {
        console.log('Dados salvos com sucesso!');
        setUser({ ...user, ...formData }); // Atualiza o contexto com os novos dados
        setEditing(false);
      } else {
        console.error('Erro ao salvar os dados.');
      }
    } catch (error) {
      console.error('Erro na comunicação com o servidor:', error);
    }
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

  return (
    <div className="profile-page">
      <div className="profile-container">
        {user ? (
          <>
            <form className="profile-form" onSubmit={handleSave}>
              <div className="form-section">
                {/* Informações Complementares (lado esquerdo) */}
                <div className="form-left">
                  <div className="profile-picture-container">
                    <img
                      src={formData.profilePicture || defaultAvatar}
                      alt="Foto de perfil"
                      className="profile-picture"
                    />
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
                        }
                      }}
                    />
                  </div>

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
                    <label>Palavra-Passe:</label>
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

              {/* Botões de ação */}
              <div className="button-group">
                {editing ? (
                  <>
                    <button type="submit" className="save-button">
                      Salvar
                    </button>
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={handleEditToggle}
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
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default Profile;