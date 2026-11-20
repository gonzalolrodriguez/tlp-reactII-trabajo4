import { Pressable, StyleSheet, Text } from 'react-native';

import { COLORES, ESPACIADO, TAMANIOS } from '@/constants/tema';

type Props = {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario';
  deshabilitado?: boolean;
};

export default function BotonPrimario({
  titulo,
  onPress,
  variante = 'primario',
  deshabilitado = false,
}: Props) {
  const esPrimario = variante === 'primario';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: deshabilitado }}
      disabled={deshabilitado}
      onPress={onPress}
      style={[
        estilos.boton,
        esPrimario ? estilos.primario : estilos.secundario,
        deshabilitado && estilos.deshabilitado,
      ]}
    >
      <Text style={[estilos.texto, esPrimario ? estilos.textoPrimario : estilos.textoSecundario]}>
        {titulo}
      </Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    minHeight: TAMANIOS.areaTactil,
    minWidth: TAMANIOS.areaTactil,
    paddingHorizontal: ESPACIADO.l,
    borderRadius: TAMANIOS.radio,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primario: {
    backgroundColor: COLORES.primario,
  },
  secundario: {
    backgroundColor: COLORES.superficie,
    borderWidth: TAMANIOS.borde,
    borderColor: COLORES.primario,
  },
  deshabilitado: {
    opacity: 0.5,
  },
  texto: {
    fontSize: TAMANIOS.textoNormal,
    fontWeight: '600',
  },
  textoPrimario: {
    color: COLORES.textoSobrePrimario,
  },
  textoSecundario: {
    color: COLORES.primario,
  },
});
