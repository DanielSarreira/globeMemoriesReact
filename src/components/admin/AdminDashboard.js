// src/components/admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios'; // Importar axios para buscar as estatísticas
import UserManagement from './UserManagement';
import CategoryManagement from './CategoryManagement';
import LanguageManagement from './LanguageManagement';
import CountryManagement from './CountryManagement';
import TransportMethodManagement from './TransportMethodManagement';
import ContentManagement from './ContentManagement';
import ActivityLogs from './ActivityLogs';
import Settings from './Settings';
import Notifications from './Notifications';
import RoleManagement from './RoleManagement';
import logo from '../../images/Globe-Memories.png'; // Importar o logotipo
import '../../styles/Admin.css';

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Estado para as estatísticas
  const [stats, setStats] = useState({
    totalUsers: 0,
    usersLast24h: 0,
    usersLast7Days: 0,
    usersLast30Days: 0,
    totalTravels: 0,
    activeUsers: 0,
    bannedUsers: 0,
  });

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
    }

    // Buscar estatísticas
    const fetchStats = async () => {
      try {
        const { data } = await axios.get('/api/statistics', {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
        });
        setStats(data);
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        // Dados mock para teste
        setStats({
          totalUsers: 150,
          usersLast24h: 5,
          usersLast7Days: 20,
          usersLast30Days: 50,
          totalTravels: 300,
          activeUsers: 120,
          bannedUsers: 5,
        });
      }
    };
    fetchStats();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="admin-dashboard-admin">
      <div className="sidebar-admin">
      <Link to="/admin">
        <img src={logo} alt="Globe Memories Logo" className="sidebar-logo" />
      </Link>
        <nav>
          <ul>
            <li><Link to="/admin/users">Gestão de Users</Link></li>
            <li><Link to="/admin/categories">Categorias</Link></li>
            <li><Link to="/admin/countries">Países</Link></li>
            <li><Link to="/admin/languages">Idiomas</Link></li>
            <li><Link to="/admin/transport-methods">Métodos de Transporte</Link></li>
            <li><Link to="/admin/content">Gestão de Conteúdo</Link></li>
            <li><Link to="/admin/logs">Relatórios de Atividade</Link></li>
            <li><Link to="/admin/settings">Configurações</Link></li>
            <li><Link to="/admin/notifications">Notificações</Link></li>
            <li><Link to="/admin/roles">Gestão de Permissões</Link></li>
            <li>
              <button onClick={handleLogout} className="btn-danger-admin">
                Sair
              </button>
            </li>
          </ul>
        </nav>
      </div>
      <div className="content-admin">
        <Routes>
          <Route path="/users" element={<UserManagement />} />
          <Route path="/categories" element={<CategoryManagement />} />
          <Route path="/languages" element={<LanguageManagement />} />
          <Route path="/countries" element={<CountryManagement />} />
          <Route path="/transport-methods" element={<TransportMethodManagement />} />
          <Route path="/content" element={<ContentManagement />} />
          <Route path="/logs" element={<ActivityLogs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/roles" element={<RoleManagement />} />
          <Route
            path="/"
            element={
              <div className="welcome-admin">
                <h2>Bem-vindo ao Backoffice do Globe Memories</h2>
                <p>Selecione uma opção no menu lateral para começar.</p>
                {/* Seção de estatísticas */}
                <div className="stats-container">
                  <h2>Estatísticas do Sistema</h2>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <h3>Total de Users</h3>
                      <p>{stats.totalUsers}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Novos Users (Últimas 24h)</h3>
                      <p>{stats.usersLast24h}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Novos Users (Últimos 7 Dias)</h3>
                      <p>{stats.usersLast7Days}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Novos Users (Últimos 30 Dias)</h3>
                      <p>{stats.usersLast30Days}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Total de Viagens</h3>
                      <p>{stats.totalTravels}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Users Ativos</h3>
                      <p>{stats.activeUsers}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Users Banidos</h3>
                      <p>{stats.bannedUsers}</p>
                    </div>
                  </div>
                </div>
              </div>
            }
          />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard;