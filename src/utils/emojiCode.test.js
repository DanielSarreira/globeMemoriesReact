import { convertEmojiCode } from '../utils/emojiCode';

describe('convertEmojiCode', () => {
  it('converts known codes to emoji', () => {
    expect(convertEmojiCode(':herb:')).toBe('🌿');
    expect(convertEmojiCode(':city_dusk:')).toBe('🌆');
  });

  it('passes through unknown codes', () => {
    expect(convertEmojiCode(':mystery:')).toBe(':mystery:');
  });

  it('returns the default pin for falsy input', () => {
    expect(convertEmojiCode(null)).toBe('📍');
    expect(convertEmojiCode('')).toBe('📍');
  });
});
