// MainLayout.js
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { FaChevronUp, FaPlane } from 'react-icons/fa';

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoadingAuth, user } = useAuth();
  const isLoginOrRegister = location.pathname === '/login' || location.pathname === '/register';
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
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

  // Se não for login/register E (está carregando OU não tem user), não renderiza Sidebar/Header
  const shouldShowLayout = isLoginOrRegister || (!isLoadingAuth && user);

  return (
    <div className="app-container">
      {shouldShowLayout && !isLoginOrRegister && <Sidebar />}
      <div
        className="content"
        style={{
          width: isLoginOrRegister ? '100%' : 'calc(100% - 270px)',
          backgroundColor: isLoginOrRegister ? '#F4F7FA' : 'transparent',
          minHeight: '100vh',
        }}
      >
        {shouldShowLayout && <Header />}
        <main>
          <Outlet />
        </main>
        {shouldShowLayout && <Footer />}
        {shouldShowLayout && !isLoginOrRegister && !isMobile && (
          <div className="fixed-buttons">
            <button className="scroll-to-top" onClick={scrollToTop} style={{ display: showScrollTop ? 'flex' : 'none' }}>
              <FaChevronUp />
            </button>
            <button className="plan-new-travel" onClick={handlePlanNewTravel}>
              <FaPlane />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainLayout;