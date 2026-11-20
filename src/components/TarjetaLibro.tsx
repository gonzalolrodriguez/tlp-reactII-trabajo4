import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { COLORES, ESPACIADO, TAMANIOS } from '@/constants/tema';
import { useBiblioteca } from '@/context/BibliotecaContext';
import type { Libro } from '@/types';

type Props = {
  libro: Libro;
};

export default function TarjetaLibro({ libro }: Props) {
  const { obtenerDisponibles } = useBiblioteca();
  const disponibles = obtenerDisponibles(libro);

  return (
    <Link href={{ pathname: '/libro/[isbn]', params: { isbn: libro.isbn } }} asChild>
      <Pressable accessibilityRole="button" style={estilos.tarjeta}>
        <Text style={estilos.titulo}>{libro.titulo}</Text>
        <Text style={estilos.autor}>
          {libro.autor} ({libro.anio})
        </Text>
        <Text style={disponibles > 0 ? estilos.disponible : estilos.agotado}>
          {disponibles > 0 ? `Ejemplares disponibles: ${disponibles}` : 'Sin ejemplares disponibles'}
        </Text>
      </Pressable>
    </Link>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    minHeight: TAMANIOS.areaTactil,
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
  autor: {
    fontSize: TAMANIOS.textoNormal,
    color: COLORES.textoSuave,
  },
  disponible: {
    fontSize: TAMANIOS.textoChico,
    color: COLORES.exito,
  },
  agotado: {
    fontSize: TAMANIOS.textoChico,
    color: COLORES.aviso,
  },
});
