import { StyleSheet, Text, View } from 'react-native';

import BotonPrimario from '@/components/BotonPrimario';
import { COLORES, ESPACIADO, TAMANIOS } from '@/constants/tema';
import { useBiblioteca } from '@/context/BibliotecaContext';
import type { Libro } from '@/types';

type Props = {
  libro: Libro;
};

export default function TarjetaMostrador({ libro }: Props) {
  const { obtenerEspera, entregarAlSiguiente } = useBiblioteca();
  const espera = obtenerEspera(libro.isbn);

  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>{libro.titulo}</Text>
      <Text style={estilos.dato}>Al frente de la lista: {espera[0]}</Text>
      <Text style={estilos.dato}>Personas esperando: {espera.length}</Text>
      <BotonPrimario titulo="Entregar al siguiente" onPress={() => entregarAlSiguiente(libro.isbn)} />
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    padding: ESPACIADO.l,
    marginBottom: ESPACIADO.m,
    gap: ESPACIADO.s,
    backgroundColor: COLORES.superficie,
    borderRadius: TAMANIOS.radio,
    borderWidth: TAMANIOS.borde,
    borderColor: COLORES.borde,
  },
  titulo: {
    fontSize: TAMANIOS.textoSubtitulo,
    fontWeight: '600',
    color: COLORES.texto,
  },
  dato: {
    fontSize: TAMANIOS.textoNormal,
    color: COLORES.textoSuave,
  },
});
