// src/components/admin/SecurityAudit.js
import React, { useState, useEffect } from 'react';
import { 
  FaShieldAlt, FaExclamationTriangle, FaCheckCircle, 
  FaTimesCircle, FaKey, FaLock, FaUserShield, 
  FaServer, FaDatabase, FaNetworkWired 
} from 'react-icons/fa';
import Toast from '../Toast';
import '../../styles/Admin.css';

const SecurityAudit = () => {
  const [auditResults, setAuditResults] = useState({
    overallScore: 0,
    lastAudit: null,
    categories: []
  });
  
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const [securityLogs, setSecurityLogs] = useState([
    { id: '1', type: 'warning', message: 'Tentativa de login falhada - IP: 192.168.1.100', timestamp: '2025-10-14 10:30:15' },
    { id: '2', type: 'success', message: 'Backup de segurança concluído com sucesso', timestamp: '2025-10-14 03:00:00' },
    { id: '3', type: 'error', message: 'Acesso não autorizado bloqueado - IP: 203.0.113.5', timestamp: '2025-10-13 22:15:45' },
    { id: '4', type: 'info', message: 'Actualização de certificado SSL realizada', timestamp: '2025-10-13 09:00:00' },
    { id: '5', type: 'warning', message: 'Palavra-passe fraca detectada - Utilizador: user123', timestamp: '2025-10-12 16:20:30' },
  ]);

  const showToast = (message, type) => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  const runSecurityAudit = async () => {
    if (isRunningAudit) return;

    setIsRunningAudit(true);
    showToast('🔍 A executar auditoria de segurança...', 'info');

    try {
      // Simulação de auditoria de segurança
      await new Promise(resolve => setTimeout(resolve, 3000));

      const mockResults = {
        overallScore: 85,
        lastAudit: new Date().toLocaleString('pt-PT'),
        categories: [
          {
            name: 'Autenticação',
            icon: FaKey,
            score: 90,
            status: 'good',
            issues: [
              { severity: 'low', message: '2 utilizadores com palavras-passe fracas' }
            ]
          },
          {
            name: 'Autorização',
            icon: FaLock,
            score: 95,
            status: 'excellent',
            issues: []
          },
          {
            name: 'Gestão de Utilizadores',
            icon: FaUserShield,
            score: 80,
            status: 'good',
            issues: [
              { severity: 'medium', message: '3 contas inativas há mais de 90 dias' },
              { severity: 'low', message: '1 utilizador com permissões elevadas não utilizadas' }
            ]
          },
          {
            name: 'Servidor',
            icon: FaServer,
            score: 75,
            status: 'moderate',
            issues: [
              { severity: 'high', message: 'Actualização de segurança disponível para o servidor' },
              { severity: 'medium', message: 'Certificado SSL expira em 30 dias' }
            ]
          },
          {
            name: 'Base de Dados',
            icon: FaDatabase,
            score: 88,
            status: 'good',
            issues: [
              { severity: 'low', message: 'Último backup há 12 horas' }
            ]
          },
          {
            name: 'Rede',
            icon: FaNetworkWired,
            score: 92,
            status: 'excellent',
            issues: []
          }
        ]
      };

      setAuditResults(mockResults);
      showToast('✓ Auditoria de segurança concluída!', 'success');
    } catch (error) {
      console.error('Erro ao executar auditoria:', error);
      showToast('✗ Erro ao executar auditoria de segurança.', 'error');
    } finally {
      setIsRunningAudit(false);
    }
  };

  useEffect(() => {
    // Executar auditoria inicial ao carregar o componente
    runSecurityAudit();
  }, []);

  const getScoreColor = (score) => {
    if (score >= 90) return '#28a745';
    if (score >= 75) return '#ffc107';
    if (score >= 60) return '#ff9900';
    return '#dc3545';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'excellent':
        return <FaCheckCircle style={{ color: '#28a745' }} />;
      case 'good':
        return <FaCheckCircle style={{ color: '#ffc107' }} />;
      case 'moderate':
        return <FaExclamationTriangle style={{ color: '#ff9900' }} />;
      case 'poor':
        return <FaTimesCircle style={{ color: '#dc3545' }} />;
      default:
        return <FaCheckCircle style={{ color: '#6c757d' }} />;
    }
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      high: 'admin-badge-danger',
      medium: 'admin-badge-warning',
      low: 'admin-badge-info'
    };
    return badges[severity] || 'admin-badge-info';
  };

  return (
    <div>
      {/* Cabeçalho com pontuação geral */}
      <div className="admin-section-admin">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h2>
              <FaShieldAlt style={{ marginRight: '10px', color: '#0066cc' }} />
              Auditoria de Segurança
            </h2>
            {auditResults.lastAudit && (
              <p style={{ color: '#6c757d', marginTop: '5px' }}>
                Última auditoria: {auditResults.lastAudit}
              </p>
            )}
          </div>
          
          <button 
            className="btn-primary-admin"
            onClick={runSecurityAudit}
            disabled={isRunningAudit}
            style={{
              opacity: isRunningAudit ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '1rem',
              padding: '14px 24px'
            }}
          >
            <FaShieldAlt />
            {isRunningAudit ? 'A executar auditoria...' : 'Executar Nova Auditoria'}
          </button>
        </div>

        {/* Pontuação Geral */}
        {auditResults.overallScore > 0 && (
          <div style={{
            marginTop: '30px',
            padding: '30px',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #fff 100%)',
            borderRadius: '16px',
            textAlign: 'center',
            border: '2px solid #e9ecef'
          }}>
            <h3 style={{ marginBottom: '15px', color: '#495057' }}>Pontuação Geral de Segurança</h3>
            <div style={{
              fontSize: '4rem',
              fontWeight: '800',
              color: getScoreColor(auditResults.overallScore),
              marginBottom: '10px'
            }}>
              {auditResults.overallScore}%
            </div>
            <div style={{
              width: '100%',
              maxWidth: '400px',
              height: '20px',
              background: '#e9ecef',
              borderRadius: '10px',
              margin: '0 auto',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${auditResults.overallScore}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${getScoreColor(auditResults.overallScore)} 0%, ${getScoreColor(auditResults.overallScore)}dd 100%)`,
                transition: 'width 1s ease'
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Categorias de Segurança */}
      {auditResults.categories.length > 0 && (
        <div className="admin-section-admin" style={{ marginTop: '30px' }}>
          <h2>📋 Análise Detalhada por Categoria</h2>
          
          <div style={{ display: 'grid', gap: '20px', marginTop: '25px' }}>
            {auditResults.categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <div key={index} style={{
                  padding: '25px',
                  background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
                  borderRadius: '12px',
                  border: '1px solid #e9ecef',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <Icon style={{ fontSize: '2rem', color: '#0066cc' }} />
                      <div>
                        <h3 style={{ margin: 0, color: '#1a1a1a' }}>{category.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                          {getStatusIcon(category.status)}
                          <span style={{ 
                            fontSize: '1.5rem', 
                            fontWeight: 'bold',
                            color: getScoreColor(category.score)
                          }}>
                            {category.score}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  <div style={{
                    width: '100%',
                    height: '12px',
                    background: '#e9ecef',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    marginBottom: '15px'
                  }}>
                    <div style={{
                      width: `${category.score}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${getScoreColor(category.score)} 0%, ${getScoreColor(category.score)}dd 100%)`,
                      transition: 'width 1s ease'
                    }} />
                  </div>

                  {/* Issues */}
                  {category.issues.length > 0 ? (
                    <div>
                      <h4 style={{ color: '#495057', marginBottom: '10px', fontSize: '0.95rem' }}>
                        Problemas Detectados:
                      </h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {category.issues.map((issue, idx) => (
                          <li key={idx} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px',
                            padding: '10px',
                            background: '#f8f9fa',
                            borderRadius: '8px',
                            marginBottom: '8px'
                          }}>
                            <FaExclamationTriangle style={{ 
                              color: issue.severity === 'high' ? '#dc3545' : issue.severity === 'medium' ? '#ffc107' : '#17a2b8',
                              fontSize: '1.2rem'
                            }} />
                            <div style={{ flex: 1 }}>
                              <span className={`admin-badge ${getSeverityBadge(issue.severity)}`}>
                                {issue.severity === 'high' ? 'Alta' : issue.severity === 'medium' ? 'Média' : 'Baixa'}
                              </span>
                              <span style={{ marginLeft: '10px', color: '#495057' }}>
                                {issue.message}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div style={{ 
                      padding: '15px', 
                      background: '#d4edda', 
                      borderRadius: '8px',
                      color: '#155724',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <FaCheckCircle style={{ fontSize: '1.3rem' }} />
                      <span style={{ fontWeight: '600' }}>Nenhum problema detectado nesta categoria</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Logs de Segurança */}
      <div className="admin-section-admin" style={{ marginTop: '30px' }}>
        <h2>📜 Logs de Segurança Recentes</h2>
        
        <table className="admin-table-admin" style={{ marginTop: '20px' }}>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Mensagem</th>
              <th>Data/Hora</th>
            </tr>
          </thead>
          <tbody>
            {securityLogs.map(log => (
              <tr key={log.id}>
                <td>
                  {log.type === 'error' && (
                    <span className="admin-badge admin-badge-danger">
                      <FaTimesCircle style={{ marginRight: '5px' }} />
                      Erro
                    </span>
                  )}
                  {log.type === 'warning' && (
                    <span className="admin-badge admin-badge-warning">
                      <FaExclamationTriangle style={{ marginRight: '5px' }} />
                      Aviso
                    </span>
                  )}
                  {log.type === 'success' && (
                    <span className="admin-badge admin-badge-success">
                      <FaCheckCircle style={{ marginRight: '5px' }} />
                      Sucesso
                    </span>
                  )}
                  {log.type === 'info' && (
                    <span className="admin-badge admin-badge-info">
                      <FaCheckCircle style={{ marginRight: '5px' }} />
                      Info
                    </span>
                  )}
                </td>
                <td>{log.message}</td>
                <td>{log.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={closeToast}
      />
    </div>
  );
};

export default SecurityAudit;
