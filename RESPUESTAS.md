# Respuestas - TP 4 "Biblioteca IPF"

Todas las respuestas se refieren a mi app. Cito el código como `archivo:Lxx-Lyy` (líneas del repositorio).

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

Por la estructura de mi navegación, no en ninguno de los dos casos. Las tabs son `expo-router/js-tabs` (`src/app/(tabs)/_layout.tsx:L1`) y una pestaña ya visitada queda montada aunque se cambie de pestaña. El detalle se abre en el Stack de la propia tab (`src/app/(tabs)/(catalogo)/_layout.tsx:L7-L10`), y en un Stack la pantalla de abajo (`index`) queda montada debajo del detalle. Por lo tanto la limpieza de `useLibros` no se ejecuta en esos dos movimientos.

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

---

# Parte D - Permisos en mi app

## D1. Recorrido completo de la cámara

Android 14, app recién instalada. El estado de la app sale de `calcularEstado` (`src/lib/permisos.ts:L73-L81`): `granted` -> "concedido"; si no, `canAskAgain` -> "preguntable"; si no, "bloqueado". Mientras no hay respuesta del sistema es "cargando".

| # | Acción | Qué muestra mi app | `status` | `canAskAgain` |
|---|---|---|---|---|
| 1 | Toca "Escanear" por primera vez. | Un instante "Revisando el permiso de la cámara..." (cargando) y enseguida el estado "preguntable": se abre la pantalla previa `/permisos/camara` (efecto en `PantallaEscanear.tsx:L25-L30`) con el beneficio en una frase, la alternativa y un único botón "Continuar". Todavía no apareció el diálogo del sistema. | `undetermined` | `true` |
| 2 | "Continuar" -> "No permitir". | Aparece el diálogo del sistema; al rechazarlo, `pedir()` devuelve el estado y la previa se cierra (`ContenidoPermiso.tsx:L22-L27`). Vuelve el escáner con el mensaje de beneficio y el botón "Continuar" (sigue "preguntable") más la entrada de ISBN a mano. | `denied` | `true` |
| 3 | Toca "Escanear" otra vez. | Se vuelve a abrir `/escanear` (es una pantalla nueva, así que la marca `previaMostrada`, `L22`, vuelve a empezar): pantalla previa con "Continuar". | `denied` | `true` |
| 4 | "Continuar" -> "No permitir". | Segundo rechazo: en Android 11 y posteriores, rechazar dos veces el mismo permiso equivale a "no volver a preguntar". El estado pasa a "bloqueado". | `denied` | `false` |
| 5 | Toca "Escanear" otra vez. | Estado "bloqueado": el escáner muestra "La cámara está desactivada para la app. Podés activarla en Ajustes > Aplicaciones > Biblioteca IPF > Permisos > Cámara. Mientras tanto, escribí el ISBN a mano." con el botón "Abrir Ajustes" y la entrada de ISBN (`PantallaEscanear.tsx:L64-L71`). No se vuelve a abrir la pantalla previa (el efecto solo la abre si es "preguntable"). | `denied` | `false` |
| 6 | "Abrir Ajustes" -> habilita la cámara -> vuelve a la app. | Al volver a primer plano, `useRevisarAlVolver` consulta de nuevo el permiso (`usePermiso.ts:L56`), el estado pasa a "concedido" y aparece la cámara (`CamaraEscaner`). | `granted` | `true` (ya no importa) |

**a) Repetir el recorrido en iOS**

En iOS el sistema solo muestra el diálogo una vez. El cambio es en el paso 2: al tocar "No permitir" por primera vez, el resultado ya es `status: denied` con `canAskAgain: false`, así que mi app pasa directamente a "bloqueado". En el paso 3 no hay pantalla previa con "Continuar": el escáner muestra el mensaje de la cámara desactivada con el botón "Abrir Ajustes" (el camino que se muestra es `Ajustes > Biblioteca IPF > Cámara`, `INFO_RECURSOS.camara.caminoIOS`, `permisos.ts:L50`, elegido por `obtenerCaminoAjustes`, `L66-L69`). Los pasos 4 y 5 son iguales al paso 3.

**b) La línea que decide entre "Continuar" y "Abrir Ajustes"**

```ts
// src/lib/permisos.ts:L80
return respuesta.canAskAgain ? 'preguntable' : 'bloqueado';
```

Usa el campo `canAskAgain` de la respuesta (después de descartar `granted`). Con `status` solo no alcanza porque "denegado" puede significar dos cosas distintas: `denied` con `canAskAgain: true` (el sistema todavía puede mostrar el diálogo: "Continuar") y `denied` con `canAskAgain: false` (el sistema ya no muestra el diálogo: hay que mandar a Ajustes). En los pasos 2 y 4 del recorrido `status` vale lo mismo (`denied`) y el comportamiento de la app tiene que ser distinto.

**c) En el paso 6, ¿qué parte de mi código se entera de que la persona volvió de Ajustes?**

`useRevisarAlVolver` (`src/hooks/useRevisarAlVolver.ts:L5-L19`), llamado desde `usePermiso` (`usePermiso.ts:L56`). Escucha `AppState`: cuando el estado pasa de `inactive` o `background` a `active` (`L10-L13`) ejecuta `consultar()`, que le pregunta de nuevo al sistema operativo (`usePermiso.ts:L29-L36`).

