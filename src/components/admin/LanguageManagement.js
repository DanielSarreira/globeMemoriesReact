// src/components/admin/LanguageManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { request } from '../../axios_helper';
import Toast from '../Toast';
import { FaExclamationCircle } from 'react-icons/fa';
import '../../styles/Admin.css';

const LanguageManagement = () => {
  const [languages, setLanguages] = useState([]);
  const [form, setForm] = useState({ name: '', code: '' });
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const showToast = (m, t) => setToast({ message: m, type: t, show: true });
  const closeToast = () => setToast({ ...toast, show: false });

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await request('GET', '/admin/languages');
      setLanguages(r.data || []);
    } catch (e) {
      showToast('Erro ao carregar línguas.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const validate = (name, value) => {
    if (name === 'name' && !value.trim()) return 'Nome é obrigatório';
    if (name === 'code') {
      if (!value.trim()) return 'Código é obrigatório';
      if (!/^[a-z]{2,5}$/.test(value.trim())) return 'Código deve ter 2-5 letras minúsculas';
    }
    return '';
  };

  const handleChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: validate(field, value) }));
  };

  const save = async () => {
    const errs = {};
    Object.keys(form).forEach((k) => {
      const e = validate(k, form[k]);
      if (e) errs[k] = e;
    });
    setErrors(errs);
    if (Object.keys(errs).length) {
      showToast('Corrija os erros no formulário', 'error');
      return;
    }
    setIsLoading(true);
    try {
      if (editing) {
        await request('PUT', `/admin/languages/${editing.id}`, form);
        showToast('Língua atualizada.', 'success');
      } else {
        await request('POST', '/admin/languages', form);
        showToast('Língua criada.', 'success');
      }
      setForm({ name: '', code: '' });
      setEditing(null);
      await fetch();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a guardar língua.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Eliminar esta língua?')) return;
    setIsLoading(true);
    try {
      await request('DELETE', `/admin/languages/${id}`);
      showToast('Língua eliminada.', 'success');
      await fetch();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Erro a eliminar.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-section-admin">
      <h2>Gestão de Línguas</h2>
      <div className="form-group-admin" style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Nome (ex: Português)"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          disabled={isLoading}
          maxLength={55}
        />
        {errors.name && <div className="field-error"><FaExclamationCircle /> {errors.name}</div>}
        <input
          type="text"
          placeholder="Código ISO (ex: pt)"
          value={form.code}
          onChange={(e) => handleChange('code', e.target.value.toLowerCase())}
          disabled={isLoading}
          maxLength={5}
          style={{ marginTop: '10px' }}
        />
        {errors.code && <div className="field-error"><FaExclamationCircle /> {errors.code}</div>}
        <div style={{ marginTop: '10px' }}>
          {editing ? (
            <>
              <button className="btn-primary-admin" onClick={save} disabled={isLoading}>Guardar</button>
              <button className="btn-danger-admin" onClick={() => { setEditing(null); setForm({ name: '', code: '' }); }}>Cancelar</button>
            </>
          ) : (
            <button className="btn-primary-admin" onClick={save} disabled={isLoading}>Adicionar Língua</button>
          )}
        </div>
      </div>
      <table className="admin-table-admin">
        <thead>
          <tr><th>Nome</th><th>Código</th><th>Ações</th></tr>
        </thead>
        <tbody>
          {languages.map((l) => (
            <tr key={l.id}>
              <td>{l.name}</td>
              <td>{l.code}</td>
              <td>
                <button className="btn-warning-admin" onClick={() => { setEditing(l); setForm({ name: l.name, code: l.code }); }}>Editar</button>
                <button className="btn-danger-admin" onClick={() => remove(l.id)} style={{ marginLeft: '6px' }}>Eliminar</button>
              </td>
            </tr>
          ))}
          {languages.length === 0 && (
            <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>Nenhuma língua registada.</td></tr>
          )}
        </tbody>
      </table>
      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={closeToast} />
    </div>
  );
};

export default LanguageManagement;
