import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Travels from './pages/Travels';
import MyTravels from './pages/MyTravels';
import ViewProfile from './pages/ViewProfile';
import NotFound from './pages/NotFound';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/travels" element={<Travels />} />
        <Route path="/my-travels" element={<MyTravels />} />
        <Route path="/profile" element={<ViewProfile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
