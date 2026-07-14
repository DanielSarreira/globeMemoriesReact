import React, { useRef, useState, useEffect, useMemo } from 'react';
import { FaCamera, FaTrash, FaUserCircle } from 'react-icons/fa';
import { toFullMediaUrl } from '../utils/mediaUrl';

/**
 * Profile-photo uploader with a round preview, used by both Register
 * and EditProfile. The user picks a file (we show a blob: preview
 * instantly), and the parent component decides when to actually POST
 * the File to the backend (typically after a successful register
 * or alongside a profile save).
 *
 * Props:
 *   - currentPhoto: existing backend URL (or null) — shown when no
 *     new file is selected
 *   - onFileChange:  (file | null) => void — fired whenever the user
 *     picks / clears a file
 *   - maxSizeBytes:  max file size in bytes (default 5 MB)
 *   - disabled:      block the input
 */
const ProfilePhotoUploader = ({
  currentPhoto,
  onFileChange,
  maxSizeBytes = 5 * 1024 * 1024,
  disabled = false,
}) => {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  // Clean up blob: URLs when we unmount or pick a new photo
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const handlePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (!/^image\//.test(file.type)) {
      setError('Por favor escolha um ficheiro de imagem (JPG, PNG, GIF, WEBP).');
      return;
    }
    if (file.size > maxSizeBytes) {
      setError(`A imagem é demasiado grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Máximo: ${(maxSizeBytes / 1024 / 1024).toFixed(0)} MB.`);
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    const url = URL.createObjectURL(file);
    setPreview(url);
    onFileChange?.(file);
    // Reset input value so picking the same file again still triggers
    e.target.value = '';
  };

  const handleRemove = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setError(null);
    onFileChange?.(null);
  };

  // What's rendered: preview (blob) > currentPhoto (URL) > placeholder
  // `currentPhoto` is whatever the parent passes — usually a backend
  // path like "profile-photos/abc.jpg" (relative) or an absolute URL.
  // We resolve it through `toFullMediaUrl` so the <img> tag gets a
  // working URL regardless of the input format.
  const resolvedCurrentPhoto = useMemo(
    () => toFullMediaUrl(currentPhoto, { bustCache: true }),
    [currentPhoto],
  );
  const displaySrc = preview || resolvedCurrentPhoto;

  return (
    <div
      className="profile-photo-uploader"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
    >
      <div
        style={{
          position: 'relative',
          width: 140,
          height: 140,
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf3 100%)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.10), 0 0 0 4px white, 0 0 0 5px #e0e6ee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {displaySrc ? (
          <img
            src={displaySrc}
            alt="Pré-visualização da foto de perfil"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              // Backend URL returned 404 — fall back to the placeholder
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <FaUserCircle size={90} color="#b8c0cc" />
        )}
        {/* Hover overlay with camera icon — only when not disabled */}
        {!disabled && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label="Escolher foto de perfil"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.45)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 180ms ease',
              fontSize: 32,
            }}
            className="profile-photo-uploader-overlay"
          >
            <FaCamera />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handlePick}
        disabled={disabled}
        style={{ display: 'none' }}
      />

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="profile-photo-btn"
          style={{
            padding: '8px 16px',
            borderRadius: '999px',
            background: 'linear-gradient(135deg, #2bb6a3 0%, #1a8b7c 100%)',
            color: 'white',
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 2px 6px rgba(43, 182, 163, 0.30)',
          }}
        >
          <FaCamera /> {currentPhoto || preview ? 'Trocar foto' : 'Adicionar foto'}
        </button>
        {displaySrc && !disabled && (
          <button
            type="button"
            onClick={handleRemove}
            style={{
              padding: '8px 14px',
              borderRadius: '999px',
              background: 'transparent',
              color: '#c0392b',
              border: '1.5px solid #fad5d5',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <FaTrash /> Remover
          </button>
        )}
      </div>

      {error && (
        <p
          role="alert"
          style={{
            color: '#c0392b',
            fontSize: 12,
            fontWeight: 500,
            textAlign: 'center',
            margin: 0,
            maxWidth: 280,
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default ProfilePhotoUploader;
