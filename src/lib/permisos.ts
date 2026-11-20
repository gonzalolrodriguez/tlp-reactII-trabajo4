import { Linking, Platform } from 'react-native';

import { CANAL_PRESTAMOS, SEGUNDOS_RECORDATORIO_DEMO } from '../constants/config';
import type { EstadoPermiso, RecursoPermiso, RespuestaPermiso } from '../types/permisos';

// En Expo Go para Android, importar expo-notifications puede hacer fallar toda la app.
// Por eso se carga dentro de un try/catch: si no se puede cargar, la app sigue
// funcionando y los avisos se muestran dentro de la app.
type ModuloNotificaciones = typeof import('expo-notifications');

async function cargarNotificaciones(): Promise<ModuloNotificaciones | null> {
  try {
    const modulo = await import('expo-notifications');
    modulo.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    return modulo;
  } catch {
    return null;
  }
}

// Se carga una sola vez; cada función espera este resultado antes de usar el módulo.
const carga = cargarNotificaciones();

export async function notificacionesDisponibles(): Promise<boolean> {
  return (await carga) !== null;
}

export type InfoRecurso = {
  titulo: string;
  beneficio: string;
  alternativa: string;
  caminoAndroid: string;
  caminoIOS: string;
};

export const INFO_RECURSOS: Record<RecursoPermiso, InfoRecurso> = {
  camara: {
    titulo: 'Cámara',
    beneficio:
      'Usamos tu cámara para leer el código de barras del libro y abrir su ficha sin escribir el ISBN.',
    alternativa: 'Podés escribir el ISBN a mano.',
    caminoAndroid: 'Ajustes > Aplicaciones > Biblioteca IPF > Permisos > Cámara',
    caminoIOS: 'Ajustes > Biblioteca IPF > Cámara',
  },
  notificaciones: {
    titulo: 'Notificaciones',
    beneficio:
      'Usamos las notificaciones para recordarte la devolución de tus libros antes de que venza el plazo.',
    alternativa: 'Los avisos se ven dentro de la app, en la pestaña Mis reservas.',
    caminoAndroid: 'Ajustes > Aplicaciones > Biblioteca IPF > Notificaciones',
    caminoIOS: 'Ajustes > Biblioteca IPF > Notificaciones',
  },
};

export function esRecursoValido(valor: string | undefined): valor is RecursoPermiso {
  return valor === 'camara' || valor === 'notificaciones';
}

export function obtenerCaminoAjustes(recurso: RecursoPermiso): string {
  const info = INFO_RECURSOS[recurso];
  return Platform.OS === 'ios' ? info.caminoIOS : info.caminoAndroid;
}

// Convierte la respuesta del sistema en uno de los estados de la app.
// "status" solo no alcanza: "denegado" puede ser preguntable o bloqueado según canAskAgain.
export function calcularEstado(respuesta: RespuestaPermiso | null): EstadoPermiso {
  if (respuesta === null) {
    return 'cargando';
  }
  if (respuesta.granted) {
    return 'concedido';
  }
  return respuesta.canAskAgain ? 'preguntable' : 'bloqueado';
}

export async function abrirAjustes(): Promise<void> {
  await Linking.openSettings();
}

// Consulta el estado real al sistema operativo, nunca un valor guardado.
export async function consultarNotificaciones(): Promise<RespuestaPermiso> {
  const Notifications = await carga;
  if (!Notifications) {
    return { granted: false, canAskAgain: false };
  }
  try {
    const respuesta = await Notifications.getPermissionsAsync();
    return { granted: respuesta.granted, canAskAgain: respuesta.canAskAgain };
  } catch {
    return { granted: false, canAskAgain: true };
  }
}

// En Android el canal tiene que existir ANTES de pedir el permiso.
async function crearCanalPrestamos(Notifications: ModuloNotificaciones): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL_PRESTAMOS, {
      name: 'Devolución de préstamos',
      description: 'Recordatorios para devolver los libros a tiempo',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function pedirNotificaciones(): Promise<RespuestaPermiso> {
  const Notifications = await carga;
  if (!Notifications) {
    return { granted: false, canAskAgain: false };
  }
  try {
    await crearCanalPrestamos(Notifications);
    await Notifications.requestPermissionsAsync();
  } catch {
    // Si el pedido falla, igual se consulta el estado real.
  }
  return consultarNotificaciones();
}

// Programa el recordatorio (modo demostración) y devuelve su identificador.
export async function programarRecordatorio(titulo: string): Promise<string | null> {
  const Notifications = await carga;
  if (!Notifications) {
    return null;
  }
  try {
    await crearCanalPrestamos(Notifications);
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Devolución de libro',
        body: `Recordá devolver "${titulo}" a la biblioteca.`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: SEGUNDOS_RECORDATORIO_DEMO,
        channelId: CANAL_PRESTAMOS,
      },
    });
  } catch {
    return null;
  }
}

export async function cancelarRecordatorio(identificador: string): Promise<void> {
  const Notifications = await carga;
  if (!Notifications) {
    return;
  }
  try {
    await Notifications.cancelScheduledNotificationAsync(identificador);
  } catch {
    // Si la notificación ya no existe, no hay nada que cancelar.
  }
}

// Notificación inmediata: el trigger solo indica el canal de Android.
export async function enviarNotificacionInmediata(titulo: string): Promise<boolean> {
  const Notifications = await carga;
  if (!Notifications) {
    return false;
  }
  try {
    await crearCanalPrestamos(Notifications);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Tu libro está listo',
        body: `Ya podés retirar "${titulo}" en el mostrador.`,
      },
      trigger: { channelId: CANAL_PRESTAMOS },
    });
    return true;
  } catch {
    return false;
  }
}
