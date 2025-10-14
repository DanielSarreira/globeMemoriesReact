// src/components/admin/ContentManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Toast from '../Toast';
import '../../styles/Admin.css';

const ContentManagement = () => {
  const [contents, setContents] = useState([
    // Mock data
    { _id: '1', title: 'Minha Viagem a Lisboa', author: 'tiago', status: 'Publicado', createdAt: '2025-03-01' },
    { _id: '2', title: 'Explorando o Rio', author: 'ana', status: 'Pendente', createdAt: '2025-03-02' },
  ]);

  const [toast, setToast] = useState({ message: '', type: '', isVisible: false });

  const showToast = (message, type) => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 2600);
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  useEffect(() => {
    // Placeholder para chamada à API
    const fetchContents = async () => {
      // const { data } = await axios.get('/api/contents', {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      // });
      // setContents(data);
    };
    fetchContents();
  }, []);

  const handleApprove = async (id) => {
    try {
      // Placeholder para chamada à API
      setContents(contents.map(content =>
        content._id === id ? { ...content, status: 'Publicado' } : content
      ));
      showToast('Conteúdo aprovado e publicado com sucesso!', 'success');
    } catch (error) {
      showToast('Erro ao aprovar conteúdo. Tente novamente.', 'error');
    }
  };

  const handleReject = async (id) => {
    try {
      // Placeholder para chamada à API
      setContents(contents.map(content =>
        content._id === id ? { ...content, status: 'Rejeitado' } : content
      ));
      showToast('Conteúdo rejeitado com sucesso!', 'success');
    } catch (error) {
      showToast('Erro ao rejeitar conteúdo. Tente novamente.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja eliminar este conteúdo? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      // Placeholder para chamada à API
      setContents(contents.filter(content => content._id !== id));
      showToast('Conteúdo eliminado com sucesso!', 'success');
    } catch (error) {
      showToast('Erro ao eliminar conteúdo. Tente novamente.', 'error');
    }
  };

  return (
    <div className="admin-section-admin">
      <h2>Gestão de Conteúdo</h2>
      <table className="admin-table-admin">
        <thead>
          <tr>
            <th>Título</th>
            <th>Autor</th>
            <th>Status</th>
            <th>Data de Criação</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {contents.map(content => (
            <tr key={content._id}>
              <td>{content.title}</td>
              <td>{content.author}</td>
              <td>{content.status}</td>
              <td>{content.createdAt}</td>
              <td>
                {content.status === 'Pendente' && (
                  <>
                    <button className="btn-success-admin" onClick={() => handleApprove(content._id)}>Aprovar</button>
                    <button className="btn-warning-admin" onClick={() => handleReject(content._id)}>Rejeitar</button>
                  </>
                )}
                <button className="btn-danger-admin" onClick={() => handleDelete(content._id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
};

export default ContentManagement;