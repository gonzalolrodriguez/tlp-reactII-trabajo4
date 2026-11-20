import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { COLORES, ESPACIADO, TAMANIOS } from '@/constants/tema';

type Props = {
  mensaje: string;
};

// Mensaje claro con una salida: un link al Catálogo.
export default function MensajeConEnlace({ mensaje }: Props) {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.texto}>{mensaje}</Text>
      <Link href="/" accessibilityRole="link" style={estilos.enlace}>
        Ir al Catálogo
      </Link>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: ESPACIADO.xl,
    gap: ESPACIADO.l,
    backgroundColor: COLORES.fondo,
  },
  texto: {
    fontSize: TAMANIOS.textoNormal,
    color: COLORES.texto,
    textAlign: 'center',
  },
  enlace: {
    minHeight: TAMANIOS.areaTactil,
    minWidth: TAMANIOS.areaTactil,
    paddingVertical: ESPACIADO.m,
    fontSize: TAMANIOS.textoNormal,
    fontWeight: '600',
    color: COLORES.primario,
  },
});
