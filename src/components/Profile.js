import React, { useState } from 'react';
import '../styles/Profile.css';

const Profile = () => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Teste',
    email: 'tiago@example.com',
    password: '********',
    phone: '912345678',
    address: 'Rua das Flores, 123',
    bio: 'Desenvolvedor apaixonado por tecnologia e ',
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

  const handleSave = () => {
    // Simula envio para backend
    console.log('Dados salvos:', formData);
    setEditing(false);
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h2>Perfil do Usuário</h2>
        <form className="profile-form">
          <div className="form-group">
            <label>Nome</label>
            {editing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
            ) : (
              <p>{formData.name}</p>
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
            <label>Senha</label>
            {editing ? (
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
              />
            ) : (
              <p>{formData.password}</p>
            )}
          </div>

          <div className="form-group">
            <label>Telefone</label>
            {editing ? (
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            ) : (
              <p>{formData.phone}</p>
            )}
          </div>

          <div className="form-group">
            <label>Endereço</label>
            {editing ? (
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
              />
            ) : (
              <p>{formData.address}</p>
            )}
          </div>

          <div className="form-group">
            <label>Biografia</label>
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

          <div className="button-group">
            {editing ? (
              <>
                <button
                  type="button"
                  className="save-button"
                  onClick={handleSave}
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
