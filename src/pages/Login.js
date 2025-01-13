import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request, setAuthHeader } from '../axios_helper';
import '../styles/Login.css'; // Arquivo de estilo

const Login = () => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target; // Extract name and value from the event
    if (name === "login") setLogin(value); // Update login state if name is username
    if (name === "password") setPassword(value); // Update password state if name is password
  };

  // Submit login
  const onSubmitLogin = (e) => {
    onLogin(e, login, password);
  };

  const onLogin = (e, username, password) => {
    e.preventDefault();
    request(
      "POST",
      "/login",
      {
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
        console.log(error)
      }
    );
  };

  /*onSubmitRegister = (e) => {
      this.state.onRegister(e, this.state.firstName, this.state.lastName, this.state.login, this.state.password);
  };*/

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Entrar na sua conta</h2>
        <form onSubmit={onSubmitLogin} className="login-form">
          <div className="form-group">
            <label>Utilizador</label>
            <input
              type="login" 
              id="loginName" 
              name="login" 
              placeholder="Insira o seu utilizador"
              value={login}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password" 
              id="loginPassword" 
              name="password" 
              placeholder="Insira a sua password"
              value={password}
              onChange={handleInputChange}
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
