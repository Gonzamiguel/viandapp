/**
 * ViandaPro - Contexto Global
 * Configuraciones y estado compartido
 */

import { createContext, useContext, useState } from 'react';

const GlobalContext = createContext(null);

export function GlobalProvider({ children }) {
  const [globalSettings, setGlobalSettings] = useState({
    theme: 'light',
    language: 'es',
  });

  const value = {
    globalSettings,
    setGlobalSettings,
  };

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
}

export function useGlobal() {
  const ctx = useContext(GlobalContext);
  if (!ctx) throw new Error('useGlobal debe usarse dentro de GlobalProvider');
  return ctx;
}
