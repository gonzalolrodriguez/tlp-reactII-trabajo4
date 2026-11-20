import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  CLAVE_PERSONAL,
  USUARIO_ACTUAL,
  USUARIO_PERSONAL,
} from '@/constants/config';
import { ESPERAS_INICIALES } from '@/data/esperasIniciales';
import { Cola } from '@/estructuras/Cola';
import { Pila } from '@/estructuras/Pila';
import {
  colaDesdeArray,
  copiarCola,
  copiarPila,
  crearEsperasIniciales,
} from '@/lib/colecciones';
import { buscarLibroPorIsbn } from '@/lib/libros';
import {
  cancelarRecordatorio,
  consultarNotificaciones,
  enviarNotificacionInmediata,
  programarRecordatorio,
} from '@/lib/permisos';
import { calcularDisponibles, calcularFechaDevolucion } from '@/lib/prestamos';
import type { Libro } from '@/types';
import type { Aviso, Prestamo, ResultadoReserva } from '@/types/prestamos';

type ValorBiblioteca = {
  prestamos: Prestamo[];
  recientes: Pila<string>;
  avisos: Aviso[];
  sesion: boolean;
  obtenerEspera: (isbn: string) => string[];
  obtenerDisponibles: (libro: Libro) => number;
  posicionEnEspera: (isbn: string) => number;
  tienePrestamo: (isbn: string) => boolean;
  registrarVisto: (isbn: string) => void;
  reservar: (libro: Libro) => ResultadoReserva;
  devolver: (isbn: string) => Promise<void>;
  activarRecordatorio: (isbn: string) => Promise<boolean>;
  desactivarRecordatorio: (isbn: string) => Promise<void>;
  entregarAlSiguiente: (isbn: string) => Promise<void>;
  agregarAviso: (mensaje: string) => void;
  descartarAviso: (id: string) => void;
  iniciarSesion: (usuario: string, clave: string) => boolean;
  cerrarSesion: () => void;
};

const BibliotecaContext = createContext<ValorBiblioteca | null>(null);

type Props = {
  children: ReactNode;
};

