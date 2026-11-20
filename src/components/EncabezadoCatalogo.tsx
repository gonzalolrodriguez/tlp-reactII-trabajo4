import { View } from 'react-native';

import AccesosRapidos from '@/components/AccesosRapidos';
import VistosRecientes from '@/components/VistosRecientes';

// Parte de arriba del Catálogo: recientes y accesos a Buscar y Escanear.
export default function EncabezadoCatalogo() {
  return (
    <View>
      <VistosRecientes />
      <AccesosRapidos />
    </View>
  );
}
