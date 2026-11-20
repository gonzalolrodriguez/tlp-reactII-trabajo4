import { FlatList, StyleSheet, View } from 'react-native';

import BotonPrimario from '@/components/BotonPrimario';
import EstadoVacio from '@/components/EstadoVacio';
import TarjetaMostrador from '@/components/TarjetaMostrador';
import { COLORES, ESPACIADO } from '@/constants/tema';
import { useBiblioteca } from '@/context/BibliotecaContext';
import { LIBROS } from '@/data/libros';

export default function PantallaMostrador() {
  const { obtenerEspera, cerrarSesion } = useBiblioteca();
  const librosConEspera = LIBROS.filter((libro) => obtenerEspera(libro.isbn).length > 0);

  return (
    <View style={estilos.pantalla}>
      <FlatList
        data={librosConEspera}
        keyExtractor={(libro) => libro.isbn}
        renderItem={({ item }) => <TarjetaMostrador libro={item} />}
        ListEmptyComponent={<EstadoVacio mensaje="No hay personas en lista de espera." />}
        contentContainerStyle={estilos.contenido}
      />
      <BotonPrimario titulo="Cerrar sesión" variante="secundario" onPress={cerrarSesion} />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    padding: ESPACIADO.l,
    gap: ESPACIADO.m,
    backgroundColor: COLORES.fondo,
  },
  contenido: {
    flexGrow: 1,
  },
});
