import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request, setAuthHeader } from '../axios_helper';
import { useAuth } from '../context/AuthContext'
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import '../styles/styles.css';
import logo from '../images/register.jpg';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nationality: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { setUser } = useAuth();

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

    onRegister(e, formData.firstName, formData.lastName, formData.nationality, formData.email, formData.username, formData.password);

  };

  const onRegister = (event, firstName, lastName, nationality, email, username, password) => {
    event.preventDefault();
    request(
        "POST",
        "/register",
        {
            firstName: firstName,
            lastName: lastName,
            nationality: nationality,
            email: email,
            username: username,
            password: password
        }).then(
        (response) => {
            setAuthHeader(response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data));
            setUser(response.data);
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
              <label>Primeiro Nome</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Insira o seu Nome"
                required
              />
            </div>

            <div className="form-group">
              <label>Último Nome</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Insira o seu Apelido"
                required
              />
            </div>

            <div className="form-group">
              <label>País</label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                placeholder="Insira o seu País"
                required
              />
            </div>

            <div className="form-group">
              <label>Nome de Utilizador</label>
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
