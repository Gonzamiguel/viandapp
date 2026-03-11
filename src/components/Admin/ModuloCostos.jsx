import { useEffect, useMemo, useState } from 'react';
import { Calculator, Wallet, FileDown, ShoppingCart } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { useBusiness } from '../../context/BusinessContext';
import { getRecetario, subscribePedidosRealtime, subscribeInsumos } from '../../firebase/operations';
import { sumarIngredientesDePedidos } from '../../utils/necesidadesHelpers';
import { UNIDADES as UNIDADES_PLATOS } from '../../constants';

function normalizeName(str) {
  return (str || '').trim().toLowerCase();
}

function keyNameUnidad(nombre, unidad) {
  return `${normalizeName(nombre)}|${(unidad || '').toLowerCase()}`;
}

function precioConvertido(insumo, unidadNecesaria) {
  const precio = Number(insumo?.precioUnitario) || 0;
  const unidadInsumo = (insumo?.unidadMedida || '').toLowerCase();
  const unidad = (unidadNecesaria || '').toLowerCase();
  if (!precio) return 0;
  if (unidadInsumo === unidad) return precio;
  // Conversión básica kg<->gr y lt<->ml
  if (unidadInsumo === 'kg' && unidad === 'gr') return precio / 1000;
  if (unidadInsumo === 'gr' && unidad === 'kg') return precio * 1000;
  if ((unidadInsumo === 'l' || unidadInsumo === 'lt') && unidad === 'ml') return precio / 1000;
  if (unidadInsumo === 'ml' && (unidad === 'l' || unidad === 'lt')) return precio * 1000;
  // Si no sabemos convertir, devolvemos 0 para alertar con costo 0
  return 0;
}

