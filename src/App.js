import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar'; // Importa o Sidebar
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
import './App.css'; // Importa o CSS do App

const App = () => {
  return (
    <Router>
      <Sidebar /> {/* Adiciona o Sidebar */}
      <div className="content">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/travels" element={<Travels />} />
            <Route path="/travel/:id" element={<TravelDetails />} /> {/* Correção aqui */}
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
    </Router>
  );
};

export default App;
