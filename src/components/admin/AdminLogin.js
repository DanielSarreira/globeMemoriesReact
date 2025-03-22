// src/components/admin/AdminLogin.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Admin.css';
import logo from '../../images/Globe-Memories.png'; // Importar o logotipo

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulação de login (substituir pelo axios.post quando o backend estiver pronto)
    if (email === 'admin@globememories.com' && password === 'admin123') {
      localStorage.setItem('adminToken', 'mock-token');
      navigate('/admin');
    } else {
      alert('Credenciais inválidas');
    }
  };

  return (
    <div className="admin-login-admin">
      
        <img src={logo} alt="Globe Memories Logo" className="sidebar-logo-login" />
      
      <form onSubmit={handleLogin}>
        <div className="form-group-admin">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group-admin">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary-admin">Entrar</button>
      </form>
    </div>
  );
};

export default AdminLogin;