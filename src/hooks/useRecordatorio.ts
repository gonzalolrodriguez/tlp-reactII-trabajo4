import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useBiblioteca } from '@/context/BibliotecaContext';
import {
  calcularEstado,
  consultarNotificaciones,
  notificacionesDisponibles,
} from '@/lib/permisos';

// Lógica del interruptor "Recordarme" de un préstamo.
// El permiso de notificaciones se pide únicamente al activarlo.
export function useRecordatorio(isbn: string): (activar: boolean) => Promise<void> {
  const router = useRouter();
  const { activarRecordatorio, desactivarRecordatorio, agregarAviso } = useBiblioteca();

  return useCallback(
    async (activar: boolean) => {
      if (!activar) {
        await desactivarRecordatorio(isbn);
        return;
      }
      if (!(await notificacionesDisponibles())) {
        agregarAviso(
          'Las notificaciones no están disponibles en esta versión de la app. Recordá la fecha de devolución.',
        );
        return;
      }
      const estado = calcularEstado(await consultarNotificaciones());
      if (estado === 'concedido') {
        await activarRecordatorio(isbn);
        return;
      }
      // Todavía no hay permiso: se muestra la pantalla previa antes del diálogo del sistema.
      router.push({ pathname: '/permisos/[recurso]', params: { recurso: 'notificaciones', isbn } });
    },
    [isbn, router, activarRecordatorio, desactivarRecordatorio, agregarAviso],
  );
}
