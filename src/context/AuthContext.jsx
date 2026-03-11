/**
 * ViandaPro - Contexto de Autenticación (Multi-Tenant)
 * loginStaff y loginCliente requieren businessId del negocio actual
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import {
  getUsuarioByDni,
  createOrUpdateUsuario,
  getUsuarioStaffByUid,
  getSuperAdminEmail,
} from '../firebase/operations';

const LAST_BUSINESS_ID_KEY = 'viandapro:lastBusinessId';
const LAST_USER_ROLE_KEY = 'viandapro:lastUserRole';

function persistSessionInfo(businessId, rol) {
  try {
    if (businessId) localStorage.setItem(LAST_BUSINESS_ID_KEY, businessId);
    if (rol) localStorage.setItem(LAST_USER_ROLE_KEY, rol);
  } catch {
    // Ignorar errores de almacenamiento para no frenar el flujo
  }
}

function getPersistedSessionInfo() {
  try {
    return {
      businessId: localStorage.getItem(LAST_BUSINESS_ID_KEY),
      rol: localStorage.getItem(LAST_USER_ROLE_KEY),
    };
  } catch {
    return { businessId: null, rol: null };
  }
}

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
        const superAdminEmail = getSuperAdminEmail();
        const emailNorm = firebaseUser.email?.trim().toLowerCase() ?? '';
        // Bypass maestro: si es el super admin, conservar último businessId/rol usado
        if (emailNorm === superAdminEmail) {
          const { businessId: savedBusinessId, rol: savedRol } = getPersistedSessionInfo();
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            businessId: savedBusinessId,
            rol: savedRol || 'admin',
          });
          return;
        }

        const usuario = await getUsuarioStaffByUid(firebaseUser.uid);
        if (!usuario) {
          setUser(null);
          return;
        }
        const businessId = String(usuario.businessId || '').trim().toLowerCase();
        const rol = usuario.rol || 'admin';
        persistSessionInfo(businessId, rol);
        setUser({ ...usuario, email: firebaseUser.email, businessId, rol });
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
      const slugNormalized = String(businessId).trim().toLowerCase();
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const emailNorm = cred.user.email?.trim().toLowerCase() ?? '';
      const superAdminEmail = getSuperAdminEmail();
      const usuario = await getUsuarioStaffByUid(cred.user.uid);
      const userBusinessId = usuario?.businessId ? String(usuario.businessId).trim().toLowerCase() : '';

      // Bypass maestro: Gonzalo puede entrar a cualquier slug
      if (emailNorm === superAdminEmail) {
        const bypassUser = {
          uid: cred.user.uid,
          email: cred.user.email,
          businessId: slugNormalized,
          rol: usuario?.rol || 'admin',
          nombre: usuario?.nombre || 'Super Admin',
          apellido: usuario?.apellido || '',
        };
        persistSessionInfo(bypassUser.businessId, bypassUser.rol);
        setUser(bypassUser);
        return bypassUser;
      }

      if (!usuario) {
        throw new Error('Usuario no configurado');
      }
      if (userBusinessId !== slugNormalized) {
        throw new Error('El usuario no pertenece a este negocio');
      }

      const userData = {
        ...usuario,
        email: cred.user.email,
        businessId: userBusinessId,
        rol: usuario.rol || 'admin',
      };
      persistSessionInfo(userData.businessId, userData.rol);
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
