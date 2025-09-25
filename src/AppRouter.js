import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Travels from './pages/Travels';
import MyTravels from './pages/MyTravels';
import ViewProfile from './pages/ViewProfile';
import ResetPassword from './pages/ResetPassword';
import SettingsAndPrivacy from './pages/SettingsAndPrivacy';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import InteractiveMap from './pages/InteractiveMap';
import HelpSupport from './pages/HelpSupport';
import FutureTravels from './pages/FutureTravels';
import Achievements from './pages/Achievements';
import QandA from './pages/QandA';
import Users from './pages/Users';
import UserProfile from './pages/UserProfile';
import Weather from './pages/weather';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/travels" element={
          <ProtectedRoute>
            <Travels />
          </ProtectedRoute>
        } />
        <Route path="/my-travels" element={
          <ProtectedRoute>
            <MyTravels />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ViewProfile />
          </ProtectedRoute>
        } />
        <Route path="/settings-and-privacy" element={
          <ProtectedRoute>
            <SettingsAndPrivacy />
          </ProtectedRoute>
        } />
        <Route path="/interactive-map" element={
          <ProtectedRoute>
            <InteractiveMap />
          </ProtectedRoute>
        } />
        <Route path="/help-support" element={
          <ProtectedRoute>
            <HelpSupport />
          </ProtectedRoute>
        } />
        <Route path="/future-travels" element={
          <ProtectedRoute>
            <FutureTravels />
          </ProtectedRoute>
        } />
        <Route path="/achievements" element={
          <ProtectedRoute>
            <Achievements />
          </ProtectedRoute>
        } />
        <Route path="/qanda" element={
          <ProtectedRoute>
            <QandA />
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        } />
        <Route path="/user-profile" element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        } />
        <Route path="/weather" element={
          <ProtectedRoute>
            <Weather />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
