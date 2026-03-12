/**
 * ViandaPro - Armador de Calendario (Rediseño UX)
 * Calendario compacto + Panel de configuración lateral + Termómetro de Rentabilidad Diaria
 */

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Save, Coffee, UtensilsCrossed, Moon, AlertTriangle, Thermometer } from 'lucide-react';
import { getRecetario, getMenuDiario, updateMenuDiario, getConfiguracion, subscribeInsumos } from '../../firebase/operations';
import { useBusiness } from '../../context/BusinessContext';
import { CATEGORIAS_PLATO } from '../../constants';
import { normalizeCategorias } from '../../utils/platoHelpers';
import { calcularCostoNetaPlato } from '../../utils/costosHelpers';

function keyNameUnidad(nombre, unidad) {
  return `${(nombre || '').trim().toLowerCase()}|${(unidad || '').toLowerCase()}`;
}

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function ModuloCalendario() {
  const { businessId } = useBusiness();
  const [recetario, setRecetario] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [config, setConfig] = useState({ factorQ: 0, factorQSpice: 0, precioVentaUnico: 0, costoPonderadoObjetivo: null });
  const [mesActual, setMesActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [menuDelDia, setMenuDelDia] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    getRecetario(businessId).then(setRecetario);
    getConfiguracion(businessId).then(setConfig);
    const unsub = subscribeInsumos(businessId, (list) => setInsumos(list.filter((i) => i.activo !== false)));
    return () => unsub?.();
  }, [businessId]);

  useEffect(() => {
    if (!businessId || !diaSeleccionado) {
      setMenuDelDia(null);
      return;
    }
    setLoadingMenu(true);
    getMenuDiario(businessId, diaSeleccionado)
      .then((m) => setMenuDelDia(m?.servicios || { desayuno: [], almuerzo: [], cena: [] }))
      .finally(() => setLoadingMenu(false));
  }, [businessId, diaSeleccionado]);

  const platosPorCategoria = {
    Desayuno: recetario.filter((p) => normalizeCategorias(p.categoria).includes('Desayuno')),
    Almuerzo: recetario.filter((p) => normalizeCategorias(p.categoria).includes('Almuerzo')),
    Cena: recetario.filter((p) => normalizeCategorias(p.categoria).includes('Cena')),
  };

  const { insumosById, insumosByNombreUnidad } = useMemo(() => {
    const byId = {};
    const byName = {};
    insumos.forEach((i) => {
      byId[i.id] = i;
      byName[keyNameUnidad(i.nombre, i.unidadMedida)] = i;
    });
    return { insumosById: byId, insumosByNombreUnidad: byName };
  }, [insumos]);

  const platosMap = useMemo(() => {
    const m = {};
    recetario.forEach((p) => { m[p.id] = p; });
    return m;
  }, [recetario]);

  const costoPonderadoDia = useMemo(() => {
    if (!menuDelDia) return 0;
    const ids = new Set();
    ['desayuno', 'almuerzo', 'cena'].forEach((s) => {
      (menuDelDia[s] || []).forEach((id) => ids.add(id));
    });
    if (ids.size === 0) return 0;
    const factorQ = config.factorQ ?? 0;
    const factorQSpice = config.factorQSpice ?? 0;
    let suma = 0;
    ids.forEach((id) => {
      const plato = platosMap[id];
      if (plato) {
        const { costoNeta } = calcularCostoNetaPlato(plato, insumosById, insumosByNombreUnidad, factorQ, factorQSpice);
        suma += costoNeta;
      }
    });
    return suma / ids.size;
  }, [menuDelDia, platosMap, insumosById, insumosByNombreUnidad, config.factorQ, config.factorQSpice]);

  const precioVenta = config.precioVentaUnico ?? 0;
  const umbral35 = precioVenta > 0 ? precioVenta * 0.35 : null;
  const objetivo = config.costoPonderadoObjetivo ?? null;
  const desbalanceado = (umbral35 != null && costoPonderadoDia > umbral35) || (objetivo != null && objetivo > 0 && costoPonderadoDia > objetivo);

  const togglePlato = (servicio, platoId) => {
    const serv = menuDelDia?.[servicio] || [];
    const idx = serv.indexOf(platoId);
    const nuevo = idx >= 0 ? serv.filter((_, i) => i !== idx) : [...serv, platoId];
    setMenuDelDia((prev) => ({
      ...(prev || {}),
      [servicio]: nuevo,
    }));
  };

  const handleGuardarDia = async () => {
    if (!businessId || !diaSeleccionado) return;
    setGuardando(true);
    await updateMenuDiario(businessId, diaSeleccionado, menuDelDia || { desayuno: [], almuerzo: [], cena: [] });
    setGuardando(false);
  };

  // Calendario: matriz 7x6 (semanas x días)
  const year = mesActual.getFullYear();
  const month = mesActual.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const totalDias = lastDay.getDate();
  const celdas = [];
  for (let i = 0; i < startOffset; i++) celdas.push(null);
  for (let d = 1; d <= totalDias; d++) celdas.push(d);
  while (celdas.length % 7 !== 0) celdas.push(null);

  const hayPlatos = recetario.length > 0;
  const formatearFecha = (dia) => {
    const d = new Date(year, month, dia);
    return d.toISOString().split('T')[0];
  };

  const esHoy = (dia) => {
    const hoy = new Date();
    return dia && year === hoy.getFullYear() && month === hoy.getMonth() && dia === hoy.getDate();
  };

  if (!hayPlatos) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Armador de Calendario</h1>
        <div className="card py-12 text-center">
          <p className="text-gray-500">No hay datos disponibles. Comience cargando un plato desde el módulo Chef.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Armador de Calendario</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendario compacto */}
        <div className="card w-fit shrink-0">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setMesActual((m) => new Date(m.getFullYear(), m.getMonth() - 1))}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold min-w-[160px] text-center capitalize">
              {mesActual.toLocaleString('es', { month: 'long' })} {year}
            </h2>
            <button
              type="button"
              onClick={() => setMesActual((m) => new Date(m.getFullYear(), m.getMonth() + 1))}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="w-[280px]">
            {/* Headers días */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {DIAS_SEMANA.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">
                  {d}
                </div>
              ))}
            </div>
            {/* Celdas */}
            <div className="grid grid-cols-7 gap-0.5">
              {celdas.map((dia, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => dia && setDiaSeleccionado(formatearFecha(dia))}
                  disabled={!dia}
                  className={`
                    w-9 h-9 rounded-lg text-sm font-medium transition
                    ${!dia ? 'invisible' : ''}
                    ${diaSeleccionado === formatearFecha(dia)
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                      : esHoy(dia)
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'hover:bg-gray-100 text-gray-700'
                    }
                  `}
                >
                  {dia || ''}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Panel de configuración */}
        <div className="flex-1 min-w-0">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              Configurando Menú: {diaSeleccionado ? (
                <span className="text-emerald-600">
                  {new Date(diaSeleccionado + 'T12:00:00').toLocaleDateString('es-AR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              ) : (
                <span className="text-gray-400 font-normal">Selecciona un día</span>
              )}
            </h2>

            {!diaSeleccionado ? (
              <p className="text-gray-500 text-sm mt-4">
                Haz clic en un número del calendario para configurar el menú de ese día.
              </p>
            ) : loadingMenu ? (
              <div className="py-12 text-center text-gray-500 animate-pulse">Cargando...</div>
            ) : (
              <div className="mt-6 space-y-6">
                {/* Termómetro de Rentabilidad Diaria */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Thermometer className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-medium text-gray-700">Rentabilidad Diaria</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            desbalanceado ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                          style={{
                            width: umbral35 && umbral35 > 0
                              ? `${Math.min(100, (costoPonderadoDia / umbral35) * 100)}%`
                              : objetivo && objetivo > 0
                                ? `${Math.min(100, (costoPonderadoDia / objetivo) * 100)}%`
                                : `${Math.min(100, (costoPonderadoDia / 600) * 100)}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Costo ponderado hoy: ${costoPonderadoDia.toFixed(2)}
                        {umbral35 && precioVenta > 0 && (
                          <span className="ml-2">| Límite 35%: ${umbral35.toFixed(2)}</span>
                        )}
                        {objetivo && objetivo > 0 && !umbral35 && (
                          <span className="ml-2">| Objetivo: ${objetivo.toFixed(2)}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {desbalanceado && (
                    <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 font-medium">
                        Atención: El costo de hoy (${costoPonderadoDia.toFixed(2)}) compromete tu margen. Considerá equilibrar con platos de menor costo.
                      </p>
                    </div>
                  )}
                </div>

                {CATEGORIAS_PLATO.map((cat) => {
                  const servicio = cat.toLowerCase();
                  const platos = platosPorCategoria[cat] || [];
                  const seleccionados = menuDelDia?.[servicio] || [];
                  const Icon = cat === 'Desayuno' ? Coffee : cat === 'Almuerzo' ? UtensilsCrossed : Moon;

                  return (
                    <div key={cat} className="border border-gray-100 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className="w-4 h-4 text-emerald-600" />
                        <h3 className="font-medium text-gray-700">{cat}</h3>
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-2 pr-1 border border-gray-100 rounded-lg p-2 bg-gray-50/50">
                        {platos.length === 0 ? (
                          <p className="text-sm text-gray-500 py-2">No hay platos en esta categoría</p>
                        ) : (
                          platos.map((p) => (
                            <label
                              key={p.id}
                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-white cursor-pointer group"
                            >
                              <input
                                type="checkbox"
                                checked={seleccionados.includes(p.id)}
                                onChange={() => togglePlato(servicio, p.id)}
                                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                                {p.nombre}
                              </span>
                              {p.kcal && (
                                <span className="text-xs text-gray-400 ml-auto">{p.kcal} kcal</span>
                              )}
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={handleGuardarDia}
                  disabled={guardando}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {guardando ? 'Guardando...' : 'Guardar Día'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
