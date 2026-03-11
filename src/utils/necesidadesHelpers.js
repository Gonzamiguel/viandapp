/**
 * Lógica de suma de ingredientes para Necesidades/Stock
 * Suma todos los ingredientes de los pedidos confirmados en un rango
 */

import { normalizeIngredientes } from './platoHelpers';

/**
 * Agrupa y suma ingredientes por (nombre, unidad)
 * @param {Array<{platoId: string, ...}>} pedidos
 * @param {Object} platosMap - { platoId: plato }
 * @returns {Array<{nombre, cantidad, unidad}>}
 */
export function sumarIngredientesDePedidos(pedidos, platosMap) {
  const acum = {}; // key: "nombre|unidad" -> { nombre, cantidad, unidad }

  for (const pedido of pedidos) {
    const plato = platosMap[pedido.platoId];
    if (!plato) continue;

    const ingredientes = normalizeIngredientes(plato.ingredientes);
    for (const ing of ingredientes) {
      const key = `${ing.nombre.toLowerCase().trim()}|${ing.unidad}`;
      if (!acum[key]) {
        acum[key] = { nombre: ing.nombre, cantidad: 0, unidad: ing.unidad };
      }
      // Cada pedido = 1 porción del plato
      acum[key].cantidad += Number(ing.cantidad) || 1;
    }
  }

  return Object.values(acum).filter((i) => i.cantidad > 0).sort((a, b) => a.nombre.localeCompare(b.nombre));
}
