import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Sheet, useToast } from './index';

const REASONS = [
  { key: 'inappropriate', label: 'Conteúdo inapropriado', helper: 'imagens ofensivas, nudez, etc.' },
  { key: 'falseInfo',     label: 'Informação falsa',      helper: 'locais inexistentes, preços manipulados' },
  { key: 'abusive',       label: 'Assédio / abuso',       helper: 'linguagem agressiva ou ofensiva' },
  { key: 'spam',          label: 'Spam / autopromoção',   helper: 'publicidade abusiva, links externos' },
  { key: 'plagiarism',    label: 'Plágio de conteúdo',    helper: 'fotos ou textos copiados sem créditos' },
  { key: 'violation',     label: 'Violação das regras',   helper: 'regras da plataforma' },
];

const ReportSheet = ({ open, onClose, travel }) => {
  const toast = useToast();
  const [reasons, setReasons] = useState({});
  const [other, setOther] = useState('');

  const toggle = (k) => setReasons((r) => ({ ...r, [k]: !r[k] }));

  const submit = () => {
    const anyChecked = Object.values(reasons).some(Boolean) || (reasons.other && other.trim());
    if (!anyChecked) {
      toast.danger('Selecione pelo menos um motivo.');
      return;
    }
    // TODO: backend — POST /api/reports
    toast.success('Publicação denunciada. Obrigado.');
    onClose?.();
    setReasons({});
    setOther('');
  };

  return (
    <Sheet open={open} onClose={onClose} title="Denunciar publicação">
      <p style={{ margin: '0 0 var(--gm-space-4)', color: 'var(--gm-text-2)', fontSize: 'var(--gm-text-sm)', lineHeight: 1.5 }}>
        Por que deseja denunciar a publicação de <strong style={{ color: 'var(--gm-text-1)' }}>{travel?.user || 'este viajante'}</strong>?
        Esta ação reporta a publicação aos administradores.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {REASONS.map((r) => (
          <label
            key={r.key}
            style={{
              display: 'flex', gap: 12, cursor: 'pointer',
              padding: '12px 14px',
              borderRadius: 'var(--gm-radius-md)',
              background: reasons[r.key] ? 'var(--gm-brand-soft)' : 'var(--gm-bg-sunken)',
              transition: 'background var(--gm-dur-fast) var(--gm-ease-out)',
            }}
          >
            <input
              type="checkbox"
              checked={!!reasons[r.key]}
              onChange={() => toggle(r.key)}
              style={{ marginTop: 2, accentColor: 'var(--gm-brand)' }}
            />
            <div>
              <div style={{ fontWeight: 'var(--gm-weight-semibold)', color: 'var(--gm-text-1)', fontSize: 'var(--gm-text-sm)' }}>{r.label}</div>
              <div style={{ fontSize: 'var(--gm-text-xs)', color: 'var(--gm-text-3)' }}>{r.helper}</div>
            </div>
          </label>
        ))}

        <label style={{
          display: 'flex', gap: 12, cursor: 'pointer',
          padding: '12px 14px',
          borderRadius: 'var(--gm-radius-md)',
          background: reasons.other ? 'var(--gm-brand-soft)' : 'var(--gm-bg-sunken)',
        }}>
          <input
            type="checkbox"
            checked={!!reasons.other}
            onChange={() => toggle('other')}
            style={{ marginTop: 2, accentColor: 'var(--gm-brand)' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'var(--gm-weight-semibold)', fontSize: 'var(--gm-text-sm)' }}>Outro (especificar)</div>
            {reasons.other && (
              <textarea
                value={other}
                onChange={(e) => setOther(e.target.value)}
                placeholder="Descreva o motivo..."
                style={{
                  width: '100%',
                  marginTop: 8,
                  padding: '12px 14px',
                  border: '1px solid var(--gm-border)',
                  borderRadius: 'var(--gm-radius-sm)',
                  fontSize: 'var(--gm-text-sm)',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  minHeight: 80,
                  color: 'var(--gm-text-1)',
                  background: 'var(--gm-bg-card)',
                }}
              />
            )}
          </div>
        </label>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 'var(--gm-space-5)' }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            appearance: 'none', background: 'transparent', border: 0,
            padding: '10px 16px', font: 'inherit', fontWeight: 'var(--gm-weight-semibold)',
            color: 'var(--gm-text-2)', cursor: 'pointer',
          }}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={submit}
          style={{
            appearance: 'none', border: 0,
            padding: '10px 18px',
            background: 'var(--gm-danger)', color: '#FFFFFF',
            borderRadius: 'var(--gm-radius-pill)',
            font: 'inherit', fontWeight: 'var(--gm-weight-semibold)',
            cursor: 'pointer',
          }}
        >
          Denunciar
        </button>
      </div>
    </Sheet>
  );
};

ReportSheet.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  travel: PropTypes.object,
};

export default ReportSheet;
