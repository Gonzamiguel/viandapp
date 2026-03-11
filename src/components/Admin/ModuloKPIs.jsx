/**
 * ViandaPro - Dashboard de Analítica de Viandas (KPIs Reales)
 * Agregaciones desde Firestore: pedidos + join con platos
 */

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Calendar, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { getPedidos, getRecetario } from '../../firebase/operations';
import { useBusiness } from '../../context/BusinessContext';

const COLOR_EMERALD = '#059669';
const SERVICIOS = [
  { key: 'desayuno', label: 'Desayuno' },
  { key: 'almuerzo', label: 'Almuerzo' },
  { key: 'cena', label: 'Cena' },
];

function getRangoDefault() {
  const hoy = new Date();
  const hace7 = new Date(hoy);
  hace7.setDate(hace7.getDate() - 6);
  return {
    fechaDesde: hace7.toISOString().split('T')[0],
    fechaHasta: hoy.toISOString().split('T')[0],
  };
}

export default function ModuloKPIs() {
  const { businessId } = useBusiness();
  const [pedidosRaw, setPedidosRaw] = useState([]);
  const [recetario, setRecetario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rango, setRango] = useState(getRangoDefault);

  useEffect(() => {
    if (!businessId) return;
    Promise.all([getPedidos(businessId), getRecetario(businessId)]).then(([p, r]) => {
      setPedidosRaw(p);
      setRecetario(r);
    }).finally(() => setLoading(false));
  }, [businessId]);

  const pedidosFiltrados = useMemo(() => {
    return pedidosRaw.filter((p) => {
      if (!p.fecha) return false;
      if (rango.fechaDesde && p.fecha < rango.fechaDesde) return false;
      if (rango.fechaHasta && p.fecha > rango.fechaHasta) return false;
      return true;
    });
  }, [pedidosRaw, rango]);

  const platosMap = useMemo(() => {
    const m = {};
    recetario.forEach((p) => { m[p.id] = p; });
    return m;
  }, [recetario]);

  const datosPorServicio = useMemo(() => {
    const counts = { desayuno: 0, almuerzo: 0, cena: 0 };
    pedidosFiltrados.forEach((p) => {
      const s = (p.servicio || '').toLowerCase();
      if (counts[s] !== undefined) counts[s]++;
    });
    return SERVICIOS.map(({ key, label }) => ({
      servicio: label,
      cantidad: counts[key] || 0,
    }));
  }, [pedidosFiltrados]);

  const rankingPlatos = useMemo(() => {
    const counts = {};
    pedidosFiltrados.forEach((p) => {
      if (p.platoId) counts[p.platoId] = (counts[p.platoId] || 0) + 1;
    });
    return Object.entries(counts).map(([platoId, cantidad]) => ({
      platoId,
      nombre: platosMap[platoId]?.nombre || platoId,
      cantidad,
    }));
  }, [pedidosFiltrados, platosMap]);

  const top5Mas = useMemo(() => {
    return [...rankingPlatos].sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);
  }, [rankingPlatos]);

  const top5Menos = useMemo(() => {
    const ordenados = [...rankingPlatos].sort((a, b) => a.cantidad - b.cantidad);
    return ordenados.slice(0, 5);
  }, [rankingPlatos]);

  const sinDatos = pedidosFiltrados.length === 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard / KPIs</h1>
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard / KPIs</h1>

      {/* Selector de rango de fechas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-5 h-5" />
          <span className="font-medium">Rango de fechas</span>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">Desde</label>
            <input
              type="date"
              value={rango.fechaDesde}
              onChange={(e) => setRango((prev) => ({ ...prev, fechaDesde: e.target.value }))}
              className="input-field py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">Hasta</label>
            <input
              type="date"
              value={rango.fechaHasta}
              onChange={(e) => setRango((prev) => ({ ...prev, fechaHasta: e.target.value }))}
              className="input-field py-2 text-sm"
            />
          </div>
          {!sinDatos && (
            <p className="text-sm text-emerald-600 font-medium ml-2">
              {pedidosFiltrados.length} pedidos en este rango
            </p>
          )}
        </div>
      </div>

      {sinDatos ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">No hay pedidos en este rango de fechas</p>
          <p className="text-gray-400 text-sm mt-1">Ajusta el rango o espera a que se registren pedidos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico: Top 5 más pedidos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Top 5 platos más pedidos
            </h2>
            <div className="h-72">
              {top5Mas.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top5Mas} layout="vertical" margin={{ left: 8, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="nombre"
                      width={120}
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      tickFormatter={(v) => (v.length > 18 ? `${v.slice(0, 18)}…` : v)}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px' }}
                      formatter={(v) => [v, 'Pedidos']}
                      labelFormatter={(l) => l}
                    />
                    <Bar dataKey="cantidad" name="Pedidos" radius={[0, 4, 4, 0]} fill={COLOR_EMERALD}>
                      {top5Mas.map((_, i) => (
                        <Cell key={i} fill={COLOR_EMERALD} fillOpacity={1 - i * 0.12} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">Sin datos</div>
              )}
            </div>
          </div>

          {/* Gráfico: Top 5 menos pedidos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-amber-600" />
              Top 5 platos menos pedidos
            </h2>
            <div className="h-72">
              {top5Menos.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top5Menos} layout="vertical" margin={{ left: 8, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="nombre"
                      width={140}
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      tickFormatter={(v) => (v.length > 22 ? `${v.slice(0, 22)}…` : v)}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px' }}
                      formatter={(v) => [v, 'Pedidos']}
                      labelFormatter={(l) => l}
                    />
                    <Bar dataKey="cantidad" name="Pedidos" radius={[0, 4, 4, 0]} fill="#d97706">
                      {top5Menos.map((_, i) => (
                        <Cell key={i} fill="#d97706" fillOpacity={0.6 + i * 0.08} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">Sin datos</div>
              )}
            </div>
          </div>

          {/* Gráfico: Demanda por Servicio */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Demanda por servicio</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosPorServicio} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="servicio" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px' }}
                    formatter={(v) => [v, 'Viandas']}
                    labelFormatter={(l) => l}
                  />
                  <Bar dataKey="cantidad" name="Viandas" radius={[4, 4, 0, 0]} fill={COLOR_EMERALD} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
