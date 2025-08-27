// src/components/SplashScreen.js
import React from 'react';
// ...existing code...

const SplashScreen = () => {
  return (
    <div className="splash-screen">
      <img src="images/logo_white.png" alt="Globe Memories" className="splash-logo" />
      <br></br><br></br>
      <h1 className="splash-title"></h1>
    </div>
  );
};

export default SplashScreen;