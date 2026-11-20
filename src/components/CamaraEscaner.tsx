import { CameraView } from 'expo-camera';
import { StyleSheet } from 'react-native';

import { COLORES, TAMANIOS } from '@/constants/tema';

type Props = {
  onCodigoLeido: (codigo: string) => void;
};

// Cámara que lee códigos EAN-13 (el código de barras de la contratapa).
// onBarcodeScanned se dispara muchas veces mientras el código sigue enfrente.
export default function CamaraEscaner({ onCodigoLeido }: Props) {
  return (
    <CameraView
      style={estilos.camara}
      facing="back"
      barcodeScannerSettings={{ barcodeTypes: ['ean13'] }}
      onBarcodeScanned={(resultado) => onCodigoLeido(resultado.data)}
    />
  );
}

const estilos = StyleSheet.create({
  camara: {
    height: TAMANIOS.altoCamara,
    borderRadius: TAMANIOS.radio,
    overflow: 'hidden',
    backgroundColor: COLORES.texto,
  },
});
