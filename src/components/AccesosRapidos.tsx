import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import BotonPrimario from '@/components/BotonPrimario';
import { ESPACIADO } from '@/constants/tema';

export default function AccesosRapidos() {
  return (
    <View style={estilos.fila}>
      <View style={estilos.columna}>
        <BotonPrimario titulo="Buscar" onPress={() => router.push('/buscar')} />
      </View>
      <View style={estilos.columna}>
        <BotonPrimario
          titulo="Escanear"
          variante="secundario"
          onPress={() => router.push('/escanear')}
        />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    gap: ESPACIADO.m,
    marginBottom: ESPACIADO.l,
  },
  columna: {
    flex: 1,
  },
});
