import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { request, setAuthHeader, uploadFile, toFullMediaUrl, getUserAvatar } from '../axios_helper';
import { useAuth } from '../context/AuthContext';
import { FaSave, FaTimes, FaArrowLeft, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import ProfilePhotoUploader from '../components/ProfilePhotoUploader';
import TermsModal from '../components/TermsModal';
import '../styles/pages/edit-profile.css';

/**
 * /profile/edit/:username — edit the authenticated user's own profile.
 *
 * Mirrors the fields of GET /users/{id}/detailed and PATCH
 * /users/{id}/update-profile. The profile photo lives in a separate
 * endpoint (POST /photos/upload) so we do a 2-step save: profile
 * fields first, then photo (if changed), then refresh.
 */
const EditProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    userBio: '',
    nationality: '',
    city: '',
    gender: '',
    birthDate: '',
    languagesSpoken: '',
  });
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [originalPhoto, setOriginalPhoto] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Authorization: only the user themselves can edit their profile.
  useEffect(() => {
    if (!user) {
      // AuthContext hasn't rehydrated yet — wait a tick.
      return;
    }
    if (user.username !== username) {
      showToast('Não tem permissão para editar este perfil.', 'error');
      navigate(`/profile/${user.username}`);
    }
  }, [user, username, navigate]);

  // Load the existing profile data once.
  useEffect(() => {
    if (!user || user.username !== username) return undefined;
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await request('GET', `/users/${user.id}/detailed`);
        if (!isMounted) return;
        setForm({
          firstName: res.data.firstName || '',
          lastName: res.data.lastName || '',
          userBio: res.data.userBio || '',
          nationality: res.data.nationality || '',
          city: res.data.city || '',
          gender: res.data.gender || '',
          birthDate: res.data.birthDate || '',
          languagesSpoken: res.data.languagesSpoken || '',
        });
        const photo = res.data.profilePhoto || null;
        setCurrentPhoto(photo);
        setOriginalPhoto(photo);
        setPhotoRemoved(false);
      } catch (err) {
        showToast(err.response?.data?.message || 'Não foi possível carregar o perfil.', 'error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [user, username]);

  const showToast = (message, type) => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  const handleField = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  // ── Inline validation (mirrors backend constraints) ──────────
  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = 'Nome é obrigatório.';
    else if (form.firstName.length > 50) next.firstName = 'Nome demasiado longo (máx. 50).';
    if (!form.lastName.trim()) next.lastName = 'Apelido é obrigatório.';
    else if (form.lastName.length > 50) next.lastName = 'Apelido demasiado longo (máx. 50).';
    if (form.userBio.length > 500) next.userBio = 'Bio demasiado longa (máx. 500 caracteres).';
    if (form.nationality.length > 50) next.nationality = 'Nacionalidade demasiado longa (máx. 50).';
    if (form.city.length > 100) next.city = 'Cidade demasiado longa (máx. 100).';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePhotoChange = (file) => {
    setPhotoFile(file);
    setPhotoRemoved(file === null);
    if (file) {
      // Create a blob: URL so the uploader can preview the new file
      // while we still hold the original URL.
      setCurrentPhoto(URL.createObjectURL(file));
    } else {
      setCurrentPhoto(null);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!validate()) {
      showToast('Verifique os campos em falta antes de guardar.', 'error');
      return;
    }
    setSaving(true);
    try {
      // 1. Save the text fields first. We pass an array of languages
      //    so the backend can map them to IDs in the languages_spoken
      //    join table; if the user left it blank we send an empty
      //    array to clear the field.
      const languages = (form.languagesSpoken || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await request('PATCH', `/users/${user.id}/update-profile`, {
        firstName: form.firstName,
        lastName: form.lastName,
        userBio: form.userBio,
        nationality: form.nationality,
        city: form.city,
        gender: form.gender,
        birthDate: form.birthDate || null,
        languagesSpoken: languages.join(', '),
      });

      // 2. Photo: upload only if the user picked a new one, OR delete
      //    if they explicitly removed the existing one.
      if (photoFile) {
        const upRes = await uploadFile('/photos/upload', photoFile);
        const newUrl = upRes?.data?.fileUrl;
        if (newUrl) {
          // We set BOTH `profilePhoto` (canonical backend field) and
          // `profilePicture` (legacy alias used by some components
          // like the Header) so every consumer renders the new photo
          // immediately without a refresh.
          const updated = {
            ...user,
            profilePhoto: newUrl,
            profilePicture: newUrl,
          };
          setUser(updated);
          localStorage.setItem('user', JSON.stringify(updated));
        }
      } else if (photoRemoved && originalPhoto) {
        // The backend exposes DELETE /photos/profile (note: this is
        // /photos + /profile = /photos/profile — matches the
        // controller mapping). Returns 200 with empty body.
        try {
          await request('DELETE', '/photos/profile');
        } catch (delErr) {
          // Best-effort — at worst the photo stays the same and the
          // user can retry.
          console.warn('Photo delete failed:', delErr);
        }
        const updated = { ...user, profilePhoto: null, profilePicture: null };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      }

      showToast('Perfil atualizado com sucesso!', 'success');
      // After a short delay, bounce back to the view page.
      setTimeout(() => navigate(`/profile/${user.username}`), 800);
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao guardar o perfil. Tente novamente.';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-profile-container edit-profile-loading">
        <div className="edit-profile-spinner" />
        <p>A carregar o seu perfil…</p>
      </div>
    );
  }

  return (
    <div className="edit-profile-container">
      <header className="edit-profile-header">
        <Link to={`/profile/${username}`} className="edit-profile-back">
          <FaArrowLeft /> Voltar ao perfil
        </Link>
        <h1>
          <span aria-hidden="true">✏️</span> Editar Perfil
        </h1>
        <p className="edit-profile-subtitle">
          Mantenha o seu perfil actualizado para que outros viajantes o conheçam melhor.
        </p>
      </header>

      <form onSubmit={handleSave} className="edit-profile-form" noValidate>
        {/* Photo card — sits at the top for visual prominence */}
        <section className="edit-profile-card edit-profile-photo-card">
          <h2>📸 Foto de Perfil</h2>
          <p className="edit-profile-card-hint">
            A foto aparece no seu perfil, comentários e feed. Use uma imagem quadrada com pelo menos 200×200px.
          </p>
          <ProfilePhotoUploader
            currentPhoto={originalPhoto}
            onFileChange={handlePhotoChange}
            disabled={saving}
          />
          {photoRemoved && originalPhoto && (
            <p className="edit-profile-photo-warning" role="alert">
              ⚠️ A foto actual será removida quando guardar.
            </p>
          )}
        </section>

        {/* Identity card */}
        <section className="edit-profile-card">
          <h2>👤 Identidade</h2>
          <div className="edit-profile-grid">
            <div className="edit-profile-field">
              <label htmlFor="firstName">
                Nome <span className="required-star">*</span>
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={form.firstName}
                onChange={handleField}
                maxLength={50}
                className={errors.firstName ? 'input-error' : ''}
                placeholder="O seu nome"
              />
              {errors.firstName && (
                <span className="field-error-message"><FaExclamationCircle /> {errors.firstName}</span>
              )}
            </div>
            <div className="edit-profile-field">
              <label htmlFor="lastName">
                Apelido <span className="required-star">*</span>
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={form.lastName}
                onChange={handleField}
                maxLength={50}
                className={errors.lastName ? 'input-error' : ''}
                placeholder="O seu apelido"
              />
              {errors.lastName && (
                <span className="field-error-message"><FaExclamationCircle /> {errors.lastName}</span>
              )}
            </div>
          </div>
        </section>

        {/* Bio + basics card */}
        <section className="edit-profile-card">
          <h2>📝 Sobre Mim</h2>
          <div className="edit-profile-field">
            <label htmlFor="userBio">Bio</label>
            <textarea
              id="userBio"
              name="userBio"
              value={form.userBio}
              onChange={handleField}
              maxLength={500}
              rows={4}
              placeholder="Conte um pouco sobre si e o tipo de viagens que gosta de fazer…"
            />
            <small className="char-counter">{form.userBio.length}/500 caracteres</small>
            {errors.userBio && (
              <span className="field-error-message"><FaExclamationCircle /> {errors.userBio}</span>
            )}
          </div>
        </section>

        {/* Location + personal */}
        <section className="edit-profile-card">
          <h2>🌍 Nacionalidade & Localidade</h2>
          <div className="edit-profile-grid">
            <div className="edit-profile-field">
              <label htmlFor="nationality">Nacionalidade</label>
              <input
                id="nationality"
                name="nationality"
                type="text"
                value={form.nationality}
                onChange={handleField}
                maxLength={50}
                placeholder="Ex.: Portuguesa"
              />
              {errors.nationality && (
                <span className="field-error-message"><FaExclamationCircle /> {errors.nationality}</span>
              )}
            </div>
            <div className="edit-profile-field">
              <label htmlFor="city">Cidade atual</label>
              <input
                id="city"
                name="city"
                type="text"
                value={form.city}
                onChange={handleField}
                maxLength={100}
                placeholder="Ex.: Braga"
              />
              {errors.city && (
                <span className="field-error-message"><FaExclamationCircle /> {errors.city}</span>
              )}
            </div>
          </div>
        </section>

        {/* Personal */}
        <section className="edit-profile-card">
          <h2>👤 Detalhes Pessoais</h2>
          <div className="edit-profile-grid">
            <div className="edit-profile-field">
              <label htmlFor="gender">Género</label>
              <select
                id="gender"
                name="gender"
                value={form.gender || ''}
                onChange={handleField}
              >
                <option value="">Prefiro não dizer</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div className="edit-profile-field">
              <label htmlFor="birthDate">Data de nascimento</label>
              <input
                id="birthDate"
                name="birthDate"
                type="date"
                value={form.birthDate || ''}
                onChange={handleField}
              />
            </div>
          </div>
        </section>

        {/* Languages */}
        <section className="edit-profile-card">
          <h2>🗣️ Línguas que fala</h2>
          <div className="edit-profile-field">
            <label htmlFor="languagesSpoken">
              Línguas (separadas por vírgula)
            </label>
            <input
              id="languagesSpoken"
              name="languagesSpoken"
              type="text"
              value={form.languagesSpoken}
              onChange={handleField}
              placeholder="Ex.: Português, Inglês, Espanhol"
            />
            <small className="field-hint">
              💡 Use vírgulas para separar. Ex.: &quot;Português, Inglês&quot;.
            </small>
          </div>
        </section>

        {/* Action bar */}
        <div className="edit-profile-actions">
          <button
            type="button"
            onClick={() => navigate(`/profile/${username}`)}
            className="edit-profile-btn-secondary"
            disabled={saving}
          >
            <FaTimes /> Cancelar
          </button>
          <button
            type="submit"
            className="edit-profile-btn-primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="edit-profile-spinner-inline" /> A guardar…
              </>
            ) : (
              <>
                <FaSave /> Guardar Alterações
              </>
            )}
          </button>
        </div>
      </form>

      {/* Inline toast */}
      {toast.show && (
        <div
          role="status"
          aria-live="polite"
          className={`edit-profile-toast edit-profile-toast-${toast.type}`}
        >
          {toast.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
          <span>{toast.message}</span>
        </div>
      )}

      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        initialTab="terms"
      />
    </div>
  );
};

export default EditProfile;
