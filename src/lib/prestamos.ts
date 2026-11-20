import { DIAS_PRESTAMO, MILISEGUNDOS_POR_DIA } from '../constants/config';
import type { Libro } from '../types';
import type { Prestamo } from '../types/prestamos';

// Los ejemplares disponibles no se guardan: se calculan cada vez.
// ingresos = ejemplares que el mostrador le entregó a la persona (aunque el libro tuviera 0 en el estante).
export function calcularDisponibles(
  libro: Libro,
  prestamos: Prestamo[],
  ingresos: Record<string, number>,
): number {
  const prestados = prestamos.filter((p) => p.isbn === libro.isbn).length;
  return libro.ejemplares + (ingresos[libro.isbn] ?? 0) - prestados;
}

export function calcularFechaDevolucion(hoy: Date): string {
  return new Date(hoy.getTime() + DIAS_PRESTAMO * MILISEGUNDOS_POR_DIA).toISOString();
}

export function formatearFecha(fechaIso: string): string {
  return new Date(fechaIso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
