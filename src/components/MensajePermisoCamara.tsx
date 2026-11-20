import { StyleSheet, Text, View } from 'react-native';

import BotonPrimario from '@/components/BotonPrimario';
import { COLORES, ESPACIADO, TAMANIOS } from '@/constants/tema';

type Props = {
  mensaje: string;
  textoBoton: string;
  onPress: () => void;
};

// Se muestra en el escáner cuando todavía no hay permiso de cámara.
export default function MensajePermisoCamara({ mensaje, textoBoton, onPress }: Props) {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.texto}>{mensaje}</Text>
      <BotonPrimario titulo={textoBoton} onPress={onPress} />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    padding: ESPACIADO.l,
    gap: ESPACIADO.m,
    backgroundColor: COLORES.superficie,
    borderRadius: TAMANIOS.radio,
    borderWidth: TAMANIOS.borde,
    borderColor: COLORES.borde,
  },
  texto: {
    fontSize: TAMANIOS.textoNormal,
    color: COLORES.texto,
  },
});
