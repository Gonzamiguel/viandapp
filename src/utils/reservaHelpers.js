/**
 * Helpers para validación de margen de reserva
 */

export function getMinFechaReserva(margenReservaHoras = 72) {
  const ahora = new Date();
  const minFecha = new Date(ahora.getTime() + margenReservaHoras * 60 * 60 * 1000);
  return minFecha.toISOString().split('T')[0];
}

export function esFechaPermitida(fecha, margenReservaHoras, ignorarRestriccion) {
  if (ignorarRestriccion) return true;
  const minFecha = getMinFechaReserva(margenReservaHoras);
  return fecha >= minFecha;
}

export function getMensajeRestriccion(margenReservaHoras) {
  const horas = margenReservaHoras ?? 72;
  return `Pedidos cerrados para esta fecha (requiere ${horas}hs de antelación)`;
}
