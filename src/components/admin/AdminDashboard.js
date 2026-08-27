// src/components/admin/AdminDashboard.js
//
// Round 58 — the backoffice now uses the same design system as the
// user-facing site (gradient surfaces, soft shadows, lucide icons
// for the chrome) instead of the legacy flat blue table. The
// sidebar is grouped by section (Dashboard / Moderação / Dados /
// Conteúdo / Sistema) with collapsible headers, a top bar with
// global stats cards, and a content area that uses the same
// `.gm-card` surface as the rest of the app.
//
// The data layer / Routes / behaviour are unchanged — every page
// still mounts under the same path it did before, so deep-links
// from existing bookmarks keep working.
import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { request, clearAuthToken, STORAGE_KEYS } from '../../axios_helper';
import {
  Home, BarChart3, Flag, Eye, MessageCircle, HelpCircle,
  Users, ListTree, Globe2, Languages, Bus, FileText,
  Trophy, HandHeart, Lightbulb,
  Bell, Database, ShieldCheck, History, Settings as SettingsIcon, UserCog,
  LogOut, ChevronDown, Sparkles, AlertTriangle, Heart, Shield,
  MessageSquare,
} from 'lucide-react';
import UserManagement from './UserManagement';
import UserProfilesManagement from './UserProfilesManagement';
import UserReports from './UserReports';
import CategoryManagement from './CategoryManagement';
import LanguageManagement from './LanguageManagement';
import CountryManagement from './CountryManagement';
import TransportMethodManagement from './TransportMethodManagement';
import ContentManagement from './ContentManagement';
import ActivityLogs from './ActivityLogs';
import Settings from './Settings';
import Notifications from './Notifications';
import AdvancedNotifications from './AdvancedNotifications';
import RoleManagement from './RoleManagement';
import BackupManagement from './BackupManagement';
import SecurityAudit from './SecurityAudit';
import Statistics from './Statistics';
import WelcomeModalManagement from './WelcomeModalManagement';
import ReportsManagement from './ReportsManagement';
import TravelModeration from './TravelModeration';
import TravelModerationComplete from './TravelModerationComplete';
import CommentsModeration from './CommentsModeration';
import QandAModeration from './QandAModeration';
import AchievementsManagement from './AchievementsManagement';
import AdminSuggestionsManager from './AdminSuggestionsManager';
import logo from '../../images/Globe-Memories.png';
import '../../styles/Admin.css';
import '../../styles/components/welcome-modal-management.css';
import '../../styles/components/admin-modern.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [stats, setStats] = useState({
    totalUsers: 0,
    usersLast24h: 0,
    usersLast7Days: 0,
    usersLast30Days: 0,
    totalTravels: 0,
    activeUsers: 0,
    bannedUsers: 0,
    pendingUserReports: 0,
    pendingTripReports: 0,
    pendingFeedback: 0,
    totalForumQuestions: 0,
    totalFeedback: 0,
  });
  const [statsError, setStatsError] = useState(null);
  const [openSections, setOpenSections] = useState({
    Dashboard: true,
    Moderação: true,
    Dados: false,
    Conteúdo: false,
    Sistema: false,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        const response = await request('GET', '/admin/dashboard/stats');
        if (!isMounted) return;
        const data = response.data || {};
        setStats({
          totalUsers: data.totalUsers ?? 0,
          usersLast24h: data.usersLast24h ?? 0,
          usersLast7Days: data.usersLast7Days ?? 0,
          usersLast30Days: data.usersLast30Days ?? 0,
          totalTravels: data.totalTrips ?? 0,
          activeUsers: data.activeUsers ?? 0,
          bannedUsers: data.bannedUsers ?? 0,
          pendingUserReports: data.pendingUserReports ?? 0,
          pendingTripReports: data.pendingTripReports ?? 0,
          pendingFeedback: data.pendingFeedback ?? 0,
          totalForumQuestions: data.totalForumQuestions ?? 0,
          totalFeedback: data.totalFeedback ?? 0,
        });
        setStatsError(null);
      } catch (error) {
        if (!isMounted) return;
        console.error('Erro ao buscar estatísticas:', error);
        setStatsError(error?.response?.data?.message || 'Não foi possível carregar estatísticas.');
      }
    };

    fetchStats();
    return () => { isMounted = false; };
  }, []);

  const handleLogout = () => {
    clearAuthToken(STORAGE_KEYS.ADMIN);
    localStorage.removeItem('adminLoginAttempts');
    localStorage.removeItem('adminLastFailedLogin');
    navigate('/admin/login');
  };

  // Menu grouped by section. Round 58 — collapsed by default
  // everywhere except the current active section so the sidebar
  // isn't a wall of links on first paint.
  const menuItems = useMemo(() => [
    { path: '/admin', icon: Home, label: 'Dashboard', exact: true, section: 'Dashboard' },
    { path: '/admin/statistics', icon: BarChart3, label: 'Estatísticas Detalhadas', section: 'Dashboard' },
    { path: '/admin/reports', icon: Flag, label: 'Denúncias de Viagens', section: 'Moderação', badge: stats.pendingTripReports },
    { path: '/admin/user-reports', icon: Shield, label: 'Denúncias de Utilizadores', section: 'Moderação', badge: stats.pendingUserReports },
    { path: '/admin/travel-moderation-complete', icon: Eye, label: 'Mod. de Viagens', section: 'Moderação' },
    { path: '/admin/comments-moderation', icon: MessageCircle, label: 'Mod. de Comentários', section: 'Moderação' },
    { path: '/admin/qanda-moderation', icon: HelpCircle, label: 'Mod. de Q&A', section: 'Moderação' },
    { path: '/admin/users', icon: Users, label: 'Utilizadores', section: 'Dados' },
    { path: '/admin/user-profiles', icon: Users, label: 'Perfis de Utilizadores', section: 'Dados' },
    { path: '/admin/categories', icon: ListTree, label: 'Categorias', section: 'Dados' },
    { path: '/admin/countries', icon: Globe2, label: 'Países', section: 'Dados' },
    { path: '/admin/languages', icon: Languages, label: 'Idiomas', section: 'Dados' },
    { path: '/admin/transport-methods', icon: Bus, label: 'Métodos de Transporte', section: 'Dados' },
    { path: '/admin/content', icon: FileText, label: 'Gestão de Conteúdo', section: 'Conteúdo' },
    { path: '/admin/achievements', icon: Trophy, label: 'Achievements', section: 'Conteúdo' },
    { path: '/admin/welcome-modal', icon: HandHeart, label: 'Modal de Boas-Vindas', section: 'Conteúdo' },
    { path: '/admin/suggestions', icon: Lightbulb, label: 'Sugestões/Feedback', section: 'Conteúdo', badge: stats.pendingFeedback },
    { path: '/admin/notifications', icon: Bell, label: 'Notificações', section: 'Sistema' },
    { path: '/admin/advanced-notifications', icon: Bell, label: 'Notificações Avançadas', section: 'Sistema' },
    { path: '/admin/backup', icon: Database, label: 'Gestão de Backups', section: 'Sistema' },
    { path: '/admin/security', icon: ShieldCheck, label: 'Auditoria de Segurança', section: 'Sistema' },
    { path: '/admin/logs', icon: History, label: 'Logs de Atividade', section: 'Sistema' },
    { path: '/admin/settings', icon: SettingsIcon, label: 'Configurações', section: 'Sistema' },
    { path: '/admin/roles', icon: UserCog, label: 'Gestão de Permissões', section: 'Sistema' },
  ], [stats]);

  const grouped = useMemo(() => {
    const out = { Dashboard: [], Moderação: [], Dados: [], Conteúdo: [], Sistema: [] };
    menuItems.forEach((it) => { if (out[it.section]) out[it.section].push(it); });
    return out;
  }, [menuItems]);

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  // Keep the section of the current route open.
  useEffect(() => {
    const activeSection = menuItems.find((it) => isActive(it.path, it.exact))?.section;
    if (activeSection) setOpenSections((s) => ({ ...s, [activeSection]: true }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleSection = (s) => setOpenSections((o) => ({ ...o, [s]: !o[s] }));

  const sectionLabels = {
    Dashboard: 'Dashboard',
    'Moderação': 'Moderação',
    Dados: 'Gestão de Dados',
    'Conteúdo': 'Conteúdo',
    Sistema: 'Sistema',
  };

  const sectionIcons = {
    Dashboard: BarChart3,
    'Moderação': ShieldCheck,
    Dados: Database,
    'Conteúdo': Sparkles,
    Sistema: SettingsIcon,
  };

  return (
    <div className="adm-app">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="adm-sidebar">
        <Link to="/admin" className="adm-sidebar__brand">
          <img src={logo} alt="Globe Memories" />
          <div>
            <strong>Globe Memories</strong>
            <span>Administração</span>
          </div>
        </Link>

        <nav className="adm-sidebar__nav">
          {Object.keys(grouped).map((section) => {
            const SectionIcon = sectionIcons[section];
            const items = grouped[section];
            const isOpen = openSections[section];
            const hasActive = items.some((it) => isActive(it.path, it.exact));
            return (
              <div key={section} className={`adm-sidebar__group ${isOpen ? 'is-open' : ''} ${hasActive ? 'has-active' : ''}`}>
                <button
                  type="button"
                  className="adm-sidebar__group-head"
                  onClick={() => toggleSection(section)}
                  aria-expanded={isOpen}
                >
                  <SectionIcon size={15} strokeWidth={2} />
                  <span>{sectionLabels[section]}</span>
                  <ChevronDown
                    size={14}
                    strokeWidth={2.2}
                    className={`adm-sidebar__chevron ${isOpen ? 'is-open' : ''}`}
                  />
                </button>
                {isOpen && (
                  <ul className="adm-sidebar__list">
                    {items.map((it) => {
                      const Icon = it.icon;
                      return (
                        <li key={it.path}>
                          <Link
                            to={it.path}
                            className={`adm-sidebar__link ${isActive(it.path, it.exact) ? 'is-active' : ''}`}
                          >
                            <Icon size={16} strokeWidth={1.8} />
                            <span>{it.label}</span>
                            {it.badge > 0 && (
                              <span className="adm-sidebar__badge">{it.badge}</span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        <div className="adm-sidebar__foot">
          <button type="button" className="adm-sidebar__logout" onClick={handleLogout}>
            <LogOut size={16} strokeWidth={2} /> Terminar sessão
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────── */}
      <div className="adm-main">
        <div className="adm-topbar">
          <div className="adm-topbar__title">
            <span className="adm-topbar__eyebrow">
              <Sparkles size={14} strokeWidth={2.2} /> Backoffice
            </span>
            <h1>{menuItems.find((it) => isActive(it.path, it.exact))?.label || 'Administração'}</h1>
          </div>
          <div className="adm-topbar__stats">
            <div className="adm-topbar__stat">
              <Users size={16} strokeWidth={2} />
              <div>
                <strong>{stats.totalUsers}</strong>
                <span>utilizadores</span>
              </div>
            </div>
            <div className="adm-topbar__stat">
              <Eye size={16} strokeWidth={2} />
              <div>
                <strong>{stats.totalTravels}</strong>
                <span>viagens</span>
              </div>
            </div>
            <div className={`adm-topbar__stat ${stats.pendingTripReports + stats.pendingUserReports > 0 ? 'adm-topbar__stat--warn' : ''}`}>
              <Flag size={16} strokeWidth={2} />
              <div>
                <strong>{stats.pendingTripReports + stats.pendingUserReports}</strong>
                <span>denúncias</span>
              </div>
            </div>
            <div className="adm-topbar__stat">
              <MessageSquare size={16} strokeWidth={2} />
              <div>
                <strong>{stats.totalForumQuestions}</strong>
                <span>perguntas</span>
              </div>
            </div>
          </div>
        </div>

        {statsError && (
          <div className="adm-banner adm-banner--warn">
            <AlertTriangle size={16} strokeWidth={2} />
            <span>{statsError} (a mostrar zeros)</span>
          </div>
        )}

        <div className="adm-content">
          <Routes>
            <Route path="reports" element={<ReportsManagement />} />
            <Route path="user-reports" element={<UserReports />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="travel-moderation-complete" element={<TravelModerationComplete />} />
            <Route path="travel-moderation" element={<TravelModeration />} />
            <Route path="comments-moderation" element={<CommentsModeration />} />
            <Route path="qanda-moderation" element={<QandAModeration />} />

            <Route path="users" element={<UserManagement />} />
            <Route path="user-profiles" element={<UserProfilesManagement />} />
            <Route path="categories" element={<CategoryManagement />} />
            <Route path="languages" element={<LanguageManagement />} />
            <Route path="countries" element={<CountryManagement />} />
            <Route path="transport-methods" element={<TransportMethodManagement />} />

            <Route path="content" element={<ContentManagement />} />
            <Route path="achievements" element={<AchievementsManagement />} />
            <Route path="welcome-modal" element={<WelcomeModalManagement />} />
            <Route path="suggestions" element={<AdminSuggestionsManager />} />

            <Route path="notifications" element={<Notifications />} />
            <Route path="advanced-notifications" element={<AdvancedNotifications />} />
            <Route path="backup" element={<BackupManagement />} />
            <Route path="security" element={<SecurityAudit />} />
            <Route path="logs" element={<ActivityLogs />} />
            <Route path="settings" element={<Settings />} />
            <Route path="roles" element={<RoleManagement />} />

            <Route
              path="/"
              element={
                <div className="adm-home">
                  <h2>
                    <Heart size={22} strokeWidth={2} /> Bem-vindo ao backoffice
                  </h2>
                  <p>Escolhe uma secção na barra lateral para começar. As áreas com itens pendentes estão marcadas com uma insignia.</p>

                  <div className="adm-stats-grid">
                    <div className="adm-stat-card" style={{ borderLeft: '4px solid #2563eb' }}>
                      <Users size={28} strokeWidth={1.5} />
                      <h3>Utilizadores</h3>
                      <p>{stats.totalUsers}</p>
                      <span>+{stats.usersLast7Days} últimos 7 dias</span>
                    </div>
                    <div className="adm-stat-card" style={{ borderLeft: '4px solid #0ea5e9' }}>
                      <Eye size={28} strokeWidth={1.5} />
                      <h3>Viagens</h3>
                      <p>{stats.totalTravels}</p>
                      <span>publicadas</span>
                    </div>
                    <div className="adm-stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                      <Flag size={28} strokeWidth={1.5} />
                      <h3>Denúncias pendentes</h3>
                      <p>{stats.pendingTripReports + stats.pendingUserReports}</p>
                      <span>aguardam triagem</span>
                    </div>
                    <div className="adm-stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
                      <MessageSquare size={28} strokeWidth={1.5} />
                      <h3>Perguntas no fórum</h3>
                      <p>{stats.totalForumQuestions}</p>
                      <span>publicadas</span>
                    </div>
                  </div>
                </div>
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
