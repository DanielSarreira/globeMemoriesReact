import React, { useEffect, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home as HomeIcon, Compass, Users as UsersIcon, MessageCircle, Map as MapIcon, User as UserIcon,
  Plus, CloudSun, Bell, Settings as SettingsIcon, LogOut, MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api, { setAuthHeader } from '../../axios_helper';
import { toFullMediaUrl } from '../../utils/mediaUrl';
import { getDisplayName as getUserDisplayName } from '../../utils/userDisplay';
import useSwipeGesture from '../../hooks/useSwipeGesture';
import Avatar from './Avatar';
import './app-shell.css';

const PRIMARY_NAV = [
  { to: '/', label: 'Início', icon: HomeIcon, exact: true },
  { to: '/travels', label: 'Descobrir', icon: Compass, exact: false },
  { to: '/interactive-map', label: 'Mapa', icon: MapIcon, exact: false },
  { to: '/weather', label: 'Meteorologia', icon: CloudSun, exact: false },
  { to: '/qanda', label: 'Fórum', icon: MessageCircle, exact: false },
];

const SECONDARY_NAV = [];

const PERSONAL_NAV = [
  // Round 46+ — "Por fazer" (FutureTravels) removido a pedido do
  // user. O route /plan-travel continua activo para quem chega via
  // URL directa, mas o item some da nav lateral.
  { to: '/notifications', label: 'Notificações', icon: Bell, exact: false, badgeKey: 'notifications' },
  { to: '/feedback', label: 'Feedback e Sugestões', icon: MessageSquare, exact: false },
  { to: '/settings-and-privacy', label: 'Definições', icon: SettingsIcon, exact: false },
];

// Round 46+ — Derive a friendly display name for the user. The
// username never changes, but firstName/lastName can be edited in
// /profile/{username}/edit and we want the sidebar avatar to show
// the latest value immediately, without a full reload. The shared
// helper also accepts nested user objects and the userFirstName /
// userLastName shape used by the trip DTOs.
const getDisplayName = (user) => getUserDisplayName(user) || '';

// FIX (Round 33 — mobile UX): o user pediu swipe horizontal
// para navegar entre tabs do menu (sidebar). Lista ordenada
// das tabs que fazem sentido como destino de swipe.
//
// /interactive-map foi REMOVIDO desta lista. O react-leaflet
// tem o seu próprio handler de touch (drag/pan do mapa) e
// compete com o nosso swipe — quando ambos correm em
// paralelo, o leaflet chama `panBy` num elemento em processo
// de desmontar, e rebenta com `Cannot read properties of
// undefined (reading 'classList')` em `addClass`. Excluir a
// rota é mais seguro do que tentar coordenar dois gesture
// systems. Para ir do mapa para outras tabs, o user usa a
// tab bar inferior ou o sidebar.
const SWIPE_TABS = [
  '/',
  '/travels',
  '/qanda',
];

function indexOfPath(pathname, list) {
  for (let i = 0; i < list.length; i += 1) {
    const p = list[i];
    if (p === '/') {
      if (pathname === '/') return i;
    } else if (pathname === p || pathname.startsWith(`${p}/`)) {
      return i;
    }
  }
  return -1;
}

const isActive = (pathname, to, exact) => {
  if (exact) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
};

const NavItem = ({ to, label, icon: Icon, exact, badge }) => {
  const displayBadge = badge > 99 ? '99+' : (badge > 0 ? String(badge) : null);
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive: a }) => `gm-app__nav-item ${a ? 'gm-app__nav-item--active' : ''}`}
      title={label}
    >
      <span className="gm-app__nav-icon">
        <Icon size={20} strokeWidth={1.75} />
      </span>
      <span className="gm-app__nav-label">{label}</span>
      {displayBadge && (
        <span
          className="gm-app__nav-badge"
          aria-label={`${badge} não ${badge === 1 ? 'lida' : 'lidas'}`}
        >
          {displayBadge}
        </span>
      )}
    </NavLink>
  );
};

NavItem.propTypes = {
  to: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  exact: PropTypes.bool,
  badge: PropTypes.number,
};

