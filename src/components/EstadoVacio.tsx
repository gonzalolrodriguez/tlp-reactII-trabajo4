import { StyleSheet, Text, View } from 'react-native';

import { COLORES, ESPACIADO, TAMANIOS } from '@/constants/tema';

type Props = {
  mensaje: string;
};

export default function EstadoVacio({ mensaje }: Props) {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.texto}>{mensaje}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    padding: ESPACIADO.xl,
  },
  texto: {
    fontSize: TAMANIOS.textoNormal,
    color: COLORES.textoSuave,
    textAlign: 'center',
  },
});
