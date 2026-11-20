import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MAXIMO_RECIENTES } from '@/constants/config';
import { COLORES, ESPACIADO, TAMANIOS } from '@/constants/tema';
import { useBiblioteca } from '@/context/BibliotecaContext';
import { buscarLibroPorIsbn } from '@/lib/libros';

// Muestra los 3 libros del tope de la Pila, del más reciente al más antiguo.
export default function VistosRecientes() {
  const { recientes } = useBiblioteca();
  const isbns = recientes.aArray().slice(-MAXIMO_RECIENTES).reverse();

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Vistos recientemente</Text>
      {isbns.length === 0 ? (
        <Text style={estilos.vacio}>Todavía no abriste ningún libro.</Text>
      ) : (
        isbns.map((isbn, orden) => {
          const libro = buscarLibroPorIsbn(isbn);
          if (!libro) {
            return null;
          }
          return (
            <Link
              key={`${isbn}-${orden}`}
              href={{ pathname: '/libro/[isbn]', params: { isbn } }}
              asChild
            >
              <Pressable accessibilityRole="button" style={estilos.fila}>
                <Text style={estilos.texto}>{libro.titulo}</Text>
              </Pressable>
            </Link>
          );
        })
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    marginBottom: ESPACIADO.l,
  },
  titulo: {
    fontSize: TAMANIOS.textoSubtitulo,
    fontWeight: '700',
    color: COLORES.texto,
    marginBottom: ESPACIADO.s,
  },
  vacio: {
    fontSize: TAMANIOS.textoNormal,
    color: COLORES.textoSuave,
  },
  fila: {
    minHeight: TAMANIOS.areaTactil,
    justifyContent: 'center',
    paddingHorizontal: ESPACIADO.m,
    marginBottom: ESPACIADO.xs,
    backgroundColor: COLORES.primarioSuave,
    borderRadius: TAMANIOS.radio,
  },
  texto: {
    fontSize: TAMANIOS.textoNormal,
    color: COLORES.primario,
  },
});
