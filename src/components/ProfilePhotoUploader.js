import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Camera as IconCamera, Trash as IconTrash, UserCircle as IconUser } from 'lucide-react';
import { toFullMediaUrl } from '../utils/mediaUrl';
import '../styles/components/profile-photo-uploader.css';

/**
 * Profile-photo uploader with a round preview, used by both Register
 * and EditProfile. The user picks a file (we show a blob: preview
 * instantly), and the parent component decides when to actually POST
 * the File to the backend (typically after a successful register
 * or alongside a profile save).
 *
 * v3 design: all visuals live in profile-photo-uploader.css and
 * reference the v3 design tokens. No inline styles.
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
    <div className="gm-ppu">
      <div className="gm-ppu__ring">
        {displaySrc ? (
          <img
            src={displaySrc}
            alt="Pré-visualização da foto de perfil"
            className="gm-ppu__img"
            onError={(e) => {
              // Backend URL returned 404 — fall back to the placeholder
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <IconUser size={90} strokeWidth={1.25} className="gm-ppu__placeholder" />
        )}
        {/* Hover overlay with camera icon — only when not disabled */}
        {!disabled && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label="Escolher foto de perfil"
            className="gm-ppu__overlay"
          >
            <IconCamera size={32} strokeWidth={1.5} />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handlePick}
        disabled={disabled}
        className="gm-ppu__file"
      />

      <div className="gm-ppu__actions">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="gm-ppu__btn gm-ppu__btn--primary"
        >
          <IconCamera size={14} strokeWidth={1.75} />
          {currentPhoto || preview ? 'Trocar foto' : 'Adicionar foto'}
        </button>
        {displaySrc && !disabled && (
          <button
            type="button"
            onClick={handleRemove}
            className="gm-ppu__btn gm-ppu__btn--ghost"
          >
            <IconTrash size={14} strokeWidth={1.75} /> Remover
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="gm-ppu__error">
          {error}
        </p>
      )}
    </div>
  );
};

export default ProfilePhotoUploader;
