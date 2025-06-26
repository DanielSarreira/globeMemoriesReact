// MainLayout.js
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { FaChevronUp, FaPlus } from 'react-icons/fa';
import '../styles/styles.css';

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginOrRegister = location.pathname === '/login' || location.pathname === '/register';
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handlePlanNewTravel = () => {
    navigate('/my-travels', { state: { openModal: true } });
  };

  return (
    <div className="app-container">
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
        {!isLoginOrRegister && (
          <div className="fixed-buttons">
            <button className="scroll-to-top" onClick={scrollToTop} style={{ display: showScrollTop ? 'flex' : 'none' }}>
              <FaChevronUp />
            </button>
            <button className="plan-new-travel" onClick={handlePlanNewTravel}>
              <FaPlus />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainLayout;