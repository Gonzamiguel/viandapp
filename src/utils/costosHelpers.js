/**
 * ViandaPro - Motor de Escandallo + Ingeniería de Menú
 * Conversión automática: (Precio Insumo / Unidad Compra) * Cantidad Receta
 * Merma: Costo Porción = (Costo Calculado) / (1 - %Merma)
 * Modelo Híbrido: Insumos directos + Factor Q (costos ocultos) + Factor Q Spice (sal, especias, aceites)
 */

import { normalizeIngredientes } from './platoHelpers';

function normalizeName(str) {
  return (str || '').trim().toLowerCase();
}

function keyNameUnidad(nombre, unidad) {
  return `${normalizeName(nombre)}|${(unidad || '').toLowerCase()}`;
}

/**
 * Convierte precio según unidad de compra.
 * Usuario carga: $1000 por 1 kg. Receta usa: 200 g.
 * Fórmula: (Precio Insumo / Unidad Compra) * Cantidad Receta
 * Ej: (1000 / 1000g) * 200g = 200
 */
export function precioConvertido(insumo, unidadNecesaria) {
  const precio = Number(insumo?.precioUnitario) || 0;
  const unidadInsumo = (insumo?.unidadMedida || '').toLowerCase();
  const unidad = (unidadNecesaria || '').toLowerCase();
  if (!precio) return 0;
  if (unidadInsumo === unidad) return precio;
  if (unidadInsumo === 'kg' && unidad === 'gr') return precio / 1000;
  if (unidadInsumo === 'gr' && unidad === 'kg') return precio * 1000;
  if ((unidadInsumo === 'l' || unidadInsumo === 'lt') && unidad === 'ml') return precio / 1000;
  if (unidadInsumo === 'ml' && (unidad === 'l' || unidad === 'lt')) return precio * 1000;
  return 0;
}

/**
 * Motor de Escandallo: Costo por insumo con conversión automática y merma.
 * Costo Calculado = (Precio/UnidadCompra) * CantidadReceta
 * Costo Porción = Costo Calculado / (1 - %Merma)
 */
export function calcularCostoNetaPlato(plato, insumosById, insumosByNombreUnidad, factorQ = 0, factorQSpice = 0) {
  const ingredientes = normalizeIngredientes(plato?.ingredientes || []);
  let costoBruto = 0;
  const desglose = [];

  for (const ing of ingredientes) {
    const insumo =
      (ing.insumoId && insumosById[ing.insumoId]) ||
      insumosByNombreUnidad[keyNameUnidad(ing.nombre, ing.unidad)];
    const precioPorUnidad = precioConvertido(insumo, ing.unidad);
    const merma = insumo?.merma || 0;
    const costoCalculado = (Number(ing.cantidad) || 0) * precioPorUnidad;
    const divisor = 1 - (merma / 100 || 0);
    const costoPorcion = divisor > 0 ? costoCalculado / divisor : costoCalculado;
    costoBruto += costoPorcion;
    desglose.push({
      nombre: ing.nombre,
      cantidad: ing.cantidad,
      unidad: ing.unidad,
      merma,
      costoInsumo: costoPorcion,
    });
  }

  const factorQMult = 1 + (Number(factorQ) || 0) / 100;
  const factorSpiceMult = 1 + (Number(factorQSpice) || 0) / 100;
  const costoNeta = costoBruto * factorQMult * factorSpiceMult;

  return { costoBruto, costoNeta, desglose };
}

/** Constantes de clasificación Menu Engineering */
export const CLASIFICACION_MENU = {
  ESTRELLA: 'ESTRELLA',
  CABALLO_DE_BATALLA: 'CABALLO_DE_BATALLA',
  PERRO: 'PERRO',
  ROMPECABEZAS: 'ROMPECABEZAS',
};

/**
 * Clasifica un plato según la matriz de Ingeniería de Menú.
 * Umbrales: por encima = alto, por debajo = bajo.
 * @param {number} frecuencia - % de elección (0-100)
 * @param {number} costoNeta - Costo del plato
 * @param {number} precioVenta - Precio de venta único
 * @param {number} umbralPopularidad - Mediana o percentil (ej: 25)
 * @param {number} umbralCosto - Mediana de costos o % del precio (ej: 50% del precio)
 */
export function clasificarMenuEngineering(
  frecuencia,
  costoNeta,
  precioVenta,
  umbralPopularidad = 25,
  umbralCostoRelativo = 0.5
) {
  const costoRelativo = precioVenta > 0 ? costoNeta / precioVenta : 0;
  const altaPopularidad = frecuencia >= umbralPopularidad;
  const altoCosto = costoRelativo >= umbralCostoRelativo;

  if (altaPopularidad && !altoCosto) return CLASIFICACION_MENU.ESTRELLA;
  if (altaPopularidad && altoCosto) return CLASIFICACION_MENU.CABALLO_DE_BATALLA;
  if (!altaPopularidad && altoCosto) return CLASIFICACION_MENU.PERRO;
  return CLASIFICACION_MENU.ROMPECABEZAS;
}

/**
 * Calcula Costo Ponderado Global.
 * Σ(Costo_plato_X × Frecuencia_X) donde Frecuencia está normalizada (suma = 1)
 */
export function calcularCostoPonderado(platosConCosto, frecuencias) {
  let total = 0;
  for (const p of platosConCosto) {
    const freq = frecuencias[p.id] ?? 0;
    total += (p.costoNeta ?? 0) * freq;
  }
  return total;
}

/**
 * Margen de Contribución Unitario = Precio Venta - Costo Neta
 */
export function margenContribucion(precioVenta, costoNeta) {
  return (Number(precioVenta) || 0) - (Number(costoNeta) || 0);
}
