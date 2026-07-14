import React from 'react';
import '../../styles/admin-placeholder.css';

const AdminPlaceholder = ({ title, message }) => (
  <div className="admin-placeholder">
    <h2 className="admin-placeholder__title">{title}</h2>
    <p className="admin-placeholder__message">{message}</p>
  </div>
);

export default AdminPlaceholder;
