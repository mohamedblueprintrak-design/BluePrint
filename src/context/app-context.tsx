'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

type Theme = 'dark' | 'light' | 'system';
type Language = 'ar' | 'en';
type Currency = 'AED' | 'SAR' | 'USD' | 'EUR' | 'EGP';
type QuickAddDialog = 'project' | 'client' | 'invoice' | 'task' | null;

interface AppContextType {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  
  // Language
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
  
  // Currency
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  
  // Sidebar
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Current Page
  currentPage: string;
  setCurrentPage: (page: string) => void;
  
  // Command Palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  
  // Quick Add Dialog
  quickAddDialog: QuickAddDialog;
  setQuickAddDialog: (dialog: QuickAddDialog) => void;
  openQuickAddDialog: (dialog: Exclude<QuickAddDialog, null>) => void;
  closeQuickAddDialog: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  theme: 'bp_theme',
  language: 'bp_lang',
  currency: 'bp_currency',
  sidebarCollapsed: 'bp_sidebar_collapsed'
};

const DEFAULT_VALUES = {
  theme: 'dark' as Theme,
  language: 'ar' as Language,
  currency: 'AED' as Currency,
  sidebarCollapsed: false
};

function getInitialValue<T>(key: string, defaultValue: T, validValues?: T[]): T {
  // During SSR, return default value
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      // If validValues provided, check if stored value is valid
      if (validValues && !validValues.includes(stored as T)) {
        return defaultValue;
      }
      return stored as T;
    }
  } catch (e) {
    // localStorage might not be available
    console.warn('localStorage not available:', e);
  }
  return defaultValue;
}

export function AppProvider({ children }: { children: ReactNode }) {
  // Theme state
  const [theme, setThemeState] = useState<Theme>(() => 
    getInitialValue(STORAGE_KEYS.theme, DEFAULT_VALUES.theme, ['dark', 'light', 'system'])
  );
  const [isDark, setIsDark] = useState(true);
  
  // Language state
  const [language, setLanguageState] = useState<Language>(() => 
    getInitialValue(STORAGE_KEYS.language, DEFAULT_VALUES.language, ['ar', 'en'])
  );
  const isRTL = language === 'ar';
  
  // Currency state
  const [currency, setCurrencyState] = useState<Currency>(() => 
    getInitialValue(STORAGE_KEYS.currency, DEFAULT_VALUES.currency, ['AED', 'SAR', 'USD', 'EUR', 'EGP'])
  );
  
  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(() => {
    const value = getInitialValue<string>(STORAGE_KEYS.sidebarCollapsed, 'false');
    return value === 'true';
  });
  
  // Current Page state
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Command Palette state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  
  // Quick Add Dialog state
  const [quickAddDialog, setQuickAddDialog] = useState<QuickAddDialog>(null);
  const _openQuickAddDialog = (dialog: Exclude<QuickAddDialog, null>) => setQuickAddDialog(dialog);
  const _closeQuickAddDialog = () => setQuickAddDialog(null);

  // Theme effects
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateTheme = () => {
      let dark = false;
      if (theme === 'dark') {
        dark = true;
      } else if (theme === 'system') {
        dark = mediaQuery.matches;
      }
      setIsDark(dark);
      root.classList.toggle('dark', dark);
      localStorage.setItem(STORAGE_KEYS.theme, theme);
    };

    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme]);

  // Language effects
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem(STORAGE_KEYS.language, language);
  }, [language, isRTL]);

  // Currency effect
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.currency, currency);
  }, [currency]);

  // Sidebar collapsed effect
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.sidebarCollapsed, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette: Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Stable callback functions
  const setTheme = useCallback((newTheme: Theme) => setThemeState(newTheme), []);
  const setLanguage = useCallback((lang: Language) => setLanguageState(lang), []);
  const setCurrency = useCallback((curr: Currency) => setCurrencyState(curr), []);
  const setSidebarCollapsed = useCallback((collapsed: boolean) => setSidebarCollapsedState(collapsed), []);
  const openQuickAddDialogCb = useCallback((dialog: Exclude<QuickAddDialog, null>) => setQuickAddDialog(dialog), []);
  const closeQuickAddDialogCb = useCallback(() => setQuickAddDialog(null), []);

  // Memoized context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    theme,
    setTheme,
    isDark,
    language,
    setLanguage,
    isRTL,
    currency,
    setCurrency,
    sidebarCollapsed,
    setSidebarCollapsed,
    currentPage,
    setCurrentPage,
    commandPaletteOpen,
    setCommandPaletteOpen,
    quickAddDialog,
    setQuickAddDialog,
    openQuickAddDialog: openQuickAddDialogCb,
    closeQuickAddDialog: closeQuickAddDialogCb
  }), [
    theme, setTheme, isDark,
    language, setLanguage, isRTL,
    currency, setCurrency,
    sidebarCollapsed, setSidebarCollapsed,
    currentPage,
    commandPaletteOpen,
    quickAddDialog,
    openQuickAddDialogCb, closeQuickAddDialogCb
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
