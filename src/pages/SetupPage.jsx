/**
 * ViandaPro - Setup
 * Redirige al login staff. La cuenta se crea desde el Panel Maestro.
 */

import { useParams, Navigate } from 'react-router-dom';

export default function SetupPage() {
  const { businessSlug } = useParams();
  return <Navigate to={`/staff/${businessSlug}/login`} replace state={{ message: 'Tu cuenta ya está creada. Ingresá con tu email y contraseña.' }} />;
}