export function ProveedorBiblioteca({ children }: Props) {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [esperas, setEsperas] = useState<Record<string, Cola<string>>>(() =>
    crearEsperasIniciales(ESPERAS_INICIALES),
  );
  const [recientes, setRecientes] = useState<Pila<string>>(() => new Pila<string>());
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [sesion, setSesion] = useState(false);
  // Ejemplares que el mostrador le entregó a la persona (ver calcularDisponibles).
  const [ingresosPorEntrega, setIngresosPorEntrega] = useState<Record<string, number>>({});
  const contadorAvisos = useRef(0);

  const obtenerEspera = useCallback(
    (isbn: string): string[] => (esperas[isbn] ? esperas[isbn].aArray() : []),
    [esperas],
  );

  const obtenerDisponibles = useCallback(
    (libro: Libro): number => calcularDisponibles(libro, prestamos, ingresosPorEntrega),
    [prestamos, ingresosPorEntrega],
  );

  // Posición de la persona en la espera del libro (1 es el frente). 0 si no está en la lista.
  const posicionEnEspera = useCallback(
    (isbn: string): number => {
      const posicion = obtenerEspera(isbn).indexOf(USUARIO_ACTUAL);
      return posicion === -1 ? 0 : posicion + 1;
    },
    [obtenerEspera],
  );

  const tienePrestamo = useCallback(
    (isbn: string): boolean => prestamos.some((p) => p.isbn === isbn),
    [prestamos],
  );

  const registrarVisto = useCallback((isbn: string) => {
    setRecientes((anterior) => {
      if (anterior.tope() === isbn) {
        return anterior;
      }
      const nueva = copiarPila(anterior);
      nueva.push(isbn);
      return nueva;
    });
  }, []);

  const agregarAviso = useCallback((mensaje: string) => {
    contadorAvisos.current += 1;
    const id = `aviso-${contadorAvisos.current}`;
    setAvisos((anteriores) => [...anteriores, { id, mensaje }]);
  }, []);

  const descartarAviso = useCallback((id: string) => {
    setAvisos((anteriores) => anteriores.filter((aviso) => aviso.id !== id));
  }, []);

  const reservar = useCallback(
    (libro: Libro): ResultadoReserva => {
      if (tienePrestamo(libro.isbn) || posicionEnEspera(libro.isbn) > 0) {
        return { tipo: 'repetida' };
      }
      if (obtenerDisponibles(libro) > 0) {
        const fechaDevolucion = calcularFechaDevolucion(new Date());
        setPrestamos((anteriores) => [
          ...anteriores,
          { isbn: libro.isbn, fechaDevolucion, recordatorioId: null },
        ]);
        return { tipo: 'prestamo', fechaDevolucion };
      }
      const nuevaCola = esperas[libro.isbn]
        ? copiarCola(esperas[libro.isbn])
        : colaDesdeArray<string>([]);
      nuevaCola.encolar(USUARIO_ACTUAL);
      setEsperas((anteriores) => ({ ...anteriores, [libro.isbn]: nuevaCola }));
      return { tipo: 'espera', posicion: nuevaCola.tamanio };
    },
    [esperas, obtenerDisponibles, posicionEnEspera, tienePrestamo],
  );

  const desactivarRecordatorio = useCallback(
    async (isbn: string) => {
      const prestamo = prestamos.find((p) => p.isbn === isbn);
      if (!prestamo || prestamo.recordatorioId === null) {
        return;
      }
      await cancelarRecordatorio(prestamo.recordatorioId);
      setPrestamos((anteriores) =>
        anteriores.map((p) => (p.isbn === isbn ? { ...p, recordatorioId: null } : p)),
      );
    },
    [prestamos],
  );

  const activarRecordatorio = useCallback(
    async (isbn: string): Promise<boolean> => {
      const prestamo = prestamos.find((p) => p.isbn === isbn);
      const libro = buscarLibroPorIsbn(isbn);
      if (!prestamo || !libro || prestamo.recordatorioId !== null) {
        return false;
      }
      const identificador = await programarRecordatorio(libro.titulo);
      if (identificador === null) {
        agregarAviso(
          'No pudimos programar el recordatorio en este dispositivo. Recordá devolver el libro antes de la fecha.',
        );
        return false;
      }
      setPrestamos((anteriores) =>
        anteriores.map((p) => (p.isbn === isbn ? { ...p, recordatorioId: identificador } : p)),
      );
      return true;
    },
    [prestamos, agregarAviso],
  );

  const devolver = useCallback(
    async (isbn: string) => {
      const prestamo = prestamos.find((p) => p.isbn === isbn);
      if (!prestamo) {
        return;
      }
      if (prestamo.recordatorioId !== null) {
        await cancelarRecordatorio(prestamo.recordatorioId);
      }
      setPrestamos((anteriores) => anteriores.filter((p) => p.isbn !== isbn));
    },
    [prestamos],
  );

  const entregarAlSiguiente = useCallback(
    async (isbn: string) => {
      const cola = esperas[isbn];
      if (!cola || cola.vacia) {
        return;
      }
      const nuevaCola = copiarCola(cola);
      const persona = nuevaCola.desencolar();
      setEsperas((anteriores) => ({ ...anteriores, [isbn]: nuevaCola }));

      const libro = buscarLibroPorIsbn(isbn);
      if (persona !== USUARIO_ACTUAL || !libro) {
        return;
      }
      setIngresosPorEntrega((anteriores) => ({
        ...anteriores,
        [isbn]: (anteriores[isbn] ?? 0) + 1,
      }));
      setPrestamos((anteriores) => [
        ...anteriores,
        { isbn, fechaDevolucion: calcularFechaDevolucion(new Date()), recordatorioId: null },
      ]);

      // Se consulta el permiso en este momento: pudo cambiar desde Ajustes.
      const permiso = await consultarNotificaciones();
      if (permiso.granted && (await enviarNotificacionInmediata(libro.titulo))) {
        return;
      }
      agregarAviso(`Ya podés retirar "${libro.titulo}" en el mostrador. Lo ves en Mis reservas.`);
    },
    [esperas, agregarAviso],
  );

  const iniciarSesion = useCallback((usuario: string, clave: string): boolean => {
    const correcta = usuario.trim() === USUARIO_PERSONAL && clave === CLAVE_PERSONAL;
    if (correcta) {
      setSesion(true);
    }
    return correcta;
  }, []);

  const cerrarSesion = useCallback(() => {
    setSesion(false);
  }, []);

  const valor = useMemo<ValorBiblioteca>(
    () => ({
      prestamos,
      recientes,
      avisos,
      sesion,
      obtenerEspera,
      obtenerDisponibles,
      posicionEnEspera,
      tienePrestamo,
      registrarVisto,
      reservar,
      devolver,
      activarRecordatorio,
      desactivarRecordatorio,
      entregarAlSiguiente,
      agregarAviso,
      descartarAviso,
      iniciarSesion,
      cerrarSesion,
    }),
    [
      prestamos,
      recientes,
      avisos,
      sesion,
      obtenerEspera,
      obtenerDisponibles,
      posicionEnEspera,
      tienePrestamo,
      registrarVisto,
      reservar,
      devolver,
      activarRecordatorio,
      desactivarRecordatorio,
      entregarAlSiguiente,
      agregarAviso,
      descartarAviso,
      iniciarSesion,
      cerrarSesion,
    ],
  );

  return <BibliotecaContext.Provider value={valor}>{children}</BibliotecaContext.Provider>;
}

export function useBiblioteca(): ValorBiblioteca {
  const valor = useContext(BibliotecaContext);
  if (valor === null) {
    throw new Error('useBiblioteca se usa dentro de ProveedorBiblioteca');
  }
  return valor;
}
