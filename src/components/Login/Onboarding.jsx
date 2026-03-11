/**
 * ViandaPro - Login / Onboarding
 * Check-in Express (Cliente) o Login Staff (Email/Password)
 */

import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { UtensilsCrossed, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';

export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { businessId, businessSlug, nombre: nombreNegocio, logoUrl } = useBusiness();
  const mensajeRedirect = location.state?.message;
  const { loginStaff } = useAuth();
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmitStaff = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Completa email y contraseña');
      return;
    }
    try {
      const usuario = await loginStaff(businessId, email.trim(), password);
      if (usuario?.rol === 'admin') navigate(`/staff/${businessSlug}/admin`);
      else navigate(`/staff/${businessSlug}/chef`);
    } catch (err) {
      setError(err.message || 'Error de credenciales para este negocio');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Branding dinámico: logo y nombre del negocio */}
        <div className="text-center mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt={nombreNegocio} className="h-16 w-auto mx-auto mb-4 object-contain" />
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white mb-4">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-800">{nombreNegocio || 'ViandaPro'}</h1>
          <p className="text-gray-500 text-sm mt-1">Gestión de viandas para empresas</p>
        </div>

        {mensajeRedirect && (
          <p className="mb-4 text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg">{mensajeRedirect}</p>
        )}

        {/* Form Staff único */}
        <div className="card">
          <form onSubmit={handleSubmitStaff} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@tuempresa.com"
                  className="input-field pl-10"
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10"
                  autoComplete="current-password"
                />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full mt-2">
              Iniciar sesión Staff
            </button>
          </form>

          {error && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
          )}
        </div>
        <p className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-500 hover:text-emerald-600 transition">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
