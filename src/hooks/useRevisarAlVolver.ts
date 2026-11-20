import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

// Ejecuta "revisar" cuando la app vuelve a primer plano (por ejemplo, al volver de Ajustes).
export function useRevisarAlVolver(revisar: () => void) {
  const anterior = useRef<string | null | undefined>(AppState.currentState);

  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (nuevo) => {
      const estabaAfuera = anterior.current === 'inactive' || anterior.current === 'background';
      if (estabaAfuera && nuevo === 'active') {
        revisar();
      }
      anterior.current = nuevo;
    });

    return () => suscripcion.remove();
  }, [revisar]);
}
