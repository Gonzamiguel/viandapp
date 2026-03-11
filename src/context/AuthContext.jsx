/**
 * ViandaPro - Contexto de Autenticación (Multi-Tenant)
 * loginStaff y loginCliente requieren businessId del negocio actual
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getUsuarioByDni, createOrUpdateUsuario, getUsuarioStaffByUid } from '../firebase/operations';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const usuario = await getUsuarioStaffByUid(firebaseUser.uid);
        if (usuario) {
          setUser({ ...usuario, email: firebaseUser.email, businessId: usuario.businessId });
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const loginCliente = async (businessId, dni, nombre, empresa, hotel) => {
    if (!businessId) throw new Error('businessId es requerido');
    setLoading(true);
    try {
      await createOrUpdateUsuario(businessId, dni, { nombre, empresa, hotel, rol: 'cliente' });
      const usuario = await getUsuarioByDni(businessId, dni);
      setUser({ ...usuario, dni, ignorar_restriccion: usuario?.ignorar_restriccion ?? false });
      return usuario;
    } finally {
      setLoading(false);
    }
  };

  const loginStaff = async (businessId, email, password) => {
    if (!businessId) throw new Error('businessId es requerido');
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const usuario = await getUsuarioStaffByUid(cred.user.uid);
      const slugNormalized = String(businessId).toLowerCase().trim();
      const userBusinessId = usuario?.businessId ? String(usuario.businessId).toLowerCase().trim() : '';
      if (!usuario || userBusinessId !== slugNormalized) {
        await auth.signOut();
        throw new Error('Error de credenciales para este negocio');
      }
      const userData = { ...usuario, email: cred.user.email, businessId: usuario.businessId };
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    firebaseSignOut(auth);
  };

  const value = {
    user,
    loading,
    loginCliente,
    loginStaff,
    signOut,
    isCliente: user?.rol === 'cliente',
    isChef: user?.rol === 'chef',
    isAdmin: user?.rol === 'admin',
    userBusinessId: user?.businessId ?? null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