Si esa parte no existiera, la pantalla seguiría mostrando "bloqueado" con el botón "Abrir Ajustes" aunque el permiso ya estuviera concedido: al ir a Ajustes la pantalla no pierde el foco de navegación ni se desmonta, así que `useFocusEffect` (`usePermiso.ts:L49-L53`) no se vuelve a ejecutar. La persona tendría que salir y volver a entrar a `/escanear` para ver la cámara.

## D2. Notificaciones y consistencia

**a) La persona activa "Recordarme" y antes de los 15 segundos toca "Devolver". ¿Qué pasaría si no cancelara la notificación?**

La notificación ya está programada en el sistema operativo y llegaría igual a los 15 segundos: la persona recibiría un recordatorio de devolución ("Recordá devolver ... a la biblioteca.") de un libro que ya devolvió. En mi código `devolver` la cancela antes de quitar el préstamo (`BibliotecaContext.tsx:L185-L188`), llamando a `cancelarRecordatorio` (`src/lib/permisos.ts:L150-L160`, que usa `cancelScheduledNotificationAsync`). El interruptor "Recordarme" también la cancela al apagarse (`BibliotecaContext.tsx:L143-L155`).

**b) ¿Dónde guardo el identificador de la notificación? Si la app se cierra antes de que llegue, ¿qué pasa?**

Lo guardo en el préstamo, campo `recordatorioId` (`src/types/prestamos.ts:L4`), dentro del estado `prestamos` del Context (`BibliotecaContext.tsx:L64`, asignado en `L171-L173`). Ese estado vive solo en memoria.

Si la app se cierra antes de que llegue la notificación: el sistema operativo es quien la tiene programada, así que (en general) la notificación llega igual. Pero el identificador se perdió con el estado: al volver a abrir la app, `prestamos` está vacío y no hay manera de cancelar esa notificación. El problema es una inconsistencia: la persona recibe un recordatorio de un préstamo que la app ya no conoce, y no puede cancelarlo.

Cómo lo resolvería: guardar los préstamos (con su `recordatorioId`) en almacenamiento persistente, por ejemplo con `@react-native-async-storage/async-storage` (el desafío opcional de persistencia, que no hice), y al iniciar la app comparar con `getAllScheduledNotificationsAsync()` para cancelar las notificaciones que ya no tengan un préstamo asociado. En esta versión de la app, como todo el estado vive en memoria, es una limitación conocida.

**c) ¿Por qué en Android 13 o superior el canal se crea antes de pedir el permiso? ¿Qué cambia en Android 12?**

La documentación de Expo (`docs.expo.dev/versions/v58.0.0/sdk/notifications/`, sección de permisos) dice que desde Android 13 las personas deben aceptar recibir notificaciones mediante un diálogo de permiso, y que "This prompt will not appear until at least one notification channel is created" (ese diálogo no aparece hasta que se cree al menos un canal de notificaciones). Si pidiera el permiso sin canal, la persona nunca vería el diálogo del sistema y no podría decidir. Por eso, en mi código, `pedirNotificaciones` primero crea el canal `prestamos` y recién después pide el permiso:

```ts
// src/lib/permisos.ts:L117-L119 (el canal se crea en L101-L110)
try {
  await crearCanalPrestamos(Notifications);
  await Notifications.requestPermissionsAsync();
```

En Android 12 o anterior no existe ese permiso de ejecución: las notificaciones están permitidas por defecto y no hay ningún diálogo que pedir (el manifiesto de `expo-notifications` declara `POST_NOTIFICATIONS`, que solo se solicita en tiempo de ejecución desde Android 13). El orden entonces no cambia nada para el permiso. El canal igual hace falta para publicar notificaciones (desde Android 8), por eso también se asegura en `programarRecordatorio` y `enviarNotificacionInmediata` (`permisos.ts:L133` y `L169`).

**d) Si el permiso está denegado y te entregan un libro desde el mostrador, ¿cómo te enterás? ¿Ese código consulta el permiso en ese momento o usa un valor guardado?**

El código que decide está en `entregarAlSiguiente`:

```ts
// src/context/BibliotecaContext.tsx:L216-L221
// Se consulta el permiso en este momento: pudo cambiar desde Ajustes.
const permiso = await consultarNotificaciones();
if (permiso.granted && (await enviarNotificacionInmediata(libro.titulo))) {
  return;
}
agregarAviso(`Ya podés retirar "${libro.titulo}" en el mostrador. Lo ves en Mis reservas.`);
```

Si el permiso no está concedido (o el envío falla), `agregarAviso` guarda un aviso que se muestra dentro de la app, en la parte de arriba de "Mis reservas" (`EncabezadoReservas.tsx`, componente `AvisoEnApp`).

Consulta el permiso **en ese momento**: `consultarNotificaciones` le pregunta al sistema (`permisos.ts:L88-L99`, `getPermissionsAsync`) y no usa un valor guardado. Importa porque el permiso lo puede cambiar la persona desde Ajustes en cualquier momento: con un valor guardado que dijera "concedido" cuando ya no lo está, la app enviaría una notificación que el sistema no muestra y no avisaría dentro de la app, y la persona nunca se enteraría de que su libro está listo.

