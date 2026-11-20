import { useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useRevisarAlVolver } from '@/hooks/useRevisarAlVolver';
import {
  abrirAjustes,
  calcularEstado,
  consultarNotificaciones,
  pedirNotificaciones,
} from '@/lib/permisos';
import type { EstadoPermiso, RecursoPermiso, RespuestaPermiso } from '@/types/permisos';

type ResultadoUsoPermiso = {
  estado: EstadoPermiso;
  pedir: () => Promise<EstadoPermiso>;
  abrirAjustes: () => Promise<void>;
};

// Estados: cargando -> concedido | preguntable | bloqueado.
// La cámara usa useCameraPermissions de expo-camera; las notificaciones, expo-notifications.
export function usePermiso(recurso: RecursoPermiso): ResultadoUsoPermiso {
  const [permisoCamara, pedirCamara, consultarCamara] = useCameraPermissions({
    get: recurso === 'camara',
  });
  const [respuestaNotificaciones, setRespuestaNotificaciones] =
    useState<RespuestaPermiso | null>(null);

  // Consulta el estado real al sistema operativo.
  const consultar = useCallback(async () => {
    if (recurso === 'camara') {
      await consultarCamara();
    } else {
      setRespuestaNotificaciones(await consultarNotificaciones());
    }
  }, [recurso, consultarCamara]);

  // Muestra el diálogo del sistema y devuelve el estado resultante.
  const pedir = useCallback(async (): Promise<EstadoPermiso> => {
    if (recurso === 'camara') {
      return calcularEstado(await pedirCamara());
    }
    const respuesta = await pedirNotificaciones();
    setRespuestaNotificaciones(respuesta);
    return calcularEstado(respuesta);
  }, [recurso, pedirCamara]);

  // Vuelve a consultar cada vez que la pantalla gana el foco...
  useFocusEffect(
    useCallback(() => {
      consultar();
    }, [consultar]),
  );

  // ...y cuando la app vuelve de Ajustes (segundo plano -> activa).
  useRevisarAlVolver(consultar);

  const respuesta = recurso === 'camara' ? permisoCamara : respuestaNotificaciones;

  return { estado: calcularEstado(respuesta), pedir, abrirAjustes };
}
