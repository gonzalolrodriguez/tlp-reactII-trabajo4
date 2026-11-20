import { useCallback, useEffect, useState } from 'react';

import { obtenerLibros } from '@/lib/api';
import type { Libro } from '@/types';

type ResultadoUseLibros = {
  libros: Libro[];
  cargando: boolean;
  error: string | null;
  reintentar: () => void;
};

export function useLibros(): ResultadoUseLibros {
  const [libros, setLibros] = useState<Libro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Cambiar este contador vuelve a ejecutar el efecto, es decir, repite el pedido.
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let cancelado = false;

    obtenerLibros()
      .then((datos) => {
        if (!cancelado) {
          setLibros(datos);
          setCargando(false);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setError('No pudimos cargar el catálogo. Revisá tu conexión e intentá de nuevo.');
          setCargando(false);
        }
      });

    // Si el componente se desmonta o se repite el pedido, se ignora la respuesta vieja.
    return () => {
      cancelado = true;
    };
  }, [intento]);

  const reintentar = useCallback(() => {
    setCargando(true);
    setError(null);
    setIntento((anterior) => anterior + 1);
  }, []);

  return { libros, cargando, error, reintentar };
}
