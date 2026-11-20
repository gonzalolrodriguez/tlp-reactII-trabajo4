import { StyleSheet, Text, View } from 'react-native';

import BotonPrimario from '@/components/BotonPrimario';
import { COLORES, ESPACIADO, TAMANIOS } from '@/constants/tema';

type Props = {
  mensaje: string;
  onReintentar: () => void;
};

export default function EstadoError({ mensaje, onReintentar }: Props) {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.texto}>{mensaje}</Text>
      <BotonPrimario titulo="Reintentar" onPress={onReintentar} />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    padding: ESPACIADO.xl,
    gap: ESPACIADO.l,
  },
  texto: {
    fontSize: TAMANIOS.textoNormal,
    color: COLORES.error,
    textAlign: 'center',
  },
});
