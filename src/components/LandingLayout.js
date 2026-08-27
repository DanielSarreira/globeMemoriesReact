// src/components/LandingLayout.js
//
// Round 59 — Bare layout for the public Landing page. The Landing
// is meant to feel like a marketing site (no app sidebar, no top
// nav, just the small LandingHeader floating on top), so we
// intentionally don't wrap it in AppShell/MainLayout. We still
// include the AccountClosedModal so a banned/deleted user mid-
// session gets a clean logout experience even when the app's
// shell isn't mounted.

import React from 'react';
import { Outlet } from 'react-router-dom';
import AccountClosedModal from './AccountClosedModal';

const LandingLayout = () => (
  <>
    <Outlet />
    <AccountClosedModal />
  </>
);

export default LandingLayout;