## D3. Lo que mi app pide y lo que no

| Plataforma | Permiso o clave declarada | Función de la app que lo justifica | ¿Quién lo agrega? |
|---|---|---|---|
| Android | `android.permission.CAMERA` | Escáner de ISBN (`CamaraEscaner`). | El plugin `expo-camera` (`withCamera.js:L44-L48`) y el manifiesto de la librería. |
| Android | `android.permission.POST_NOTIFICATIONS` | Recordatorio de devolución y aviso de libro listo; se pide en ejecución desde Android 13. | El manifiesto de la librería `expo-notifications`. |
| Android | `android.permission.RECEIVE_BOOT_COMPLETED` | Reprogramar las notificaciones después de reiniciar el teléfono. | El manifiesto de la librería `expo-notifications`. |
| Android | `android.permission.INTERNET` | Servidor de desarrollo de Expo (la API de la app es simulada y no usa red). | Expo por defecto (aparece en `npx expo config --type introspect`). |
| iOS | `NSCameraUsageDescription` | Escáner de ISBN. Texto: "Usamos tu cámara para leer el código de barras del libro y abrir su ficha sin escribir el ISBN." | El plugin `expo-camera`, con el texto de `app.json:L44`. |
| iOS | `aps-environment` (entitlement) | Lo agrega el plugin de notificaciones para soportar push; la app solo usa notificaciones locales. | El plugin `expo-notifications` (aparece en la configuración introspectada). |
| Ambas | No se declaran: micrófono, ubicación, galería | La app no los usa. | - |

Los permisos de Android salen del manifiesto compilado: la configuración de Expo muestra `CAMERA` e `INTERNET` y los manifiestos de las librerías suman los de `expo-notifications` al compilar (los leí en `node_modules`, no en una build).

**a) ¿Por qué mi app no declara `RECORD_AUDIO` aunque usa `expo-camera`?**

Porque `expo-camera` lo agrega por defecto (`recordAudioAndroid = true`, `node_modules/expo-camera/plugin/build/withCamera.js:L22` y `L47`) y yo lo desactivé: la app solo lee códigos de barras, no graba video. El fragmento de `app.json` que lo logra:

```jsonc
// app.json:L21-L25 (blockedPermissions) y L41-L48 (plugin expo-camera)
"blockedPermissions": [
  "android.permission.RECORD_AUDIO",
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE"
],
// ...
[
  "expo-camera",
  {
    "cameraPermission": "Usamos tu cámara para leer el código de barras del libro y abrir su ficha sin escribir el ISBN.",
    "microphonePermission": false,
    "recordAudioAndroid": false
  }
]
```

`recordAudioAndroid: false` evita que el plugin lo agregue, `microphonePermission: false` evita la clave de micrófono en iOS y `blockedPermissions` lo quita del manifiesto final si otro módulo lo sumara.

**b) "Elegir una foto de portada desde la galería": ¿qué paquete, qué permiso, y OTA o build nueva?**

- Paquete: `expo-image-picker` (`npx expo install expo-image-picker`), con `launchImageLibraryAsync`.
- Permiso: según la documentación del SDK 58 (`docs.expo.dev/versions/v58.0.0/sdk/imagepicker/`), "No permissions request is necessary for launching the image library": para elegir una foto no hace falta pedir permiso en ejecución, porque usa el selector del sistema y la app solo recibe la foto que la persona elige (mínimo privilegio). La excepción documentada es el video en iOS, que no es mi caso. La documentación también dice que el plugin agrega `RECORD_AUDIO` por defecto en Android (se desactiva con `microphonePermission: false`) y que `CAMERA`, `READ_EXTERNAL_STORAGE` y `WRITE_EXTERNAL_STORAGE` vienen del manifiesto de la librería, así que mantendría el `blockedPermissions` de mi `app.json` para lo que la app no necesita. En iOS se puede personalizar `photosPermission`.
- ¿OTA o build nueva? Hace falta **una build nueva**. `expo-image-picker` es un módulo nativo y su plugin modifica archivos nativos (`AndroidManifest.xml`, `Info.plist`). Una actualización OTA (`expo-updates`) solo reemplaza el JavaScript y los assets, no puede agregar código nativo ni cambiar el manifiesto: un `import` de un módulo nativo ausente fallaría en ejecución.

**c) ¿Qué partes de mi app no pude verificar del todo en Expo Go? ¿Por qué? ¿Cómo las verificaría?**

- El **texto de propósito** de la cámara y los **permisos finales** (`blockedPermissions`, `recordAudioAndroid`): Expo Go es una app ya compilada con su propio `Info.plist` y manifiesto, así que mi `app.json` no se aplica. Lo verificaría en una development build (`npx expo prebuild` y revisar `AndroidManifest.xml` e `Info.plist`, o `npx expo run:android` y `adb shell dumpsys package <paquete>` para ver los permisos) y comprobando que el diálogo de cámara muestra mi texto.
- El **canal de Android** y las **notificaciones**: en Expo Go para Android las notificaciones pueden no estar disponibles (por eso `src/lib/permisos.ts:L6-L29` carga `expo-notifications` dentro de un `try/catch`), así que el orden canal-permiso y el recordatorio a los 15 segundos solo se pueden comprobar del todo en una development build en Android 13 o superior.
- El **esquema propio** `bibliotecaipf://`: en Expo Go no está registrado, solo funciona la forma `exp://IP:8081/--/...`. Con la build de desarrollo se prueba con `npx uri-scheme open bibliotecaipf://... --android`.

