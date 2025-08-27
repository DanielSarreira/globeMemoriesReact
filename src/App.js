import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WeatherProvider } from './context/WeatherContext';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Travels from './pages/Travels';
import TravelDetails from './components/TravelDetails';
import MyTravels from './pages/MyTravels';
import ViewProfile from './pages/ViewProfile';
import Login from './pages/Login';
import Register from './pages/Register';
import SplashScreen from './components/SplashScreen';
import HelpSupport from './pages/HelpSupport';
import NotFound from './pages/NotFound';
import Users from './pages/Users';
import UserProfile from './pages/UserProfile';
import BlockedUsers from './pages/BlockedUsers';
import Notifications from './components/Notifications';
import InteractiveMap from './pages/InteractiveMap';
import QandA from './pages/QandA';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import Achievements from './pages/Achievements';
import Weather from './pages/weather';
import FutureTravels from './pages/FutureTravels';
import MainLayout from './components/MainLayout';
import AdminLayout from './components/AdminLayout';
import './styles/index.css';

// Função para verificar autenticação
const isAuthenticated = () => {
  return !!localStorage.getItem('auth_token');
};

// Componente de Rota Protegida
const ProtectedRoute = () => {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" />;
};

const App = () => {
  return (
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
        <Route path="/blocked-users" element={<ProtectedRoute />}>
          <Route index element={<BlockedUsers />} />
        </Route>
        <Route path="/qanda" element={<ProtectedRoute />}>
          <Route index element={<QandA />} />
        </Route>
        <Route path="/achievements" element={<ProtectedRoute />}>
          <Route index element={<Achievements />} />
        </Route>
        <Route path="/interactivemap" element={<ProtectedRoute />}>
          <Route index element={<InteractiveMap />} />
        </Route>
        <Route path="/futuretravels" element={<ProtectedRoute />}>
          <Route index element={<FutureTravels />} />
        </Route>
        <Route path="/Weather" element={<ProtectedRoute />}>
          <Route index element={<Weather />} />
        </Route>
        <Route path="/notifications" element={<ProtectedRoute />}>
          <Route index element={<Notifications />} />
        </Route>
        <Route path="*" element={<ProtectedRoute />}>
          <Route index element={<NotFound />} />
        </Route>
      </Route>

      {/* Rotas do backoffice com AdminLayout */}
      <Route element={<AdminLayout />}>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Route>
    </Routes>
  );
};

const AppWrapper = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      <WeatherProvider>
        <Router>
          <ScrollToTop />
          {isLoading ? <SplashScreen /> : <App />}
        </Router>
      </WeatherProvider>
    </AuthProvider>
  );
};

export default AppWrapper;