import { useLocalSearchParams } from 'expo-router';

import ContenidoPermiso from '@/components/ContenidoPermiso';
import MensajeConEnlace from '@/components/MensajeConEnlace';
import { esRecursoValido } from '@/lib/permisos';

export default function PantallaPermiso() {
  const { recurso, isbn } = useLocalSearchParams<{ recurso: string; isbn?: string }>();

  if (!esRecursoValido(recurso)) {
    return <MensajeConEnlace mensaje="Ese permiso no existe. Los permisos de la app son cámara y notificaciones." />;
  }

  return <ContenidoPermiso recurso={recurso} isbn={isbn} />;
}
