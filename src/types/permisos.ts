export type RecursoPermiso = 'camara' | 'notificaciones';

export type EstadoPermiso = 'cargando' | 'concedido' | 'preguntable' | 'bloqueado';

export type RespuestaPermiso = {
  granted: boolean;
  canAskAgain: boolean;
};
