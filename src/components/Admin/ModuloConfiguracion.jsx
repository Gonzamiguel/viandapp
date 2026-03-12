/**
 * ViandaPro - Módulo Configuración
 * Mi Negocio (White Label) + Configuración Global + Ingeniería de Menú
 */

import { useState, useEffect } from 'react';
import { Settings, Save, Building2, Percent, DollarSign, Target } from 'lucide-react';
import { getConfiguracion, updateConfiguracion, updateNegocio } from '../../firebase/operations';
import { useBusiness } from '../../context/BusinessContext';

export default function ModuloConfiguracion() {
  const { businessId, negocio } = useBusiness();
  const [margenReservaHoras, setMargenReservaHoras] = useState(72);
  const [factorQ, setFactorQ] = useState(0);
  const [factorQSpice, setFactorQSpice] = useState(0);
  const [precioVentaUnico, setPrecioVentaUnico] = useState(0);
  const [costoPonderadoObjetivo, setCostoPonderadoObjetivo] = useState('');
  const [nombreNegocio, setNombreNegocio] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [guardandoNegocio, setGuardandoNegocio] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [mensajeNegocio, setMensajeNegocio] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;
    getConfiguracion(businessId).then((c) => {
      setMargenReservaHoras(c.margenReservaHoras ?? 72);
      setFactorQ(c.factorQ ?? 0);
      setFactorQSpice(c.factorQSpice ?? 0);
      setPrecioVentaUnico(c.precioVentaUnico ?? 0);
      setCostoPonderadoObjetivo(c.costoPonderadoObjetivo ?? '');
    }).finally(() => setLoading(false));
  }, [businessId]);

  useEffect(() => {
    if (negocio) {
      setNombreNegocio(negocio.nombre ?? '');
      setLogoUrl(negocio.logoUrl ?? '');
    }
  }, [negocio]);

  const handleGuardarNegocio = async (e) => {
    e.preventDefault();
    setGuardandoNegocio(true);
    setMensajeNegocio('');
    try {
      await updateNegocio(businessId, {
        nombre: nombreNegocio.trim() || negocio?.nombre,
        logoUrl: logoUrl.trim() || null,
      });
      setMensajeNegocio('Negocio actualizado correctamente');
      setTimeout(() => setMensajeNegocio(''), 3000);
    } catch (err) {
      setMensajeNegocio(err.message || 'Error al guardar');
    } finally {
      setGuardandoNegocio(false);
    }
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje('');
    try {
      await updateConfiguracion(businessId, {
        margenReservaHoras: Number(margenReservaHoras) || 72,
        factorQ: Number(factorQ) || 0,
        factorQSpice: Number(factorQSpice) || 0,
        precioVentaUnico: Number(precioVentaUnico) || 0,
        costoPonderadoObjetivo: costoPonderadoObjetivo ? Number(costoPonderadoObjetivo) : null,
      });
      setMensaje('Configuración guardada correctamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setMensaje(err.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) return <div className="animate-pulse text-gray-500">Cargando...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Configuración</h1>

      {/* Mi Negocio (White Label) */}
      <div className="card max-w-md mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-gray-800">Mi Negocio</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Personalizá el nombre y logo que ven los clientes al hacer pedidos.
        </p>
        <form onSubmit={handleGuardarNegocio} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del negocio</label>
            <input
              type="text"
              value={nombreNegocio}
              onChange={(e) => setNombreNegocio(e.target.value)}
              placeholder="Ej: Donata Catering"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL del logo</label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-1">Subí tu logo a un hosting y pegá la URL aquí.</p>
          </div>
          {mensajeNegocio && (
            <p className={`text-sm p-3 rounded-lg ${mensajeNegocio.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
              {mensajeNegocio}
            </p>
          )}
          <button type="submit" disabled={guardandoNegocio} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            {guardandoNegocio ? 'Guardando...' : 'Guardar negocio'}
          </button>
        </form>
      </div>

      <div className="card max-w-md mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-gray-800">Configuración de reservas</h2>
        </div>
        <form onSubmit={handleGuardar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Margen de Reserva (Horas)
            </label>
            <input
              type="number"
              value={margenReservaHoras}
              onChange={(e) => setMargenReservaHoras(Number(e.target.value) || 72)}
              min={24}
              max={168}
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-1">
              Por defecto 72 horas (3 días). Los clientes solo pueden pedir para fechas posteriores a este margen.
            </p>
          </div>
          {mensaje && (
            <p className={`text-sm p-3 rounded-lg ${mensaje.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
              {mensaje}
            </p>
          )}
          <button type="submit" disabled={guardando} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </div>

      {/* Ingeniería de Menú - Super Admin del negocio */}
      <div className="card max-w-md">
        <div className="flex items-center gap-2 mb-4">
          <Percent className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-gray-800">Ingeniería de Menú</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Parámetros para el cálculo de costos y validación de rentabilidad.
        </p>
        <form onSubmit={handleGuardar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Factor Q (% costos ocultos)
            </label>
            <input
              type="number"
              value={factorQ}
              onChange={(e) => setFactorQ(Number(e.target.value) || 0)}
              min={0}
              max={50}
              step={0.5}
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-1">
              Porcentaje que se suma al costo de cada plato (mano de obra, energía, etc.). Ej: 15 = +15%.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Factor Q Spice (% sal, especias, aceites)
            </label>
            <input
              type="number"
              value={factorQSpice}
              onChange={(e) => setFactorQSpice(Number(e.target.value) || 0)}
              min={0}
              max={20}
              step={0.5}
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-1">
              Porcentaje global para cubrir sal, especias y aceites. Ej: 3 = +3%.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Precio de venta único ($)
            </label>
            <input
              type="number"
              value={precioVentaUnico}
              onChange={(e) => setPrecioVentaUnico(Number(e.target.value) || 0)}
              min={0}
              step={0.01}
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-1">
              Precio fijo de venta por vianda (modelo precio único).
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Target className="w-4 h-4 inline mr-1" />
              Costo ponderado objetivo ($)
            </label>
            <input
              type="number"
              value={costoPonderadoObjetivo}
              onChange={(e) => setCostoPonderadoObjetivo(e.target.value)}
              min={0}
              step={0.01}
              placeholder="Ej: 450"
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-1">
              Si el costo ponderado del menú diario supera este valor, se mostrará advertencia.
            </p>
          </div>
          {mensaje && (
            <p className={`text-sm p-3 rounded-lg ${mensaje.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
              {mensaje}
            </p>
          )}
          <button type="submit" disabled={guardando} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </div>
    </div>
  );
}
