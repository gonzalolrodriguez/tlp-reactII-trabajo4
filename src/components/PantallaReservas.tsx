import { SectionList, StyleSheet, Text } from 'react-native';

import EncabezadoReservas from '@/components/EncabezadoReservas';
import EstadoVacio from '@/components/EstadoVacio';
import TarjetaEspera from '@/components/TarjetaEspera';
import TarjetaPrestamo from '@/components/TarjetaPrestamo';
import { LIBROS } from '@/data/libros';
import { COLORES, ESPACIADO, TAMANIOS } from '@/constants/tema';
import { useBiblioteca } from '@/context/BibliotecaContext';

type Seccion = {
  titulo: string;
  tipo: 'prestamo' | 'espera';
  data: string[]; // ISBN de cada libro
};

export default function PantallaReservas() {
  const { prestamos, posicionEnEspera } = useBiblioteca();

  const isbnsPrestados = prestamos.map((prestamo) => prestamo.isbn);
  const isbnsEnEspera = LIBROS.filter((libro) => posicionEnEspera(libro.isbn) > 0).map(
    (libro) => libro.isbn,
  );

  const secciones: Seccion[] = [];
  if (isbnsPrestados.length > 0) {
    secciones.push({ titulo: 'Mis préstamos', tipo: 'prestamo', data: isbnsPrestados });
  }
  if (isbnsEnEspera.length > 0) {
    secciones.push({ titulo: 'Mis reservas en espera', tipo: 'espera', data: isbnsEnEspera });
  }

  return (
    <SectionList
      style={estilos.lista}
      contentContainerStyle={estilos.contenido}
      sections={secciones}
      keyExtractor={(isbn) => isbn}
      renderSectionHeader={({ section }) => <Text style={estilos.seccion}>{section.titulo}</Text>}
      renderItem={({ item, section }) => {
        if (section.tipo === 'prestamo') {
          const prestamo = prestamos.find((p) => p.isbn === item);
          return prestamo ? <TarjetaPrestamo prestamo={prestamo} /> : null;
        }
        return <TarjetaEspera isbn={item} />;
      }}
      ListHeaderComponent={EncabezadoReservas}
      ListEmptyComponent={<EstadoVacio mensaje="Todavía no reservaste ningún libro." />}
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
  seccion: {
    fontSize: TAMANIOS.textoSubtitulo,
    fontWeight: '700',
    color: COLORES.texto,
    marginVertical: ESPACIADO.s,
    backgroundColor: COLORES.fondo,
  },
});
