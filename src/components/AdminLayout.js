import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * AdminLayout — minimal pass-through. The admin backoffice is being
 * redesigned in a future pass; for now it renders its content without
 * the public app shell.
 */
const AdminLayout = () => <Outlet />;

export default AdminLayout;
