export type Prestamo = {
  isbn: string;
  fechaDevolucion: string; // fecha en formato ISO
  recordatorioId: string | null; // identificador de la notificación programada
};

export type Aviso = {
  id: string;
  mensaje: string;
};

export type ResultadoReserva =
  | { tipo: 'prestamo'; fechaDevolucion: string }
  | { tipo: 'espera'; posicion: number }
  | { tipo: 'repetida' };
