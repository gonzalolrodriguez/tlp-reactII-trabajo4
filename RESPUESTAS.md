# Respuestas - TP 4 "Biblioteca IPF"

Todas las respuestas se refieren a mi app. Cito el código como `archivo:Lxx-Lyy` (líneas del repositorio). Las frases marcadas con `[CONFIRMAR EN EL TELÉFONO]` son comportamientos que razoné a partir del código y de la documentación, pero que hay que observar en el dispositivo.

---

# Parte B - Estado, efectos y renderizado

## B1. El ciclo de vida de `useLibros`

El hook está en `src/hooks/useLibros.ts:L13-L50` y lo usa `src/components/PantallaCatalogo.tsx:L12`. Tiene cuatro estados: `libros`, `cargando` (empieza en `true`), `error` e `intento` (`L14-L18`).

**a) Render por render**

Caso feliz (el pedido tiene éxito):

| Render | Qué lo provoca | `libros` | `cargando` | `error` | Qué se ve |
|---|---|---|---|---|---|
| 1 | Montaje del Catálogo | `[]` | `true` | `null` | "Cargando el catálogo..." (`PantallaCatalogo.tsx:L16-L17`). Después del render corre el efecto (`useLibros.ts:L20`) y llama a `obtenerLibros()`. |
| 2 | A los 800 ms resuelve la promesa: `setLibros(datos)` y `setCargando(false)` (`L26-L27`). React 18+ agrupa las dos actualizaciones, así que es un solo render. | 17 libros | `false` | `null` | La lista de `TarjetaLibro`. |

En total son 2 renders de `PantallaCatalogo` (sin contar los renders de los hijos por cambios del Context).

Caso con falla (1 de cada 5 veces, `src/lib/api.ts:L11-L13`):

| Render | Qué lo provoca | `libros` | `cargando` | `error` | Qué se ve |
|---|---|---|---|---|---|
| 1 | Montaje | `[]` | `true` | `null` | "Cargando el catálogo..." |
| 2 | La promesa se rechaza: `setError(...)` y `setCargando(false)` (`L32-L33`) | `[]` | `false` | "No pudimos cargar el catálogo..." | `EstadoError` con el botón "Reintentar" (`PantallaCatalogo.tsx:L18-L19`). |

Cuando la persona toca "Reintentar" (`reintentar`, `useLibros.ts:L43-L47`):

| Render | Qué lo provoca | `libros` | `cargando` | `error` | `intento` |
|---|---|---|---|---|---|
| 3 | `setCargando(true)`, `setError(null)` y `setIntento(1)`, agrupados en un solo render | `[]` | `true` | `null` | 1 |
| 4 | Resuelve el nuevo pedido: igual que el render 2 si tiene éxito (17 libros, `cargando: false`), o con `error` otra vez si vuelve a fallar | 17 o `[]` | `false` | `null` o mensaje | 1 |

Entre el render 3 y el nuevo pedido, React ejecuta primero la limpieza del efecto anterior (`cancelado = true`, `L38-L40`) y recién después el efecto nuevo, porque cambió `intento`, que está en el array de dependencias (`L41`).

**b) ¿Se desmonta el Catálogo al ir a "Mis reservas"? ¿Y al abrir un detalle?**

Por la estructura de mi navegación, no en ninguno de los dos casos. Las tabs son `expo-router/js-tabs` (`src/app/(tabs)/_layout.tsx:L1`) y una pestaña ya visitada queda montada aunque se cambie de pestaña. El detalle se abre en el Stack de la propia tab (`src/app/(tabs)/(catalogo)/_layout.tsx:L7-L10`), y en un Stack la pantalla de abajo (`index`) queda montada debajo del detalle. Por lo tanto la limpieza de `useLibros` no se ejecuta en esos dos movimientos. `[CONFIRMAR EN EL TELÉFONO]` (con un `console.log` temporal dentro de la función de limpieza, `L38-L40`; no lo dejé en el código porque el TP prohíbe `console.log` en la entrega).

Las situaciones reales en las que sí se ejecuta la limpieza que escribí:

