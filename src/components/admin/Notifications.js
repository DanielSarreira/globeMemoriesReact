// src/components/admin/Notifications.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/Admin.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([
    // Mock data
    { _id: '1', message: 'Bem-vindo ao Globe Memories!', recipient: 'Todos', sentAt: '2025-03-01' },
    { _id: '2', message: 'Nova funcionalidade disponível!', recipient: 'tiago', sentAt: '2025-03-02' },
  ]);
  const [newNotification, setNewNotification] = useState({ message: '', recipient: '' });

  useEffect(() => {
    // Placeholder para chamada à API
    const fetchNotifications = async () => {
      // const { data } = await axios.get('/api/notifications', {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      // });
      // setNotifications(data);
    };
    fetchNotifications();
  }, []);

  const handleSend = async () => {
    // Placeholder para chamada à API
    setNotifications([...notifications, { _id: Date.now().toString(), ...newNotification, sentAt: new Date().toISOString().split('T')[0] }]);
    setNewNotification({ message: '', recipient: '' });
  };

  const handleDelete = async (id) => {
    // Placeholder para chamada à API
    setNotifications(notifications.filter(notification => notification._id !== id));
  };

  return (
    <div className="admin-section-admin">
      <h2>Notificações</h2>
      <div className="form-group-admin">
        <input
          type="text"
          placeholder="Mensagem"
          value={newNotification.message}
          onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
        />
        <input
          type="text"
          placeholder="Destinatário (ex.: Todos, tiago)"
          value={newNotification.recipient}
          onChange={(e) => setNewNotification({ ...newNotification, recipient: e.target.value })}
        />
        <button className="btn-primary-admin" onClick={handleSend}>Enviar Notificação</button>
      </div>
      <table className="admin-table-admin">
        <thead>
          <tr>
            <th>Mensagem</th>
            <th>Destinatário</th>
            <th>Data de Envio</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {notifications.map(notification => (
            <tr key={notification._id}>
              <td>{notification.message}</td>
              <td>{notification.recipient}</td>
              <td>{notification.sentAt}</td>
              <td>
                <button className="btn-danger-admin" onClick={() => handleDelete(notification._id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Notifications;