---

# Parte E - Buenas prácticas y decisiones de diseño

## E1. Revisión de código

**a) Problemas de `src/app/(tabs)/index.tsx` del compañero**

| # | Línea | Problema | Clasificación | Por qué sucede | Cómo corregirlo |
|---|---|---|---|---|---|
| 1 | 18-20 | El `useEffect` no tiene array de dependencias: corre después de cada render. | Error de ejecución (bucle de pedidos) | `setLibros(datos)` cambia el estado -> re-render -> el efecto corre otra vez -> nuevo pedido (ver b). | Agregar `[]` (o las dependencias reales) y mover la carga a un hook como mi `useLibros` (`src/hooks/useLibros.ts:L13-L50`). |
| 2 | 19 | El pedido no tiene `.catch` y `obtenerLibros()` falla 1 de cada 5 veces. | Error de ejecución | La promesa rechazada queda sin manejar (*unhandled rejection*) y la lista queda vacía sin explicación. | Estado `error` con un mensaje claro y botón "Reintentar" (mi `PantallaCatalogo.tsx:L18-L19`). |
| 3 | 18-20 | Sin estados de carga, error ni vacío, y sin limpieza del efecto. | Mala práctica | Si el componente se desmonta antes de resolver, se actualiza estado de algo desmontado o llegan respuestas viejas; no hay indicador de carga. | Variable `cancelado` en la limpieza, `cargando`, `error` y `ListEmptyComponent` (como en `useLibros.ts:L20-L41`). |
| 4 | 13-16 | Pide permiso de cámara y de notificaciones al montar, sin contexto ni acción de la persona. | Mala práctica (experiencia y revisión de tienda) | El efecto dispara dos diálogos del sistema apenas se abre el Catálogo, sin explicar para qué. | Pedir cada permiso solo cuando se necesita: la cámara al entrar a `/escanear` con pantalla previa, las notificaciones al activar "Recordarme" (como en `usePermiso`). |
| 5 | 15 y 6 | `Notifications.requestPermissionsAsync()` se llama sin crear antes el canal de Android y el import de `expo-notifications` es estático. | Error de ejecución en Android 13+ y en Expo Go (según la versión) | Sin canal, el diálogo de Android 13+ no aparece (ver D2 c); y en Expo Go para Android, importar el módulo puede romper la app. | Crear el canal antes de pedir y cargar el módulo con `import()` dentro de `try/catch` (`src/lib/permisos.ts:L6-L29` y `L112-L124`). |
| 6 | 14-15 | `pedirPermiso` falta en el array de dependencias (el `[]` está incompleto) y no se manejan las promesas de los dos pedidos. | Advertencia (`react-hooks/exhaustive-deps`) | El linter exige declarar todo valor reactivo que usa el efecto; las promesas rechazadas no se manejan. | Quitar el efecto (punto 4) o declarar las dependencias y manejar errores. |
| 7 | 11 | `permiso` se declara y no se usa. | Advertencia (lint) | Código sin usar que genera ruido en `npx expo lint`. | Eliminarlo. |
| 8 | 22 | `libro: any`. | Mala práctica | `any` desactiva el chequeo de tipos: un error como `libro.titlo` no se detecta al compilar. | Tipar con `Libro` de `src/types/index.ts`. |
| 9 | 22-30 | El componente `Fila` está declarado dentro de `Catalogo`. | Rendimiento u optimización (y mala práctica) | En cada render se crea una función nueva: para React es un tipo de componente distinto, así que desmonta y vuelve a montar todas las filas y pierde su estado. | Moverlo a su propio archivo a nivel de módulo (mi `src/components/TarjetaLibro.tsx`). |
| 10 | 33-36 | `ScrollView` con `map` y `key={i}` (el índice). | Rendimiento u optimización / mala práctica | `ScrollView` monta todos los elementos a la vez (no virtualiza) y el índice como `key` hace que React reutilice mal los nodos si la lista cambia de orden o se filtra. | `FlatList` con `keyExtractor={(l) => l.isbn}` (`PantallaCatalogo.tsx:L23-L30`). |
| 11 | 37-39 | `Pressable` con solo un ícono, sin `accessibilityRole` ni `accessibilityLabel`, y área táctil de unos 28 px. | Mala práctica (accesibilidad) | Un lector de pantalla no sabe qué es ni qué hace, y el área táctil es menor a 44 x 44. | `accessibilityRole="button"`, `accessibilityLabel="Escanear código de barras"` y área mínima de 44 (`TAMANIOS.areaTactil`, `src/constants/tema.ts:L33`). |
| 12 | 25 | Estilos en línea y valores fijos (`fontSize: 16`, `color: '#333'`, `padding: 12`). | Mala práctica | Se crea un objeto nuevo por render y los valores quedan repetidos y fuera del tema. | `StyleSheet.create` y constantes de `src/constants/tema.ts`. |
| 13 | 24 y 37 | Rutas armadas con strings (`'/libro/' + libro.isbn`) y `router.push` directo. | Mala práctica | Se pierde el chequeo de las rutas tipadas: un error de tipeo no se detecta al compilar. | `href={{ pathname: '/libro/[isbn]', params: { isbn } }}` con rutas tipadas (`TarjetaLibro.tsx:L17`). |
| 14 | 9-42 | Toda la pantalla (lógica, componentes y estilos) está dentro de `src/app`. | Mala práctica (estructura) | `src/app` debería tener solo rutas; mezclar todo en un archivo impide reutilizar y probar. | El archivo de ruta solo reexporta la pantalla (`src/app/(tabs)/(catalogo)/index.tsx:L1`). |