1. Cuando la persona toca "Reintentar": cambia `intento`, y la limpieza marca como vieja la respuesta del pedido anterior (si todavía estuviera en vuelo, se ignora).
2. Cuando el componente se desmonta de verdad (se cierra la app, o se recarga la app durante el desarrollo).

La limpieza tiene sentido de todos modos: el mismo patrón (`let cancelado = false` y `return () => { cancelado = true; }`) corre en cada tecla en el buscador (`src/hooks/useBuscarLibros.ts:L47-L51`), donde sí se ejecuta todo el tiempo.

**c) ¿Por qué no se puede pasar una función `async` directamente a `useEffect`?**

Porque `useEffect` espera que la función devuelva `undefined` o la función de limpieza. Una función `async` siempre devuelve una `Promise`, así que React recibe un objeto que no es una función y avisa del error; además la limpieza nunca se ejecutaría. Lo resolví con una función normal que encadena `.then(...).catch(...)` sobre `obtenerLibros()` y devuelve la limpieza (`useLibros.ts:L20-L41`). La otra forma es declarar una función `async` dentro del efecto y llamarla, sin devolverla.

**d) ¿Cómo implementé `reintentar`?**

`reintentar` (`useLibros.ts:L43-L47`) vuelve a poner `cargando` en `true`, borra el `error` y suma 1 al contador `intento`. Ese contador está en el array de dependencias del efecto (`L41`), así que al cambiar, React ejecuta la limpieza del efecto anterior y vuelve a correr el efecto, que repite `obtenerLibros()`.

Uso `intento` y no `libros`, `cargando` o `error` porque el efecto no lee ninguno de esos valores y, además, los modifica: si dependiera de `cargando`, el propio `setCargando(false)` del resultado volvería a disparar el efecto y se armaría un bucle de pedidos. `intento` solo cambia por una acción explícita de la persona, así que repite el pedido únicamente cuando hace falta.

## B2. La condición de carrera del buscador

El buscador está en `src/hooks/useBuscarLibros.ts` y la pantalla en `src/components/PantallaBuscar.tsx`. Mi código tiene dos defensas: un debounce de 300 ms (`useBuscarLibros.ts:L33-L45`) y una limpieza que marca como vieja la búsqueda en curso (`L31` y `L47-L51`). Además muestra solo la respuesta cuya `consulta` coincide con el texto actual (`L59`).

| Momento | Qué pasa | Sin limpieza: qué se ve | Con mi código: qué se ve |
|---|---|---|---|
| t = 0 ms | Escribe "bor" -> se pide `buscarLibros("bor")`, que tarda 1.400 ms. | La caja muestra "bor" y todavía no hay resultados (indicador de carga o lista vacía). | La caja muestra "bor" (viene de la URL) y la lista muestra "Buscando..." (`cargando = texto !== '' && actual === null`, `L63`). Todavía no se hizo ningún pedido: el temporizador espera 300 ms. |
| t = 200 ms | Escribe "borges" -> se pide `buscarLibros("borges")`, que tarda 300 ms. | La caja muestra "borges". Hay dos pedidos en vuelo y siguen sin resultados. | La caja muestra "borges". Al cambiar `texto`, la limpieza del efecto anterior hizo `clearTimeout` y `obsoleta = true`: el pedido de "bor" nunca salió. Sigue "Buscando...". |
| t = 500 ms | Llega la respuesta de "borges". | Aparecen los resultados de "borges". | Recién ahora se dispara el pedido de "borges" (200 ms + 300 ms de debounce), así que todavía "Buscando...". Los resultados aparecen cuando llega esa respuesta. |
| t = 1.400 ms | Llega la respuesta de "bor". | La lista se pisa con los resultados de "bor" mientras la caja y la URL dicen "borges". Queda así hasta la próxima tecla. | Los resultados de "borges" ya están en pantalla y nadie los pisa: no existe respuesta de "bor". Si ese pedido hubiera salido (por ejemplo, si la persona hubiera esperado más de 300 ms antes de seguir escribiendo), su `.then` encontraría `obsoleta === true` (`L36` y `L41`) y se descartaría; y aunque se guardara, `actual` la ignora porque su `consulta` no es "borges" (`L59`). |

