import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { getSettings } from '../storage/storage';
import { Colors, DarkColors } from '../constants/colors';

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  cardBg: string;
}

const LightTheme: ThemeColors = {
  background: Colors.white,
  surface: Colors.grayLight,
  text: Colors.dark,
  textSecondary: Colors.gray,
  border: Colors.border,
  cardBg: Colors.white,
};

const DarkTheme: ThemeColors = {
  background: DarkColors.background,
  surface: DarkColors.surface,
  text: DarkColors.text,
  textSecondary: DarkColors.textSecondary,
  border: DarkColors.border,
  cardBg: DarkColors.surface,
};

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  reload: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: LightTheme,
  isDark: false,
  reload: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [darkModeSetting, setDarkModeSetting] = useState<'auto' | 'light' | 'dark'>('auto');
  const [loaded, setLoaded] = useState(false);

  const loadTheme = useCallback(async () => {
    try {
      const settings = await getSettings();
      setDarkModeSetting(settings.darkMode);
    } catch {
      setDarkModeSetting('auto');
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  let isDark: boolean;
  if (darkModeSetting === 'dark') {
    isDark = true;
  } else if (darkModeSetting === 'light') {
    isDark = false;
  } else {
    isDark = systemScheme === 'dark';
  }

  const colors = isDark ? DarkTheme : LightTheme;

  return React.createElement(
    ThemeContext.Provider,
    { value: { colors, isDark, reload: loadTheme } },
    children
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
