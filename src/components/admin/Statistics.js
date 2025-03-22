// src/components/admin/Statistics.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/Admin.css';

const Statistics = () => {
  const [stats, setStats] = useState({
    totalUsers: 150,
    totalTravels: 300,
    activeUsers: 120,
    bannedUsers: 5,
  });

  useEffect(() => {
    // Placeholder para chamada à API
    const fetchStats = async () => {
      // const { data } = await axios.get('/api/statistics', {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      // });
      // setStats(data);
    };
    fetchStats();
  }, []);

  return (
    <div className="admin-section-admin">
      <h2>Estatísticas do Sistema</h2>
      <div className="stats-grid-admin">
        <div className="stat-card-admin">
          <h3>Total de Usuários</h3>
          <p>{stats.totalUsers}</p>
        </div>
        <div className="stat-card-admin">
          <h3>Total de Viagens</h3>
          <p>{stats.totalTravels}</p>
        </div>
        <div className="stat-card-admin">
          <h3>Usuários Ativos</h3>
          <p>{stats.activeUsers}</p>
        </div>
        <div className="stat-card-admin">
          <h3>Usuários Banidos</h3>
          <p>{stats.bannedUsers}</p>
        </div>
      </div>
    </div>
  );
};

export default Statistics;