La causa del problema sin limpieza es que las respuestas no llegan en el orden en que se pidieron (la demora de `buscarLibros` es aleatoria a propósito, `src/lib/api.ts:L18-L19`): gana la última que llega, no la última que se pidió.

**a) ¿Qué hace exactamente la limpieza y cuándo se ejecuta?**

La limpieza (`useBuscarLibros.ts:L47-L51`) hace dos cosas: `obsoleta = true`, que invalida el `.then` y el `.catch` de ese pedido porque ambos preguntan `if (!obsoleta)` antes de guardar nada (`L36`, `L41`); y `clearTimeout(temporizador)`, que cancela el pedido si todavía estaba esperando los 300 ms. Se ejecuta justo antes de que corra el efecto siguiente, es decir cada vez que cambian `texto` o `intento` (`L52`), y también cuando la pantalla se desmonta. Cada ejecución del efecto tiene su propia variable `obsoleta` (es una clausura), así que solo el pedido vigente puede escribir el estado.

**b) La propuesta del compañero: `.then((datos) => { if (texto === q) setResultados(datos) })`**

No es una solución confiable tal como está planteada, y depende de dónde viene `texto`:

- Una función dentro del efecto es una clausura: captura las variables del render en el que se creó. El `.then()` del pedido de "bor" "ve" `q = "bor"`, que es el valor de ese render, congelado. El de "borges" ve `q = "borges"`.
- Si `texto` es la variable local del efecto (por ejemplo, `q.trim()` calculada en ese mismo render), la condición `texto === q` compara el valor consigo mismo: siempre es `true`, no filtra nada y la condición de carrera sigue igual.
- Para que compare contra el valor actual hay que leer algo que no quede congelado en la clausura, por ejemplo un `useRef` que se actualice en cada render. Con eso funciona, pero es un parche manual (hay que mantener el ref sincronizado), no cancela el temporizador ni evita el pedido viejo, y no cubre el desmontaje.
- La forma que usé es la limpieza del efecto: como React corre la limpieza del render anterior antes del efecto siguiente, cada clausura tiene su propio `obsoleta` y solo el último pedido puede escribir el estado.

**c) Mientras la persona escribe, ¿qué pasa con la URL y con el botón atrás? ¿Qué cambiaría con `router.push`?**

En `PantallaBuscar.tsx:L17-L20` uso `router.setParams({ q: ... })`: reemplaza el parámetro `q` de la pantalla actual, así que la URL cambia (`/buscar?q=b`, `/buscar?q=bo`, ...) pero no se apila ninguna pantalla nueva. El botón atrás vuelve directo a la pantalla anterior (el Catálogo). El texto de la caja sale de la URL (`L13-L14` y `L36`), así que un deep link como `bibliotecaipf://buscar?q=borges` ya llega con la caja completa.

Con `router.push` cada letra apilaría una pantalla `/buscar` nueva: escribir "borges" dejaría 6 entradas en la pila, el botón atrás iría borrando letra por letra en lugar de salir de la búsqueda, y cada pantalla nueva se montaría desde cero (se perdería el foco del teclado).

## B3. Mutar o reemplazar

**a) La persona toca "Anotarme" tres veces: ¿qué muestra el texto?**

Muestra "Personas en espera: 0" y no cambia. Cada toque ejecuta `encolar`, que muta el objeto `Cola` por dentro (`#items` pasa a tener 1, 2, 3 elementos), pero nunca se llama a un setter. React solo vuelve a renderizar cuando cambia el estado mediante `setX` (o cambian las props o el Context). Mutar un objeto que React guarda no se lo avisa, así que no hay re-render, el JSX no se evalúa de nuevo y la pantalla queda con el último valor dibujado. El estado real ya vale 3, pero la pantalla no lo sabe.

**b) Después escribe en un `TextInput` controlado y el número "salta" a 3.**

Cada tecla ejecuta `setTexto(...)` y provoca un re-render. En ese render se vuelve a leer `espera.tamanio` sobre el mismo objeto (el inicializador de `useState` corre una sola vez y la instancia se conserva), que ya tenía 3 elementos. El texto aparece de golpe en 3. La pantalla muestra el valor correcto solo de casualidad, cuando otro cambio fuerza un render.

