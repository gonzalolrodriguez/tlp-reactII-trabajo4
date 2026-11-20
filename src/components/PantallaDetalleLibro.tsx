import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import BotonPrimario from '@/components/BotonPrimario';
import MensajeConEnlace from '@/components/MensajeConEnlace';
import { COLORES, ESPACIADO, TAMANIOS } from '@/constants/tema';
import { useBiblioteca } from '@/context/BibliotecaContext';
import { buscarLibroPorIsbn, esIsbnValido } from '@/lib/libros';

export default function PantallaDetalleLibro() {
  const { isbn } = useLocalSearchParams<{ isbn: string }>();
  const { obtenerDisponibles, obtenerEspera, registrarVisto } = useBiblioteca();

  // El parámetro puede venir de cualquier link: se valida antes de usarlo.
  const libro = esIsbnValido(isbn) ? buscarLibroPorIsbn(isbn) : undefined;

  // Cada vez que se abre un detalle se apila en "vistos recientemente".
  useEffect(() => {
    if (libro) {
      registrarVisto(libro.isbn);
    }
  }, [libro, registrarVisto]);

  if (!esIsbnValido(isbn)) {
    return <MensajeConEnlace mensaje="El ISBN no es válido: tiene que tener 13 dígitos." />;
  }
  if (!libro) {
    return <MensajeConEnlace mensaje="No encontramos ningún libro con ese ISBN en la biblioteca." />;
  }

  const disponibles = obtenerDisponibles(libro);
  const espera = obtenerEspera(libro.isbn);

  return (
    <View style={estilos.pantalla}>
      <Stack.Screen options={{ title: libro.titulo }} />
      <Text style={estilos.titulo}>{libro.titulo}</Text>
      <Text style={estilos.dato}>Autor: {libro.autor}</Text>
      <Text style={estilos.dato}>Año: {libro.anio}</Text>
      <Text style={estilos.dato}>ISBN: {libro.isbn}</Text>
      <Text style={estilos.dato}>Ejemplares disponibles: {disponibles}</Text>
      <Text style={estilos.dato}>Personas en lista de espera: {espera.length}</Text>
      {espera.length > 0 && <Text style={estilos.espera}>{espera.join(', ')}</Text>}
      <View style={estilos.boton}>
        <BotonPrimario
          titulo="Reservar"
          onPress={() => router.push({ pathname: '/reservar/[isbn]', params: { isbn: libro.isbn } })}
        />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    padding: ESPACIADO.l,
    gap: ESPACIADO.s,
    backgroundColor: COLORES.fondo,
  },
  titulo: {
    fontSize: TAMANIOS.textoTitulo,
    fontWeight: '700',
    color: COLORES.texto,
    marginBottom: ESPACIADO.s,
  },
  dato: {
    fontSize: TAMANIOS.textoNormal,
    color: COLORES.texto,
  },
  espera: {
    fontSize: TAMANIOS.textoChico,
    color: COLORES.textoSuave,
  },
  boton: {
    marginTop: ESPACIADO.l,
  },
});
