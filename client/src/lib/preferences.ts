import type { ThemePreference, UserSettingsInput } from '@/types/domain';

const SETTINGS_STORAGE_KEY = 'wallet-wise-settings';

export const defaultUserSettings: UserSettingsInput = {
  currency: 'INR',
  theme: 'dark',
};

function isValidThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function isValidCurrency(value: unknown): value is UserSettingsInput['currency'] {
  return value === 'INR' || value === 'USD' || value === 'EUR' || value === 'GBP' || value === 'AED';
}

export function getCachedSettings(): UserSettingsInput {
  if (typeof window === 'undefined') {
    return defaultUserSettings;
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (!raw) {
      return defaultUserSettings;
    }

    const parsed = JSON.parse(raw) as Partial<UserSettingsInput>;

    return {
      currency: isValidCurrency(parsed.currency)
        ? parsed.currency
        : defaultUserSettings.currency,
      theme: isValidThemePreference(parsed.theme)
        ? parsed.theme
        : defaultUserSettings.theme,
    };
  } catch (error) {
    return defaultUserSettings;
  }
}

export function cacheSettings(settings: UserSettingsInput) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function resolveThemePreference(
  themePreference: ThemePreference,
): Exclude<ThemePreference, 'system'> {
  if (themePreference !== 'system') {
    return themePreference;
  }

  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark';
  }

  return 'light';
}

export function applyThemePreference(themePreference: ThemePreference) {
  if (typeof document === 'undefined') {
    return;
  }

  const resolvedTheme = resolveThemePreference(themePreference);
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;
}
