import { StyleSheet, Switch, Text, View } from 'react-native';

import BotonPrimario from '@/components/BotonPrimario';
import { COLORES, ESPACIADO, TAMANIOS } from '@/constants/tema';
import { useBiblioteca } from '@/context/BibliotecaContext';
import { useRecordatorio } from '@/hooks/useRecordatorio';
import { buscarLibroPorIsbn } from '@/lib/libros';
import { formatearFecha } from '@/lib/prestamos';
import type { Prestamo } from '@/types/prestamos';

type Props = {
  prestamo: Prestamo;
};

export default function TarjetaPrestamo({ prestamo }: Props) {
  const { devolver } = useBiblioteca();
  const alternarRecordatorio = useRecordatorio(prestamo.isbn);
  const libro = buscarLibroPorIsbn(prestamo.isbn);

  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>{libro ? libro.titulo : prestamo.isbn}</Text>
      <Text style={estilos.dato}>Devolver antes del {formatearFecha(prestamo.fechaDevolucion)}</Text>
      <View style={estilos.fila}>
        <Text style={estilos.etiqueta}>Recordarme</Text>
        <Switch
          accessibilityLabel="Recordarme la devolución de este libro"
          value={prestamo.recordatorioId !== null}
          onValueChange={alternarRecordatorio}
        />
      </View>
      <BotonPrimario
        titulo="Devolver"
        variante="secundario"
        onPress={() => devolver(prestamo.isbn)}
      />
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
  fila: {
    minHeight: TAMANIOS.areaTactil,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  etiqueta: {
    fontSize: TAMANIOS.textoNormal,
    color: COLORES.texto,
  },
});
