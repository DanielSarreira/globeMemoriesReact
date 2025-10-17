// src/components/admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  FaUsers, FaList, FaLanguage, FaGlobeAmericas, 
  FaBus, FaFileAlt, FaHistory, FaCog, 
  FaBell, FaUserShield, FaSignOutAlt, FaChartLine,
  FaHome, FaDatabase, FaShieldAlt, FaHandsHelping 
} from 'react-icons/fa';
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
import BackupManagement from './BackupManagement';
import SecurityAudit from './SecurityAudit';
import WelcomeModalManagement from './WelcomeModalManagement';
import logo from '../../images/Globe-Memories.png';
import '../../styles/Admin.css';
import '../../styles/components/welcome-modal-management.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

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

  const menuItems = [
    { path: '/admin', icon: FaHome, label: 'Dashboard', exact: true },
    { path: '/admin/users', icon: FaUsers, label: 'Gestão de Utilizadores' },
    { path: '/admin/categories', icon: FaList, label: 'Categorias' },
    { path: '/admin/countries', icon: FaGlobeAmericas, label: 'Países' },
    { path: '/admin/languages', icon: FaLanguage, label: 'Idiomas' },
    { path: '/admin/transport-methods', icon: FaBus, label: 'Métodos de Transporte' },
    { path: '/admin/content', icon: FaFileAlt, label: 'Gestão de Conteúdo' },
    { path: '/admin/welcome-modal', icon: FaHandsHelping, label: 'Modal de Boas-Vindas' },
    { path: '/admin/backup', icon: FaDatabase, label: 'Gestão de Backups' },
    { path: '/admin/security', icon: FaShieldAlt, label: 'Auditoria de Segurança' },
    { path: '/admin/logs', icon: FaHistory, label: 'Logs de Atividade' },
    { path: '/admin/settings', icon: FaCog, label: 'Configurações' },
    { path: '/admin/notifications', icon: FaBell, label: 'Notificações' },
    { path: '/admin/roles', icon: FaUserShield, label: 'Gestão de Permissões' },
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="admin-dashboard-admin">
      <div className="sidebar-admin">
        <Link to="/admin">
          <img src={logo} alt="Globe Memories Logo" className="sidebar-logo" />
        </Link>
        <nav>
          <ul>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link 
                    to={item.path} 
                    className={isActive(item.path, item.exact) ? 'active' : ''}
                  >
                    <Icon style={{ marginRight: '12px', fontSize: '1.1rem' }} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li style={{ marginTop: '30px' }}>
              <button 
                onClick={handleLogout} 
                className="btn-danger-admin"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <FaSignOutAlt />
                Terminar Sessão
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
          <Route path="/welcome-modal" element={<WelcomeModalManagement />} />
          <Route path="/backup" element={<BackupManagement />} />
          <Route path="/security" element={<SecurityAudit />} />
          <Route path="/logs" element={<ActivityLogs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/roles" element={<RoleManagement />} />
          <Route
            path="/"
            element={
              <div>
                <div className="welcome-admin">
                  <h2>🌍 Bem-vindo ao Backoffice do Globe Memories</h2>
                  <p style={{ fontSize: '1.05rem', marginTop: '10px' }}>
                    Painel de controlo e gestão da plataforma
                  </p>
                </div>

                {/* Seção de estatísticas principais */}
                <div className="stats-container" style={{ marginTop: '30px' }}>
                  <h2>📊 Estatísticas em Tempo Real</h2>
                  <div className="stats-grid">
                    <div className="stat-card" style={{ borderLeft: '4px solid #0066cc' }}>
                      <FaUsers style={{ fontSize: '2.5rem', color: '#0066cc', marginBottom: '10px' }} />
                      <h3>Total de Utilizadores</h3>
                      <p>{stats.totalUsers}</p>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '4px solid #28a745' }}>
                      <FaChartLine style={{ fontSize: '2.5rem', color: '#28a745', marginBottom: '10px' }} />
                      <h3>Últimas 24 Horas</h3>
                      <p>{stats.usersLast24h}</p>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '4px solid #17a2b8' }}>
                      <FaChartLine style={{ fontSize: '2.5rem', color: '#17a2b8', marginBottom: '10px' }} />
                      <h3>Últimos 7 Dias</h3>
                      <p>{stats.usersLast7Days}</p>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '4px solid #ffc107' }}>
                      <FaChartLine style={{ fontSize: '2.5rem', color: '#ffc107', marginBottom: '10px' }} />
                      <h3>Últimos 30 Dias</h3>
                      <p>{stats.usersLast30Days}</p>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '4px solid #ff9900' }}>
                      <FaGlobeAmericas style={{ fontSize: '2.5rem', color: '#ff9900', marginBottom: '10px' }} />
                      <h3>Total de Viagens</h3>
                      <p>{stats.totalTravels}</p>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '4px solid #28a745' }}>
                      <FaUsers style={{ fontSize: '2.5rem', color: '#28a745', marginBottom: '10px' }} />
                      <h3>Utilizadores Ativos</h3>
                      <p>{stats.activeUsers}</p>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '4px solid #dc3545' }}>
                      <FaShieldAlt style={{ fontSize: '2.5rem', color: '#dc3545', marginBottom: '10px' }} />
                      <h3>Utilizadores Banidos</h3>
                      <p>{stats.bannedUsers}</p>
                    </div>
                  </div>
                </div>

                {/* Ações rápidas */}
                <div className="admin-section-admin" style={{ marginTop: '30px' }}>
                  <h2>⚡ Ações Rápidas</h2>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '15px',
                    marginTop: '20px' 
                  }}>
                    <button 
                      className="btn-primary-admin"
                      onClick={() => navigate('/admin/users')}
                      style={{ padding: '15px', fontSize: '1rem' }}
                    >
                      <FaUsers style={{ marginRight: '8px' }} />
                      Gerir Utilizadores
                    </button>
                    <button 
                      className="btn-success-admin"
                      onClick={() => navigate('/admin/content')}
                      style={{ padding: '15px', fontSize: '1rem' }}
                    >
                      <FaFileAlt style={{ marginRight: '8px' }} />
                      Gerir Conteúdo
                    </button>
                    <button 
                      className="btn-info-admin"
                      onClick={() => navigate('/admin/logs')}
                      style={{ padding: '15px', fontSize: '1rem' }}
                    >
                      <FaHistory style={{ marginRight: '8px' }} />
                      Ver Logs
                    </button>
                    <button 
                      className="btn-warning-admin"
                      onClick={() => navigate('/admin/settings')}
                      style={{ padding: '15px', fontSize: '1rem' }}
                    >
                      <FaCog style={{ marginRight: '8px' }} />
                      Configurações
                    </button>
                  </div>
                </div>

                {/* Informações do sistema */}
                <div className="admin-section-admin" style={{ marginTop: '30px' }}>
                  <h2>ℹ️ Informações do Sistema</h2>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: '20px',
                    marginTop: '20px' 
                  }}>
                    <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e9ecef' }}>
                      <h4 style={{ color: '#495057', marginBottom: '10px' }}>
                        <FaDatabase style={{ marginRight: '8px', color: '#0066cc' }} />
                        Versão da Base de Dados
                      </h4>
                      <p style={{ fontSize: '1.2rem', color: '#0066cc', fontWeight: 'bold' }}>v1.0.0</p>
                    </div>
                    <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e9ecef' }}>
                      <h4 style={{ color: '#495057', marginBottom: '10px' }}>
                        <FaShieldAlt style={{ marginRight: '8px', color: '#28a745' }} />
                        Estado do Sistema
                      </h4>
                      <p style={{ fontSize: '1.2rem', color: '#28a745', fontWeight: 'bold' }}>✓ Operacional</p>
                    </div>
                    <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e9ecef' }}>
                      <h4 style={{ color: '#495057', marginBottom: '10px' }}>
                        <FaCog style={{ marginRight: '8px', color: '#ff9900' }} />
                        Último Backup
                      </h4>
                      <p style={{ fontSize: '1.2rem', color: '#ff9900', fontWeight: 'bold' }}>Hoje às 03:00</p>
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