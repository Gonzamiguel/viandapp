/**
 * ViandaPro - Módulo Recetario
 * Filtros rápidos + Grid de Cards + PDF + Modal Editar
 */

import { useState, useEffect } from 'react';
import { Coffee, UtensilsCrossed, Moon, FileDown, Pencil } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { getRecetario, updatePlato } from '../../firebase/operations';
import { useBusiness } from '../../context/BusinessContext';
import { CATEGORIAS_PLATO, UNIDADES } from '../../constants';
import { normalizeIngredientes, normalizeCategorias } from '../../utils/platoHelpers';

const SERVICIOS = [
  { key: 'Desayuno', icon: Coffee },
  { key: 'Almuerzo', icon: UtensilsCrossed },
  { key: 'Cena', icon: Moon },
];

export default function Recetario() {
  const { businessId } = useBusiness();
  const [recetario, setRecetario] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [platoEditando, setPlatoEditando] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;
    getRecetario(businessId).then(setRecetario).finally(() => setLoading(false));
  }, [businessId]);

  const platosFiltrados = filtro
    ? recetario.filter((p) => normalizeCategorias(p.categoria).includes(filtro))
    : recetario;

  const exportarPDF = (plato) => {
    const doc = new jsPDF();
    const ing = normalizeIngredientes(plato.ingredientes);

    doc.setFontSize(18);
    doc.setTextColor(5, 150, 105);
    doc.text('FICHA TÉCNICA', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(plato.nombre, 105, 32, { align: 'center' });
    doc.setFontSize(10);
    const cats = normalizeCategorias(plato.categoria);
    doc.text(`${cats.length ? cats.join(', ') : '—'} | ${plato.kcal || 0} kcal | ${plato.tiempoCoccion || '-'} min`, 105, 40, { align: 'center' });

    doc.setFontSize(11);
    doc.text('Ingredientes', 20, 55);
    doc.setFontSize(9);
    if (ing.length > 0) {
      const colWidths = [60, 50, 40];
      doc.setFillColor(245, 245, 245);
      doc.rect(20, 58, 170, 8);
      doc.text('Nombre', 22, 63);
      doc.text('Cantidad', 82, 63);
      doc.text('Unidad', 132, 63);
      doc.setTextColor(0, 0, 0);
      ing.forEach((i, idx) => {
        const y = 68 + idx * 7;
        doc.text(i.nombre, 22, y);
        doc.text(String(i.cantidad), 82, y);
        doc.text(i.unidad, 132, y);
      });
    } else {
      doc.text('-', 20, 65);
    }

    const procedY = ing.length > 0 ? 68 + ing.length * 7 + 15 : 75;
    doc.setFontSize(11);
    doc.text('Procedimiento', 20, procedY);
    doc.setFontSize(9);
    const pasos = (plato.procedimiento || plato.pasos || '').split('\n');
    pasos.forEach((line, i) => {
      doc.text(line, 20, procedY + 7 + i * 6, { maxWidth: 170 });
    });

    doc.save(`ficha_${plato.nombre.replace(/\s/g, '_')}.pdf`);
  };

  const handleGuardarEdicion = async (data) => {
    await updatePlato(businessId, platoEditando.id, data);
    setRecetario(await getRecetario(businessId));
    setPlatoEditando(null);
  };

  if (loading) {
    return <div className="animate-pulse text-gray-500">Cargando recetario...</div>;
  }

  if (recetario.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Recetario / Platos</h1>
        <div className="card py-12 text-center">
          <p className="text-gray-500">No hay datos disponibles. Comience cargando un plato desde el módulo Nuevo Plato.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Recetario / Platos</h1>

      {/* Filtros rápidos */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => setFiltro('')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            !filtro ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Todos
        </button>
        {SERVICIOS.map(({ key, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFiltro(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              filtro === key ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {key}
          </button>
        ))}
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {platosFiltrados.map((plato) => (
          <div key={plato.id} className="card hover:shadow-md transition">
            <h3 className="font-semibold text-gray-800 mb-1">{plato.nombre}</h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {normalizeCategorias(plato.categoria).map((cat) => (
                <span
                  key={cat}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    cat === 'Desayuno' ? 'bg-amber-100 text-amber-800' :
                    cat === 'Almuerzo' ? 'bg-orange-100 text-orange-800' :
                    'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {cat}
                </span>
              ))}
            </div>
            <p className="text-emerald-600 font-medium mb-4">{plato.kcal || 0} kcal</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPlatoEditando(plato)}
                className="btn-secondary flex-1 flex items-center justify-center gap-1.5 py-2 text-sm"
              >
                <Pencil className="w-4 h-4" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => exportarPDF(plato)}
                className="btn-primary flex-1 flex items-center justify-center gap-1.5 py-2 text-sm"
              >
                <FileDown className="w-4 h-4" />
                Ficha PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      {platoEditando && (
        <ModalEditarPlato
          plato={platoEditando}
          onClose={() => setPlatoEditando(null)}
          onGuardar={handleGuardarEdicion}
        />
      )}
    </div>
  );
}

function ModalEditarPlato({ plato, onClose, onGuardar }) {
  const [nombre, setNombre] = useState(plato.nombre);
  const [categorias, setCategorias] = useState(normalizeCategorias(plato.categoria));
  const [tiempoCoccion, setTiempoCoccion] = useState(plato.tiempoCoccion ?? '');
  const [ingredientes, setIngredientes] = useState(
    normalizeIngredientes(plato.ingredientes).length
      ? normalizeIngredientes(plato.ingredientes)
      : [{ nombre: '', cantidad: 1, unidad: 'gr' }]
  );
  const [procedimiento, setProcedimiento] = useState(plato.procedimiento ?? plato.pasos ?? '');
  const [kcal, setKcal] = useState(plato.kcal ?? '');

  const agregarIng = () => setIngredientes((p) => [...p, { nombre: '', cantidad: 1, unidad: 'gr' }]);
  const quitarIng = (idx) => setIngredientes((p) => p.filter((_, i) => i !== idx));
  const actualizarIng = (idx, f, v) =>
    setIngredientes((p) => p.map((ing, i) => (i === idx ? { ...ing, [f]: v } : ing)));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (categorias.length === 0) {
      alert('Selecciona al menos una categoría');
      return;
    }
    const ingData = ingredientes
      .filter((i) => i.nombre.trim())
      .map((i) => ({ nombre: i.nombre.trim(), cantidad: Number(i.cantidad) || 1, unidad: i.unidad }));
    onGuardar({
      nombre,
      categoria: categorias,
      tiempoCoccion: Number(tiempoCoccion) || 0,
      ingredientes: ingData,
      procedimiento,
      kcal: Number(kcal) || 0,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Editar Plato</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nombre</label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Categorías</label>
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
                      <span className="text-sm">{c}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tiempo (min)</label>
                <input type="number" value={tiempoCoccion} onChange={(e) => setTiempoCoccion(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Kcal</label>
                <input type="number" value={kcal} onChange={(e) => setKcal(e.target.value)} className="input-field" />
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <label className="text-sm text-gray-600">Ingredientes</label>
                <button type="button" onClick={agregarIng} className="text-sm text-emerald-600">+ Agregar</button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {ingredientes.map((ing, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={ing.nombre}
                      onChange={(e) => actualizarIng(idx, 'nombre', e.target.value)}
                      className="input-field flex-1 py-1.5"
                      placeholder="Nombre"
                    />
                    <input
                      type="number"
                      value={ing.cantidad}
                      onChange={(e) => actualizarIng(idx, 'cantidad', e.target.value)}
                      className="input-field w-20 py-1.5"
                    />
                    <select
                      value={ing.unidad}
                      onChange={(e) => actualizarIng(idx, 'unidad', e.target.value)}
                      className="input-field w-24 py-1.5"
                    >
                      {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <button type="button" onClick={() => quitarIng(idx)} className="text-red-500 p-1">✕</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">Procedimiento</label>
              <textarea value={procedimiento} onChange={(e) => setProcedimiento(e.target.value)} className="input-field min-h-[80px]" rows={4} />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">Guardar</button>
              <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
