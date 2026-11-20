import { FlatList, StyleSheet } from 'react-native';

import EncabezadoCatalogo from '@/components/EncabezadoCatalogo';
import EstadoCargando from '@/components/EstadoCargando';
import EstadoError from '@/components/EstadoError';
import EstadoVacio from '@/components/EstadoVacio';
import TarjetaLibro from '@/components/TarjetaLibro';
import { COLORES, ESPACIADO } from '@/constants/tema';
import { useLibros } from '@/hooks/useLibros';

export default function PantallaCatalogo() {
  const { libros, cargando, error, reintentar } = useLibros();

  // Qué se muestra cuando la lista no tiene libros: cargando, error o vacío.
  let sinLibros = <EstadoVacio mensaje="La biblioteca todavía no tiene libros cargados." />;
  if (cargando) {
    sinLibros = <EstadoCargando mensaje="Cargando el catálogo..." />;
  } else if (error !== null) {
    sinLibros = <EstadoError mensaje={error} onReintentar={reintentar} />;
  }

  return (
    <FlatList
      style={estilos.lista}
      contentContainerStyle={estilos.contenido}
      data={libros}
      keyExtractor={(libro) => libro.isbn}
      renderItem={({ item }) => <TarjetaLibro libro={item} />}
      ListHeaderComponent={EncabezadoCatalogo}
      ListEmptyComponent={sinLibros}
    />
  );
}

const estilos = StyleSheet.create({
  lista: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  contenido: {
    padding: ESPACIADO.l,
  },
});