Un error que aparece "a veces" es peor que uno que aparece siempre porque: el que aparece siempre se detecta en la primera prueba; el intermitente depende de qué otros renders ocurran, así que puede no verse en desarrollo y fallar en producción; es difícil de reproducir y depurar (el dato "está bien", lo que falla es cuándo se refleja, y no hay ninguna excepción); y puede dar resultados distintos entre pantallas o dispositivos.

**c) Cómo lo resolví en mi Context y comparación con otras alternativas**

Nunca muto una `Pila` o una `Cola` que está en el estado. `src/lib/colecciones.ts:L4-L24` tiene `copiarCola`, `copiarPila` y `colaDesdeArray`: se arma una copia, se modifica la copia y se guarda la copia, que es un objeto nuevo y por lo tanto React la detecta:

```tsx
// src/context/BibliotecaContext.tsx:L133-L138 (reservar con lista de espera)
const nuevaCola = esperas[libro.isbn]
  ? copiarCola(esperas[libro.isbn])
  : colaDesdeArray<string>([]);
nuevaCola.encolar(USUARIO_ACTUAL);
setEsperas((anteriores) => ({ ...anteriores, [libro.isbn]: nuevaCola }));
return { tipo: 'espera', posicion: nuevaCola.tamanio };
```

Lo mismo hago en `entregarAlSiguiente` (`L199-L201`) y en `registrarVisto` (`L99-L108`, que además devuelve el mismo estado si el libro ya está en el tope).

| Alternativa | Ventaja | Costo |
|---|---|---|
| Copia nueva de la estructura (la que usé) | Es explícita y fácil de razonar: cada cambio produce un objeto nuevo, los `useMemo`, `useCallback` y el compilador de React (`app.json:L53`, `reactCompiler: true`) funcionan bien porque asumen datos inmutables. | Hay que copiar en cada operación (costo O(n)), que en este tamaño (listas de unas pocas personas) es irrelevante, y hay que acordarse de usar siempre la copia. |
| Contador de versión (mutar el objeto y hacer `setVersion(v => v + 1)`) | Es barato: no copia nada. | Los componentes que dependan del objeto por referencia (props, `useMemo`, el compilador) no se enteran del cambio; el objeto sigue siendo "el mismo" y se pueden mostrar datos viejos. Es el mismo error de B3 a) disfrazado. |
| `useReducer` | Centraliza todas las transiciones en un solo lugar y es fácil de probar. | Igual hay que devolver un estado nuevo (copiar), y agrega código (acciones y reducer) para una app de este tamaño. |

## B4. ¿Dónde vive cada dato?

| Dato | Dónde vive en mi app | Por qué ahí y no en otro lugar |
|---|---|---|
| Texto del buscador | En la URL, parámetro `q` (`PantallaBuscar.tsx:L13-L14`, `L19`). | Así un deep link (`/buscar?q=borges`) funciona, el atrás no se llena de pantallas y no hay un estado local duplicado de lo que dice la URL. No tiene sentido en el Context: solo lo usa esta pantalla. |
| Préstamos y reservas | Context, estado `prestamos` (`BibliotecaContext.tsx:L64`). | Lo leen y modifican pantallas distintas (Catálogo, Detalle, Reservar, Mis reservas, Mostrador). Si fuera estado local de una pantalla se perdería al navegar. |
| Listas de espera | Context, estado `esperas`: un `Record<isbn, Cola<string>>` (`L65-L67`), inicializado desde `src/data/esperasIniciales.ts`. | Las lee el detalle, `/reservas` y las modifica la persona (al reservar) y el personal (al entregar al siguiente): es compartido entre pantallas. |
| Vistos recientemente | Context, estado `recientes`: una `Pila<string>` (`L68`). | Se escribe desde el detalle (`registrarVisto`) y se lee en el Catálogo: dos pantallas distintas. |
| Sesión del personal | Context, estado `sesion` (`L70`). | La leen `NavegacionRaiz` (para `Stack.Protected`, `src/components/NavegacionRaiz.tsx:L16-L24`) y `EnlacePersonal`; tiene que estar por encima del navegador. |
| Ejemplares disponibles de un libro | Se calcula: `calcularDisponibles` (`src/lib/prestamos.ts:L7-L14`) = `ejemplares` + ingresos por entrega - préstamos del libro. No se guarda. | Guardarlo duplicaría un dato que ya se deduce de los préstamos; ver E4 d). |
| Estado del permiso de cámara | Lo guarda el sistema operativo; la app lo consulta con `useCameraPermissions` dentro de `usePermiso` (`src/hooks/usePermiso.ts:L23-L25`) y lo vuelve a consultar al ganar foco y al volver de Ajustes (`L48-L56`). | El usuario puede cambiarlo desde Ajustes en cualquier momento; una copia propia quedaría vieja. Las notificaciones usan un estado local `respuestaNotificaciones` (`L26-L27`), pero es solo la última respuesta del sistema y se refresca en los mismos momentos. |
| Identificador de la notificación programada | Context, dentro de cada préstamo: campo `recordatorioId` (`src/types/prestamos.ts:L4`; se asigna en `BibliotecaContext.tsx:L171-L173`). | Su vida es la del préstamo: se cancela al devolver (`L185-L187`) o al apagar el interruptor, y el interruptor sale de ese mismo campo (`recordatorioId !== null`, `src/components/TarjetaPrestamo.tsx:L28`), así que hay una sola fuente de verdad. |

