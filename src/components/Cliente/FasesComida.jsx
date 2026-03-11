/**
 * ViandaPro - Fases de Comida
 * Cards por día con Desayuno, Almuerzo, Cena
 * Bloquea días que no cumplan margen de reserva
 */

import { useState, useEffect } from 'react';
import { Coffee, UtensilsCrossed, Moon, Check, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMenusRango, getPlatoById, createPedido, getConfiguracion } from '../../firebase/operations';
import { useBusiness } from '../../context/BusinessContext';
import { esFechaPermitida, getMensajeRestriccion } from '../../utils/reservaHelpers';

const SERVICIOS = [
  { key: 'desayuno', label: 'Desayuno', icon: Coffee },
  { key: 'almuerzo', label: 'Almuerzo', icon: UtensilsCrossed },
  { key: 'cena', label: 'Cena', icon: Moon },
];

export default function FasesComida({ fechaInicio, fechaFin, guestData, onBack }) {
  const { businessId } = useBusiness();
  const [config, setConfig] = useState({ margenReservaHoras: 72 });
  const [menus, setMenus] = useState({});
  const [selecciones, setSelecciones] = useState({});
  const [platosCache, setPlatosCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [errorPedido, setErrorPedido] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);

  const ignorarRestriccion = guestData?.ignorar_restriccion ?? false;

  const dias = [];
  const start = new Date(fechaInicio);
  const end = new Date(fechaFin);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dias.push(d.toISOString().split('T')[0]);
  }

  useEffect(() => {
    if (!businessId) return;
    getConfiguracion(businessId).then(setConfig);
  }, [businessId]);

  useEffect(() => {
    if (!businessId) return;
    getMenusRango(businessId, fechaInicio, fechaFin).then(setMenus).finally(() => setLoading(false));
  }, [businessId, fechaInicio, fechaFin]);

  useEffect(() => {
    if (!businessId) return;
    const ids = new Set();
    Object.values(menus).forEach((menu) => {
      Object.values(menu?.servicios || {}).forEach((arr) => {
        (arr || []).forEach((id) => ids.add(id));
      });
    });
    const missing = Array.from(ids).filter((id) => !platosCache[id]);
    if (missing.length === 0) return;
    Promise.all(missing.map((id) => getPlatoById(businessId, id)))
      .then((list) => {
        setPlatosCache((prev) => {
          const next = { ...prev };
          list.forEach((plato) => {
            if (plato?.id) next[plato.id] = plato;
          });
          return next;
        });
      })
      .catch(() => {});
  }, [menus, businessId, platosCache]);

  const handleSeleccionar = (fecha, servicio, platoId, bloqueado) => {
    if (bloqueado) return;
    setSelecciones((prev) => ({
      ...prev,
      [fecha]: {
        ...(prev[fecha] || {}),
        [servicio]: platoId,
      },
    }));
  };

  const handleConfirmar = async () => {
    setEnviando(true);
    setErrorPedido('');
    try {
      const pedidos = [];
      for (const fecha of Object.keys(selecciones)) {
        for (const [servicio, platoId] of Object.entries(selecciones[fecha])) {
          if (platoId) {
            pedidos.push(
              createPedido(businessId, {
                dni: guestData.dni,
                nombre: guestData.nombre,
                fecha,
                servicio,
                platoId,
                empresa: guestData.empresa,
                hotel: guestData.hotel,
                ignorar_restriccion: ignorarRestriccion,
              })
            );
          }
        }
      }
      await Promise.all(pedidos);
      setConfirmado(true);
    } catch (err) {
      setErrorPedido(err.message || 'Error al confirmar pedidos');
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div className="card text-center py-12">
        <div className="animate-pulse text-gray-500">Cargando menús...</div>
      </div>
    );
  }

  const hayMenus = dias.some((f) => menus[f]?.servicios);
  if (!hayMenus) {
    return (
      <div className="card py-12 text-center">
        <p className="text-gray-500 mb-4">No hay menús configurados para este rango. El administrador debe asignar platos en el Calendario.</p>
        <button type="button" onClick={onBack} className="btn-secondary">Cambiar fechas</button>
      </div>
    );
  }

  if (confirmado) {
    return (
      <div className="card text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
          <Check className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">¡Pedidos confirmados!</h3>
        <p className="text-gray-500 mb-6">Tus viandas han sido registradas correctamente.</p>
        <button type="button" onClick={onBack} className="btn-secondary">
          Hacer otro pedido
        </button>
      </div>
    );
  }

  const mensajeRestriccion = getMensajeRestriccion(config.margenReservaHoras);
  const fechaActual = dias[currentIdx] || dias[0];
  const menuActual = menus[fechaActual];
  const bloqueado = !esFechaPermitida(fechaActual, config.margenReservaHoras, ignorarRestriccion);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="text-emerald-600 hover:underline text-sm">
          ← Cambiar fechas
        </button>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <button
            type="button"
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-medium">
            Día {currentIdx + 1} de {dias.length}
          </span>
          <button
            type="button"
            onClick={() => setCurrentIdx((i) => Math.min(dias.length - 1, i + 1))}
            disabled={currentIdx === dias.length - 1}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {menuActual ? (
        <div
          className={`card relative ${bloqueado ? 'opacity-60 bg-gray-50' : ''}`}
          title={bloqueado ? mensajeRestriccion : ''}
        >
          {bloqueado && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl z-10 cursor-not-allowed"
              title={mensajeRestriccion}
            >
              <div className="text-center p-4">
                <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 max-w-[200px]">{mensajeRestriccion}</p>
              </div>
            </div>
          )}
          <h3 className="font-semibold text-gray-800 mb-4">
            {new Date(fechaActual + 'T12:00:00').toLocaleDateString('es-AR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </h3>

          <div className="space-y-4">
            {SERVICIOS.map(({ key, label, icon: Icon }) => {
              const platosIds = menuActual.servicios?.[key] || [];
              const seleccionado = selecciones[fechaActual]?.[key] || '';
              return (
                <div key={key} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-gray-700">{label}</span>
                  </div>
                  <select
                    value={seleccionado}
                    onChange={(e) => handleSeleccionar(fechaActual, key, e.target.value, bloqueado)}
                    disabled={bloqueado || platosIds.length === 0}
                    className="input-field w-full"
                  >
                    <option value="">{platosIds.length ? 'Selecciona un plato' : 'Sin opciones'}</option>
                    {platosIds.map((platoId) => (
                      <option key={platoId} value={platoId}>
                        {platosCache[platoId]?.nombre || 'Plato'}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card py-12 text-center text-gray-500">No hay menú para este día.</div>
      )}

      {errorPedido && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{errorPedido}</p>
      )}

      <div className="card">
        <button
          type="button"
          onClick={handleConfirmar}
          disabled={enviando || Object.keys(selecciones).length === 0}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {enviando ? 'Confirmando...' : 'Confirmar pedidos'}
        </button>
      </div>
    </div>
  );
}

function PlatoOption({ businessId, platoId, seleccionado, bloqueado, onSelect, mensajeRestriccion }) {
  const [plato, setPlato] = useState(null);
  useEffect(() => {
    if (!businessId) return;
    getPlatoById(businessId, platoId).then(setPlato);
  }, [businessId, platoId]);

  if (!plato) return null;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={bloqueado}
      title={bloqueado ? mensajeRestriccion : ''}
      className={`px-4 py-2 rounded-lg border-2 text-left transition ${
        bloqueado
          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
          : seleccionado
            ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
            : 'border-gray-200 hover:border-emerald-300 text-gray-700'
      }`}
    >
      <span className="font-medium">{plato.nombre}</span>
      <span className="block text-xs text-gray-500">{plato.kcal} kcal</span>
    </button>
  );
}
