import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfilePhotoUploader from './ProfilePhotoUploader';

// jsdom doesn't ship URL.createObjectURL / revokeObjectURL; we mock
// them so the component can use blob: URLs without crashing.
const BLOB_URL = 'blob:mock-url';
beforeAll(() => {
  if (!global.URL.createObjectURL) {
    global.URL.createObjectURL = jest.fn(() => BLOB_URL);
  }
  if (!global.URL.revokeObjectURL) {
    global.URL.revokeObjectURL = jest.fn();
  }
});

describe('<ProfilePhotoUploader />', () => {
  function makeFile(name, size, type = 'image/jpeg') {
    const f = new File(['x'.repeat(size)], name, { type });
    Object.defineProperty(f, 'size', { value: size });
    return f;
  }

  test('renders "Adicionar foto" when no currentPhoto', () => {
    render(<ProfilePhotoUploader currentPhoto={null} onFileChange={() => {}} />);
    expect(screen.getByText('Adicionar foto')).not.toBeNull();
  });

  test('renders the current photo when provided', () => {
    render(
      <ProfilePhotoUploader
        currentPhoto="http://example.com/avatar.jpg"
        onFileChange={() => {}}
      />,
    );
    const img = screen.getByAltText('Pré-visualização da foto de perfil');
    // The current photo is preserved (relative paths become full
    // URLs through toFullMediaUrl; absolute URLs are kept and just
    // get a cache-buster).
    expect(img.getAttribute('src')).toMatch(
      /^https?:\/\/example\.com\/avatar\.jpg(\?|&)v=\d+$/,
    );
  });

  test('clicking "Remover" calls onFileChange with null', () => {
    const onFileChange = jest.fn();
    render(
      <ProfilePhotoUploader
        currentPhoto="http://example.com/avatar.jpg"
        onFileChange={onFileChange}
      />,
    );
    fireEvent.click(screen.getByText('Remover'));
    expect(onFileChange).toHaveBeenCalledWith(null);
  });

  test('rejects a non-image file (no callback, shows error)', () => {
    const onFileChange = jest.fn();
    render(<ProfilePhotoUploader onFileChange={onFileChange} />);
    const input = document.querySelector('input[type="file"]');
    const badFile = makeFile('doc.pdf', 100, 'application/pdf');
    fireEvent.change(input, { target: { files: [badFile] } });
    expect(onFileChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toMatch(/imagem/);
  });

  test('rejects a file above maxSizeBytes', () => {
    const onFileChange = jest.fn();
    render(<ProfilePhotoUploader onFileChange={onFileChange} maxSizeBytes={1024} />);
    const input = document.querySelector('input[type="file"]');
    const big = makeFile('huge.jpg', 5000);
    fireEvent.change(input, { target: { files: [big] } });
    expect(onFileChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toMatch(/grande/);
  });

  test('accepts a valid image and fires onFileChange', () => {
    const onFileChange = jest.fn();
    render(<ProfilePhotoUploader onFileChange={onFileChange} />);
    const input = document.querySelector('input[type="file"]');
    const good = makeFile('avatar.jpg', 1024);
    fireEvent.change(input, { target: { files: [good] } });
    expect(onFileChange).toHaveBeenCalledTimes(1);
    expect(onFileChange.mock.calls[0][0].name).toBe('avatar.jpg');
  });

  test('disables the picker when disabled=true', () => {
    const onFileChange = jest.fn();
    render(<ProfilePhotoUploader onFileChange={onFileChange} disabled />);
    const input = document.querySelector('input[type="file"]');
    expect(input.disabled).toBe(true);
  });

  describe('currentPhoto URL resolution (regression)', () => {
    test('relative backend path → full URL with cache-buster', () => {
      // The backend returns paths like "profile-photos/abc.jpg"
      // (relative). The uploader must resolve them to
      // http://localhost:8080/files/... so the <img> can load them.
      render(
        <ProfilePhotoUploader
          currentPhoto="profile-photos/abc.jpg"
          onFileChange={() => {}}
        />,
      );
      const img = screen.getByAltText('Pré-visualização da foto de perfil');
      const src = img.getAttribute('src');
      expect(src).toMatch(/^https?:\/\/[^/]+\/files\/profile-photos\/abc\.jpg/);
      // Cache-buster so the browser refetches after the user changes
      // the photo of the same path.
      expect(src).toMatch(/[?&]v=\d+$/);
    });

    test('absolute URL is preserved (with cache-buster)', () => {
      render(
        <ProfilePhotoUploader
          currentPhoto="https://cdn.example.com/avatar.jpg"
          onFileChange={() => {}}
        />,
      );
      const img = screen.getByAltText('Pré-visualização da foto de perfil');
      // Absolute URL is kept (cdn.example.com is preserved) but a
      // cache-buster query string is appended so the browser refetches
      // when the user updates the photo at the same URL.
      expect(img.getAttribute('src')).toMatch(
        /^https:\/\/cdn\.example\.com\/avatar\.jpg(\?|&)v=\d+$/,
      );
    });

    test('null currentPhoto → no img rendered (placeholder shown)', () => {
      render(<ProfilePhotoUploader currentPhoto={null} onFileChange={() => {}} />);
      expect(
        screen.queryByAltText('Pré-visualização da foto de perfil'),
      ).toBeNull();
    });
  });
});