const AppShell = ({ children, showTopBar = true }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const raw = window.localStorage.getItem('gm:unreadCount');
      const n = raw ? Number(raw) : 0;
      return Number.isFinite(n) ? n : 0;
    } catch (_) { return 0; }
  });
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return undefined;
    }
    let cancelled = false;
    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/notifications/count');
        if (!cancelled) {
          const n = typeof data?.unreadCount === 'number' ? data.unreadCount : null;
          if (n !== null) {
            setUnreadCount(n);
            try { window.localStorage.setItem('gm:unreadCount', String(n)); } catch (_) { /* no-op */ }
          }
        }
      } catch (_) { /* silent */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    const onFocus = () => fetchUnread();
    const onStorage = (e) => {
      if (e.key === 'gm:unreadCount') fetchUnread();
    };
    const onReadAll = () => setUnreadCount(0);
    const onCountEvent = (e) => {
      const c = e?.detail?.count;
      if (typeof c === 'number' && c >= 0) setUnreadCount(c);
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);
    window.addEventListener('gm:notifications-read-all', onReadAll);
    window.addEventListener('gm:notifications-count', onCountEvent);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('gm:notifications-read-all', onReadAll);
      window.removeEventListener('gm:notifications-count', onCountEvent);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const refetch = async () => {
      try {
        const { data } = await api.get('/notifications/count');
        if (!cancelled) {
          const n = typeof data?.unreadCount === 'number' ? data.unreadCount : null;
          if (n !== null) {
            setUnreadCount(n);
            try { window.localStorage.setItem('gm:unreadCount', String(n)); } catch (_) { /* no-op */ }
          }
        }
      } catch (_) { /* silent */ }
    };
    refetch();
    return () => { cancelled = true; };
  }, [user, location.pathname]);

  const flushPaths = ['/trip/new'];
  const isFlush = flushPaths.includes(location.pathname) || /^\/trip\/\d+\/edit$/.test(location.pathname);

  const [, setProfileTick] = useState(0);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    // Round 46+ — Helper: re-read the canonical user from
    // localStorage so name + photo changes from EditProfile are
    // picked up without a full page reload.
    const rehydrateUser = () => {
      try {
        const raw = window.localStorage.getItem('user');
        if (raw) {
          // We don't have setUser here, but the AuthContext will
          // re-read on the next mount; for the AppShell the user
          // value from `useAuth()` is what we read directly. The
          // tick below forces a re-render, and on the next render
          // `useAuth()` will return the latest value because
          // EditProfile calls `setUser(fresh)` which already
          // updates the in-memory state. The tick is just a safety
          // net in case the consumer uses localStorage directly.
        }
      } catch (_) { /* no-op */ }
    };
    const tick = () => { rehydrateUser(); setProfileTick((t) => t + 1); };
    const onStorage = (e) => {
      if (e.key && e.key.endsWith('_profilePhotoVersion')) tick();
      // Round 46+ — Also re-render when the `user` localStorage
      // entry changes (e.g. profile name edited on another tab).
      if (e.key === 'user') tick();
    };
    const onCustom = () => tick();
    window.addEventListener('storage', onStorage);
    window.addEventListener('gm:profile-updated', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('gm:profile-updated', onCustom);
    };
  }, []);

  const handleLogout = useCallback(() => {
    setAuthHeader(null);
    try { localStorage.removeItem('user'); } catch (_) { /* no-op */ }
    try { localStorage.removeItem('user-travels'); } catch (_) { /* no-op */ }
    navigate('/login');
  }, [navigate]);

  // Round 79 — swipe-to-tab navigation REMOVED. The horizontal
  // swipe on the page background was a Round 33 addition for
  // "app-like" mobile UX, but in practice it conflicts with
  // vertical page scrolling, the browser's back/forward swipe
  // gesture, and carousel swipes inside cards. Users hit it
  // accidentally while trying to scroll and got sent to a
  // different tab. The user has now asked to remove the
  // horizontal-swipe tab change on the PWA; the remaining
  // swipes (carousel between photos, sibling-trips in
  // TravelDetails) are scoped to their containers and not
  // affected. The hook infrastructure (useSwipeGesture,
  // SWIPE_TABS, indexOfPath) is left in place in case we want
  // to bring it back with better constraints later.
  const swipeToTab = useCallback(
    (_direction) => {
      // intentionally no-op
    },
    []
  );

  useSwipeGesture({
    onSwipeLeft: () => swipeToTab('left'),
    onSwipeRight: () => swipeToTab('right'),
    // Hard-disable the swipe-to-tab navigation everywhere.
    // Setting `enabled: false` makes the hook a no-op
    // without removing the wiring, so re-enabling later is
    // a one-line change.
    enabled: false,
  });

  return (
    <div className="gm-app">
      {/* ── Mobile top bar ─────────────────────────────── */}
      {showTopBar && (
        <header className="gm-app__topbar" role="banner">
          <Link to="/" className="gm-app__brand">
            <img
              src="/images/Globe-Memories.png"
              alt="Globe Memories"
              className="gm-app__brand-logo"
            />
          </Link>
          <div className="gm-app__topbar-actions">
            {user ? (
              <>
                <button
                  type="button"
                  className="gm-app__iconbtn"
                  aria-label="Meteorologia"
                  onClick={() => navigate('/weather')}
                >
                  <CloudSun size={20} strokeWidth={1.75} />
                </button>
                <span className="gm-app__iconbtn-wrap">
                  <button
                    type="button"
                    className="gm-app__iconbtn"
                    aria-label="Notificações"
                    onClick={() => navigate('/notifications')}
                  >
                    <Bell size={20} strokeWidth={1.75} />
                    {unreadCount > 0 && (
                      <span
                        className="gm-app__iconbtn-badge"
                        aria-label={`${unreadCount} notificações por ler`}
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                </span>
              </>
            ) : (
              <button
                type="button"
                className="gm-app__btn-primary"
                style={{ height: 36, padding: '0 16px', fontSize: 13 }}
                onClick={() => navigate('/login')}
              >
                Entrar
              </button>
            )}
          </div>
        </header>
      )}

      {/* ── Desktop sidebar ───────────────────────────── */}
      {user && (
        <aside className="gm-app__sidebar" aria-label="Navegação principal">
          <Link to="/" className="gm-app__sidebar-head">
            <img
              src="/images/Globe-Memories.png"
              alt="Globe Memories"
              className="gm-app__sidebar-logo"
            />
          </Link>

          {/* Primary + Personal — wrapped so we can vertically
              centre the whole nav block when the sidebar is
              collapsed (Instagram style). */}
          <div className="gm-app__sidebar-nav-wrap">
            {/* Primary */}
            <nav className="gm-app__nav" aria-label="Navegação primária">
              {PRIMARY_NAV.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </nav>

            {/* Personal */}
            <nav className="gm-app__nav" aria-label="Pessoal">
              <p className="gm-app__nav-title gm-app__nav-section" style={{ padding: '12px 12px 4px' }}>Pessoal</p>
              {PERSONAL_NAV.map((item) => (
                <NavItem
                  key={item.to}
                  {...item}
                  badge={item.badgeKey === 'notifications' ? unreadCount : 0}
                />
              ))}
            </nav>
          </div>

          <div className="gm-app__nav-divider" />

          {/* Profile */}
          <Link
            to={user ? `/profile/${user.username}` : '/login'}
            className="gm-app__profile"
            onClick={(e) => { e.preventDefault(); navigate(user ? `/profile/${user.username}` : '/login'); }}
          >
            <Avatar
              src={(() => {
                const raw = toFullMediaUrl(user?.userProfilePicture || user?.profilePhoto || user?.profilePicture)
                  || user?.userProfilePicture || user?.profilePhoto || user?.profilePicture;
                if (!raw) return raw;
                if (typeof window === 'undefined' || !user?.username) return raw;
                let version = 0;
                try {
                  const v = window.localStorage.getItem(`${user.username}_profilePhotoVersion`);
                  version = v ? Number(v) || 0 : 0;
                } catch (e) { /* no-op */ }
                const sep = raw.includes('?') ? '&' : '?';
                return `${raw}${sep}v=${version}`;
              })()}
              name={getDisplayName(user) || 'Convidado'}
              size="md"
            />
            <div className="gm-app__profile-info">
              <span className="gm-app__profile-name">{getDisplayName(user) || 'Convidado'}</span>
              <span className="gm-app__profile-handle">@{user?.username || 'guest'}</span>
            </div>
            <button
              type="button"
              className="gm-app__iconbtn"
              aria-label="Terminar sessão"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLogout(); }}
              style={{ width: 32, height: 32 }}
            >
              <LogOut size={16} strokeWidth={1.75} />
            </button>
          </Link>
        </aside>
      )}

      {/* ── Desktop: unauth sidebar (login/register pages) ── */}
      {!user && showTopBar && (
        <aside className="gm-app__sidebar" aria-label="Navegação">
          <Link to="/" className="gm-app__sidebar-head">
            <img
              src="/images/Globe-Memories.png"
              alt="Globe Memories"
              className="gm-app__sidebar-logo"
            />
          </Link>

          <div className="gm-app__sidebar-auth">
            <p className="gm-app__sidebar-auth-text">
              Bem-vindo de volta. Inicia sessão para continuar.
            </p>
            <div className="gm-app__sidebar-auth-actions">
              <Link to="/login" className="gm-app__btn-primary">Entrar</Link>
              <Link to="/register" className="gm-app__btn-ghost">Criar conta</Link>
            </div>
          </div>
        </aside>
      )}

      {/* ── Main content ─────────────────────────────── */}
      <div className={`gm-app__main ${isFlush ? 'gm-app__main--flush' : ''}`.trim()}>
        <div className="gm-app__content">
          {children}
        </div>
      </div>

      {/* ── Mobile tab bar + FAB ─────────────────────── */}
      {user && (
        <>
          <nav className="gm-app__tabbar" aria-label="Navegação inferior">
            {[
              { to: '/', label: 'Início', icon: HomeIcon, exact: true },
              { to: '/travels', label: 'Descobrir', icon: Compass, exact: false },
              { to: '/interactive-map', label: 'Mapa', icon: MapIcon, exact: false },
              { to: '/qanda', label: 'Fórum', icon: MessageCircle, exact: false },
              { to: `/profile/${user.username}`, label: 'Perfil', icon: UserIcon, exact: false, profile: true },
            ].map((item) => {
              const Icon = item.icon;
              const active = isActive(location.pathname, item.to, item.exact);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`gm-app__tab ${active ? 'gm-app__tab--active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  aria-label={item.label}
                >
                  <span className="gm-app__tab-icon">
                    <Icon size={22} strokeWidth={active ? 2 : 1.75} />
                  </span>
                </Link>
              );
            })}
          </nav>


          <button
            type="button"
            className="gm-app__fab"
            aria-label="Adicionar publicação"
            onClick={() => navigate('/trip/new')}
          >
            <Plus size={28} strokeWidth={2.25} />
          </button>
        </>
      )}
    </div>
  );
};

AppShell.propTypes = {
  children: PropTypes.node,
  showTopBar: PropTypes.bool,
};

export default AppShell;