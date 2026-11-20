import { StyleSheet, Text, View } from 'react-native';

import { COLORES, ESPACIADO, TAMANIOS } from '@/constants/tema';
import { useBiblioteca } from '@/context/BibliotecaContext';
import { buscarLibroPorIsbn } from '@/lib/libros';

type Props = {
  isbn: string;
};

// Reserva en espera: muestra la posición de la persona en la lista.
export default function TarjetaEspera({ isbn }: Props) {
  const { posicionEnEspera, obtenerEspera } = useBiblioteca();
  const libro = buscarLibroPorIsbn(isbn);

  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>{libro ? libro.titulo : isbn}</Text>
      <Text style={estilos.dato}>
        Posición {posicionEnEspera(isbn)} de {obtenerEspera(isbn).length} en la lista de espera
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    padding: ESPACIADO.l,
    marginBottom: ESPACIADO.m,
    gap: ESPACIADO.xs,
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
