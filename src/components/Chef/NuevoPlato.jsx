/**
 * ViandaPro - Módulo Nuevo Plato
 * Formulario dinámico con ingredientes desglosados
 */

import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Package } from 'lucide-react';
import { createPlato, subscribeInsumos } from '../../firebase/operations';
import { useBusiness } from '../../context/BusinessContext';
import { CATEGORIAS_PLATO, UNIDADES } from '../../constants';

const INGREDIENTE_INICIAL = { nombre: '', cantidad: '', unidad: 'gr', insumoId: '' };

export default function NuevoPlato() {
  const { businessId } = useBusiness();
  const [nombre, setNombre] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [tiempoCoccion, setTiempoCoccion] = useState('');
  const [ingredientes, setIngredientes] = useState([{ ...INGREDIENTE_INICIAL }]);
  const [procedimiento, setProcedimiento] = useState('');
  const [kcal, setKcal] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [insumos, setInsumos] = useState([]);

  useEffect(() => {
    if (!businessId) return undefined;
    const unsub = subscribeInsumos(businessId, (list) => {
      setInsumos(list.filter((i) => i.activo !== false));
    });
    return () => unsub?.();
  }, [businessId]);

  const insumosOptions = useMemo(() => {
    return insumos.map((i) => ({
      value: i.id,
      label: i.nombre,
      unidad: i.unidadMedida || 'unidad',
    }));
  }, [insumos]);

  const agregarIngrediente = () => {
    setIngredientes((prev) => [...prev, { ...INGREDIENTE_INICIAL }]);
  };

  const quitarIngrediente = (idx) => {
    if (ingredientes.length <= 1) return;
    setIngredientes((prev) => prev.filter((_, i) => i !== idx));
  };

  const actualizarIngrediente = (idx, field, value) => {
    setIngredientes((prev) =>
      prev.map((ing, i) => (i === idx ? { ...ing, [field]: value } : ing))
    );
  };

  const seleccionarInsumo = (idx, insumoId) => {
    const insumo = insumosOptions.find((i) => i.value === insumoId);
    setIngredientes((prev) =>
      prev.map((ing, i) =>
        i === idx
          ? {
              ...ing,
              insumoId,
              nombre: insumo?.label || ing.nombre,
              unidad: insumo?.unidad || ing.unidad,
            }
          : ing
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setExito(false);
    try {
      const ingredientesData = ingredientes
        .filter((i) => i.nombre.trim())
        .map((i) => ({
          insumoId: i.insumoId || null,
          nombre: i.nombre.trim(),
          cantidad: Number(i.cantidad) || 1,
          unidad: i.unidad,
        }));

      if (ingredientesData.length === 0) {
        throw new Error('Agrega al menos un ingrediente');
      }
      if (categorias.length === 0) {
        throw new Error('Selecciona al menos una categoría');
      }

      await createPlato(businessId, {
        nombre: nombre.trim(),
        categoria: categorias,
        tiempoCoccion: Number(tiempoCoccion) || 0,
        ingredientes: ingredientesData,
        procedimiento: procedimiento.trim(),
        kcal: Number(kcal) || 0,
      });

      setNombre('');
      setCategorias([]);
      setTiempoCoccion('');
      setIngredientes([{ ...INGREDIENTE_INICIAL }]);
      setProcedimiento('');
      setKcal('');
      setExito(true);
      setTimeout(() => setExito(false), 4000);
    } catch (err) {
      alert(err.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Nuevo Plato</h1>

      <form onSubmit={handleSubmit} className="card max-w-3xl">
        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Plato</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="input-field"
              placeholder="Ej: Omelette con vegetales"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categorías</label>
            <div className="flex flex-wrap gap-3 pt-2">
              {CATEGORIAS_PLATO.map((c) => (
                <label key={c} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={categorias.includes(c)}
                    onChange={(e) => {
                      setCategorias((prev) =>
                        e.target.checked ? [...prev, c] : prev.filter((x) => x !== c)
                      );
                    }}
                    className="rounded border-gray-300 text-emerald-600"
                  />
                  <span className="text-sm text-gray-700">{c}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">Puedes marcar una o más categorías</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo de Cocción (min)</label>
            <input
              type="number"
              value={tiempoCoccion}
              onChange={(e) => setTiempoCoccion(e.target.value)}
              className="input-field"
              placeholder="15"
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kcal</label>
            <input
              type="number"
              value={kcal}
              onChange={(e) => setKcal(e.target.value)}
              className="input-field"
              placeholder="320"
              min={0}
            />
          </div>
        </div>

        {/* Ingredientes */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">Ingredientes</label>
            <button
              type="button"
              onClick={agregarIngrediente}
              className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              Agregar fila
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-medium text-gray-700">Nombre</th>
                  <th className="text-left p-3 font-medium text-gray-700 w-24">Cantidad</th>
                  <th className="text-left p-3 font-medium text-gray-700 w-28">Unidad</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {ingredientes.map((ing, idx) => (
                  <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50/50">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <select
                          value={ing.insumoId}
                          onChange={(e) => seleccionarInsumo(idx, e.target.value)}
                          className="input-field py-1.5 text-sm"
                        >
                          <option value="">Selecciona insumo</option>
                          {insumosOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={ing.cantidad}
                        onChange={(e) => actualizarIngrediente(idx, 'cantidad', e.target.value)}
                        className="input-field py-1.5 text-sm w-28"
                        placeholder="100"
                        min={0}
                        step="0.01"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={ing.unidad}
                        onChange={(e) => actualizarIngrediente(idx, 'unidad', e.target.value)}
                        className="input-field py-1.5 text-sm w-24"
                      >
                        {UNIDADES.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => quitarIngrediente(idx)}
                        disabled={ingredientes.length <= 1}
                        className="p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Quitar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Procedimiento */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Procedimiento (paso a paso)</label>
          <textarea
            value={procedimiento}
            onChange={(e) => setProcedimiento(e.target.value)}
            className="input-field min-h-[120px]"
            placeholder="1. Batir los huevos...&#10;2. Saltear vegetales...&#10;3. Incorporar y cocinar..."
            rows={5}
          />
        </div>

        {exito && (
          <p className="mb-4 text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg">
            ✓ Plato guardado correctamente
          </p>
        )}

        <button type="submit" disabled={guardando} className="btn-primary">
          {guardando ? 'Guardando...' : 'Guardar Plato'}
        </button>
      </form>
    </div>
  );
}
