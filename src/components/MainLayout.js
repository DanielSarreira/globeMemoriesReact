import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppShell } from './ui';

/**
 * MainLayout — wraps every public route in the new AppShell.
 * The single source of truth for navigation. Used by App.js.
 */
const MainLayout = () => (
  <AppShell>
    <Outlet />
  </AppShell>
);

export default MainLayout;