**b) El efecto de las líneas 18-20 no tiene array de dependencias. ¿Qué pasa durante el primer minuto? ¿Cambiaría algo si `obtenerLibros()` devolviera siempre el mismo array?**

`obtenerLibros()` espera 800 ms y devuelve `LIBROS.map((l) => ({ ...l }))` (`src/lib/api.ts:L9-L15`): un array nuevo, con objetos nuevos, en cada llamada. Con el array de dependencias omitido, el efecto corre después de cada render.

1. **t = 0:** primer render con `libros = []`. Corren los dos efectos; el segundo llama a `obtenerLibros()` (pedido 1).
2. **t ~ 0,8 s:** el pedido 1 resuelve con un array nuevo. `setLibros(datos)`: como `Object.is(nuevo, anterior)` es `false`, React programa un render.
3. **Render con datos:** se dibuja la lista y, como el efecto no tiene dependencias, **vuelve a ejecutarse**: pedido 2.
4. **t ~ 1,6 s:** el pedido 2 resuelve con otro array nuevo (referencia distinta): otro render, otro efecto, pedido 3.
5. El ciclo se repite cada ~0,8 s. Si no hubiera fallas serían unos 70 a 75 pedidos en el minuto, cada uno con un render de toda la lista (y con `Fila` reconstruyéndose, punto 9): consumo de datos, batería y CPU, y una lista que parpadea sin estado estable.
6. **Las fallas aleatorias cortan el bucle:** en cada pedido hay un 20 % de probabilidad de que `obtenerLibros()` lance un error. Como no hay `.catch`, esa promesa rechazada no llama a `setLibros`, por lo tanto no hay render nuevo y no se agenda otro efecto. El bucle se detiene silenciosamente (con un aviso de *unhandled rejection* en la consola) y dura en promedio unos 5 ciclos (~4 s); que llegue a durar un minuto entero es prácticamente imposible (0,8^75). Pero cualquier otro render (por ejemplo, un cambio de estado de `useCameraPermissions` cuando la persona responde el diálogo) lo reinicia, así que el comportamiento es intermitente y difícil de depurar.

**¿Cambiaría algo si siempre devolviera el mismo array?** Sí: el bucle desaparecería. React compara el estado nuevo con el anterior con `Object.is`; si la referencia es la misma, `setLibros` se descarta (*bail out*) y no se agenda un render nuevo (React puede evaluar el componente una vez más antes de descartarlo, pero no sigue con los hijos ni con los efectos). Sin render nuevo, el efecto no corre otra vez: un pedido, un render con datos y fin. El código seguiría estando mal (falta el array de dependencias y depende de un detalle de la API para no romperse): por eso una API real, que "trae objetos nuevos" como dice el comentario de `api.ts:L8`, lo expone.

**c) La pantalla reescrita con mis hooks, componentes y constantes**

Es la que tengo en la app: la ruta solo reexporta la pantalla, y la pantalla usa `useLibros`, `FlatList` con `keyExtractor` estable, los componentes de estado, `TarjetaLibro` (a nivel de módulo, con `Link` a una ruta tipada) y `AccesosRapidos` con botones accesibles; los permisos se piden solo cuando hacen falta (en `/escanear` y al activar "Recordarme").

```tsx
// src/app/(tabs)/(catalogo)/index.tsx
export { default } from '@/components/PantallaCatalogo';
```

```tsx
// src/components/PantallaCatalogo.tsx
import { FlatList, StyleSheet } from 'react-native';

import EncabezadoCatalogo from '@/components/EncabezadoCatalogo'; // Vistos recientemente + accesos a Buscar y Escanear
import EstadoCargando from '@/components/EstadoCargando';
import EstadoError from '@/components/EstadoError';
import EstadoVacio from '@/components/EstadoVacio';
import TarjetaLibro from '@/components/TarjetaLibro';
import { COLORES, ESPACIADO } from '@/constants/tema';
import { useLibros } from '@/hooks/useLibros';

export default function PantallaCatalogo() {
  const { libros, cargando, error, reintentar } = useLibros();

  // Qué se muestra cuando la lista no tiene libros: cargando, error o vacío.
  let sinLibros = <EstadoVacio mensaje="La biblioteca todavía no tiene libros cargados." />;
  if (cargando) {
    sinLibros = <EstadoCargando mensaje="Cargando el catálogo..." />;
  } else if (error !== null) {
    sinLibros = <EstadoError mensaje={error} onReintentar={reintentar} />;
  }

  return (
    <FlatList
      style={estilos.lista}
      contentContainerStyle={estilos.contenido}
      data={libros}
      keyExtractor={(libro) => libro.isbn}
      renderItem={({ item }) => <TarjetaLibro libro={item} />}
      ListHeaderComponent={EncabezadoCatalogo}
      ListEmptyComponent={sinLibros}
    />
  );
}

const estilos = StyleSheet.create({
  lista: { flex: 1, backgroundColor: COLORES.fondo },
  contenido: { padding: ESPACIADO.l },
});
```

