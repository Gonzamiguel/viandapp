/**
 * ViandaPro - Módulo Necesidades/Stock
 * Suma todos los ingredientes de pedidos confirmados + Export Excel
 */

import { useState, useEffect, useMemo } from 'react';
import { Download, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getPedidos, getRecetario } from '../../firebase/operations';
import { useBusiness } from '../../context/BusinessContext';
import { sumarIngredientesDePedidos } from '../../utils/necesidadesHelpers';

export default function ModuloNecesidades() {
  const { businessId } = useBusiness();
  const [pedidos, setPedidos] = useState([]);
  const [recetario, setRecetario] = useState([]);
  const [filtros, setFiltros] = useState({
    anio: new Date().getFullYear().toString(),
    mes: '',
    fechaDesde: '',
    fechaHasta: '',
    servicio: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;
    Promise.all([getPedidos(businessId), getRecetario(businessId)]).then(([p, r]) => {
      setPedidos(p);
      setRecetario(r);
    }).finally(() => setLoading(false));
  }, [businessId]);

  const platosMap = useMemo(() => {
    const m = {};
    recetario.forEach((p) => { m[p.id] = p; });
    return m;
  }, [recetario]);

  const pedidosFiltrados = useMemo(() => {
    let list = [...pedidos];
    const { fechaDesde, fechaHasta } = filtros;
    if (fechaDesde) {
      list = list.filter((p) => p.fecha >= fechaDesde);
    }
    if (fechaHasta) {
      list = list.filter((p) => p.fecha <= fechaHasta);
    }
    if (filtros.anio) {
      list = list.filter((p) => new Date(p.fecha).getFullYear() === parseInt(filtros.anio, 10));
    }
    if (filtros.mes) {
      list = list.filter((p) => new Date(p.fecha).getMonth() + 1 === parseInt(filtros.mes, 10));
    }
    if (filtros.servicio) {
      list = list.filter((p) => p.servicio === filtros.servicio);
    }
    return list;
  }, [pedidos, filtros]);

  const necesidades = useMemo(() => {
    return sumarIngredientesDePedidos(pedidosFiltrados, platosMap);
  }, [pedidosFiltrados, platosMap]);

  const handleExportExcel = () => {
    const data = necesidades.map((i) => ({
      Ingrediente: i.nombre,
      'Cantidad Total': i.cantidad,
      Unidad: i.unidad,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Necesidades');
    const nombreArchivo = [
      'necesidades',
      filtros.fechaDesde && `desde-${filtros.fechaDesde}`,
      filtros.fechaHasta && `hasta-${filtros.fechaHasta}`,
      filtros.mes && `m${filtros.mes}`,
    ].filter(Boolean).join('_') || 'necesidades_general';
    XLSX.writeFile(wb, `${nombreArchivo}.xlsx`);
  };

  if (loading) return <div className="animate-pulse text-gray-500">Cargando...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Necesidades / Stock</h1>

      {/* Filtros */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-gray-800">Filtros</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Año</label>
            <select
              value={filtros.anio}
              onChange={(e) => setFiltros((f) => ({ ...f, anio: e.target.value }))}
              className="input-field"
            >
              {[2024, 2025, 2026].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Mes</label>
            <select
              value={filtros.mes}
              onChange={(e) => setFiltros((f) => ({ ...f, mes: e.target.value }))}
              className="input-field"
            >
              <option value="">Todos</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString('es', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Desde</label>
            <input
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) => setFiltros((f) => ({ ...f, fechaDesde: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Hasta</label>
            <input
              type="date"
              value={filtros.fechaHasta}
              onChange={(e) => setFiltros((f) => ({ ...f, fechaHasta: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Servicio</label>
            <select
              value={filtros.servicio}
              onChange={(e) => setFiltros((f) => ({ ...f, servicio: e.target.value }))}
              className="input-field"
            >
              <option value="">Todos</option>
              <option value="desayuno">Desayuno</option>
              <option value="almuerzo">Almuerzo</option>
              <option value="cena">Cena</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de necesidades */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Ingredientes totales ({pedidosFiltrados.length} pedidos)
          </h2>
          <button onClick={handleExportExcel} className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar Excel
          </button>
        </div>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-3 font-medium text-gray-700">Ingrediente</th>
                <th className="text-right p-3 font-medium text-gray-700">Cantidad Total</th>
                <th className="text-left p-3 font-medium text-gray-700">Unidad</th>
              </tr>
            </thead>
            <tbody>
              {necesidades.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    No hay pedidos en el rango seleccionado
                  </td>
                </tr>
              ) : (
                necesidades.map((ing, i) => (
                  <tr key={i} className="border-t border-gray-100 hover:bg-gray-50/50">
                    <td className="p-3 font-medium">{ing.nombre}</td>
                    <td className="p-3 text-right">{ing.cantidad}</td>
                    <td className="p-3">{ing.unidad}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
