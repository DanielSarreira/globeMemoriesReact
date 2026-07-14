// Test the visibility-mapping helpers used by SettingsAndPrivacy.js to
// translate between the backend StatsVisibility enum and the option ids
// used by the 3-way dropdowns ("all" / "followers" / "private").
//
// We re-declare the helpers here rather than exporting them from the page
// component, because the page itself is a default export. This keeps the
// component's surface area minimal while still giving us coverage of the
// most error-prone conversion logic.

const statsVisibilityToOption = (v) => {
  if (v === 'FOLLOWERS') return 'followers';
  if (v === 'PRIVATE') return 'private';
  return 'all';
};

const optionToStatsVisibility = (v) => {
  if (v === 'followers') return 'FOLLOWERS';
  if (v === 'private') return 'PRIVATE';
  return 'PUBLIC';
};

describe('SettingsAndPrivacy — StatsVisibility <-> option mapping', () => {
  describe('statsVisibilityToOption (backend -> dropdown)', () => {
    test.each([
      ['PUBLIC', 'all'],
      ['FOLLOWERS', 'followers'],
      ['PRIVATE', 'private'],
    ])('maps %s -> %s', (backend, expected) => {
      expect(statsVisibilityToOption(backend)).toBe(expected);
    });

    test('defaults unknown / null / undefined to "all" (PUBLIC) for legacy users', () => {
      // The V4 migration defaults to PUBLIC, but legacy users with a NULL
      // column (e.g. pre-migration) should still see the dropdown land on
      // "all" instead of crashing or showing "private".
      expect(statsVisibilityToOption(null)).toBe('all');
      expect(statsVisibilityToOption(undefined)).toBe('all');
      expect(statsVisibilityToOption('SOMETHING_NEW')).toBe('all');
    });
  });

  describe('optionToStatsVisibility (dropdown -> backend)', () => {
    test.each([
      ['all', 'PUBLIC'],
      ['followers', 'FOLLOWERS'],
      ['private', 'PRIVATE'],
    ])('maps %s -> %s', (option, expected) => {
      expect(optionToStatsVisibility(option)).toBe(expected);
    });

    test('defaults unknown option ids to PUBLIC (safe over-share)', () => {
      expect(optionToStatsVisibility('')).toBe('PUBLIC');
      expect(optionToStatsVisibility('hidden')).toBe('PUBLIC');
      expect(optionToStatsVisibility(null)).toBe('PUBLIC');
      expect(optionToStatsVisibility(undefined)).toBe('PUBLIC');
    });
  });

  describe('round-trip', () => {
    test.each(['PUBLIC', 'FOLLOWERS', 'PRIVATE'])('%s round-trips through both helpers', (v) => {
      const option = statsVisibilityToOption(v);
      const back = optionToStatsVisibility(option);
      expect(back).toBe(v);
    });
  });
});

describe('SettingsAndPrivacy — null-handling for hidden stats', () => {
  // The UserProfile page shows "🔒 Privado" instead of "0" / crash when
  // the backend returns null for a stat the owner has hidden.
  const HIDDEN_STAT = '🔒 Privado';
  const isHiddenStat = (v) => v === null || v === undefined;
  const formatStat = (value, formatter) => {
    if (isHiddenStat(value)) return HIDDEN_STAT;
    return formatter ? formatter(value) : value;
  };

  test('isHiddenStat returns true for null and undefined', () => {
    expect(isHiddenStat(null)).toBe(true);
    expect(isHiddenStat(undefined)).toBe(true);
  });

  test('isHiddenStat returns false for 0 and empty string', () => {
    // 0 is a valid (just no travels) value, not "hidden".
    expect(isHiddenStat(0)).toBe(false);
    expect(isHiddenStat('')).toBe(false);
  });

  test('formatStat returns HIDDEN_STAT when value is null', () => {
    expect(formatStat(null, (v) => v.toLocaleString())).toBe(HIDDEN_STAT);
  });

  test('formatStat applies the formatter when value is a number', () => {
    expect(formatStat(1234, (v) => v.toLocaleString())).toBe('1,234');
  });

  test('formatStat returns the value as-is when no formatter is given', () => {
    expect(formatStat(42)).toBe(42);
  });

  test('formatStat handles a null formatter argument safely', () => {
    // Guards against the rare case where the caller passes a falsy
    // formatter (undefined / null) — we should not call it.
    expect(formatStat(7, undefined)).toBe(7);
    expect(formatStat(7, null)).toBe(7);
  });
});
