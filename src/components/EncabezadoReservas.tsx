import { StyleSheet, View } from 'react-native';

import AvisoEnApp from '@/components/AvisoEnApp';
import EstadoNotificaciones from '@/components/EstadoNotificaciones';
import { ESPACIADO } from '@/constants/tema';
import { useBiblioteca } from '@/context/BibliotecaContext';

// Parte de arriba de Mis reservas: estado de las notificaciones y avisos dentro de la app.
export default function EncabezadoReservas() {
  const { avisos, descartarAviso } = useBiblioteca();

  return (
    <View style={estilos.contenedor}>
      <EstadoNotificaciones />
      {avisos.map((aviso) => (
        <AvisoEnApp key={aviso.id} aviso={aviso} onDescartar={descartarAviso} />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: ESPACIADO.s,
    marginBottom: ESPACIADO.m,
  },
});
