// src/components/admin/ContentManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/Admin.css';

const ContentManagement = () => {
  const [contents, setContents] = useState([
    // Mock data
    { _id: '1', title: 'Minha Viagem a Lisboa', author: 'tiago', status: 'Publicado', createdAt: '2025-03-01' },
    { _id: '2', title: 'Explorando o Rio', author: 'ana', status: 'Pendente', createdAt: '2025-03-02' },
  ]);

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
    // Placeholder para chamada à API
    setContents(contents.map(content =>
      content._id === id ? { ...content, status: 'Publicado' } : content
    ));
  };

  const handleReject = async (id) => {
    // Placeholder para chamada à API
    setContents(contents.map(content =>
      content._id === id ? { ...content, status: 'Rejeitado' } : content
    ));
  };

  const handleDelete = async (id) => {
    // Placeholder para chamada à API
    setContents(contents.filter(content => content._id !== id));
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
    </div>
  );
};

export default ContentManagement;