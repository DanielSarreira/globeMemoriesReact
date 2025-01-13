import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request, setAuthHeader } from '../axios_helper';
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import '../styles/Register.css'; // Ficheiro CSS
import logo from '../images/register.jpg';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validação de email
    if (!formData.email.includes('@')) {
      setErrorMessage('Por favor, insira um email válido com "@".');
      setSuccessMessage('');
      return;
    }

    // Verificação de passwords
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('As palavras-passe não coincidem.');
      setSuccessMessage('');
      return;
    }

    onRegister(e, formData.name, formData.email, formData.username, formData.password);

  };

  const onRegister = (event, firstName, email, username, password) => {
    event.preventDefault();
    request(
        "POST",
        "/register",
        {
            firstName: firstName,
            lastName: email,
            login: username,
            password: password
        }).then(
        (response) => {
            setAuthHeader(response.data.token);
            console.log(response);
            navigate("/");
        }).catch(
        (error) => {
            setAuthHeader(null);
            console.log(error);
        }
    );
  };

  return (
    <div className="register-page">
      <div className="register-right">
        <div className="register-container">
          <h2>Crie a sua conta</h2>
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label>Nome</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Insira o seu nome"
                required
              />
            </div>

            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Escolha um nome de utilizador"
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Insira o seu email"
                required
              />
            </div>

            <div className="form-group">
              <label>Palavra-passe</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Insira a sua palavra-passe"
                required
              />
            </div>

            <div className="form-group">
              <label>Confirmar Palavra-passe</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirme a sua palavra-passe"
                required
              />
            </div>

            {errorMessage && (
              <div className="error-message">
                <FaExclamationCircle /> {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="success-message">
                <FaCheckCircle /> {successMessage}
              </div>
            )}

            <button type="submit" className="register-button">Registar</button>
          </form>

          <p>Já tem uma conta? <Link to="/login">Iniciar Sessão</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
