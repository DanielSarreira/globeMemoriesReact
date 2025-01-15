import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Profile.css';
import defaultAvatar from '../images/assets/avatar.jpg'; // Imagem de avatar padrão

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
    profilePicture: '', // Campo para foto de perfil
  });

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
    e.preventDefault(); // Previne o envio do formulário
    try {
      const response = await axios.put('https://your-backend-api.com/user/profile', formData);
      if (response.status === 200) {
        console.log('Dados salvos com sucesso!');
        setEditing(false); // Desativa o modo de edição após salvar
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
        <form className="profile-form" onSubmit={handleSave}>
          {/* Foto de perfil */}
          <h2>O meu Perfil</h2>
          <div className="profile-picture-container">
            <img
              src={formData.profilePicture || defaultAvatar} // Verifica se a foto de perfil existe
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
                    profilePicture: URL.createObjectURL(file), // Mostra a imagem selecionada
                  }));
                }
              }}
            />
          </div>

          {/* Seção de Informações Obrigatórias e Complementares */}
          <div className="form-section">
            {/* Informações Obrigatórias (lado esquerdo) */}
            <div className="form-left">
              <h3>Informações Obrigatórias</h3>
              <div className="form-group">
                <label>Primeiro Nome</label>
                {editing ? (
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p>{formData.firstName}</p>
                )}
              </div>

              <div className="form-group">
                <label>Último Nome</label>
                {editing ? (
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p>{formData.lastName}</p>
                )}
              </div>

              <div className="form-group">
                <label>Username</label>
                {editing ? (
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p>{formData.username}</p>
                )}
              </div>

              <div className="form-group">
                <label>Email</label>
                {editing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p>{formData.email}</p>
                )}
              </div>

              <div className="form-group">
                <label>Palavra-Passe</label>
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
            </div>

            {/* Informações Complementares (lado direito) */}
            <div className="form-right">
              <h3>Informações Complementares</h3>
              <div className="form-group">
                <label>Sobre Mim</label>
                {editing ? (
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p>{formData.bio}</p>
                )}
              </div>

              <div className="form-group">
                <label>País</label>
                {editing ? (
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p>{formData.country}</p>
                )}
              </div>

              <div className="form-group">
                <label>Cidade</label>
                {editing ? (
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p>{formData.city}</p>
                )}
              </div>

              <div className="form-group">
                <label>Sexo</label>
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
                  <p>{formData.gender}</p>
                )}
              </div>

              <div className="form-group">
                <label>Aniversário</label>
                {editing ? (
                  <input
                    type="date"
                    name="birthday"
                    value={formData.birthday}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p>{formData.birthday}</p>
                )}
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="button-group">
            {editing ? (
              <>
                <button
                  type="submit"
                  className="save-button"
                >
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
      </div>
    </div>
  );
};

export default Profile;
