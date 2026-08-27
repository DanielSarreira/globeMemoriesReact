import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Routes, Route, BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WeatherProvider } from './context/WeatherContext';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import SplashScreen from './components/SplashScreen';
import { initializeAccessibility } from './utils/accessibility';
import { ToastProvider } from './components/ui/Toast';
import Home from './pages/Home';
import Travels from './pages/Travels';
import TravelDetails from './components/TravelDetails.jsx';
import EditProfile from './pages/EditProfile';
import Login from './pages/Login';
import Register from './pages/Register';
import HelpSupport from './pages/HelpSupport';
import NotFound from './pages/NotFound';
import UserProfile from './pages/UserProfile';
import Notifications from './components/Notifications';
import InteractiveMap from './pages/InteractiveMap';
import QandA from './pages/QandA';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import Achievements from './pages/Achievements';
import Weather from './pages/weather';
import SettingsAndPrivacy from './pages/SettingsAndPrivacy';
import Feedback from './pages/Feedback';
import FutureTravelsComingSoon from './pages/FutureTravelsComingSoon';
import TripWizard from './pages/TripWizard';
import MainLayout from './components/MainLayout';
import AdminLayout from './components/AdminLayout';
import AuthLayout from './components/AuthLayout';
import LandingLayout from './components/LandingLayout';
import AccountClosedModal from './components/AccountClosedModal';
import Landing from './pages/Landing';

import './styles/index.css';

