import { useState, useEffect } from 'react';

export type ThemeColor = 'crimson' | 'blue' | 'green' | 'purple' | 'orange' | 'pink';
export type ThemeMode = 'light' | 'dark' | 'auto';

export interface Theme {
  mode: ThemeMode;
  color: ThemeColor;
}

const THEME_KEY = 'app-theme';

type ColorScheme = {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  info: string;
  danger: string;
};
const COLOR_SCHEMES: Record<ThemeColor, ColorScheme> = {
  crimson: {
    primary: '#800020',
    primaryHover: '#660018',
    primaryLight: '#a6002b',
    secondary: '#f1f5f9',
    accent: '#ff4444',
    success: '#059669',
    warning: '#f59e0b',
    info: '#0ea5e9',
    danger: '#dc2626'
  },
  blue: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryLight: '#3b82f6',
    secondary: '#f1f5f9',
    accent: '#06b6d4',
    success: '#059669',
    warning: '#f59e0b',
    info: '#0ea5e9',
    danger: '#dc2626'
  },
  green: {
    primary: '#059669',
    primaryHover: '#047857',
    primaryLight: '#10b981',
    secondary: '#f0fdf4',
    accent: '#22c55e',
    success: '#16a34a',
    warning: '#f59e0b',
    info: '#0ea5e9',
    danger: '#dc2626'
  },
  purple: {
    primary: '#7c3aed',
    primaryHover: '#6d28d9',
    primaryLight: '#8b5cf6',
    secondary: '#faf5ff',
    accent: '#a855f7',
    success: '#059669',
    warning: '#f59e0b',
    info: '#0ea5e9',
    danger: '#dc2626'
  },
  orange: {
    primary: '#ea580c',
    primaryHover: '#c2410c',
    primaryLight: '#f97316',
    secondary: '#fff7ed',
    accent: '#fb923c',
    success: '#059669',
    warning: '#f59e0b',
    info: '#0ea5e9',
    danger: '#dc2626'
  },
  pink: {
    primary: '#db2777',
    primaryHover: '#be185d',
    primaryLight: '#ec4899',
    secondary: '#fdf2f8',
    accent: '#f472b6',
    success: '#059669',
    warning: '#f59e0b',
    info: '#0ea5e9',
    danger: '#dc2626'
  }
};

export function useTheme() {
  const [theme, setTheme] = useState<Theme>({
    mode: 'light',
    color: 'crimson'
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) {
        try {
          const parsedTheme = JSON.parse(saved);
          setTheme(parsedTheme);
        } catch {}
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      applyTheme(theme);
      localStorage.setItem(THEME_KEY, JSON.stringify(theme));
    }
  }, [theme]);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    const body = document.body;
    if (newTheme.mode === 'dark') {
      body.classList.add('dark');
    } else if (newTheme.mode === 'light') {
      body.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        body.classList.add('dark');
      } else {
        body.classList.remove('dark');
      }
    }
    const colors = COLOR_SCHEMES[newTheme.color];
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-hover', colors.primaryHover);
    root.style.setProperty('--primary-light', colors.primaryLight);
    root.style.setProperty('--secondary', colors.secondary);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--success', colors.success);
    root.style.setProperty('--warning', colors.warning);
    root.style.setProperty('--info', colors.info);
    root.style.setProperty('--danger', colors.danger);
    body.className = body.className.replace(/theme-\w+/g, '');
    body.classList.add(`theme-${newTheme.color}`);
  };

  const setMode = (mode: ThemeMode) => {
    setTheme(prev => ({ ...prev, mode }));
  };

  const setColor = (color: ThemeColor) => {
    setTheme(prev => ({ ...prev, color }));
  };

  const toggleMode = () => {
    setTheme(prev => ({
      ...prev,
      mode: prev.mode === 'light' ? 'dark' : 'light'
    }));
  };

  return {
    theme,
    setMode,
    setColor,
    toggleMode,
    colorSchemes: COLOR_SCHEMES
  };
}
