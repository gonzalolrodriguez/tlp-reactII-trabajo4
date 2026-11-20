import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import BotonPrimario from '@/components/BotonPrimario';
import { LARGO_ISBN } from '@/constants/config';
import { COLORES, ESPACIADO, TAMANIOS } from '@/constants/tema';
import { esIsbnValido } from '@/lib/libros';

type Props = {
  onEnviar: (isbn: string) => void;
};

// Alternativa siempre disponible: escribir el ISBN a mano (también sin permiso de cámara).
export default function EntradaIsbnManual({ onEnviar }: Props) {
  const [isbn, setIsbn] = useState('');
  const [mensaje, setMensaje] = useState<string | null>(null);

  function enviar() {
    const limpio = isbn.trim();
    if (!esIsbnValido(limpio)) {
      setMensaje(`El ISBN tiene que tener ${LARGO_ISBN} dígitos, sin guiones.`);
      return;
    }
    setMensaje(null);
    onEnviar(limpio);
  }

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.etiqueta}>O escribí el ISBN a mano</Text>
      <TextInput
        style={estilos.campo}
        value={isbn}
        onChangeText={setIsbn}
        placeholder="9788499089508"
        placeholderTextColor={COLORES.deshabilitado}
        accessibilityLabel="ISBN del libro"
        keyboardType="number-pad"
        maxLength={LARGO_ISBN}
        onSubmitEditing={enviar}
      />
      {mensaje !== null && <Text style={estilos.error}>{mensaje}</Text>}
      <BotonPrimario titulo="Buscar por ISBN" onPress={enviar} />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: ESPACIADO.s,
  },
  etiqueta: {
    fontSize: TAMANIOS.textoNormal,
    fontWeight: '600',
    color: COLORES.texto,
  },
  campo: {
    minHeight: TAMANIOS.areaTactil,
    paddingHorizontal: ESPACIADO.m,
    fontSize: TAMANIOS.textoNormal,
    color: COLORES.texto,
    backgroundColor: COLORES.superficie,
    borderRadius: TAMANIOS.radio,
    borderWidth: TAMANIOS.borde,
    borderColor: COLORES.borde,
  },
  error: {
    fontSize: TAMANIOS.textoChico,
    color: COLORES.error,
  },
});
