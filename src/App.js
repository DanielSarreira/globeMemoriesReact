import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Routes, Route, BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WeatherProvider } from './context/WeatherContext';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import SplashScreen from './components/SplashScreen';
import { initializeAccessibility } from './utils/accessibility';
import Home from './pages/Home';
import Travels from './pages/Travels';
import TravelDetails from './components/TravelDetails';
import MyTravels from './pages/MyTravels';
import ViewProfile from './pages/ViewProfile';
import Login from './pages/Login';
import Register from './pages/Register';
import HelpSupport from './pages/HelpSupport';
import NotFound from './pages/NotFound';
import Users from './pages/Users';
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
import FutureTravels from './pages/FutureTravels';
import FutureTravelsComingSoon from './pages/FutureTravelsComingSoon';
import MainLayout from './components/MainLayout';
import AdminLayout from './components/AdminLayout';

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

const App = () => {
  const { isLoadingAuth } = useAuth();

  // Inicializar melhorias de acessibilidade
  useEffect(() => {
    initializeAccessibility();
  }, []);

  // Enquanto carrega a autenticação, mostra splash screen
  if (isLoadingAuth) {
    return <SplashScreen />;
  }

  return (
    <WeatherProvider>
      <Routes>
        {/* Rotas da aplicação principal com MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={<ProtectedRoute />}>
            <Route index element={<Home />} />
          </Route>
          <Route path="/travels" element={<ProtectedRoute />}>
            <Route index element={<Travels />} />
          </Route>
          <Route path="/travel/:id" element={<ProtectedRoute />}>
            <Route index element={<TravelDetails />} />
          </Route>
          <Route path="/my-travels" element={<ProtectedRoute />}>
            <Route index element={<MyTravels />} />
          </Route>
          <Route path="/profile/edit/:username" element={<ProtectedRoute />}>
            <Route index element={<ViewProfile />} />
          </Route>
          <Route path="/profile/:username" element={<ProtectedRoute />}>
            <Route index element={<UserProfile />} />
          </Route>
          <Route path="/help-support" element={<ProtectedRoute />}>
            <Route index element={<HelpSupport />} />
          </Route>
          <Route path="/users" element={<ProtectedRoute />}>
            <Route index element={<Users />} />
          </Route>
          <Route path="/qanda" element={<ProtectedRoute />}>
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
            <Route index element={<FutureTravels />} />
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
          {/* Redirecionar /blocked-users para /settings-and-privacy#blocked-users */}
          <Route path="/blocked-users" element={<Navigate to="/settings-and-privacy#blocked-users" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>

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
          <ScrollToTop />
          <App />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default AppWrapper;