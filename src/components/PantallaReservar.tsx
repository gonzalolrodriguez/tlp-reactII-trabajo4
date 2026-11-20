import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import BotonPrimario from '@/components/BotonPrimario';
import MensajeConEnlace from '@/components/MensajeConEnlace';
import { DIAS_PRESTAMO } from '@/constants/config';
import { COLORES, ESPACIADO, TAMANIOS } from '@/constants/tema';
import { useBiblioteca } from '@/context/BibliotecaContext';
import { buscarLibroPorIsbn, esIsbnValido } from '@/lib/libros';

const MENSAJE_REPETIDA = 'Ya tenés este libro prestado o en la lista de espera. No se puede reservar dos veces.';

export default function PantallaReservar() {
  const { isbn } = useLocalSearchParams<{ isbn: string }>();
  const { obtenerDisponibles, obtenerEspera, tienePrestamo, posicionEnEspera, reservar } =
    useBiblioteca();
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const libro = esIsbnValido(isbn) ? buscarLibroPorIsbn(isbn) : undefined;
  if (!libro) {
    return <MensajeConEnlace mensaje="No encontramos el libro que querés reservar." />;
  }

  const yaReservado = tienePrestamo(libro.isbn) || posicionEnEspera(libro.isbn) > 0;
  const hayEjemplares = obtenerDisponibles(libro) > 0;
  const posicionNueva = obtenerEspera(libro.isbn).length + 1;

  function confirmar() {
    if (!libro) {
      return;
    }
    const resultado = reservar(libro);
    if (resultado.tipo === 'repetida') {
      setMensajeError(MENSAJE_REPETIDA);
      return;
    }
    // dismissTo cierra el modal y va a /reservas: "atrás" no vuelve a la confirmación.
    router.dismissTo('/reservas');
  }

  let resumen = `No hay ejemplares disponibles. Ingresás a la lista de espera en la posición ${posicionNueva}.`;
  if (hayEjemplares) {
    resumen = `Hay ejemplares disponibles. Se registra un préstamo por ${DIAS_PRESTAMO} días.`;
  }

  return (
    <View style={estilos.pantalla}>
      <Text style={estilos.titulo}>{libro.titulo}</Text>
      <Text style={estilos.autor}>{libro.autor}</Text>
      <Text style={estilos.resumen}>{yaReservado ? MENSAJE_REPETIDA : resumen}</Text>
      {mensajeError !== null && <Text style={estilos.error}>{mensajeError}</Text>}
      <View style={estilos.botones}>
        <BotonPrimario titulo="Confirmar" onPress={confirmar} deshabilitado={yaReservado} />
        <BotonPrimario titulo="Cancelar" variante="secundario" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    padding: ESPACIADO.xl,
    gap: ESPACIADO.m,
    backgroundColor: COLORES.fondo,
  },
  titulo: {
    fontSize: TAMANIOS.textoTitulo,
    fontWeight: '700',
    color: COLORES.texto,
  },
  autor: {
    fontSize: TAMANIOS.textoNormal,
    color: COLORES.textoSuave,
  },
  resumen: {
    fontSize: TAMANIOS.textoNormal,
    color: COLORES.texto,
    marginVertical: ESPACIADO.m,
  },
  error: {
    fontSize: TAMANIOS.textoNormal,
    color: COLORES.error,
  },
  botones: {
    gap: ESPACIADO.m,
  },
});