El acceso a la cámara que en el código del compañero era un `Pressable` con un ícono es, en mi versión, el botón "Escanear" de `AccesosRapidos` (`src/components/AccesosRapidos.tsx:L14-L18`), con texto visible, `accessibilityRole="button"` (dentro de `BotonPrimario`) y área táctil de 44 (`TAMANIOS.areaTactil`). El link "Personal" del header lo pone el Stack de la tab (`src/app/(tabs)/(catalogo)/_layout.tsx:L8`).

**d) ¿Cuál podría provocar el rechazo de la app en una tienda y cuál haría que una persona la desinstale primero?**

- **Rechazo de tienda:** pedir permisos al abrir la app, sin contexto ni propósito (líneas 13-16). La guía de revisión de Apple, apartado 5.1.1, dice que las apps "should only request access to data relevant to the core functionality of the app" (solo deben pedir acceso a datos relevantes para su función principal), que los textos de propósito deben describir clara y completamente el uso de los datos, y que "where possible, provide alternative solutions for users who don't grant consent" (donde se pueda, ofrecer alternativas a quien no da consentimiento). Pedir la cámara y las notificaciones al abrir el Catálogo, sin que la persona haya tocado "Escanear" ni activado un recordatorio, no cumple eso. En mi app, los permisos se piden con una pantalla previa y cada uno tiene una alternativa (ISBN a mano y avisos dentro de la app).
- **Desinstalación:** lo más probable es el **bucle de pedidos** de las líneas 18-20: se nota sin que la persona haga nada, agota batería y datos móviles, calienta el teléfono y hace parpadear la lista, sin salida. Los diálogos de permiso al abrir molestan, pero se descartan con un toque.

## E2. Organización y acoplamiento

**a) ¿Qué carpetas importan a cuáles? ¿Hay alguna importación "hacia arriba"?**

Revisé los imports con una búsqueda en todo `src/`:

| Carpeta | Importa de |
|---|---|
| `app` | `components` (en los archivos de ruta y en `_layout`), `context` y `constants` (`src/app/_layout.tsx:L1-L2` y `src/app/(tabs)/_layout.tsx:L3-L4`) |
| `components` | `components`, `hooks`, `context`, `lib`, `data`, `types`, `constants` |
| `hooks` | `hooks`, `context`, `lib`, `types`, `constants` |
| `context` | `lib`, `data`, `estructuras`, `types`, `constants` |
| `lib` | `data`, `estructuras`, `types`, `constants` (con rutas relativas) |
| `data` | `types` |
| `estructuras`, `types`, `constants` | nada de `src` |

El sentido es `app -> components -> hooks -> context -> lib -> data / estructuras / types / constants`, sin ciclos. **Ninguna carpeta importa de `src/app`** (una búsqueda de `@/app` y `../app` no da resultados): ni un hook ni un componente conoce las rutas; las rutas solo conocen las pantallas. (Los hooks y componentes importan el paquete `expo-router`, pero eso es una librería, no `src/app`.)

Importar `src/app` desde un hook sería un problema: la carpeta `app` es lo que el router recorre para generar las URLs, y con importaciones hacia arriba se crean ciclos y se ata la lógica reutilizable a la estructura de rutas (mover o renombrar una ruta rompería los hooks, y no se podrían probar sin cargar el router).

**b) Si el Catálogo pasara a venir de una API real, ¿qué archivos cambiarían? Si la lista tiene más de dos archivos, ¿qué dice eso de mi diseño?**

El pedido en sí está aislado: cambiaría `src/lib/api.ts` (reemplazar `LIBROS` por un `fetch`) y, como mucho, los mensajes de error en `src/hooks/useLibros.ts` y `src/hooks/useBuscarLibros.ts`. Las pantallas que usan esos hooks no cambiarían.

Pero la lista es más larga: `src/data/libros.ts` dejaría de ser la fuente de datos y hoy hay búsquedas por ISBN que la leen de forma sincrónica: `src/lib/libros.ts:L11-L13` (`buscarLibroPorIsbn`, usado por el detalle, el escáner, el Context, las tarjetas de préstamo y de espera y "recientes"), y dos pantallas que importan `LIBROS` directamente: `PantallaReservas.tsx:L7` y `L21`, y `PantallaMostrador.tsx:L8` y `L12`. Eso dice dos cosas de mi diseño: (1) los datos están separados del resto, pero la app tiene dos caminos para leer libros (el pedido asincrónico y la consulta sincrónica a `data`), es decir, la fuente de verdad no es una sola; (2) dos pantallas se saltan la capa `lib` e importan de `data`. Con una API real haría falta un lugar único con los libros ya cargados (un store o el Context) del que lean todos.