**Cuando cambia el `value` del Context, ¿qué componentes se vuelven a renderizar?**

Todos los que llaman a `useBiblioteca()` (por ejemplo `TarjetaLibro`, `VistosRecientes`, `EnlacePersonal`, `NavegacionRaiz`, `TarjetaPrestamo`), aunque solo usen una parte del valor: React compara el objeto `value` completo y no sabe qué campo usa cada consumidor. En mi provider, el `useMemo` del valor (`L238-L279`) solo evita renders cuando el provider se renderiza sin que cambie ningún estado.

**Si el Catálogo solo usa "recientes", ¿se re-renderiza al activar un recordatorio en otra pestaña?**

Sí. Activar el recordatorio hace `setPrestamos` (`L171-L173`), eso cambia `prestamos` y con él el `value` (los callbacks `obtenerDisponibles`, `tienePrestamo`, etc. dependen de `prestamos`). Como las pestañas siguen montadas, `VistosRecientes` y las `TarjetaLibro` del Catálogo se vuelven a renderizar aunque no se vean.

**¿Qué podría hacer para evitarlo y vale la pena en una app de este tamaño?**

Se podría dividir el Context en varios (uno para préstamos y esperas, otro para recientes, otro para sesión y avisos) o usar un selector (por ejemplo `use-context-selector` o una librería de estado como zustand). En esta app no vale la pena: son 17 libros, `FlatList` solo renderiza lo visible y cada render es barato; dividir el Context agrega archivos y complejidad. Primero mediría con el Profiler de React DevTools (o con "highlight updates") y solo lo dividiría si se viera un problema real.

---

# Parte C - Navegación y rutas

## C1. La pila en mi app

Navegadores: el Stack raíz (`src/components/NavegacionRaiz.tsx`), las Tabs (`src/app/(tabs)/_layout.tsx`) y el Stack de la tab Catálogo (`src/app/(tabs)/(catalogo)/_layout.tsx`). Las pilas se escriben de la base al tope.