// Componente de Rota Protegida
const ProtectedRoute = () => {
  const { user, isLoadingAuth } = useAuth();

  // Enquanto carrega, mostra splash screen
  if (isLoadingAuth) {
    return <SplashScreen />;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

/**
 * Round 58 — the root `/` route. Anonymous visitors see the
 * Landing page (marketing CTA + 15 random public trips). Signed-in
 * users see the Home feed directly so the user doesn't bounce
 * between the landing and the dashboard every time they open the
 * app. The landing is still reachable at `/landing` for any user
 * who wants the marketing view.
 */
const RootRoute = () => {
  const { user, isLoadingAuth } = useAuth();
  if (isLoadingAuth) return <SplashScreen />;
  return user ? <Navigate to="/home" replace /> : <Landing />;
};

/**
 * The legacy /my-travels page is gone — trip management (create,
 * edit, delete) now lives in the user's profile (see UserProfile
 * and the Edit/Delete buttons on the travel cards there). Any
 * bookmark or link to the old URL is bounced to the caller's own
 * profile so the UX is coherent with where trips actually live now.
 */
const MyTravelsLegacyRedirect = () => {
  const { user } = useAuth();
  const target = user?.username ? `/profile/${user.username}` : '/login';
  return <Navigate to={target} replace />;
};

const App = () => {
  const { isLoadingAuth } = useAuth();

  // Inicializar melhorias de acessibilidade
  useEffect(() => {
    initializeAccessibility();
  }, []);

  // While we're still loading the persisted auth state, show the
  // splash. The RootRoute will then either render the landing
  // (anonymous) or redirect to /home (signed in).
  if (isLoadingAuth) {
    return <SplashScreen />;
  }

  return (
    <WeatherProvider>
      <Routes>
        {/* Auth routes — dedicated AuthLayout (no sidebar, no top bar) */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Round 59 — Landing lives in its own bare layout (no
            sidebar, no top bar). The small floating LandingHeader
            already carries the Login/Register CTAs. Mounted BEFORE
            the MainLayout so React Router's path specificity picks
            the right layout for `/` and `/landing`. */}
        <Route element={<LandingLayout />}>
          <Route path="/" element={<RootRoute />} />
          <Route path="/landing" element={<Landing />} />
        </Route>

        {/* Rotas da aplicação principal com MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/home" element={<ProtectedRoute />}>
            <Route index element={<Home />} />
          </Route>
          <Route path="/travels" element={<ProtectedRoute />}>
            <Route index element={<Travels />} />
          </Route>
          <Route path="/travel/:id" element={<ProtectedRoute />}>
            <Route index element={<TravelDetails />} />
          </Route>
          <Route path="/my-travels" element={<ProtectedRoute />}>
            <Route index element={<MyTravelsLegacyRedirect />} />
          </Route>
          <Route path="/my-travels/new" element={<ProtectedRoute />}>
            <Route index element={<MyTravelsLegacyRedirect />} />
          </Route>
          <Route path="/my-travels/:id/edit" element={<ProtectedRoute />}>
            <Route index element={<MyTravelsLegacyRedirect />} />
          </Route>
          {/* Trip creation & edit live on /trip/* (the legacy
              /my-travels/* paths above now redirect to the user's
              profile). */}
          <Route path="/trip/new" element={<ProtectedRoute />}>
            <Route index element={<TripWizard />} />
          </Route>
          <Route path="/trip/:id/edit" element={<ProtectedRoute />}>
            <Route index element={<TripWizard />} />
          </Route>
          {/* /saved-trips used to be a dedicated page; it now lives
              as a sub-tab inside the user's profile (see
              UserProfile → "Viagens Guardadas"). The path is left
              as a 404 in case anyone has a bookmark. */}
          <Route path="/profile/edit/:username" element={<ProtectedRoute />}>
            <Route index element={<EditProfile />} />
          </Route>
          <Route path="/profile/:username" element={<ProtectedRoute />}>
            <Route index element={<UserProfile />} />
          </Route>
          <Route path="/help-support" element={<ProtectedRoute />}>
            <Route index element={<HelpSupport />} />
          </Route>
          <Route path="/users" element={<Navigate to="/travels?tab=travellers" replace />} />
          <Route path="/qanda" element={<ProtectedRoute />}>
            <Route index element={<QandA />} />
          </Route>
          {/* /qanda/:id e /forum/questions/:id — o "Fórum" (QandA)
              mostra perguntas inline na lista, sem detail-page
              dedicada. Para não perder a UX de clicar numa
              notificação "respondeu à tua pergunta" (que antes
              caía em 404 com /forum/questions/:id), abrimos a
              mesma página do Fórum. O user pode ver a pergunta
              no contexto da lista. */}
          <Route path="/qanda/:id" element={<ProtectedRoute />}>
            <Route index element={<QandA />} />
          </Route>
          <Route path="/forum/questions/:id" element={<ProtectedRoute />}>
            <Route index element={<QandA />} />
          </Route>
          <Route path="/forum/comments/:id" element={<ProtectedRoute />}>
            <Route index element={<QandA />} />
          </Route>
          <Route path="/achievements" element={<ProtectedRoute />}>
            <Route index element={<Achievements />} />
          </Route>
          <Route path="/interactive-map" element={<ProtectedRoute />}>
            <Route index element={<InteractiveMap />} />
          </Route>
          <Route path="/plan-travel" element={<ProtectedRoute />}>
            <Route index element={<FutureTravelsComingSoon />} />
          </Route>
          <Route path="/future-travels" element={<ProtectedRoute />}>
            <Route index element={<Navigate to="/trip/new" replace />} />
          </Route>
          <Route path="/Weather" element={<ProtectedRoute />}>
            <Route index element={<Weather />} />
          </Route>
          <Route path="/notifications" element={<ProtectedRoute />}>
            <Route index element={<Notifications />} />
          </Route>
          <Route path="/settings-and-privacy" element={<ProtectedRoute />}>
            <Route index element={<SettingsAndPrivacy />} />
          </Route>
          <Route path="/feedback" element={<ProtectedRoute />}>
            <Route index element={<Feedback />} />
          </Route>
          {/* Redirecionar /blocked-users para /settings-and-privacy#blocked-users */}
          <Route path="/blocked-users" element={<Navigate to="/settings-and-privacy#blocked-users" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* TripWizard (full-screen, sem sidebar/topbar, própria UI)
            está agora registado em /trip/new e /trip/:id/edit dentro
            do MainLayout, com a devida proteção. O legacy
            /my-travels/new e /my-travels/:id/edit ficam como
            redirect para a profile. */}

        {/* Rotas do backoffice com AdminLayout */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Route>
        </Route>
      </Routes>
    </WeatherProvider>
  );
};

const AppWrapper = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <ScrollToTop />
            <App />
            <AccountClosedModal />
          </ToastProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default AppWrapper;