**c) Un compañero propone reemplazar `usePermiso` y la pantalla previa por un único `<ConPermiso recurso="camara">...</ConPermiso>` que envuelva a la cámara. ¿Qué ganaría y qué perdería? ¿Me serviría para las notificaciones?**

Ganaría: menos piezas para la cámara y un solo lugar donde decidir "si hay permiso muestro esto, si no aquello".

Perdería: (1) la pantalla previa es una ruta propia (`/permisos/[recurso]`, modal) que el TP pide y que se abre también como deep link; un componente envolvente no la reemplaza; (2) el hook devuelve datos (`estado`, `pedir`, `abrirAjustes`) que usan tres lugares con interfaces distintas: el escáner, la pantalla previa y la línea de estado de "Mis reservas" (`PantallaEscanear.tsx:L15`, `ContenidoPermiso.tsx:L15`, `EstadoNotificaciones.tsx:L9`); un componente envolvente obliga a su contenido a estar adentro y no sirve para mostrar un estado en otro lugar; (3) menos control sobre los estados "bloqueado" y "preguntable" (qué mostrar y cuándo abrir la pantalla previa).

Para las notificaciones, que se piden desde un interruptor y no al abrir una pantalla, no serviría: no hay un componente "que envolver", el permiso se pide como consecuencia de una acción (`useRecordatorio.ts:L13-L38`). El hook, en cambio, ya sirve para los dos recursos (`usePermiso('camara')` y `usePermiso('notificaciones')`).

## E3. Mapa de fallas

| Situación | Qué ve la persona | Dónde se maneja (archivo y línea) |
|---|---|---|
| `obtenerLibros()` falla | El mensaje "No pudimos cargar el catálogo. Revisá tu conexión e intentá de nuevo." con el botón "Reintentar". | `src/hooks/useLibros.ts:L30-L35` (guarda el mensaje) y `src/components/PantallaCatalogo.tsx:L18-L19` (muestra `EstadoError`). |
| Se abre `/libro/abc` | "El ISBN no es válido: tiene que tener 13 dígitos." con el link "Ir al Catálogo". | `src/components/PantallaDetalleLibro.tsx:L25-L27` (valida con `esIsbnValido`, `src/lib/libros.ts:L5-L9`) y `MensajeConEnlace.tsx:L11-L19`. |
| Se escanea un ISBN que no está en el catálogo | Un aviso en pantalla: "El ISBN ... no está en el catálogo de la biblioteca." y se puede seguir escaneando. | `src/components/PantallaEscanear.tsx:L36-L42`. |
| La cámara está bloqueada | "La cámara está desactivada para la app. Podés activarla en ..." con el botón "Abrir Ajustes", y la entrada de ISBN a mano. | `PantallaEscanear.tsx:L64-L71`; el estado sale de `calcularEstado` (`src/lib/permisos.ts:L73-L81`). |
| Las notificaciones están denegadas | En "Mis reservas": "Notificaciones: no permitidas. Los avisos se muestran acá, dentro de la app." Al entregarle un libro desde el mostrador, un aviso dentro de la app. Si activa "Recordarme" y el permiso está bloqueado, la pantalla previa le ofrece "Abrir Ajustes". | `src/components/EstadoNotificaciones.tsx:L14-L21`; `BibliotecaContext.tsx:L216-L221` (aviso en la app); `src/hooks/useRecordatorio.ts:L29-L35` y `ExplicacionPermiso.tsx` (pantalla previa). Si no se pudo programar el recordatorio: `BibliotecaContext.tsx:L165-L170`. |
| Se intenta reservar un libro ya reservado | El botón "Confirmar" está deshabilitado y se lee "Ya tenés este libro prestado o en la lista de espera. No se puede reservar dos veces." | `src/components/PantallaReservar.tsx:L12`, `L25`, `L51` y `L54`; la regla también está en `reservar` (`BibliotecaContext.tsx:L122-L124`) y se muestra el mensaje si igual se intenta (`PantallaReservar.tsx:L34-L36`). |
| "Entregar al siguiente" con la lista de espera vacía | Un libro sin nadie en la lista no aparece en el mostrador: al entregar al último, desaparece la tarjeta y, si no queda ninguna, se lee "No hay personas en lista de espera." Si igual se llamara a la acción, no pasa nada (no rompe). | `src/components/PantallaMostrador.tsx:L12` y `L20`; la protección en `BibliotecaContext.tsx:L195-L198`. |
| Login con clave incorrecta | "Usuario o clave incorrectos. Revisá los datos e intentá de nuevo." y el modal sigue abierto. | `src/components/PantallaLogin.tsx:L15-L18`; la comprobación está en `iniciarSesion` (`BibliotecaContext.tsx:L226-L232`). |

## E4. Decisiones con argumentos

**a) Identificador: ¿ISBN como parámetro de ruta y `key`, o un id numérico propio?**