| # | Acción | Pilas resultantes |
|---|---|---|
| 1 | Abre la app. | Stack raíz: `[(tabs)]`. Tabs: Catálogo activa (y Mis reservas sin abrir). Stack de la tab Catálogo: `[index]`. |
| 2 | Toca un libro del Catálogo. | Stack raíz: `[(tabs)]`. Stack de la tab Catálogo: `[index, libro/[isbn]]`. (El detalle se abre dentro de la tab, `TarjetaLibro.tsx:L17`.) |
| 3 | Toca "Reservar". | Stack raíz: `[(tabs), reservar/[isbn]]` (modal, `NavegacionRaiz.tsx:L14`). Stack de la tab Catálogo: sin cambios, `[index, libro/[isbn]]`. |
| 4 | Toca "Confirmar". | Stack raíz: `[(tabs)]` (el modal se cierra). Tabs: ahora la activa es "Mis reservas". Stack de la tab Catálogo: sigue `[index, libro/[isbn]]` (conserva su estado). |
| 5 | Toca atrás (Android). | Tabs: vuelve a la primera pestaña, Catálogo (el `backBehavior` por defecto de las tabs es `firstRoute`). Stack de la tab Catálogo: `[index, libro/[isbn]]`, así que se ve el detalle. La confirmación no vuelve: el modal ya no está en ninguna pila. |
| 6 | Toca la tab "Catálogo". | Es la tab ya activa. Con un Stack anidado, tocar la tab activa lleva al inicio de ese Stack, por lo que debería verse `[index]`, es decir la lista del Catálogo. |

**a) ¿Qué método usé en el paso 4?**

`router.dismissTo('/reservas')` (`src/components/PantallaReservar.tsx:L39`). Cierra el modal y navega a la pestaña `/reservas`.

- Con `push('/reservas')` el modal de confirmación seguiría en el Stack raíz y se apilaría encima otra pantalla de `/reservas` (`[(tabs), reservar, reservas]`): el atrás volvería a la confirmación, y se podría confirmar de nuevo.
- Con `replace('/reservas')` se reemplazaría el modal por la ruta de `/reservas`; la confirmación ya no existiría, pero se perdería la relación con las tabs que están debajo y podría quedar una copia de las pestañas, con comportamiento menos predecible.
- `dismissTo` va a la ruta pedida si ya está en la pila: descarta el modal, usa las tabs que ya estaban abajo y deja en foco "Mis reservas". Por eso lo elegí: "atrás" nunca regresa a la confirmación.

**b) En el paso 6, ¿qué pantalla ve la persona? ¿Me parece correcto?**

Según el comportamiento por defecto de React Navigation, ve el Catálogo (la lista), porque tocar la tab que ya está activa hace volver al inicio de su Stack. Me parece correcto para esta app: la persona recibe la lista, que es la pantalla principal de la tab, y no el detalle de un libro que acaba de reservar y ya terminó de mirar. Si el comportamiento fuera conservar el detalle, tampoco sería grave, pero prefiero mostrar el Catálogo.

## C2. El escáner que dispara de más

**a) ¿Qué pasaría si dentro de `onBarcodeScanned` llamara a `router.push` sin protección?**

`onBarcodeScanned` se dispara muchas veces por segundo mientras el código sigue frente a la cámara (`src/components/CamaraEscaner.tsx:L11` y `L18`). Cada llamada ejecutaría `router.push`, y cada `push` es una acción de navegación que React Navigation pone en cola y ejecuta en orden (como la cola de acciones del TP 2): ninguna se descarta. Resultado: se apilarían decenas de copias del detalle del mismo libro, la persona tendría que tocar atrás muchas veces para volver, y el detalle registraría el libro en "recientes" cada vez que se monta una copia.

**b) ¿Usé `useState` o `useRef`? ¿Por qué un `useState` en `true` no alcanza?**

Usé `useRef`: `yaNavegando` (`src/components/PantallaEscanear.tsx:L20`), que se revisa en `abrirLibro` (`L33-L35`) y se pone en `true` justo antes de navegar (`L44`). Con `useState`, `setYaNavegando(true)` no cambia el valor en el momento: React lo aplica en el siguiente render, y la función `onBarcodeScanned` que sigue ejecutándose ve el valor viejo (`false`) de su clausura. Los llamados que llegan antes de ese render pasarían la protección y harían navegar varias veces. Cambiar `ref.current` es inmediato y no espera un render, así que el segundo llamado ya ve el bloqueo. Además no hace falta volver a renderizar nada por ese valor.

**c) ¿Por qué conviene `replace` para ir del escáner al detalle?**

