'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeId } from '@/lib/themes';

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'midnight_romance',
  setTheme: () => {},
});

export function ThemeProvider({ children, initial = 'midnight_romance' }: { children: React.ReactNode; initial?: ThemeId }) {
  const [theme, setThemeState] = useState<ThemeId>(initial);

  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('mc-theme', t); } catch {}
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mc-theme') as ThemeId | null;
      if (saved) {
        setTimeout(() => setTheme(saved), 0);
      } else {
        setTimeout(() => setTheme(initial), 0);
      }
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
