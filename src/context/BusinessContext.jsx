/**
 * ViandaPro - Contexto de Negocio (Multi-Tenant)
 * Provee configuración del tenant actual según businessSlug de la URL
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNegocioBySlug } from '../firebase/operations';

const BusinessContext = createContext(null);

export function BusinessProvider({ children, businessSlug: slugProp }) {
  const params = useParams();
  const navigate = useNavigate();
  const businessSlug = slugProp ?? params.businessSlug;

  const [negocio, setNegocio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!businessSlug) {
      setLoading(false);
      setNegocio(null);
      return;
    }
    setLoading(true);
    setError(null);
    getNegocioBySlug(businessSlug)
      .then((data) => {
        if (data) {
          setNegocio({ slug: businessSlug, ...data });
          setError(null);
        } else {
          setNegocio(null);
          setError('Negocio no encontrado');
        }
      })
      .catch((err) => {
        setNegocio(null);
        setError(err.message || 'Error al cargar el negocio');
      })
      .finally(() => setLoading(false));
  }, [businessSlug]);

  // activo: true por defecto; soporta legacy 'habilitado'
  const activo = (negocio?.activo ?? negocio?.habilitado ?? true) !== false;

  const value = {
    businessId: negocio?.slug ?? null,
    businessSlug: businessSlug ?? null,
    negocio,
    loading,
    error: !activo ? 'suspended' : error,
    activo,
    config: negocio?.config ?? { margenReservaHoras: 72 },
    nombre: negocio?.nombre ?? 'ViandaPro',
    logoUrl: negocio?.logoUrl ?? null,
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error('useBusiness debe usarse dentro de BusinessProvider');
  return ctx;
}

export function useBusinessOptional() {
  return useContext(BusinessContext);
}
