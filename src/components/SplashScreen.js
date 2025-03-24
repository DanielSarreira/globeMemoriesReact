// src/components/SplashScreen.js
import React from 'react';
import '../styles/styles.css';

const SplashScreen = () => {
  return (
    <div className="splash-screen">
      <img src="/icons/favicon2.png" alt="Globe Memories" className="splash-logo" />
      <br></br><br></br>
      <h1 className="splash-title"></h1>
    </div>
  );
};

export default SplashScreen;