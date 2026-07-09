'use client';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
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

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
