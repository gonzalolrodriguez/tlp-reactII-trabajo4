import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { COLORES, ESPACIADO, TAMANIOS } from '@/constants/tema';

type Props = {
  mensaje: string;
};

export default function EstadoCargando({ mensaje }: Props) {
  return (
    <View style={estilos.contenedor}>
      <ActivityIndicator size="large" color={COLORES.primario} />
      <Text style={estilos.texto}>{mensaje}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    padding: ESPACIADO.xl,
    gap: ESPACIADO.m,
  },
  texto: {
    fontSize: TAMANIOS.textoNormal,
    color: COLORES.textoSuave,
  },
});
