import { Link, usePathname } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { COLORES, ESPACIADO, TAMANIOS } from '@/constants/tema';

export default function PantallaNoEncontrada() {
  const ruta = usePathname();

  return (
    <View style={estilos.pantalla}>
      <Text style={estilos.titulo}>Esta pantalla no existe</Text>
      <Text style={estilos.texto}>No encontramos la dirección {ruta}</Text>
      <Link href="/" accessibilityRole="link" style={estilos.enlace}>
        Volver al Catálogo
      </Link>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: ESPACIADO.xl,
    gap: ESPACIADO.m,
    backgroundColor: COLORES.fondo,
  },
  titulo: {
    fontSize: TAMANIOS.textoTitulo,
    fontWeight: '700',
    color: COLORES.texto,
  },
  texto: {
    fontSize: TAMANIOS.textoNormal,
    color: COLORES.textoSuave,
    textAlign: 'center',
  },
  enlace: {
    minHeight: TAMANIOS.areaTactil,
    minWidth: TAMANIOS.areaTactil,
    paddingVertical: ESPACIADO.m,
    fontSize: TAMANIOS.textoNormal,
    fontWeight: '600',
    color: COLORES.primario,
  },
});
