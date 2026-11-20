import { StyleSheet, Text, View } from 'react-native';

import BotonPrimario from '@/components/BotonPrimario';
import { COLORES, ESPACIADO, TAMANIOS } from '@/constants/tema';
import { INFO_RECURSOS, obtenerCaminoAjustes } from '@/lib/permisos';
import type { EstadoPermiso, RecursoPermiso } from '@/types/permisos';

type Props = {
  recurso: RecursoPermiso;
  estado: EstadoPermiso;
  onContinuar: () => void;
  onAbrirAjustes: () => void;
};

// Pantalla previa: el beneficio en una frase y un único botón.
export default function ExplicacionPermiso({ recurso, estado, onContinuar, onAbrirAjustes }: Props) {
  const info = INFO_RECURSOS[recurso];
  const bloqueado = estado === 'bloqueado';

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>{info.titulo}</Text>
      <Text style={estilos.beneficio}>{info.beneficio}</Text>
      {bloqueado && (
        <Text style={estilos.nota}>
          El permiso está desactivado. Podés activarlo en {obtenerCaminoAjustes(recurso)}.
        </Text>
      )}
      <Text style={estilos.nota}>{info.alternativa}</Text>
      {bloqueado ? (
        <BotonPrimario titulo="Abrir Ajustes" onPress={onAbrirAjustes} />
      ) : (
        <BotonPrimario titulo="Continuar" onPress={onContinuar} />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'center',
    padding: ESPACIADO.xl,
    gap: ESPACIADO.l,
    backgroundColor: COLORES.fondo,
  },
  titulo: {
    fontSize: TAMANIOS.textoTitulo,
    fontWeight: '700',
    color: COLORES.texto,
  },
  beneficio: {
    fontSize: TAMANIOS.textoSubtitulo,
    color: COLORES.texto,
  },
  nota: {
    fontSize: TAMANIOS.textoChico,
    color: COLORES.textoSuave,
  },
});
