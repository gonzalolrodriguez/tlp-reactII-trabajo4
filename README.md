# Biblioteca IPF

App móvil de la biblioteca del Instituto Politécnico Formosa (Trabajo Práctico N° 4, Taller Complementario React Native II). Permite consultar el catálogo, buscar por título o autor, escanear el código de barras (ISBN) de un libro con la cámara, reservar (préstamo por 7 días o lista de espera) y recibir un recordatorio de devolución con una notificación local. El personal ingresa por un login y atiende la lista de espera desde el mostrador.

- Versión del SDK de Expo: **SDK 58** (`expo ~58.0.26`, `expo-router ~58.0.32`, `react-native 0.88.1`, `react 19.3.0`).
- Módulos nativos: solo `expo-camera` y `expo-notifications`.
- Lenguaje: TypeScript con rutas tipadas (`typedRoutes`).

## Cómo ejecutar el proyecto

```bash
npm install
npx expo start
```

1. Instalá **Expo Go** en el teléfono (Android o iOS).
2. Conectá el teléfono y la computadora a la **misma red Wi-Fi**.
3. Escaneá el código QR que muestra `npx expo start` (con la cámara en iOS, desde Expo Go en Android).

Otros comandos:

```bash
npx jest             # pruebas unitarias de Pila y Cola
npx expo lint        # lint
npx tsc --noEmit     # chequeo de tipos
```

Credenciales y libros para probar:

| Dato | Valor |
|---|---|
| Usuario del personal | `bibliotecario` |
| Clave del personal | `ipf2025` |
| Libro real 1 para el escáner | Harry Potter y la piedra filosofal, ISBN `9788478884452` (3 ejemplares) |
| Libro real 2 para el escáner | Ficciones, ISBN `9788499089508` (2 ejemplares) |

Los usuarios y la clave están fijos en `src/constants/config.ts`. El código de barras de la contratapa de esos libros se puede escanear también desde la pantalla de una PC (buscando la imagen del código de barras del ISBN y mostrándola en el monitor). Los libros `El Aleph`, `1984` y `Pedro Páramo` tienen 0 ejemplares y personas en lista de espera, para probar la reserva sin ejemplares y el mostrador.

## Estructura de `src/`

```
src/
  app/            solo rutas (cada archivo reexporta una pantalla de components/)
  components/     pantallas y componentes (uno por archivo, con nombre que dice qué hace)
  hooks/          useLibros, useBuscarLibros, usePermiso, useRecordatorio, useRevisarAlVolver
  lib/            lógica: api simulada, permisos y notificaciones, préstamos, ISBN, copias de colecciones
  data/           libros.ts (17 libros) y esperasIniciales.ts
  types/          Libro, Prestamo, Aviso, tipos de permisos
  context/        BibliotecaContext.tsx (préstamos, esperas, recientes, avisos y sesión)
  estructuras/    Pila.ts y Cola.ts (con campos privados #items) y sus pruebas
  constants/      tema.ts (colores, espaciado, tamaños) y config.ts (valores fijos)
```

### Árbol de `src/app` y navegador de cada `_layout`

```
src/app/
├── _layout.tsx                    Stack raíz (a través de NavegacionRaiz), con el Context como provider
│                                  unstable_settings.anchor = '(tabs)'
├── (tabs)/
│   ├── _layout.tsx                Tabs (expo-router/js-tabs): "Catálogo" y "Mis reservas"
│   ├── (catalogo)/
│   │   ├── _layout.tsx            Stack propio de la tab Catálogo
│   │   ├── index.tsx              /                   Catálogo
│   │   └── libro/[isbn].tsx       /libro/[isbn]       Detalle (dentro de la tab)
│   └── reservas.tsx               /reservas           Mis reservas (tab)
├── buscar.tsx                     /buscar?q=          Stack raíz
├── escanear.tsx                   /escanear           Stack raíz
├── reservar/[isbn].tsx            /reservar/[isbn]    Stack raíz, presentation: "modal"
├── permisos/[recurso].tsx         /permisos/[recurso] Stack raíz, presentation: "modal"
├── login.tsx                      /login              Stack raíz, modal, dentro de Stack.Protected guard={!sesion}
├── mostrador.tsx                  /mostrador          Stack raíz, dentro de Stack.Protected guard={sesion}
├── reserva.tsx                    /reserva            <Redirect href="/reservas" />
└── +not-found.tsx                 cualquier otra URL  Pantalla 404
```

