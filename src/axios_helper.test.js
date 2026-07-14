import { toFullMediaUrl, getUserAvatar } from './utils/mediaUrl';

describe('toFullMediaUrl', () => {
  test('passes through absolute URLs', () => {
    expect(toFullMediaUrl('http://example.com/x.jpg')).toBe('http://example.com/x.jpg');
    expect(toFullMediaUrl('https://example.com/x.jpg')).toBe('https://example.com/x.jpg');
  });
  test('prepends the base URL to relative paths', () => {
    expect(toFullMediaUrl('profile-photos/abc.jpg')).toMatch(/\/profile-photos\/abc\.jpg$/);
    expect(toFullMediaUrl('trip-photos/123.jpg')).toMatch(/\/trip-photos\/123\.jpg$/);
  });
  test('returns null for falsy input', () => {
    expect(toFullMediaUrl(null)).toBeNull();
    expect(toFullMediaUrl('')).toBeNull();
    expect(toFullMediaUrl(undefined)).toBeNull();
  });
});

describe('getUserAvatar', () => {
  test('returns null when no user', () => {
    expect(getUserAvatar(null)).toBeNull();
    expect(getUserAvatar(undefined)).toBeNull();
  });
  test('returns null when user has no photo field', () => {
    expect(getUserAvatar({ id: 1, username: 'x' })).toBeNull();
  });
  test('uses profilePhoto (backend canonical field)', () => {
    const u = { profilePhoto: 'profile-photos/abc.jpg' };
    const result = getUserAvatar(u, { bustCache: false });
    expect(result).toMatch(/\/profile-photos\/abc\.jpg$/);
  });
  test('falls back to profilePicture (legacy alias)', () => {
    const u = { profilePicture: 'profile-photos/legacy.jpg' };
    const result = getUserAvatar(u, { bustCache: false });
    expect(result).toMatch(/\/profile-photos\/legacy\.jpg$/);
  });
  test('prefers profilePhoto over profilePicture when both are set', () => {
    const u = {
      profilePhoto: 'profile-photos/new.jpg',
      profilePicture: 'profile-photos/old.jpg',
    };
    const result = getUserAvatar(u, { bustCache: false });
    expect(result).toMatch(/new\.jpg$/);
  });
  test('passes through absolute URLs unchanged when bustCache=false', () => {
    const u = { profilePhoto: 'https://cdn.example.com/avatar.jpg' };
    expect(getUserAvatar(u, { bustCache: false })).toBe('https://cdn.example.com/avatar.jpg');
  });
  test('null photo fields → null', () => {
    expect(getUserAvatar({ profilePhoto: null, profilePicture: null })).toBeNull();
    expect(getUserAvatar({ profilePhoto: '', profilePicture: '' })).toBeNull();
  });

  describe('cache busting', () => {
    test('default avatar URL has a ?v= query string', () => {
      const url = getUserAvatar({ profilePhoto: 'profile-photos/x.jpg' });
      expect(url).toMatch(/[?&]v=\d+$/);
    });
    test('bustCache=false skips the query string', () => {
      const url = getUserAvatar(
        { profilePhoto: 'profile-photos/x.jpg' },
        { bustCache: false },
      );
      expect(url).not.toMatch(/[?&]v=/);
      expect(url).toMatch(/profile-photos\/x\.jpg$/);
    });
    test('busts cache on absolute URLs too', () => {
      const url = getUserAvatar(
        { profilePhoto: 'https://cdn.example.com/avatar.jpg' },
      );
      expect(url).toMatch(/[?&]v=\d+$/);
    });
  });
});
