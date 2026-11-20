import { useCallback, useEffect, useState } from 'react';

import { MILISEGUNDOS_DEBOUNCE } from '@/constants/config';
import { buscarLibros } from '@/lib/api';
import type { Libro } from '@/types';

type RespuestaBusqueda = {
  consulta: string;
  libros: Libro[];
  fallo: boolean;
};

type ResultadoUseBuscarLibros = {
  libros: Libro[];
  cargando: boolean;
  error: string | null;
  reintentar: () => void;
};

// Busca con una espera de 300 ms después de la última letra escrita.
// Solo se muestran los resultados de la última búsqueda, aunque lleguen desordenados.
export function useBuscarLibros(q: string): ResultadoUseBuscarLibros {
  const [respuesta, setRespuesta] = useState<RespuestaBusqueda | null>(null);
  const [intento, setIntento] = useState(0);
  const texto = q.trim();

  useEffect(() => {
    if (texto === '') {
      return;
    }
    let obsoleta = false;

    const temporizador = setTimeout(() => {
      buscarLibros(texto)
        .then((libros) => {
          if (!obsoleta) {
            setRespuesta({ consulta: texto, libros, fallo: false });
          }
        })
        .catch(() => {
          if (!obsoleta) {
            setRespuesta({ consulta: texto, libros: [], fallo: true });
          }
        });
    }, MILISEGUNDOS_DEBOUNCE);

    // La limpieza corta la espera y marca como vieja la búsqueda en curso.
    return () => {
      obsoleta = true;
      clearTimeout(temporizador);
    };
  }, [texto, intento]);

  const reintentar = useCallback(() => {
    setRespuesta(null);
    setIntento((anterior) => anterior + 1);
  }, []);

  const actual = respuesta !== null && respuesta.consulta === texto ? respuesta : null;

  return {
    libros: actual ? actual.libros : [],
    cargando: texto !== '' && actual === null,
    error: actual?.fallo ? 'No pudimos buscar en este momento. Intentá de nuevo.' : null,
    reintentar,
  };
}
