import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORES, ESPACIADO, TAMANIOS } from '@/constants/tema';
import type { Aviso } from '@/types/prestamos';

type Props = {
  aviso: Aviso;
  onDescartar: (id: string) => void;
};

// Aviso dentro de la app: reemplaza a la notificación cuando no hay permiso.
export default function AvisoEnApp({ aviso, onDescartar }: Props) {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.texto}>{aviso.mensaje}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Descartar aviso"
        onPress={() => onDescartar(aviso.id)}
        style={estilos.cerrar}
      >
        <Text style={estilos.cerrarTexto}>Cerrar</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.s,
    paddingLeft: ESPACIADO.m,
    marginBottom: ESPACIADO.s,
    backgroundColor: COLORES.avisoSuave,
    borderRadius: TAMANIOS.radio,
  },
  texto: {
    flex: 1,
    fontSize: TAMANIOS.textoNormal,
    color: COLORES.texto,
    paddingVertical: ESPACIADO.m,
  },
  cerrar: {
    minHeight: TAMANIOS.areaTactil,
    minWidth: TAMANIOS.areaTactil,
    paddingHorizontal: ESPACIADO.m,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cerrarTexto: {
    fontSize: TAMANIOS.textoNormal,
    fontWeight: '600',
    color: COLORES.aviso,
  },
});
