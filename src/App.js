import React from 'react';
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
import NotFound from './pages/NotFound';
import './App.css';

const App = () => {
  const location = useLocation();

  // Condição para verificar se a página é de Login ou Registro
  const isLoginOrRegister = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="app-container">
      {/* Renderiza o Sidebar apenas se não estiver nas páginas de Login ou Register */}
      {!isLoginOrRegister && <Sidebar />}

      <div 
        className="content" 
        style={{ marginLeft: isLoginOrRegister ? '0' : '200px' }} // Remove a margem esquerda nas páginas de Login e Registro
      >
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/travels" element={<Travels />} />
            <Route path="/travel/:id" element={<TravelDetails />} />
            <Route path="/my-travels" element={<MyTravels />} />
            <Route path="/profile" element={<ViewProfile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/create-travel" element={<CreateTravel />} />
            <Route path="/edit-travel" element={<EditTravel />} />
            <Route path="*" element={<NotFound />} />
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
