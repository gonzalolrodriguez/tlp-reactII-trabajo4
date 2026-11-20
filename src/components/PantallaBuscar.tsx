import { router, useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';

import EstadoCargando from '@/components/EstadoCargando';
import EstadoError from '@/components/EstadoError';
import EstadoVacio from '@/components/EstadoVacio';
import TarjetaLibro from '@/components/TarjetaLibro';
import { COLORES, ESPACIADO, TAMANIOS } from '@/constants/tema';
import { useBuscarLibros } from '@/hooks/useBuscarLibros';

export default function PantallaBuscar() {
  // La búsqueda vive en la URL: /buscar?q=...
  const { q } = useLocalSearchParams<{ q?: string }>();
  const texto = q ?? '';
  const { libros, cargando, error, reintentar } = useBuscarLibros(texto);

  function actualizarTexto(nuevo: string) {
    // setParams cambia la URL sin apilar pantallas nuevas.
    router.setParams({ q: nuevo === '' ? undefined : nuevo });
  }

  let sinResultados = <EstadoVacio mensaje="Escribí un título o un autor para buscar." />;
  if (texto.trim() !== '') {
    sinResultados = <EstadoVacio mensaje={`No encontramos libros para "${texto.trim()}".`} />;
  }
  if (cargando) {
    sinResultados = <EstadoCargando mensaje="Buscando..." />;
  } else if (error !== null) {
    sinResultados = <EstadoError mensaje={error} onReintentar={reintentar} />;
  }

  return (
    <View style={estilos.pantalla}>
      <TextInput
        style={estilos.campo}
        value={texto}
        onChangeText={actualizarTexto}
        placeholder="Título o autor"
        placeholderTextColor={COLORES.deshabilitado}
        accessibilityLabel="Buscar por título o autor"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      <FlatList
        data={libros}
        keyExtractor={(libro) => libro.isbn}
        renderItem={({ item }) => <TarjetaLibro libro={item} />}
        ListEmptyComponent={sinResultados}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={estilos.contenido}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    padding: ESPACIADO.l,
    backgroundColor: COLORES.fondo,
  },
  campo: {
    minHeight: TAMANIOS.areaTactil,
    paddingHorizontal: ESPACIADO.m,
    marginBottom: ESPACIADO.l,
    fontSize: TAMANIOS.textoNormal,
    color: COLORES.texto,
    backgroundColor: COLORES.superficie,
    borderRadius: TAMANIOS.radio,
    borderWidth: TAMANIOS.borde,
    borderColor: COLORES.borde,
  },
  contenido: {
    flexGrow: 1,
  },
});
