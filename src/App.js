import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Travels from './pages/Travels';
import TravelDetails from './components/TravelDetails';
import MyTravels from './pages/MyTravels';
import ViewProfile from './pages/ViewProfile';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateTravel from './components/CreateTravel';
import EditTravel from './components/EditTravel';
import HelpSupport from './pages/HelpSupport';
import AuthContent from './components/AuthContent';
import NotFound from './pages/NotFound';
import './App.css';
import './styles/styles.css';

const App = () => {
  const location = useLocation();

  // Condição para verificar se a página é de Login ou Registro
  const isLoginOrRegister = location.pathname === '/login' || location.pathname === '/register';

  // Authentication check function
  const isAuthenticated = () => {
    // Replace with your authentication logic, e.g., check a token in localStorage
    return !!localStorage.getItem('auth_token');
  };

  // Protected Route Component
  const ProtectedRoute = () => {
    return isAuthenticated() ? <Outlet /> : <Navigate to="/login" />;
  };

  return (
    <div className="app-container">
      {/* Renderiza o Sidebar apenas se não estiver nas páginas de Login ou Register */}
      {!isLoginOrRegister && <Sidebar />}

      <div 
  className="content" 
  style={{
    width: isLoginOrRegister ? '100%' : 'calc(100% - 270px)',
    backgroundColor: isLoginOrRegister ? '#F4F7FA' : 'transparent',
    minHeight: '100vh'
  }}
>
        <Header />
        <main>
          <Routes>
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
            <Route path="/profile" element={<ProtectedRoute />}>
              <Route index element={<ViewProfile />} />
            </Route>
            <Route path="/create-travel" element={<ProtectedRoute />}>
              <Route index element={<CreateTravel />} />
            </Route>
            <Route path="/edit-travel" element={<ProtectedRoute />}>
              <Route index element={<EditTravel />} />
            </Route>
            <Route path="/auth-content" element={<ProtectedRoute />}>
              <Route index element={<AuthContent />} />
            </Route>
            <Route path="*" element={<ProtectedRoute />}>
              <Route index element={<NotFound />} />
            </Route>

            <Route path="/HelpSupport" element={<ProtectedRoute />}>
            <Route index element={<HelpSupport />} />
            </Route>

          </Routes>
        </main>
        <Footer />
      </div>
    </div>
  );
};

const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