export default function ModuloCostos() {
  const { businessId } = useBusiness();
  const [pedidos, setPedidos] = useState([]);
  const [recetario, setRecetario] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const hoy = new Date().toISOString().split('T')[0];
  const [rango, setRango] = useState({ desde: hoy, hasta: hoy });

  useEffect(() => {
    if (!businessId) return undefined;
    let cancelled = false;
    setLoading(true);

    getRecetario(businessId).then((r) => { if (!cancelled) setRecetario(r); });

    const unsubPedidos = subscribePedidosRealtime(
      businessId,
      (list) => {
        setPedidos(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    const unsubInsumos = subscribeInsumos(
      businessId,
      (list) => setInsumos(list.filter((i) => i.activo !== false)),
      () => {}
    );

    return () => {
      cancelled = true;
      unsubPedidos?.();
      unsubInsumos?.();
    };
  }, [businessId]);

  const platosMap = useMemo(() => {
    const m = {};
    recetario.forEach((p) => { m[p.id] = p; });
    return m;
  }, [recetario]);

  const pedidosEnRango = useMemo(() => {
    const { desde, hasta } = rango;
    return pedidos.filter((p) => {
      const f = p.fecha || '';
      if (desde && f < desde) return false;
      if (hasta && f > hasta) return false;
      return true;
    });
  }, [pedidos, rango]);

  const necesidades = useMemo(() => sumarIngredientesDePedidos(pedidosEnRango, platosMap), [pedidosEnRango, platosMap]);

  const { insumosById, insumosByNombreUnidad } = useMemo(() => {
    const byId = {};
    const byName = {};
    insumos.forEach((i) => {
      byId[i.id] = i;
      const key = keyNameUnidad(i.nombre, i.unidadMedida);
      byName[key] = i;
    });
    return { insumosById: byId, insumosByNombreUnidad: byName };
  }, [insumos]);

  const filas = useMemo(() => {
    return necesidades.map((n) => {
      const insumo =
        (n.insumoId && insumosById[n.insumoId]) ||
        insumosByNombreUnidad[keyNameUnidad(n.nombre, n.unidad)];
      const precio = precioConvertido(insumo, n.unidad);
      const merma = insumo?.merma || 0;
      const divisor = 1 - (merma / 100 || 0);
      const costo = divisor > 0 ? (n.cantidad * precio) / divisor : n.cantidad * precio;
      return {
        ...n,
        insumoNombre: insumo?.nombre || n.nombre,
        unidad: insumo?.unidadMedida || n.unidad,
        precioUnitario: precio,
        merma,
        costo,
      };
    });
  }, [necesidades, insumosById, insumosByNombreUnidad]);

  const costoTotal = useMemo(() => filas.reduce((acc, f) => acc + (f.costo || 0), 0), [filas]);

  const menusTotales = useMemo(() => pedidosEnRango.length, [pedidosEnRango]);
  const ticketPromedioCosto = menusTotales ? costoTotal / menusTotales : 0;

  const comprasProyectadas = useMemo(() => {
    return filas.map((f) => {
      const mermaFactor = 1 - (f.merma / 100 || 0);
      const cantidadCompra = mermaFactor > 0 ? f.cantidad / mermaFactor : f.cantidad;
      const presupuesto = cantidadCompra * f.precioUnitario;
      return {
        insumoNombre: f.insumoNombre,
        cantidadCompra,
        unidad: f.unidad,
        presupuesto,
      };
    });
  }, [filas]);

  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();
    const comprasSheet = XLSX.utils.json_to_sheet(
      comprasProyectadas.map((c) => ({
        Insumo: c.insumoNombre,
        'Cantidad a comprar': c.cantidadCompra,
        Unidad: c.unidad,
        Presupuesto: c.presupuesto,
      }))
    );
    XLSX.utils.book_append_sheet(wb, comprasSheet, 'Compras');
    const costosSheet = XLSX.utils.json_to_sheet(
      filas.map((f) => ({
        Insumo: f.insumoNombre,
        Cantidad: f.cantidad,
        Unidad: f.unidad,
        'Precio unitario': f.precioUnitario,
        'Merma (%)': f.merma,
        Costo: f.costo,
      }))
    );
    XLSX.utils.book_append_sheet(wb, costosSheet, 'Costos');
    XLSX.writeFile(wb, `costos_${rango.desde || hoy}_${rango.hasta || hoy}.xlsx`);
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Lista de Compras Proyectada', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Empresa: ${nombre || businessId || ''}`, 14, 22);
    doc.text(`Rango: ${rango.desde || '-'} a ${rango.hasta || '-'}`, 14, 28);

    const startY = 35;
    const headers = ['Insumo', 'Cant. compra', 'Unidad', 'Presupuesto'];
    const colX = [14, 90, 130, 160];
    doc.setFontSize(9);
    headers.forEach((h, i) => doc.text(h, colX[i], startY));
    comprasProyectadas.forEach((c, idx) => {
      const y = startY + 7 + idx * 6;
      doc.text(String(c.insumoNombre), colX[0], y);
      doc.text(String(c.cantidadCompra.toFixed(2)), colX[1], y, { align: 'right' });
      doc.text(String(c.unidad || ''), colX[2], y);
      doc.text(`$${c.presupuesto.toFixed(2)}`, colX[3], y, { align: 'right' });
    });
    doc.save(`compras_${rango.desde || hoy}_${rango.hasta || hoy}.pdf`);
  };

  if (loading) return <div className="animate-pulse text-gray-500">Cargando costos...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-emerald-600" />
          Análisis de Costos
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Desde</label>
            <input
              type="date"
              value={rango.desde}
              onChange={(e) => setRango((p) => ({ ...p, desde: e.target.value }))}
              className="input-field"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Hasta</label>
            <input
              type="date"
              value={rango.hasta}
              onChange={(e) => setRango((p) => ({ ...p, hasta: e.target.value }))}
              className="input-field"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Menús totales (rango)</p>
            <p className="text-3xl font-bold text-gray-800">{menusTotales}</p>
          </div>
          <Calculator className="w-10 h-10 text-blue-600" />
        </div>
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Costo operativo total (rango)</p>
            <p className="text-3xl font-bold text-gray-800">${costoTotal.toFixed(2)}</p>
          </div>
          <Wallet className="w-10 h-10 text-emerald-600" />
        </div>
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Ticket promedio de costo (rango)</p>
            <p className="text-3xl font-bold text-gray-800">${ticketPromedioCosto.toFixed(2)}</p>
          </div>
          <Calculator className="w-10 h-10 text-indigo-600" />
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-800">Lista de Compras Proyectada</h2>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={exportarExcel} className="btn-secondary flex items-center gap-2 text-sm">
              <FileDown className="w-4 h-4" />
              Exportar Excel
            </button>
            <button type="button" onClick={exportarPDF} className="btn-primary flex items-center gap-2 text-sm">
              <FileDown className="w-4 h-4" />
              Exportar PDF
            </button>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 font-medium text-gray-700">Insumo</th>
                <th className="text-left py-3 px-3 font-medium text-gray-700">Cantidad a comprar</th>
                <th className="text-left py-3 px-3 font-medium text-gray-700">Unidad</th>
                <th className="text-left py-3 px-3 font-medium text-gray-700">Presupuesto</th>
              </tr>
            </thead>
            <tbody>
              {comprasProyectadas.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-gray-500">Sin pedidos en el rango seleccionado.</td></tr>
              ) : (
                comprasProyectadas.map((c, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3">{c.insumoNombre}</td>
                    <td className="py-2 px-3">{c.cantidadCompra.toFixed(2)}</td>
                    <td className="py-2 px-3">{c.unidad}</td>
                    <td className="py-2 px-3 font-semibold text-gray-800">${c.presupuesto.toFixed(2)}</td>
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
