import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import CamaraEscaner from '@/components/CamaraEscaner';
import EntradaIsbnManual from '@/components/EntradaIsbnManual';
import EstadoCargando from '@/components/EstadoCargando';
import MensajePermisoCamara from '@/components/MensajePermisoCamara';
import { COLORES, ESPACIADO, TAMANIOS } from '@/constants/tema';
import { usePermiso } from '@/hooks/usePermiso';
import { buscarLibroPorIsbn } from '@/lib/libros';
import { INFO_RECURSOS, obtenerCaminoAjustes } from '@/lib/permisos';

export default function PantallaEscanear() {
  const { estado, abrirAjustes } = usePermiso('camara');
  const [aviso, setAviso] = useState<string | null>(null);

  // useRef (y no useState): cambiar un ref es inmediato y no espera a un render,
  // así que los llamados siguientes de onBarcodeScanned ya ven el bloqueo.
  const yaNavegando = useRef(false);
  const ultimoDesconocido = useRef<string | null>(null);
  const previaMostrada = useRef(false);

  // Antes del diálogo del sistema se muestra la pantalla previa (una sola vez por apertura).
  useEffect(() => {
    if (estado === 'preguntable' && !previaMostrada.current) {
      previaMostrada.current = true;
      router.push('/permisos/camara');
    }
  }, [estado]);

  const abrirLibro = useCallback((isbn: string) => {
    if (yaNavegando.current) {
      return;
    }
    if (!buscarLibroPorIsbn(isbn)) {
      // El mismo código desconocido no repite el aviso, pero se sigue escaneando.
      if (ultimoDesconocido.current !== isbn) {
        ultimoDesconocido.current = isbn;
        setAviso(`El ISBN ${isbn} no está en el catálogo de la biblioteca.`);
      }
      return;
    }
    yaNavegando.current = true;
    // replace: al volver atrás no se vuelve al escáner.
    router.replace({ pathname: '/libro/[isbn]', params: { isbn } });
  }, []);

  function mostrarPrevia() {
    router.push('/permisos/camara');
  }

  let zonaCamara = <EstadoCargando mensaje="Revisando el permiso de la cámara..." />;
  if (estado === 'concedido') {
    zonaCamara = <CamaraEscaner onCodigoLeido={abrirLibro} />;
  } else if (estado === 'preguntable') {
    zonaCamara = (
      <MensajePermisoCamara
        mensaje={INFO_RECURSOS.camara.beneficio}
        textoBoton="Continuar"
        onPress={mostrarPrevia}
      />
    );
  } else if (estado === 'bloqueado') {
    zonaCamara = (
      <MensajePermisoCamara
        mensaje={`La cámara está desactivada para la app. Podés activarla en ${obtenerCaminoAjustes('camara')}. Mientras tanto, escribí el ISBN a mano.`}
        textoBoton="Abrir Ajustes"
        onPress={abrirAjustes}
      />
    );
  }

  return (
    <ScrollView
      style={estilos.pantalla}
      contentContainerStyle={estilos.contenido}
      keyboardShouldPersistTaps="handled"
    >
      {zonaCamara}
      {aviso !== null && <Text style={estilos.aviso}>{aviso}</Text>}
      <EntradaIsbnManual onEnviar={abrirLibro} />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  contenido: {
    padding: ESPACIADO.l,
    gap: ESPACIADO.l,
  },
  aviso: {
    padding: ESPACIADO.m,
    fontSize: TAMANIOS.textoNormal,
    color: COLORES.aviso,
    backgroundColor: COLORES.avisoSuave,
    borderRadius: TAMANIOS.radio,
  },
});
