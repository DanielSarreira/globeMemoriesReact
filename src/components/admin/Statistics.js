// src/components/admin/Statistics.js
// Round 53 backoffice — Detailed statistics page with Chart.js charts.
// Renders time-series (users + trips), top categories/countries,
// rating distribution, privacy split, and engagement totals.
//
// The backend endpoint is /admin/statistics (AdminStatisticsController)
// which returns AdminStatisticsDto with all aggregations pre-computed.
// This page is purely a presentation layer — no business logic here.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { translateCountry } from '../../utils/localization';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { request } from '../../axios_helper';
import Toast from '../Toast';
import '../../styles/Admin.css';

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const Statistics = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const showToast = (m, t) => setToast({ message: m, type: t, show: true });
  const closeToast = () => setToast((p) => ({ ...p, show: false }));

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await request('GET', '/admin/statistics');
      setStats(r.data);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a carregar estatísticas.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const labels = useMemo(() => Object.keys(stats?.usersLast30Days || {}), [stats]);

  const lineData = useMemo(() => ({
    labels,
    datasets: [
      {
        label: 'Utilizadores (acumulado)',
        data: labels.map((d) => stats?.usersLast30Days?.[d] || 0),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.15)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Viagens',
        data: labels.map((d) => stats?.tripsLast30Days?.[d] || 0),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.15)',
        fill: true,
        tension: 0.3,
      },
    ],
  }), [labels, stats]);

  const categoriesData = useMemo(() => ({
    labels: (stats?.topCategories || []).map((c) => c.name),
    datasets: [{
      label: 'Viagens por Categoria',
      data: (stats?.topCategories || []).map((c) => c.count),
      backgroundColor: [
        'rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)', 'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)',
        'rgba(199, 199, 199, 0.7)', 'rgba(83, 102, 255, 0.7)',
        'rgba(255, 99, 255, 0.7)', 'rgba(99, 255, 132, 0.7)',
      ],
      borderWidth: 1,
    }],
  }), [stats]);

  const countriesData = useMemo(() => ({
    labels: (stats?.topCountries || []).map((c) => translateCountry(c.country)),
    datasets: [{
      label: 'Viagens por País',
      data: (stats?.topCountries || []).map((c) => c.count),
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1,
    }],
  }), [stats]);

  const ratingData = useMemo(() => {
    const dist = stats?.ratingDistribution || {};
    return {
      labels: ['1 ⭐', '2 ⭐', '3 ⭐', '4 ⭐', '5 ⭐'],
      datasets: [{
        label: 'Avaliações',
        data: [1, 2, 3, 4, 5].map((s) => dist[s] || 0),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(54, 162, 235, 0.7)',
        ],
        borderWidth: 1,
      }],
    };
  }, [stats]);

  const privacyData = useMemo(() => {
    const p = stats?.tripsByPrivacy || {};
    return {
      labels: ['Público', 'Privado', 'Outro'],
      datasets: [{
        data: [p.public || 0, p.private || 0, p.other || 0],
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(255, 206, 86, 0.7)',
        ],
        borderWidth: 1,
      }],
    };
  }, [stats]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  if (isLoading && !stats) {
    return <div className="admin-section-admin"><p>A carregar estatísticas...</p></div>;
  }
  if (!stats) {
    return <div className="admin-section-admin"><p>Sem dados para mostrar.</p></div>;
  }

  return (
    <div className="admin-section-admin">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📊 Estatísticas Detalhadas</h2>
        <button className="btn-primary-admin" onClick={fetchStats} disabled={isLoading}>
          {isLoading ? 'A atualizar...' : '🔄 Atualizar'}
        </button>
      </div>

      {/* Top stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <StatCard label="⭐ Avaliação Média" value={stats.averageRating?.toFixed(2) || '—'} sub="em todas as viagens" />
        <StatCard label="📈 Média Viagens/User" value={stats.averageTripsPerUser?.toFixed(2) || '—'} sub="engagement" />
        <StatCard label="💚 Total de Likes" value={stats.totalLikes} sub="em todas as viagens" />
        <StatCard label="💬 Comentários" value={stats.totalComments} sub="total" />
        <StatCard label="🔖 Guardados" value={stats.totalSaves} sub="por utilizadores" />
        <StatCard label="👥 Ativos 24h" value={stats.activeUsersLast24h} sub="estimativa" />
      </div>

      {/* Time series */}
      <ChartCard title="📈 Evolução nos últimos 30 dias">
        <div style={{ height: '320px' }}><Line data={lineData} options={chartOptions} /></div>
      </ChartCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
        <ChartCard title="🏆 Top Categorias">
          <div style={{ height: '300px' }}><Bar data={categoriesData} options={chartOptions} /></div>
        </ChartCard>
        <ChartCard title="🌍 Top Países">
          <div style={{ height: '300px' }}><Bar data={countriesData} options={chartOptions} /></div>
        </ChartCard>
        <ChartCard title="⭐ Distribuição de Avaliações">
          <div style={{ height: '300px' }}><Doughnut data={ratingData} /></div>
        </ChartCard>
        <ChartCard title="🔒 Privacidade das Viagens">
          <div style={{ height: '300px' }}><Doughnut data={privacyData} /></div>
        </ChartCard>
      </div>

      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={closeToast} />
    </div>
  );
};

const StatCard = ({ label, value, sub }) => (
  <div style={{
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  }}>
    <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '6px' }}>{label}</div>
    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#111827' }}>{value}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>{sub}</div>}
  </div>
);

const ChartCard = ({ title, children }) => (
  <div style={{
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  }}>
    <h3 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', color: '#374151' }}>{title}</h3>
    {children}
  </div>
);

export default Statistics;
