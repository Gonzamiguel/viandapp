import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit3, Save, X, CheckCircle2 } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { subscribeInsumos, createInsumo, updateInsumo } from '../../firebase/operations';
import { UNIDADES as UNIDADES_PLATOS } from '../../constants';

// Permitimos mismas unidades que platos para facilitar conversión
const UNIDADES = ['kg', 'lt', 'unidad', 'gr', 'ml', ...(UNIDADES_PLATOS || [])].filter(
  (v, i, arr) => arr.indexOf(v) === i
);

export default function ModuloInsumos() {
  const { businessId } = useBusiness();
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre: '', unidadMedida: 'unidad', precioUnitario: '', merma: 0 });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    if (!businessId) return undefined;
    const unsub = subscribeInsumos(businessId, (list) => {
      setInsumos(list);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub?.();
  }, [businessId]);

  const activos = useMemo(() => insumos.filter((i) => i.activo !== false), [insumos]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setMensaje({ tipo: 'error', texto: 'Completa el nombre' });
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await updateInsumo(businessId, editId, {
          nombre: form.nombre.trim(),
          unidadMedida: form.unidadMedida,
          precioUnitario: Number(form.precioUnitario) || 0,
          merma: Number(form.merma) || 0,
          activo: true,
        });
        setMensaje({ tipo: 'ok', texto: 'Insumo actualizado' });
      } else {
        await createInsumo(businessId, {
          nombre: form.nombre.trim(),
          unidadMedida: form.unidadMedida,
          precioUnitario: Number(form.precioUnitario) || 0,
          merma: Number(form.merma) || 0,
        });
        setMensaje({ tipo: 'ok', texto: 'Insumo creado' });
      }
      setForm({ nombre: '', unidadMedida: 'unidad', precioUnitario: '', merma: 0 });
      setEditId(null);
      setTimeout(() => setMensaje(null), 2500);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al guardar' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (insumo) => {
    setEditId(insumo.id);
    setForm({
      nombre: insumo.nombre || '',
      unidadMedida: insumo.unidadMedida || 'unidad',
      precioUnitario: insumo.precioUnitario ?? '',
      merma: insumo.merma ?? 0,
    });
  };

  const handleCancel = () => {
    setEditId(null);
    setForm({ nombre: '', unidadMedida: 'unidad', precioUnitario: '', merma: 0 });
    setMensaje(null);
  };

  if (loading) return <div className="animate-pulse text-gray-500">Cargando insumos...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Insumos</h1>
        <span className="text-sm text-gray-500">{activos.length} activos</span>
      </div>

      <form onSubmit={handleSave} className="card p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nombre</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              className="input-field"
              placeholder="Ej: Pollo, Bandeja plástica"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Unidad de medida</label>
            <select
              value={form.unidadMedida}
              onChange={(e) => setForm((f) => ({ ...f, unidadMedida: e.target.value }))}
              className="input-field"
            >
              {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Precio por unidad de compra</label>
            <input
              type="number"
              value={form.precioUnitario}
              onChange={(e) => setForm((f) => ({ ...f, precioUnitario: e.target.value }))}
              className="input-field"
              placeholder="Ej: 1000 (por 1 kg)"
              step="0.01"
              min={0}
            />
            <p className="text-xs text-gray-500 mt-1">
              Precio total de la unidad (ej: $1000 por 1 kg). El sistema convierte automáticamente a la cantidad de la receta.
            </p>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Merma (%)</label>
            <input
              type="number"
              value={form.merma}
              onChange={(e) => setForm((f) => ({ ...f, merma: e.target.value }))}
              className="input-field"
              placeholder="0"
              step="1"
              min={0}
              max={90}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {editId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {editId ? 'Guardar cambios' : 'Crear insumo'}
          </button>
          {editId && (
            <button type="button" onClick={handleCancel} className="btn-secondary flex items-center gap-2">
              <X className="w-4 h-4" />
              Cancelar
            </button>
          )}
          {mensaje && (
            <span className={`text-sm ${mensaje.tipo === 'error' ? 'text-red-600' : 'text-emerald-700'} flex items-center gap-1`}>
              {mensaje.tipo !== 'error' && <CheckCircle2 className="w-4 h-4" />}
              {mensaje.texto}
            </span>
          )}
        </div>
      </form>

      <div className="card overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-3 font-medium text-gray-700">Nombre</th>
              <th className="text-left py-3 px-3 font-medium text-gray-700">Unidad</th>
              <th className="text-left py-3 px-3 font-medium text-gray-700">Precio unit.</th>
              <th className="text-left py-3 px-3 font-medium text-gray-700">Merma (%)</th>
              <th className="text-left py-3 px-3 font-medium text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {insumos.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-gray-500">Sin insumos cargados.</td></tr>
            ) : (
              insumos.map((i) => (
                <tr key={i.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3">{i.nombre}</td>
                  <td className="py-2 px-3 capitalize">{i.unidadMedida || 'unidad'}</td>
                  <td className="py-2 px-3">${i.precioUnitario ?? 0}</td>
                  <td className="py-2 px-3">{i.merma ?? 0}%</td>
                  <td className="py-2 px-3">
                    <button
                      type="button"
                      onClick={() => handleEdit(i)}
                      className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-sm"
                    >
                      <Edit3 className="w-4 h-4" />
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
