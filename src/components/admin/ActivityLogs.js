// src/components/admin/ActivityLogs.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/Admin.css';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([
    // Mock data
    { _id: '1', admin: 'admin@globememories.com', action: 'Baniu viajante tiago', timestamp: '2025-03-01 10:00' },
    { _id: '2', admin: 'admin@globememories.com', action: 'Aprovou postagem "Explorando o Rio"', timestamp: '2025-03-02 14:30' },
  ]);

  useEffect(() => {
    // Placeholder para chamada à API
    const fetchLogs = async () => {
      // const { data } = await axios.get('/api/logs', {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      // });
      // setLogs(data);
    };
    fetchLogs();
  }, []);

  return (
    <div className="admin-section-admin">
      <h2>Relatórios de Atividade</h2>
      <table className="admin-table-admin">
        <thead>
          <tr>
            <th>Administrador</th>
            <th>Ação</th>
            <th>Data/Hora</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log._id}>
              <td>{log.admin}</td>
              <td>{log.action}</td>
              <td>{log.timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ActivityLogs;