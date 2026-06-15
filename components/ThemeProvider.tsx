'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeId } from '@/lib/themes';

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'soft_coquette',
  setTheme: () => {},
});

export function ThemeProvider({ children, initial = 'soft_coquette' }: { children: React.ReactNode; initial?: ThemeId }) {
  const [theme, setThemeState] = useState<ThemeId>(initial);

  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('mc-theme', t); } catch {}
  };

  useEffect(() => {
    try {
      localStorage.setItem('mc-theme', initial);
      setTimeout(() => setTheme(initial), 0);
    } catch {
      setTimeout(() => setTheme(initial), 0);
    }
  }, [initial]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
