import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import BotonPrimario from '@/components/BotonPrimario';
import { COLORES, ESPACIADO, TAMANIOS } from '@/constants/tema';
import { useBiblioteca } from '@/context/BibliotecaContext';

export default function PantallaLogin() {
  const { iniciarSesion } = useBiblioteca();
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  function ingresar() {
    // Si la clave es correcta, la sesión cambia y Stack.Protected cierra este modal solo.
    if (!iniciarSesion(usuario, clave)) {
      setMensajeError('Usuario o clave incorrectos. Revisá los datos e intentá de nuevo.');
    }
  }

  return (
    <View style={estilos.pantalla}>
      <Text style={estilos.titulo}>Ingreso del personal</Text>
      <TextInput
        style={estilos.campo}
        value={usuario}
        onChangeText={setUsuario}
        placeholder="Usuario"
        placeholderTextColor={COLORES.deshabilitado}
        accessibilityLabel="Usuario"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={estilos.campo}
        value={clave}
        onChangeText={setClave}
        placeholder="Clave"
        placeholderTextColor={COLORES.deshabilitado}
        accessibilityLabel="Clave"
        secureTextEntry
        autoCapitalize="none"
        onSubmitEditing={ingresar}
      />
      {mensajeError !== null && <Text style={estilos.error}>{mensajeError}</Text>}
      <BotonPrimario titulo="Ingresar" onPress={ingresar} />
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
    marginBottom: ESPACIADO.s,
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
    fontSize: TAMANIOS.textoNormal,
    color: COLORES.error,
  },
});
