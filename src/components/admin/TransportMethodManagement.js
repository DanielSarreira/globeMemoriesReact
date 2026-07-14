// src/components/admin/TransportMethodManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { request } from '../../axios_helper';
import Toast from '../Toast';
import { FaExclamationCircle } from 'react-icons/fa';
import '../../styles/Admin.css';

const TransportMethodManagement = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '' });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const showToast = (m, t) => setToast({ message: m, type: t, show: true });
  const closeToast = () => setToast({ ...toast, show: false });

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await request('GET', '/admin/transports');
      setItems(r.data || []);
    } catch (e) {
      showToast('Erro a carregar métodos de transporte.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const save = async () => {
    if (!form.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      if (editing) {
        await request('PUT', `/admin/transports/${editing.id}`, { name: form.name.trim() });
        showToast('Método de transporte atualizado.', 'success');
      } else {
        await request('POST', '/admin/transports', { name: form.name.trim() });
        showToast('Método de transporte criado.', 'success');
      }
      setForm({ name: '' });
      setEditing(null);
      await fetch();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a guardar.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Eliminar este método de transporte?')) return;
    setIsLoading(true);
    try {
      await request('DELETE', `/admin/transports/${id}`);
      showToast('Método eliminado.', 'success');
      await fetch();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a eliminar.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-section-admin">
      <h2>Gestão de Métodos de Transporte</h2>
      <div className="form-group-admin" style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Nome (ex: Avião)"
          value={form.name}
          onChange={(e) => { setForm({ name: e.target.value }); setError(''); }}
          disabled={isLoading}
          maxLength={55}
        />
        {error && <div className="field-error"><FaExclamationCircle /> {error}</div>}
        <div style={{ marginTop: '10px' }}>
          {editing ? (
            <>
              <button className="btn-primary-admin" onClick={save} disabled={isLoading}>Guardar</button>
              <button className="btn-danger-admin" onClick={() => { setEditing(null); setForm({ name: '' }); }}>Cancelar</button>
            </>
          ) : (
            <button className="btn-primary-admin" onClick={save} disabled={isLoading}>Adicionar</button>
          )}
        </div>
      </div>
      <table className="admin-table-admin">
        <thead><tr><th>Nome</th><th>Ações</th></tr></thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id}>
              <td>{t.name}</td>
              <td>
                <button className="btn-warning-admin" onClick={() => { setEditing(t); setForm({ name: t.name }); }}>Editar</button>
                <button className="btn-danger-admin" onClick={() => remove(t.id)} style={{ marginLeft: '6px' }}>Eliminar</button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan="2" style={{ textAlign: 'center', padding: '20px' }}>Nenhum método registado.</td></tr>
          )}
        </tbody>
      </table>
      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={closeToast} />
    </div>
  );
};

export default TransportMethodManagement;
