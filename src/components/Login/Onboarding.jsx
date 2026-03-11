/**
 * ViandaPro - Login / Onboarding
 * Check-in Express (Cliente) o Login Staff (Email/Password)
 */

import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { UtensilsCrossed, Mail, Lock, User, Building2, Hotel } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';
import { getUsuarioByDni } from '../../firebase/operations';

export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { businessId, businessSlug, nombre: nombreNegocio, logoUrl } = useBusiness();
  const mensajeRedirect = location.state?.message;
  const { loginCliente, loginStaff } = useAuth();
  const [mode, setMode] = useState('cliente');
  const [error, setError] = useState('');
  const [buscarDni, setBuscarDni] = useState(false);

  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [hotel, setHotel] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleDniBlur = async () => {
    const dniVal = dni.trim();
    if (!dniVal || dniVal.length < 6 || !businessId) return;
    setBuscarDni(true);
    try {
      const usuario = await getUsuarioByDni(businessId, dniVal);
      if (usuario) {
        setNombre(usuario.nombre || '');
        setEmpresa(usuario.empresa ?? '');
        setHotel(usuario.hotel ?? '');
      }
    } finally {
      setBuscarDni(false);
    }
  };

  const clearErrorOnChange = () => {
    if (error) setError('');
  };

  const handleSubmitCliente = async (e) => {
    e.preventDefault();
    setError('');
    const dniVal = dni.trim();
    const nombreVal = nombre.trim();
    const empresaVal = empresa.trim();
    const hotelVal = hotel.trim();
    if (!dniVal || !nombreVal || !empresaVal || !hotelVal) {
      setError('Completa todos los campos');
      return;
    }
    try {
      await loginCliente(businessId, dniVal, nombreVal, empresaVal, hotelVal);
      navigate(`/${businessSlug}/pedido`);
    } catch (err) {
      setError(err.message || 'Error al ingresar');
    }
  };

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

        {/* Tabs */}
        <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => { setMode('cliente'); setError(''); }}
            className={`flex-1 py-2.5 rounded-lg font-medium transition ${
              mode === 'cliente' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-600'
            }`}
          >
            Check-in Express
          </button>
          <button
            type="button"
            onClick={() => { setMode('staff'); setError(''); }}
            className={`flex-1 py-2.5 rounded-lg font-medium transition ${
              mode === 'staff' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-600'
            }`}
          >
            Staff
          </button>
        </div>

        {/* Form */}
        <div className="card">
          {mode === 'cliente' ? (
            <form onSubmit={handleSubmitCliente} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={dni}
                    onChange={(e) => { setDni(e.target.value); clearErrorOnChange(); }}
                    onBlur={handleDniBlur}
                    placeholder="Ej: 12345678"
                    className="input-field pl-10"
                    maxLength={12}
                  />
                  {buscarDni && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Buscando...</span>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => { setNombre(e.target.value); clearErrorOnChange(); }}
                    placeholder="Tu nombre completo"
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={empresa}
                    onChange={(e) => { setEmpresa(e.target.value); clearErrorOnChange(); }}
                    placeholder="Nombre de la empresa"
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hotel / Sede</label>
                <div className="relative">
                  <Hotel className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={hotel}
                    onChange={(e) => { setHotel(e.target.value); clearErrorOnChange(); }}
                    placeholder="Hotel o sede donde se aloja"
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full mt-2">
                Ingresar
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmitStaff} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="chef@viandapro.com"
                    className="input-field pl-10"
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
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full mt-2">
                Iniciar sesión
              </button>
            </form>
          )}

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