| `_layout` | Navegador | Qué define |
|---|---|---|
| `src/app/_layout.tsx` | Stack raíz | Envuelve todo con `ProveedorBiblioteca` y renderiza `NavegacionRaiz`. Define el `anchor: '(tabs)'` para que un deep link a `/buscar` deje las pestañas debajo en la pila. |
| `src/components/NavegacionRaiz.tsx` (lo usa el layout raíz) | Stack | `(tabs)` sin header, `buscar`, `escanear`, `reservar/[isbn]` y `permisos/[recurso]` como modales, y `Stack.Protected` para `login` (solo sin sesión) y `mostrador` (solo con sesión). Está en un componente aparte porque el guard lee la sesión del Context, que tiene que estar por encima. |
| `src/app/(tabs)/_layout.tsx` | Tabs (`expo-router/js-tabs`) | Pestañas "Catálogo" (`(catalogo)`) y "Mis reservas" (`reservas`) con íconos de `@expo/vector-icons`. |
| `src/app/(tabs)/(catalogo)/_layout.tsx` | Stack de la tab | `index` (con el link "Personal" en el header) y `libro/[isbn]`. |

## Bloque `plugins` de `app.json`

```jsonc
"plugins": [
  // Habilita Expo Router (el sistema de rutas por carpetas dentro de src/app).
  "expo-router",
  [
    // Pantalla de inicio (splash) del proyecto base.
    "expo-splash-screen",
    {
      "backgroundColor": "#208AEF",              // color de fondo del splash
      "image": "./assets/images/splash-icon.png", // imagen centrada
      "imageWidth": 76                            // ancho de la imagen en dp
    }
  ],
  [
    // Cámara: la usa el escáner de ISBN (EAN-13).
    "expo-camera",
    {
      // Texto de propósito (iOS: NSCameraUsageDescription). Sigue el molde
      // "Usamos tu [dato] para [beneficio concreto]".
      "cameraPermission": "Usamos tu cámara para leer el código de barras del libro y abrir su ficha sin escribir el ISBN.",
      // La app no graba audio ni video: no se declara NSMicrophoneUsageDescription en iOS.
      "microphonePermission": false,
      // Evita que el plugin agregue android.permission.RECORD_AUDIO (mínimo privilegio).
      "recordAudioAndroid": false
    }
  ],
  // Notificaciones locales del recordatorio de devolución. Sin opciones: la app
  // no usa íconos ni sonidos personalizados.
  "expo-notifications"
]
```

Además, `app.json` define `"scheme": "bibliotecaipf"` (para los deep links) y `experiments.typedRoutes` (rutas tipadas).

## Permisos

| Recurso | Módulo | Cuándo se pide | Alternativa si se niega |
|---|---|---|---|
| Cámara | `expo-camera` (`useCameraPermissions`, dentro de `usePermiso`) | Al entrar a `/escanear` con el permiso sin decidir se abre la pantalla previa `/permisos/camara` (beneficio en una frase y un botón "Continuar"). El diálogo del sistema aparece recién al tocar "Continuar". | La persona escribe el ISBN a mano (siempre disponible en `/escanear`). Si está bloqueado, se muestra el camino de Ajustes y el botón "Abrir Ajustes". |
| Notificaciones | `expo-notifications` | Solo al activar el interruptor "Recordarme" de un préstamo en `/reservas`. Primero la pantalla previa `/permisos/notificaciones`; en Android el canal `prestamos` se crea antes de pedir el permiso. | Los avisos se muestran dentro de la app, en la pestaña "Mis reservas". |

La app no pide ningún otro permiso (no instala `expo-location` ni `expo-image-picker`).

## Justificación de `blockedPermissions`

```json
"blockedPermissions": [
  "android.permission.RECORD_AUDIO",
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE"
]
```

Salida de `npx expo config --type introspect` (sección `android`):

```
android: {
  blockedPermissions: [
    'android.permission.RECORD_AUDIO',
    'android.permission.READ_EXTERNAL_STORAGE',
    'android.permission.WRITE_EXTERNAL_STORAGE'
  ],
  permissions: [
    'android.permission.CAMERA',
    'android.permission.INTERNET'
  ],
  ...
}
```

Los permisos finales que declara la configuración son `CAMERA` (la usa el escáner) e `INTERNET` (la agrega Expo por defecto; la necesita el servidor de desarrollo). Además, los manifiestos de las librerías suman al compilar `POST_NOTIFICATIONS` y `RECEIVE_BOOT_COMPLETED` (los dos están en `node_modules/expo-notifications/android/src/main/AndroidManifest.xml`), necesarios para el recordatorio.

Por qué se bloquea cada uno:

- `RECORD_AUDIO`: la app solo lee códigos de barras, no graba video ni audio. `expo-camera` lo agrega por defecto, por eso se pone `recordAudioAndroid: false` (el plugin deja de pedirlo, ver `node_modules/expo-camera/plugin/build/withCamera.js`) y `microphonePermission: false` (en iOS no se escribe `NSMicrophoneUsageDescription`). Está también en `blockedPermissions` como red de seguridad: si otro módulo lo agregara, se quita del manifiesto final.
- `READ_EXTERNAL_STORAGE` y `WRITE_EXTERNAL_STORAGE`: la app no lee ni guarda archivos del usuario ni usa la galería. Son permisos que el manifiesto base de Expo o algunas librerías suman por defecto; bloquearlos cumple el mínimo privilegio.

