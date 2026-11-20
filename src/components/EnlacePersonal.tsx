import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { COLORES, ESPACIADO, TAMANIOS } from '@/constants/tema';
import { useBiblioteca } from '@/context/BibliotecaContext';

// Link del header del Catálogo: sin sesión va al login, con sesión al mostrador.
export default function EnlacePersonal() {
  const { sesion } = useBiblioteca();

  return (
    <Link href={sesion ? '/mostrador' : '/login'} asChild>
      <Pressable accessibilityRole="link" style={estilos.enlace}>
        <Text style={estilos.texto}>Personal</Text>
      </Pressable>
    </Link>
  );
}

const estilos = StyleSheet.create({
  enlace: {
    minHeight: TAMANIOS.areaTactil,
    minWidth: TAMANIOS.areaTactil,
    paddingHorizontal: ESPACIADO.s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  texto: {
    fontSize: TAMANIOS.textoNormal,
    fontWeight: '600',
    color: COLORES.primario,
  },
});