Uso `router.replace({ pathname: '/libro/[isbn]', params: { isbn } })` (`PantallaEscanear.tsx:L46`). El escáner no tiene sentido como pantalla a la que volver: con `replace` sale de la pila y "atrás" desde el detalle lleva a lo que estaba antes del escáner (el Catálogo). Con `push`, al tocar atrás la persona volvería al escáner con el código todavía enfrente, y como `yaNavegando` sigue en `true` (el componente se mantuvo montado), la cámara quedaría muerta: no podría escanear otro libro. Con `replace` el componente se desmonta y la marca desaparece con él.

**d) Si el ISBN leído no está en el catálogo, ¿qué hace mi app? ¿Cómo evito que el aviso aparezca diez veces?**

Muestra el aviso "El ISBN ... no está en el catálogo de la biblioteca." en pantalla y deja seguir escaneando (`PantallaEscanear.tsx:L36-L42`): no se pone `yaNavegando` en `true`. Para que el mismo aviso no se repita, guardo el último código desconocido en otro ref, `ultimoDesconocido` (`L21`): si el código leído es igual, no se vuelve a llamar a `setAviso` (`L38-L41`). Así, aunque la cámara lea el mismo código muchas veces por segundo, el aviso se muestra una sola vez y no hay renders de más.

## C3. Deep links y rutas protegidas

`[CONFIRMAR EN EL TELÉFONO]` (toda la tabla está razonada desde el código y la documentación de Expo Router; falta probarla en Expo Go con `exp://IP:8081/--/...`).

| Link | Qué ve la persona | Qué queda debajo en la pila | Qué parte de mi código lo decide |
|---|---|---|---|
| `bibliotecaipf://libro/` + un ISBN existente (ej. `9788478884452`) | El detalle del libro (título en el header, autor, año, ejemplares, lista de espera y "Reservar"). | Stack raíz: `[(tabs)]`; la tab activa es Catálogo y su Stack tiene solo el detalle (no definí un `anchor` en `(catalogo)/_layout.tsx`), así que no hay botón atrás hacia la lista. | La ruta `src/app/(tabs)/(catalogo)/libro/[isbn].tsx` y la pantalla `PantallaDetalleLibro.tsx:L12-L16` y `L25-L52`. El `anchor: '(tabs)'` de `src/app/_layout.tsx:L5-L7` deja las pestañas debajo. |
| `bibliotecaipf://libro/123` | El mensaje "El ISBN no es válido: tiene que tener 13 dígitos." con el link "Ir al Catálogo". | Igual que el anterior: `[(tabs)]` y el detalle como única pantalla del Stack de la tab. | `PantallaDetalleLibro.tsx:L25-L27` (usa `esIsbnValido`, `src/lib/libros.ts:L5-L9`) y `MensajeConEnlace.tsx`. |
| `bibliotecaipf://buscar?q=borges` | El buscador con "borges" escrito, "Buscando..." y luego los resultados (Ficciones y El Aleph). | Stack raíz: `[(tabs), buscar]`; abajo, las pestañas con el Catálogo (`[index]`). | `src/app/_layout.tsx:L5-L7` (`anchor: '(tabs)'`, para que las pestañas queden debajo) y `PantallaBuscar.tsx:L13-L15` (lee `q` con `useLocalSearchParams`). |
| `bibliotecaipf://mostrador` (sin sesión) | El Catálogo: la ruta no existe sin sesión, y Expo Router redirige a la ruta ancla. | Stack raíz: `[(tabs)]`. | `NavegacionRaiz.tsx:L22-L24` (`Stack.Protected guard={sesion}`) y el `anchor` del layout raíz. |
| `bibliotecaipf://reserva` | "Mis reservas" (la pestaña `/reservas`). | Stack raíz: `[(tabs)]` con la pestaña "Mis reservas" activa. | `src/app/reserva.tsx:L4-L6` (`<Redirect href="/reservas" />`). |
| `bibliotecaipf://escanear` (cámara bloqueada) | El escáner con el mensaje "La cámara está desactivada para la app. Podés activarla en ...", el botón "Abrir Ajustes" y la entrada de ISBN a mano. | Stack raíz: `[(tabs), escanear]`. | `PantallaEscanear.tsx:L64-L71` y `calcularEstado` (`src/lib/permisos.ts:L73-L81`: `granted: false` + `canAskAgain: false` es "bloqueado"). |