## Deep links de prueba

Esquema: `bibliotecaipf://`. En Expo Go el esquema propio no está registrado, así que se usa el equivalente `exp://IP:8081/--/...` (con la IP que muestra `npx expo start`).

| Link | Equivalente en Expo Go | Qué debe pasar |
|---|---|---|
| `bibliotecaipf://libro/9788478884452` | `exp://IP:8081/--/libro/9788478884452` | Detalle de Harry Potter. |
| `bibliotecaipf://libro/123` | `exp://IP:8081/--/libro/123` | Mensaje "El ISBN no es válido" con link al Catálogo. |
| `bibliotecaipf://buscar?q=borges` | `exp://IP:8081/--/buscar?q=borges` | Buscador con "borges" escrito y sus resultados; las pestañas quedan debajo. |
| `bibliotecaipf://mostrador` | `exp://IP:8081/--/mostrador` | Sin sesión no existe: redirige al Catálogo. Con sesión abre el mostrador. |
| `bibliotecaipf://reserva` | `exp://IP:8081/--/reserva` | `<Redirect>` a `/reservas` (Mis reservas). |
| `bibliotecaipf://escanear` | `exp://IP:8081/--/escanear` | Escáner (según el permiso de cámara). |

En un teléfono Android con una build de desarrollo también se puede probar con `npx uri-scheme open bibliotecaipf://libro/9788478884452 --android`.

## Desafíos opcionales realizados

- **Debounce de 300 ms** en el buscador, con limpieza del temporizador (`src/hooks/useBuscarLibros.ts`, constante `MILISEGUNDOS_DEBOUNCE` en `src/constants/config.ts`).
- **Pruebas unitarias** de `Pila` y `Cola` con `jest-expo` (13 casos, incluido desencolar una cola vacía): `src/estructuras/Pila.test.ts` y `src/estructuras/Cola.test.ts`. Se ejecutan con `npx jest`.

No se hicieron: persistencia con AsyncStorage, modo oscuro ni la captura de la development build.

## Capturas

Las capturas están en la carpeta `capturas/`. Se tomaron de la app real corriendo en el navegador (`npx expo start`, versión web) con tamaño de pantalla de celular (390 × 844), no en un teléfono. Por eso el estilo del header y de las pestañas puede verse un poco distinto al de Android o iOS.

| Lo que pide el TP (F2.4) | Archivo |
|---|---|
| Catálogo cargando | `capturas/01-catalogo-cargando.png` |
| Catálogo con error | `capturas/02-catalogo-error.png` |
| Catálogo con datos | `capturas/03-catalogo-datos.png` |
| Buscador | `capturas/04-buscador.png` |
| Detalle inexistente (`/libro/123`) | `capturas/05-detalle-inexistente.png` |
| Detalle de un libro (título en el header) | `capturas/06-detalle.png` |
| Reserva con ejemplares | `capturas/07-reserva-con-ejemplares.png` y `capturas/08-mis-reservas-prestamo.png` |
| Reserva sin ejemplares (lista de espera) | `capturas/09-reserva-sin-ejemplares.png` y `capturas/10-mis-reservas-espera.png` |
| Login con clave incorrecta | `capturas/11-login-clave-incorrecta.png` |
| Mostrador antes de "Entregar al siguiente" | `capturas/12-mostrador-antes.png` |
| Mostrador después de "Entregar al siguiente" (El Aleph: de Marcos a Lucía) | `capturas/13-mostrador-despues.png` |
| Escáner: pantalla previa al permiso (estado preguntable) | `capturas/14-escaner-pantalla-previa.png` |
| Pantalla 404 | `capturas/15-pantalla-404.png` |
| Escáner: cargando | `capturas/16-escaner-cargando.png` |
| Escáner: permiso concedido (cámara abierta) | `capturas/17-escaner-concedido.png` |
| Escáner: permiso bloqueado (botón "Abrir Ajustes") | `capturas/18-escaner-bloqueado.png` |
| Notificación recibida | `capturas/19-notificacion-recibida.png` |

## Salida de `npx expo lint` y `npx tsc --noEmit`

`npx expo lint` (código de salida 0, sin errores ni advertencias):

```
npm notice run biblioteca-ipf@1.0.0 npx
npm notice run expo lint
npm warn install-scripts .npmrc allow-scripts setting is being ignored because --allow-scripts was passed on the command line
npm notice run biblioteca-ipf@1.0.0 npx
npm notice run eslint C:\Users\lehen\Desktop\tlp-reactII-trabajo4\src --fix=false --cache=true --cache-location=C:\Users\lehen\Desktop\tlp-reactII-trabajo4\.expo\cache\eslint\
```

`npx tsc --noEmit` (código de salida 0, sin errores):

```
npm notice run biblioteca-ipf@1.0.0 npx
npm notice run tsc --noEmit
```
