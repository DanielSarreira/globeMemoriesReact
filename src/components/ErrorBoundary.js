// src/components/ErrorBoundary.js
import React from 'react';
import { motion } from 'framer-motion';
import { FaExclamationTriangle, FaHome, FaRedo } from 'react-icons/fa';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Atualiza o state para mostrar a UI de erro
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log do erro para debugging (mantido console.error para erros críticos)
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Aqui poderia enviar o erro para um serviço de logging como Sentry
    // this.logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // UI customizada de erro
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px',
          fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
        }}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '40px',
              maxWidth: '600px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              style={{
                fontSize: '4rem',
                color: '#ff6b6b',
                marginBottom: '20px'
              }}
            >
              <FaExclamationTriangle />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                fontSize: '2rem',
                color: '#333',
                marginBottom: '15px',
                fontWeight: '600'
              }}
            >
              Oops! Algo correu mal
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{
                fontSize: '1.1rem',
                color: '#666',
                marginBottom: '30px',
                lineHeight: '1.6'
              }}
            >
              Pedimos desculpa, mas ocorreu um erro inesperado. 
              A nossa equipa foi notificada e está a trabalhar para resolver o problema.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}
            >
              <button
                onClick={this.handleRetry}
                style={{
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'transform 0.2s ease',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                <FaRedo style={{ fontSize: '0.9rem' }} />
                Tentar Novamente
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  background: 'transparent',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#667eea';
                  e.target.style.color = 'white';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#667eea';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <FaHome style={{ fontSize: '0.9rem' }} />
                Ir para Início
              </button>
            </motion.div>

            {/* Informações técnicas para desenvolvimento (só em dev mode) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <motion.details
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                style={{
                  marginTop: '30px',
                  textAlign: 'left',
                  background: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}
              >
                <summary style={{
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: '#666',
                  marginBottom: '10px'
                }}>
                  Detalhes Técnicos (Desenvolvimento)
                </summary>
                <div style={{
                  fontSize: '0.9rem',
                  color: '#666',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  background: 'white',
                  padding: '15px',
                  borderRadius: '4px',
                  border: '1px solid #dee2e6',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  <strong>Erro:</strong> {this.state.error && this.state.error.toString()}
                  <br />
                  <strong>Stack Trace:</strong>
                  <br />
                  {this.state.errorInfo.componentStack}
                </div>
              </motion.details>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              style={{
                marginTop: '25px',
                fontSize: '0.9rem',
                color: '#999'
              }}
            >
              Tentativas de recuperação: {this.state.retryCount}
            </motion.div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;