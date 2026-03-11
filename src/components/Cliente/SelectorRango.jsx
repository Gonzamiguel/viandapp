/**
 * ViandaPro - Selector de Rango de Fechas
 * Respeta margen de reserva (bloquea días anteriores)
 */

import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { getConfiguracion } from '../../firebase/operations';
import { useBusiness } from '../../context/BusinessContext';
import { getMinFechaReserva, getMensajeRestriccion } from '../../utils/reservaHelpers';

export default function SelectorRango({ onConfirm, guestData }) {
  const { businessId } = useBusiness();
  const hoy = new Date();
  const maxDate = new Date(hoy);
  maxDate.setDate(maxDate.getDate() + 30);

  const [config, setConfig] = useState({ margenReservaHoras: 72 });
  const [loading, setLoading] = useState(true);
  const minFechaStr = getMinFechaReserva(config.margenReservaHoras);
  const ignorarRestriccion = guestData?.ignorar_restriccion ?? false;
  const fechaMinima = ignorarRestriccion ? hoy.toISOString().split('T')[0] : minFechaStr;

  const [fechaInicio, setFechaInicio] = useState(fechaMinima);
  const [fechaFin, setFechaFin] = useState(
    new Date(new Date(fechaMinima).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  useEffect(() => {
    if (!businessId) return;
    getConfiguracion(businessId).then(setConfig).finally(() => setLoading(false));
  }, [businessId]);

  useEffect(() => {
    if (!loading) {
      const min = ignorarRestriccion ? hoy.toISOString().split('T')[0] : minFechaStr;
      setFechaInicio((prev) => (prev < min ? min : prev));
      setFechaFin((prev) => (prev < min ? min : prev));
    }
  }, [loading, minFechaStr, ignorarRestriccion]);

  const handleConfirm = () => {
    if (new Date(fechaInicio) > new Date(fechaFin)) return;
    onConfirm({ fechaInicio, fechaFin });
  };

  const mensajeTooltip = getMensajeRestriccion(config.margenReservaHoras);

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse text-gray-500 py-8 text-center">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-emerald-600" />
        <h2 className="text-lg font-semibold text-gray-800">Selecciona el rango de fechas</h2>
      </div>
      {!ignorarRestriccion && (
        <p className="text-sm text-gray-500 mb-4" title={mensajeTooltip}>
          Los pedidos requieren al menos {config.margenReservaHoras}h de anticipación.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative group">
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            min={fechaMinima}
            max={maxDate.toISOString().split('T')[0]}
            className="input-field"
          />
          {!ignorarRestriccion && (
            <span className="absolute -bottom-6 left-0 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition pointer-events-none">
              {mensajeTooltip}
            </span>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            min={fechaInicio}
            max={maxDate.toISOString().split('T')[0]}
            className="input-field"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={handleConfirm}
        className="btn-primary w-full mt-6"
      >
        Continuar a selección de platos
      </button>
    </div>
  );
}
