import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Login.css'; // Arquivo de estilo

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aqui você pode adicionar a lógica de login, como verificação de usuário
    console.log('Usuário:', formData.username, 'Senha:', formData.password);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Entrar na sua conta</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Utilizador</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Insira o seu utilizador"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Insira a sua password"
              required
            />
          </div>

          <button type="submit" className="login-button">Entrar</button>

          <p>Não tem uma conta? <Link to="/register">Registre-se</Link></p>
        </form>
      </div>
    </div>
  );
};

export default Login;
