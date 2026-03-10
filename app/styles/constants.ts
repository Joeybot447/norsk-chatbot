export const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export const colors = {
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  primaryLight: '#eff6ff',
  dark: '#0f172a',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1e293b',
  white: '#ffffff',
  danger: '#dc2626',
  dangerLight: '#fef2f2',
  dangerBorder: '#fecaca',
  success: '#16a34a',
  successLight: '#f0fdf4',
  successBorder: '#bbf7d0',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
  md: '0 4px 6px -1px rgba(0,0,0,0.1)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.1)',
  card: '0 1px 3px rgba(0,0,0,0.04)',
} as const;