**¿Por qué el link `/libro/123` llega a mi pantalla de detalle aunque no exista un libro con ese ISBN?**

Porque el router solo compara la forma de la URL con el patrón de archivos: `libro/[isbn]` acepta cualquier valor en `[isbn]` (`"123"`, `"abc"`, etc.), así que la ruta existe y se abre la pantalla. El router no sabe qué libros hay. La responsabilidad de responder bien es de la pantalla: valida el parámetro antes de usarlo (`PantallaDetalleLibro.tsx:L15-L16`) y muestra un mensaje claro con una salida (`L25-L30`): "El ISBN no es válido..." si no son 13 dígitos, o "No encontramos ningún libro con ese ISBN..." si el formato es válido pero no está en el catálogo. La pantalla 404 (`+not-found`) es solo para URLs que no coinciden con ninguna ruta.

## C4. Foco, montaje y primer plano

**a) ¿Qué evento detecta cada herramienta?**

| Herramienta | Qué detecta |
|---|---|
| `useEffect(..., [])` | El **montaje** del componente (una vez, al crearse) y, con la función de retorno, su **desmontaje**. No sabe nada de foco ni de segundo plano. En una tab la pantalla se monta una vez y queda montada aunque se cambie de pestaña. |
| `useFocusEffect` | Que la **pantalla gana o pierde el foco dentro de la navegación**: se ejecuta cada vez que se vuelve a esa pantalla (cambio de tab, volver con atrás desde otra pantalla del stack) y su limpieza corre cuando pierde el foco. |
| `AppState` | Que **la app entera** pasa a primer plano (`active`) o a segundo plano (`background` o `inactive`). Es un evento del sistema operativo, no de la navegación. |

**b) ¿Cuál de las tres se entera?**

- *La persona sale a Ajustes, habilita las notificaciones y vuelve a la app:* solo se entera `AppState` (la app pasó de `background` a `active`). La pantalla nunca perdió el foco dentro de la navegación ni se desmontó, así que ni `useEffect([])` ni `useFocusEffect` se disparan.
- *Va a la pestaña Catálogo y vuelve a "Mis reservas":* se entera `useFocusEffect` (la pantalla perdió y recuperó el foco). `AppState` no cambia (la app siguió en primer plano) y `useEffect([])` tampoco corre, porque la pestaña no se desmontó.

**c) ¿Cuál o cuáles usé en mi app y por qué?**

Usé las dos que hacen falta, no solo una, dentro de `usePermiso` (`src/hooks/usePermiso.ts`):

```tsx
// src/hooks/usePermiso.ts:L48-L56
// Vuelve a consultar cada vez que la pantalla gana el foco...
useFocusEffect(
  useCallback(() => {
    consultar();
  }, [consultar]),
);

// ...y cuando la app vuelve de Ajustes (segundo plano -> activa).
useRevisarAlVolver(consultar);
```

`useRevisarAlVolver` (`src/hooks/useRevisarAlVolver.ts:L5-L19`) se suscribe a `AppState`, ejecuta `revisar()` cuando pasa de `inactive` o `background` a `active` y quita la suscripción en la limpieza. `EstadoNotificaciones` (la línea "Notificaciones: permitidas / no permitidas" de "Mis reservas", `src/components/EstadoNotificaciones.tsx:L9-L21`) usa ese hook, igual que el escáner (`PantallaEscanear.tsx:L15`).

Caso en que mi pantalla mostraría un estado viejo si usara solo una:

- Solo `useEffect([])` (o solo el montaje): la persona abre "Mis reservas" (dice "no permitidas"), sale a Ajustes, habilita las notificaciones y vuelve. La pestaña no se montó de nuevo ni recuperó el foco de navegación: seguiría diciendo "no permitidas" aunque el permiso ya está concedido.
- Solo `useFocusEffect`: tampoco se entera de lo que pasa al volver de Ajustes (la pantalla sigue en foco), así que mostraría lo mismo.
- Solo `AppState`: el estado se actualizaría al volver de Ajustes, pero no al cambiar de pestaña dentro de la app (por ejemplo, si la persona concede el permiso desde la pantalla previa, que es otra pantalla de la misma app y no cambia el `AppState`).
