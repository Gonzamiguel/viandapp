/**
 * Helpers para platos - normalización de ingredientes
 * Soporta formato nuevo {nombre, cantidad, unidad} y legacy string[]
 */

export function normalizeIngredientes(ingredientes) {
  if (!ingredientes?.length) return [];
  return ingredientes.map((ing) => {
    if (typeof ing === 'string') {
      return { nombre: ing, cantidad: 1, unidad: 'unidad' };
    }
    return {
      nombre: ing.nombre || '',
      cantidad: Number(ing.cantidad) || 1,
      unidad: ing.unidad || 'unidad',
    };
  });
}

export function getKcalTotales(plato) {
  return plato?.kcal ?? 0;
}

/** Normaliza categoria: string o array → array de strings */
export function normalizeCategorias(categoria) {
  if (!categoria) return [];
  if (Array.isArray(categoria)) return categoria.filter(Boolean).map(String);
  return [String(categoria)];
}
