// src/App.js
import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
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
import QandA from './pages/QandA';
import './styles/styles.css';

import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';

// Layout para a aplicação principal (com Sidebar, Header e Footer)
const MainLayout = () => {
  const location = useLocation();
  const isLoginOrRegister = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="app-container">
      {/* Renderiza o Sidebar apenas se não estiver nas páginas de Login ou Register */}
      {!isLoginOrRegister && <Sidebar />}
      <div
        className="content"
        style={{
          width: isLoginOrRegister ? '100%' : 'calc(100% - 270px)',
          backgroundColor: isLoginOrRegister ? '#F4F7FA' : 'transparent',
          minHeight: '100vh',
        }}
      >
        <Header />
        <main>
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

// Layout para o backoffice (sem Sidebar, Header ou Footer da aplicação principal)
const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <Outlet />
    </div>
  );
};

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
        <Route path="/HelpSupport" element={<ProtectedRoute />}>
          <Route index element={<HelpSupport />} />
        </Route>
        <Route path="/users" element={<ProtectedRoute />}>
          <Route index element={<Users />} />
        </Route>
        <Route path="/qanda" element={<ProtectedRoute />}>
          <Route index element={<QandA />} />
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
    // Simula o tempo de carregamento (mínimo de 2 segundos para a splash screen)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        {isLoading ? <SplashScreen /> : <App />}
      </Router>
    </AuthProvider>
  );
};

export default AppWrapper;