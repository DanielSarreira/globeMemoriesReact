import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/styles.css';

// Dados mockados para notificações (simulando o backend)
const mockNotifications = [
  { id: 1, userId: 'user1', type: 'follow', message: 'AnaSilva começou a seguir-te!', relatedId: 'AnaSilva', isRead: false, createdAt: '2025-03-27T10:00:00' },
  { id: 2, userId: 'user1', type: 'follow', message: 'AnaSilva pediu para seguir!', relatedId: 'AnaSilva', isRead: false, createdAt: '2025-03-27T09:00:00' },
  { id: 3, userId: 'user1', type: 'follow', message: 'AnaSilva deixou de te seguir!', relatedId: 'AnaSilva', isRead: false, createdAt: '2025-03-26T15:30:00' },
  { id: 4, userId: 'user1', type: 'like', message: 'AnaSilva gostou da tua viagem!', relatedId: '1', isRead: false, createdAt: '2025-03-20T12:00:00' },
  { id: 5, userId: 'user1', type: 'comment', message: 'AnaSilva comentou na tua viagem: "Incrível!"', relatedId: '1', isRead: false, createdAt: '2025-02-25T08:00:00' },
  { id: 6, userId: 'user1', type: 'follow', message: 'TiagoMiranda começou a seguir-te!', relatedId: 'TiagoMiranda', isRead: false, createdAt: '2025-01-15T14:00:00' },
];

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(mockNotifications);

  // Função para agrupar notificações por período
  const groupNotificationsByPeriod = (notifications) => {
    const today = new Date('2025-03-27T00:00:00'); // Data atual (27/03/2025)
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const grouped = {
      today: [],
      yesterday: [],
      last7Days: [],
      last30Days: [],
      older: [],
    };

    notifications.forEach((notif) => {
      const notifDate = new Date(notif.createdAt);
      const notifDateOnly = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());

      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

      if (notifDateOnly.getTime() === todayOnly.getTime()) {
        grouped.today.push(notif);
      } else if (notifDateOnly.getTime() === yesterdayOnly.getTime()) {
        grouped.yesterday.push(notif);
      } else if (notifDate >= sevenDaysAgo && notifDate < yesterday) {
        grouped.last7Days.push(notif);
      } else if (notifDate >= thirtyDaysAgo && notifDate < sevenDaysAgo) {
        grouped.last30Days.push(notif);
      } else {
        grouped.older.push(notif);
      }
    });

    return grouped;
  };

  const markAsRead = (notificationId) => {
    setNotifications(notifications.map((notif) =>
      notif.id === notificationId ? { ...notif, isRead: true } : notif
    ));
  };

  // Agrupar notificações
  const groupedNotifications = groupNotificationsByPeriod(notifications);

  // Função para formatar a data e hora
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="notifications-page">
      <h2>Notificações</h2>
      {notifications.length > 0 ? (
        <div className="notifications-list">
          {/* Hoje */}
          {groupedNotifications.today.length > 0 && (
            <>
              <h3 className="notification-period">Hoje</h3>
              <ul>
                {groupedNotifications.today.map((notif) => (
                  <li
                    key={notif.id}
                    className={`notification-item ${notif.isRead ? 'read' : 'unread'}`}
                  >
                    <div className="notification-content">
                      <Link
                        to={notif.type === 'like' || notif.type === 'comment' ? `/travel/${notif.relatedId}` : `/profile/${notif.relatedId}`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        {notif.message}
                      </Link>
                      <span className="notification-time">{formatDateTime(notif.createdAt)}h</span>
                    </div>
                    {!notif.isRead && (
                      <button onClick={() => markAsRead(notif.id)} className="mark-as-read-button">
                        Marcar como lida
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Ontem */}
          {groupedNotifications.yesterday.length > 0 && (
            <>
              <h3 className="notification-period">Ontem</h3>
              <ul>
                {groupedNotifications.yesterday.map((notif) => (
                  <li
                    key={notif.id}
                    className={`notification-item ${notif.isRead ? 'read' : 'unread'}`}
                  >
                    <div className="notification-content">
                      <Link
                        to={notif.type === 'like' || notif.type === 'comment' ? `/travel/${notif.relatedId}` : `/profile/${notif.relatedId}`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        {notif.message}
                      </Link>
                      <span className="notification-time">{formatDateTime(notif.createdAt)}h</span>
                    </div>
                    {!notif.isRead && (
                      <button onClick={() => markAsRead(notif.id)} className="mark-as-read-button">
                        Marcar como lida
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Últimos 7 dias */}
          {groupedNotifications.last7Days.length > 0 && (
            <>
              <h3 className="notification-period">Últimos 7 dias</h3>
              <ul>
                {groupedNotifications.last7Days.map((notif) => (
                  <li
                    key={notif.id}
                    className={`notification-item ${notif.isRead ? 'read' : 'unread'}`}
                  >
                    <div className="notification-content">
                      <Link
                        to={notif.type === 'like' || notif.type === 'comment' ? `/travel/${notif.relatedId}` : `/profile/${notif.relatedId}`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        {notif.message}
                      </Link>
                      <span className="notification-time">{formatDateTime(notif.createdAt)}h</span>
                    </div>
                    {!notif.isRead && (
                      <button onClick={() => markAsRead(notif.id)} className="mark-as-read-button">
                        Marcar como lida
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Últimos 30 dias */}
          {groupedNotifications.last30Days.length > 0 && (
            <>
              <h3 className="notification-period">Últimos 30 dias</h3>
              <ul>
                {groupedNotifications.last30Days.map((notif) => (
                  <li
                    key={notif.id}
                    className={`notification-item ${notif.isRead ? 'read' : 'unread'}`}
                  >
                    <div className="notification-content">
                      <Link
                        to={notif.type === 'like' || notif.type === 'comment' ? `/travel/${notif.relatedId}` : `/profile/${notif.relatedId}`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        {notif.message}
                      </Link>
                      <span className="notification-time">{formatDateTime(notif.createdAt)}h</span>
                    </div>
                    {!notif.isRead && (
                      <button onClick={() => markAsRead(notif.id)} className="mark-as-read-button">
                        Marcar como lida
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Mais Antigas */}
          {groupedNotifications.older.length > 0 && (
            <>
              <h3 className="notification-period">Mais Antigas</h3>
              <ul>
                {groupedNotifications.older.map((notif) => (
                  <li
                    key={notif.id}
                    className={`notification-item ${notif.isRead ? 'read' : 'unread'}`}
                  >
                    <div className="notification-content">
                      <Link
                        to={notif.type === 'like' || notif.type === 'comment' ? `/travel/${notif.relatedId}` : `/profile/${notif.relatedId}`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        {notif.message}
                      </Link>
                      <span className="notification-time">{formatDateTime(notif.createdAt)}h</span>
                    </div>
                    {!notif.isRead && (
                      <button onClick={() => markAsRead(notif.id)} className="mark-as-read-button">
                        Marcar como lida
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : (
        <p>Nenhuma notificação disponível.</p>
      )}
    </div>
  );
};

export default Notifications;