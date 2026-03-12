/**
 * ViandaPro - Ingeniería de Menú
 * Simulador CFO: precio 100% real con gastos fijos, Factor Q, packaging y punto de equilibrio
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  TrendingUp,
  History,
  Trash2,
  Search,
  Plus,
  DollarSign,
  Save,
  X,
  Settings,
  BarChart3,
} from 'lucide-react';
import {
  getRecetario,
  subscribeInsumos,
  subscribePedidosRealtime,
  getConfiguracion,
  updateConfiguracion,
} from '../../firebase/operations';
import { useBusiness } from '../../context/BusinessContext';
import { calcularCostoNetaPlato } from '../../utils/costosHelpers';

const MAX_PLATOS_SIMULACION = 7;

function keyNameUnidad(nombre, unidad) {
  return `${(nombre || '').trim().toLowerCase()}|${(unidad || '').toLowerCase()}`;
}

export default function ModuloIngenieriaMenu() {
  const { businessId } = useBusiness();
  const [platos, setPlatos] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [config, setConfig] = useState({
    factorQ: 0,
    factorQSpice: 0,
    precioVentaUnico: 0,
    packagingPorUnidad: 0,
    gastosFijos: { sueldos: 0, alquiler: 0, otros: 0 },
  });
  const [platosSimulacion, setPlatosSimulacion] = useState([]);
  const [margenObjetivo, setMargenObjetivo] = useState(40);
  const [viandasEstimadasMes, setViandasEstimadasMes] = useState(200);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAbierta, setBusquedaAbierta] = useState(false);
  const [modalGastos, setModalGastos] = useState(false);
  const [gastosLocales, setGastosLocales] = useState({ sueldos: 0, alquiler: 0, otros: 0 });
  const [factorQLocal, setFactorQLocal] = useState(0);
  const [packagingLocal, setPackagingLocal] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return undefined;
    let cancelled = false;
    setLoading(true);
    Promise.all([getRecetario(businessId), getConfiguracion(businessId)])
      .then(([r, c]) => {
        if (!cancelled) {
          setPlatos(r);
          setConfig((prev) => ({
            ...prev,
            factorQ: c.factorQ ?? 0,
            factorQSpice: c.factorQSpice ?? 0,
            precioVentaUnico: c.precioVentaUnico ?? 0,
            packagingPorUnidad: c.packagingPorUnidad ?? 0,
            gastosFijos: c.gastosFijos ?? { sueldos: 0, alquiler: 0, otros: 0 },
          }));
          setGastosLocales(c.gastosFijos ?? { sueldos: 0, alquiler: 0, otros: 0 });
          setFactorQLocal(c.factorQSpice ?? 0);
          setPackagingLocal(c.packagingPorUnidad ?? 0);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    const unsubInsumos = subscribeInsumos(businessId, (list) => {
      if (!cancelled) setInsumos(list.filter((i) => i.activo !== false));
    });
    const unsubPedidos = subscribePedidosRealtime(businessId, (list) => {
      if (!cancelled) setPedidos(list);
    });
    return () => {
      cancelled = true;
      unsubInsumos?.();
      unsubPedidos?.();
    };
  }, [businessId]);

  const { insumosById, insumosByNombreUnidad } = useMemo(() => {
    const byId = {};
    const byName = {};
    insumos.forEach((i) => {
      byId[i.id] = i;
      byName[keyNameUnidad(i.nombre, i.unidadMedida)] = i;
    });
    return { insumosById: byId, insumosByNombreUnidad: byName };
  }, [insumos]);

  const platosConCosto = useMemo(() => {
    const factorQ = config.factorQ ?? 0;
    const factorQSpice = config.factorQSpice ?? 0;
    return platos.map((p) => {
      const { costoNeta } = calcularCostoNetaPlato(p, insumosById, insumosByNombreUnidad, factorQ, factorQSpice);
      return { ...p, costoNeta };
    });
  }, [platos, insumosById, insumosByNombreUnidad, config.factorQ, config.factorQSpice]);

  const pedidosUltimos30Dias = useMemo(() => {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 30);
    const desde = inicio.toISOString().split('T')[0];
    const hasta = fin.toISOString().split('T')[0];
    return pedidos.filter((p) => (p.fecha || '') >= desde && (p.fecha || '') <= hasta);
  }, [pedidos]);

  const totalGastosFijos = useMemo(() => {
    const g = config.gastosFijos ?? { sueldos: 0, alquiler: 0, otros: 0 };
    return (Number(g.sueldos) || 0) + (Number(g.alquiler) || 0) + (Number(g.otros) || 0);
  }, [config.gastosFijos]);

  const cargarMixHistorico = useCallback(() => {
    const total = pedidosUltimos30Dias.length;
    if (total === 0) return;
    const counts = {};
    pedidosUltimos30Dias.forEach((p) => {
      counts[p.platoId] = (counts[p.platoId] || 0) + 1;
    });
    const platosMap = {};
    platosConCosto.forEach((p) => { platosMap[p.id] = p; });
    const items = Object.entries(counts)
      .filter(([id]) => platosMap[id])
      .slice(0, MAX_PLATOS_SIMULACION)
      .map(([id, c]) => ({
        plato: platosMap[id],
        costoNeta: platosMap[id].costoNeta ?? 0,
        frecuencia: (c / total) * 100,
      }));
    setPlatosSimulacion(items);
    setBusquedaAbierta(false);
  }, [pedidosUltimos30Dias, platosConCosto]);

  const limpiarSimulacion = useCallback(() => {
    setPlatosSimulacion([]);
    setBusquedaAbierta(false);
  }, []);

  const agregarPlato = useCallback(
    (plato) => {
      if (platosSimulacion.some((i) => i.plato.id === plato.id)) return;
      if (platosSimulacion.length >= MAX_PLATOS_SIMULACION) return;
      const costoNeta = plato.costoNeta ?? 0;
      setPlatosSimulacion((prev) => [...prev, { plato, costoNeta, frecuencia: 0 }]);
      setBusqueda('');
      setBusquedaAbierta(false);
    },
    [platosSimulacion]
  );

  const quitarPlato = useCallback((platoId) => {
    setPlatosSimulacion((prev) => prev.filter((i) => i.plato.id !== platoId));
  }, []);

  const actualizarFrecuencia = useCallback((platoId, valor) => {
    const v = Math.max(0, Math.min(100, Number(valor) || 0));
    setPlatosSimulacion((prev) =>
      prev.map((i) => (i.plato.id === platoId ? { ...i, frecuencia: v } : i))
    );
  }, []);

  const platosDisponiblesParaAgregar = useMemo(() => {
    const idsEnSimulacion = new Set(platosSimulacion.map((i) => i.plato.id));
    let lista = platosConCosto.filter((p) => !idsEnSimulacion.has(p.id));
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      lista = lista.filter((p) => p.nombre?.toLowerCase().includes(q));
    }
    return lista;
  }, [platosConCosto, platosSimulacion, busqueda]);

  const sumaFrecuencias = useMemo(
    () => platosSimulacion.reduce((a, i) => a + i.frecuencia, 0),
    [platosSimulacion]
  );
  const calculoValido = Math.abs(sumaFrecuencias - 100) < 0.5;

  const costoPonderado = useMemo(() => {
    if (platosSimulacion.length === 0 || !calculoValido) return 0;
    return platosSimulacion.reduce((a, i) => a + i.costoNeta * (i.frecuencia / 100), 0);
  }, [platosSimulacion, calculoValido]);

  const packaging = config.packagingPorUnidad ?? 0;
  const N = Math.max(1, Number(viandasEstimadasMes) || 1);
  const costoFijosPorVianda = totalGastosFijos / N;

  const precioSugerido = useMemo(() => {
    const costoVariable = costoPonderado + packaging;
    const margen = Number(margenObjetivo) || 0;
    if (margen >= 100) return 0;
    return (costoVariable + costoFijosPorVianda) / (1 - margen / 100);
  }, [costoPonderado, packaging, margenObjetivo, costoFijosPorVianda]);

  const costoVariableUnitario = costoPonderado + packaging;
  const contribucionUnitaria = precioSugerido > 0 ? precioSugerido - costoVariableUnitario : 0;
  const puntoEquilibrio = contribucionUnitaria > 0 ? Math.ceil(totalGastosFijos / contribucionUnitaria) : 0;
  const utilidadNetaEstimada =
    contribucionUnitaria > 0 ? contribucionUnitaria * N - totalGastosFijos : 0;

  const desglosePorcentual = useMemo(() => {
    if (precioSugerido <= 0) return { comida: 0, gastosFijos: 0, ganancia: 0 };
    const pctComida = (costoVariableUnitario / precioSugerido) * 100;
    const pctGastosFijos = (costoFijosPorVianda / precioSugerido) * 100;
    const gananciaPorVianda = contribucionUnitaria - costoFijosPorVianda;
    const pctGanancia = (gananciaPorVianda / precioSugerido) * 100;
    return {
      comida: Math.max(0, Math.min(100, pctComida)),
      gastosFijos: Math.max(0, Math.min(100, pctGastosFijos)),
      ganancia: Math.max(0, Math.min(100, pctGanancia)),
    };
  }, [precioSugerido, costoVariableUnitario, costoFijosPorVianda, contribucionUnitaria]);

  const { platoMasCaro, platoMasBarato } = useMemo(() => {
    if (platosSimulacion.length === 0) return { platoMasCaro: 0, platoMasBarato: 0 };
    const costos = platosSimulacion.map((i) => i.costoNeta).filter((c) => c > 0);
    if (costos.length === 0) return { platoMasCaro: 0, platoMasBarato: 0 };
    return {
      platoMasCaro: Math.max(...costos),
      platoMasBarato: Math.min(...costos),
    };
  }, [platosSimulacion]);

  const handleGuardarGastos = async () => {
    if (!businessId) return;
    setGuardando(true);
    try {
      await updateConfiguracion(businessId, {
        gastosFijos: gastosLocales,
        factorQSpice: Number(factorQLocal) || 0,
        packagingPorUnidad: Number(packagingLocal) || 0,
      });
      setConfig((c) => ({
        ...c,
        gastosFijos: gastosLocales,
        factorQSpice: factorQLocal,
        packagingPorUnidad: packagingLocal,
      }));
      setModalGastos(false);
    } finally {
      setGuardando(false);
    }
  };

  const handleEstablecerPrecio = async () => {
    if (!businessId) return;
    setGuardando(true);
    setMensaje('');
    try {
      await updateConfiguracion(businessId, {
        precioVentaUnico: Math.round(precioSugerido * 100) / 100,
        precioVentaFijo: Math.round(precioSugerido * 100) / 100,
      });
      setConfig((c) => ({ ...c, precioVentaUnico: precioSugerido }));
      setMensaje('Precio de venta establecido correctamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setMensaje(err.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) return <div className="animate-pulse text-gray-500">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-emerald-600" />
          Ingeniería de Menú — Laboratorio CFO
        </h1>
        <button
          type="button"
          onClick={() => setModalGastos(true)}
          className="btn-secondary flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Gastos Mensuales y Factor Q
        </button>
      </div>

      {/* Modal Gastos Mensuales */}
      {modalGastos && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Gastos Mensuales del Negocio</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sueldos y Mano de Obra ($)</label>
                  <input
                    type="number"
                    value={gastosLocales.sueldos}
                    onChange={(e) => setGastosLocales((g) => ({ ...g, sueldos: Number(e.target.value) || 0 }))}
                    className="input-field"
                    min={0}
                    step={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alquiler y Servicios ($)</label>
                  <input
                    type="number"
                    value={gastosLocales.alquiler}
                    onChange={(e) => setGastosLocales((g) => ({ ...g, alquiler: Number(e.target.value) || 0 }))}
                    className="input-field"
                    placeholder="Luz, Gas, Agua"
                    min={0}
                    step={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Otros ($)</label>
                  <input
                    type="number"
                    value={gastosLocales.otros}
                    onChange={(e) => setGastosLocales((g) => ({ ...g, otros: Number(e.target.value) || 0 }))}
                    className="input-field"
                    placeholder="Software, Habilitaciones, Marketing"
                    min={0}
                    step={1}
                  />
                </div>
                <div className="rounded-lg bg-gray-100 p-3">
                  <p className="text-sm text-gray-600">Total Gastos Fijos</p>
                  <p className="text-xl font-bold text-emerald-700">
                    ${(
                      (gastosLocales.sueldos || 0) +
                      (gastosLocales.alquiler || 0) +
                      (gastosLocales.otros || 0)
                    ).toLocaleString()}
                  </p>
                </div>
                <hr />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Factor Q (%)</label>
                  <input
                    type="number"
                    value={factorQLocal}
                    onChange={(e) => setFactorQLocal(Number(e.target.value) || 0)}
                    className="input-field"
                    placeholder="Condimentos, mermas invisibles"
                    min={0}
                    max={30}
                    step={0.5}
                  />
                  <p className="text-xs text-gray-500 mt-1">Se suma al costo de cada plato</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Packaging por unidad ($)</label>
                  <input
                    type="number"
                    value={packagingLocal}
                    onChange={(e) => setPackagingLocal(Number(e.target.value) || 0)}
                    className="input-field"
                    min={0}
                    step={0.01}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={handleGuardarGastos}
                  disabled={guardando}
                  className="btn-primary flex-1"
                >
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" onClick={() => setModalGastos(false)} className="btn-secondary">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selección del Mix */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Selección del Mix (máx. {MAX_PLATOS_SIMULACION} platos)</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <button
            type="button"
            onClick={cargarMixHistorico}
            disabled={pedidosUltimos30Dias.length === 0}
            className="btn-primary flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            Cargar Mix Histórico
          </button>
          <button type="button" onClick={limpiarSimulacion} className="btn-secondary flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Limpiar y Simular Nuevo
          </button>
          <span className="text-sm text-gray-500">
            {pedidosUltimos30Dias.length > 0
              ? `Últimos 30 días: ${pedidosUltimos30Dias.length} pedidos`
              : 'Sin pedidos en los últimos 30 días'}
          </span>
          {platosSimulacion.length < MAX_PLATOS_SIMULACION && (
            <div className="relative ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onFocus={() => setBusquedaAbierta(true)}
                placeholder="Buscar plato..."
                className="input-field pl-9 w-56"
              />
              {busquedaAbierta && (
                <>
                  <div
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {platosDisponiblesParaAgregar.length === 0 ? (
                      <p className="p-3 text-sm text-gray-500">No hay platos</p>
                    ) : (
                      platosDisponiblesParaAgregar.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => agregarPlato(p)}
                          className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-emerald-50 text-sm"
                        >
                          <span>{p.nombre}</span>
                          <span className="text-gray-500">${(p.costoNeta || 0).toFixed(2)}</span>
                          <Plus className="w-4 h-4 text-emerald-600" />
                        </button>
                      ))
                    )}
                  </div>
                  <div className="fixed inset-0 z-[5]" onClick={() => setBusquedaAbierta(false)} aria-hidden />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {platosSimulacion.length > 0 && (
        <div className="flex items-center gap-4">
          <span
            className={`text-sm font-medium ${
              calculoValido ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            Suma: {sumaFrecuencias.toFixed(1)}%
            {!calculoValido && ' — La suma debe ser 100% para un cálculo válido'}
          </span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sliders */}
        <div className="flex-1 min-w-0">
          <div className="space-y-4">
            {platosSimulacion.length === 0 ? (
              <div className="card py-12 text-center">
                <p className="text-gray-500 mb-4">
                  Usá "Cargar Mix Histórico" o buscá platos para agregar (máx. {MAX_PLATOS_SIMULACION}).
                </p>
              </div>
            ) : (
              platosSimulacion.map((item) => (
                <div key={item.plato.id} className="card flex flex-col gap-3 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">{item.plato.nombre}</h3>
                      <p className="text-sm text-emerald-600">Costo Neta (con Factor Q): ${item.costoNeta.toFixed(2)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => quitarPlato(item.plato.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={0.5}
                      value={item.frecuencia}
                      onChange={(e) => actualizarFrecuencia(item.plato.id, e.target.value)}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <span className="text-sm font-medium w-14 text-right">{item.frecuencia.toFixed(1)}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Burbuja de Decisión */}
        <div className="lg:w-96 shrink-0">
          <div className="lg:sticky lg:top-6 card bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Burbuja de Decisión
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500">Costo Ponderado (Ingredientes + Factor Q)</p>
                <p className="text-xl font-bold text-emerald-700">${costoPonderado.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Margen Deseado Neto (%)</label>
                <input
                  type="number"
                  value={margenObjetivo}
                  onChange={(e) => setMargenObjetivo(Number(e.target.value) || 0)}
                  min={0}
                  max={99}
                  step={0.5}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Viandas estimadas por mes</label>
                <input
                  type="number"
                  value={viandasEstimadasMes}
                  onChange={(e) => setViandasEstimadasMes(Number(e.target.value) || 1)}
                  min={1}
                  className="input-field"
                />
              </div>

              <div className="rounded-xl bg-emerald-600 text-white p-5">
                <p className="text-sm opacity-90">Precio de Venta Único Recomendado</p>
                <p className="text-4xl font-bold mt-1">${precioSugerido.toFixed(2)}</p>
              </div>

              {calculoValido && precioSugerido > 0 && (
                <>
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                    <p className="text-sm font-medium text-amber-800">Punto de Equilibrio</p>
                    <p className="text-lg font-bold text-amber-900 mt-1">
                      Necesitás vender {puntoEquilibrio.toLocaleString()} viandas al mes para cubrir tus gastos fijos.
                    </p>
                  </div>
                  <div className="rounded-lg bg-emerald-100 border border-emerald-200 p-4">
                    <p className="text-sm font-medium text-emerald-800">Utilidad Neta Estimada</p>
                    <p className="text-2xl font-bold text-emerald-900 mt-1">
                      ${utilidadNetaEstimada.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-emerald-700 mt-1">
                      Con este precio y este mix, tu ganancia limpia mensual sería de $
                      {utilidadNetaEstimada.toLocaleString('es-AR', { minimumFractionDigits: 0 })}.
                    </p>
                  </div>

                  {/* Gráfico de barras */}
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-3">Reparto del precio por vianda</p>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span>Comida (insumos + packaging)</span>
                          <span>{desglosePorcentual.comida.toFixed(1)}%</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${desglosePorcentual.comida}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span>Gastos fijos (proporcional)</span>
                          <span>{desglosePorcentual.gastosFijos.toFixed(1)}%</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${desglosePorcentual.gastosFijos}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span>Ganancia neta</span>
                          <span>{desglosePorcentual.ganancia.toFixed(1)}%</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${desglosePorcentual.ganancia}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    <p className="text-xs font-medium text-gray-500">Subsidios cruzados</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Plato más barato</span>
                      <span className="font-semibold text-emerald-600">${platoMasBarato.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Plato más caro</span>
                      <span className="font-semibold text-amber-600">${platoMasCaro.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleEstablecerPrecio}
                  disabled={guardando || !calculoValido || platosSimulacion.length === 0}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {guardando ? 'Guardando...' : 'Establecer como Precio de Venta Oficial'}
                </button>
                {config.precioVentaUnico > 0 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Precio actual: ${config.precioVentaUnico.toFixed(2)}
                  </p>
                )}
                {mensaje && (
                  <p className={`text-sm mt-2 text-center ${mensaje.includes('Error') ? 'text-red-600' : 'text-emerald-700'}`}>
                    {mensaje}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