Elegí el ISBN como identificador: es el parámetro de la ruta `/libro/[isbn]`, el `keyExtractor` de las listas (`PantallaCatalogo.tsx:L27`) y la clave de los préstamos y las esperas.

- El ISBN identifica la edición: dos ediciones del mismo título tienen ISBN distinto, así que no se pisan ni como `key` ni como ruta. Por eso es mejor que usar el título.
- El escáner lee el ISBN del código de barras: con un id propio habría que traducir cada lectura a ese id.
- Es un `string` de 13 dígitos (`src/types/index.ts:L2`), no un `number`: un número perdería ceros a la izquierda.
- Límites: un libro sin ISBN (material propio de la biblioteca o ediciones muy antiguas) no entra en este modelo; habría que tener un id propio. Además, `useLocalSearchParams` no garantiza el tipo: un parámetro puede llegar como `string` o `string[]`, y puede ser cualquier cosa que escriba quien arma el link. Por eso valido el valor antes de usarlo (`PantallaDetalleLibro.tsx:L15-L16`) en lugar de confiar en el tipo `string`.

**b) Estructuras: ¿clase `Pila` con `#items` o un array en el estado con `[...pila, x]` y `slice`?**

Usé las clases `Pila` y `Cola` (`src/estructuras/Pila.ts`, `Cola.ts`).

- Qué me dio la clase: encapsulación (con `#items` no se puede tocar el interior; solo existen `push`, `pop`, `tope`, `encolar`, `desencolar`...), operaciones con nombre del dominio (`tope()` y `desencolar()` se leen mejor que un `slice`), y se pueden probar por separado (13 casos con jest, `src/estructuras/*.test.ts`).
- Qué me complicó con React: React solo detecta cambios por referencia, así que nunca puedo mutar la instancia guardada en el estado: tuve que escribir `copiarPila`, `copiarCola` y `colaDesdeArray` (`src/lib/colecciones.ts`). Los campos privados `#items` no se copian con el operador spread (`{ ...pila }` da un objeto vacío), así que la copia se hace con `aArray()`. Y una instancia de clase no se serializa directamente (por ejemplo, para guardarla en AsyncStorage habría que pasar por `aArray()`).
- Con un array y `[...pila, x]` esto sería más corto y natural en React, a costa de perder el invariante (cualquiera puede hacer `splice` en cualquier lugar).

**c) Memorización: ¿usé `useMemo` o `useCallback`? Un lugar donde aportan y otro donde serían ruido**

Sí, en el Context: el valor del provider está en `useMemo` (`BibliotecaContext.tsx:L238-L279`) y cada función está en `useCallback` (`L75-L236`).

- Donde aportan: `registrarVisto` (`L99-L108`, con `useCallback` y dependencias `[]`) es dependencia del efecto del detalle (`PantallaDetalleLibro.tsx:L19-L23`). Si su identidad cambiara en cada render, el efecto correría en cada render. También `useRevisarAlVolver(revisar)` vuelve a suscribirse a `AppState` si `revisar` cambia, por eso `consultar` está en `useCallback` (`usePermiso.ts:L30-L36`).
- Donde serían ruido: en los componentes de pantalla y de lista (`TarjetaLibro`, `PantallaCatalogo`): el proyecto tiene el compilador de React activado (`app.json:L53`, `reactCompiler: true`), que ya memoriza valores y funciones de los componentes; agregar `useMemo` o `React.memo` a mano ahí solo suma código sin beneficio medible con 17 libros. Incluso en el Context el compilador podría hacer parte de ese trabajo; los dejé explícitos para que se vea qué identidad necesita estar estable.
- Cómo lo comprobaría en lugar de suponerlo: con el Profiler de React DevTools (o "highlight updates"), viendo qué componentes se renderizan al cambiar el Context, y comparando con y sin la memorización.

**d) Datos duplicados: ¿guardé los "ejemplares disponibles" en el estado o los calculé?**

Los calculo: `calcularDisponibles` (`src/lib/prestamos.ts:L7-L14`) devuelve `libro.ejemplares` + ingresos por entrega - préstamos del libro, y el Context lo expone como `obtenerDisponibles` (`BibliotecaContext.tsx:L80-L83`). No hay ninguna variable "disponibles" guardada.

El error que aparece cuando un mismo dato vive en dos lugares es la inconsistencia: si guardara `disponibles` aparte de `prestamos`, habría que acordarse de restarlo al reservar, sumarlo al devolver y ajustarlo al entregar desde el mostrador. Si en algún camino se olvida, el Catálogo diría "2 disponibles" y el detalle "1", o se podría reservar un libro agotado. Calculándolo, cualquier pantalla que lo muestre parte de los mismos datos (`prestamos`) y no puede contradecirse. Lo mismo pasa con la posición en la lista de espera: se deduce de la `Cola` (`posicionEnEspera`, `L86-L92`) y no se guarda. La excepción es `ingresosPorEntrega` (`L72`), un contador que sí es estado: cuando el mostrador le entrega un libro a la persona y el libro tenía 0 ejemplares en el estante, ese ejemplar "ingresa" a la cuenta, así el disponible sigue siendo `0 + 1 - 1 = 0` y no negativo.
