import { StyleSheet, Text } from 'react-native';

import { COLORES, TAMANIOS } from '@/constants/tema';
import { usePermiso } from '@/hooks/usePermiso';

// Muestra si las notificaciones están permitidas. Se actualiza al volver a la pestaña
// (foco) y al volver desde Ajustes (AppState), no solo al montar la pantalla.
export default function EstadoNotificaciones() {
  const { estado } = usePermiso('notificaciones');

  if (estado === 'cargando') {
    return null;
  }
  if (estado === 'concedido') {
    return <Text style={estilos.permitidas}>Notificaciones: permitidas</Text>;
  }
  return (
    <Text style={estilos.noPermitidas}>
      Notificaciones: no permitidas. Los avisos se muestran acá, dentro de la app.
    </Text>
  );
}

const estilos = StyleSheet.create({
  permitidas: {
    fontSize: TAMANIOS.textoChico,
    color: COLORES.exito,
  },
  noPermitidas: {
    fontSize: TAMANIOS.textoChico,
    color: COLORES.aviso,
  },
});
