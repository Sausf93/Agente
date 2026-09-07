---
title: "Agente — Mejoras de usabilidad y dinamismo (auditoría + plan)"
autor: "Diseño de producto"
fecha: "2026-09-07"
estado: "Propuesta priorizada — para que mobile-dev la ejecute"
mockup: "docs/diseno/mockup-dinamismo.html"
alcance: "apps/mobile (solo lo señala; NO tocado en este doc). Compatible con Expo Go (SDK 57)."
---

# Mejoras de usabilidad y dinamismo

El fundador dice que la app se ve "poco usable" y la quiere **más dinámica**. Tras
auditar el código ya implementado, el diagnóstico es claro y tiene buenas noticias:

> **La estructura, los tokens y la jerarquía ya están bien.** Lo que falta es
> **vida**: la app hoy es *correcta pero estática*. No vibra al copiar, no anima la
> entrada de resultados, no reacciona al dedo, arranca sin foco en el buscador y
> resuelve las cargas con spinners que "saltan". Todo eso se arregla con dos
> librerías que **ya van dentro de Expo Go** (`expo-haptics`,
> `react-native-reanimated`) y una tercera para gestos (`react-native-gesture-handler`).

La sensación de "dinámica y usable" sube ~80 % con los **P0**, que son casi todos
*quick wins* de bajo riesgo. Ninguna mejora rompe el sistema visual, la gravedad
fija, la marca neutra ni el offline-first.

---

## 0. Estado actual (lo que ya está bien — no tocar)

- **Tokens y tema por cuerpo** (`theme.ts`, `useAppTheme`): acento por cuerpo,
  gravedad fija, modo claro/oscuro. Sólido. `resolveTheme` hace `brand === accent`,
  así que todo lo que lee `color.brand` hereda el acento.
- **Buscador incremental** con debounce de 180 ms (`BuscadorScreen`), estados vacíos
  diferenciados ("aún no has buscado" vs "sin resultados" con botón de reportar).
- **Ficha** (`FichaScreen`): "Copiar boletín" sobre el pliegue (ADR-004), variantes,
  favorito, generar documento, pie de fuente, consecuencias orientativas.
- **Cuadrante**: modelo de dos capas con ediciones manuales sagradas, resumen de
  horas arriba, editor en modal.
- **Barra inferior** con iconos Lucide y pastilla de acento en la activa.
- **Onboarding** de 2 pasos que tiñe la app al elegir cuerpo.
- **`EmptyState`** ya existe como componente con gracia (icono + título + acción).

## 0.1 Diagnóstico de por qué "se ve poco usable / estática"

| Síntoma | Causa en el código |
|---|---|
| "No pasa nada al tocar" | Sin **háptica** (`expo-haptics` no está instalado). `CopyBulletinButton` lo dice: *"se sumará cuando entre expo-haptics"*. |
| "Todo es plano / muerto" | Sin **animaciones** (`react-native-reanimated` no está instalado). Los `motion` tokens del tema no se usan. El botón "Copiado" cambia de golpe, sin transición. |
| "Salta al cargar" | Cargas resueltas con `ActivityIndicator`/texto (`FichaScreen`, `NormasListScreen`, `CuadranteScreen`), que aparecen y desaparecen bruscamente. Sin **skeletons**. |
| "Cuesta empezar a buscar" | El buscador **no arranca enfocado** (nunca se pasa `autoFocus`), no hay **micrófono**, y el placeholder es estático. |
| "No sé por qué me sale este resultado" | Los resultados **no resaltan** el término que hizo match ni muestran pista de consecuencia. |
| "Las listas aparecen de golpe" | `FlatList` de resultados/normas sin **animación de entrada** ni stagger. |
| Detalles inconsistentes | Chevrons de mes con texto `‹ ›` (Cuadrante) en vez de Lucide; selección con `infoBg` azul fijo en vez de `accentWeak`; spinner de ficha con `brand` en un sitio y `accent` en otro. |

---

## 1. Librerías a añadir (todas van en Expo Go, SDK 57)

mobile-dev instala con `pnpm` (yo no ejecuto `pnpm install`):

| Librería | Para qué | Notas |
|---|---|---|
| `expo-haptics` | Feedback táctil (copiar, favorito, selección, delito) | Bundled en Expo Go. API: `Haptics.notificationAsync`, `impactAsync`, `selectionAsync`. |
| `react-native-reanimated` | Animaciones de entrada, press-scale, crossfade, layout | Bundled en Expo Go. Requiere el **plugin de Babel** (`babel.config.js`) y su import al inicio de `entry`. v4 usa worklets, ya incluidos. |
| `react-native-gesture-handler` | Swipe en listas (favoritos), swipe entre meses | Bundled en Expo Go. Envolver la app en `GestureHandlerRootView` en `app/_layout.tsx`. |
| *(diferida)* `expo-speech-recognition` | Búsqueda por voz | **NO va en Expo Go**: requiere *dev build*. Ver P2-15. El micrófono se pinta ya (P0-3) pero deshabilitado/"pronto" hasta el dev build. |

**Preferencia de rendimiento**: animar solo `opacity`, `transform` (translate/scale).
Respetar siempre `AccessibilityInfo.isReduceMotionEnabled` (ver P1-14) y el toggle de
háptica de Ajustes (`hapticsEnabled`, ya previsto en el código).

---

## 2. Plan priorizado

Leyenda: **[QW]** quick win (bajo riesgo, pocas horas) · **[M]** mayor esfuerzo.

### P0 — Lo que más sube "usable y dinámica"

#### P0-1 · Háptica en toda la app **[QW]**
- **Dónde**: crear `src/ui/haptics.ts` (helper que lee `hapticsEnabled` de Ajustes y
  respeta reduce-motion) y llamarlo desde:
  - `CopyBulletinButton.tsx` → `notificationAsync(Success)` al copiar (ya hay `onCopied`).
  - `FavoriteToggle.tsx` → `impactAsync(Light)` al fijar / `selectionAsync` al quitar.
  - `FichaScreen.tsx` → `impactAsync(Medium)` **una vez** al abrir una ficha cuyo
    `gravedad` sea `muy_grave` o `delito` (alerta física, mapa háptico de 01-ux §4.6).
  - `BuscadorScreen`/`store` → `notificationAsync(Warning)` cuando una búsqueda con
    texto termina en 0 resultados (una sola vez por término).
  - Chips de variante (Ficha), servicio (Cuadrante), accesos rápidos, cambio de
    pestaña, selección de cuerpo (Onboarding) → `selectionAsync`.
- **Librería**: `expo-haptics`.
- **Criterio de aceptación**: al copiar el boletín el teléfono vibra en éxito; el
  toggle "Vibración" de Ajustes lo silencia todo; con reduce-motion no se dispara
  háptica no esencial; nunca sustituye al feedback visual.

#### P0-2 · "Copiar boletín" animado y vivo **[QW]**
- **Dónde**: `src/ui/components/CopyBulletinButton.tsx`.
- **Qué**: al pulsar, `scale 0.98` en press (100 ms, `durInstant`) + **crossfade** del
  contenido normal→éxito (fondo `brand`→`success`, icono `copy`→`check`) con
  `withTiming(durFast)` en vez del cambio instantáneo actual; mantener el estado
  "Copiado" 1,2 s y revertir suave. Háptico de P0-1 al inicio.
- **Librería**: `react-native-reanimated` + `expo-haptics`.
- **Criterio**: la transición a "Copiado" es suave (no un salto); el botón "late"
  levemente al pulsar; a los 1,2 s vuelve con fade. Con reduce-motion, cambia sin
  animar pero con háptico y texto.

#### P0-3 · Buscador que invita a escribir **[QW]** (voz **[M]**, diferida)
- **Dónde**: `src/ui/components/SearchBar.tsx` y `BuscadorScreen.tsx`.
- **Qué**:
  1. **Autofoco en arranque en frío** a Buscar: pasar `autoFocus` cuando se entra sin
     texto previo y sin venir de navegar atrás (01-ux F2). No re-enfocar al volver de
     una ficha (para no tapar accesos rápidos con el teclado).
  2. **Botón de micrófono** visible (icono `mic` de Lucide, ya disponible), 44×44, a la
     derecha. De momento **deshabilitado con etiqueta "Pronto"** o abre un aviso "La
     búsqueda por voz llega en la próxima versión". El hueco y la a11y quedan listos.
  3. **Placeholder rotatorio** (01-ux §6.1): alterna cada ~3 s entre "faro roto",
     "sin seguro", "0,60 mg", "art. 36.6" con fade (`durFast`). Se detiene con
     reduce-motion.
- **Librería**: `react-native-reanimated` (fade del placeholder + pulso del micro
  cuando llegue la voz). El micrófono real: `expo-speech-recognition` (dev build, P2-15).
- **Criterio**: al abrir la app en frío, el teclado ya está arriba y el cursor en el
  buscador; el micro se ve pero indica que aún no está activo; el placeholder rota
  con ejemplos reales.

#### P0-4 · Resultados con match resaltado, pista de consecuencia y entrada animada **[M]**
- **Dónde**: `BuscadorScreen.tsx` (`FilaResultado`), `features/buscador/search.ts`
  (para devolver el rango del match y, si existe, la consecuencia determinante).
- **Qué**:
  1. **Resaltar** en el título/subtítulo el tramo que hizo match (fondo `accentWeak`
     o texto en `accent` seminegrita). Reduce la duda de "¿por qué me sale esto?".
  2. **Pista de consecuencia inline** (chip pequeño "grúa"/"inmovilización"/"detención")
     cuando la infracción la tiene y es determinante (01-ux §6.2). Muchas veces es lo
     que el agente busca, más que el importe.
  3. **Animación de entrada** de las filas: fade + translate 8 pt con **stagger** de
     ~20 ms (máx. 240 ms total), usando `Reanimated.FadeInDown` / `entering`.
- **Librería**: `react-native-reanimated`.
- **Criterio**: al teclear, los resultados entran con un barrido suave; el término
  buscado aparece resaltado en cada fila; si hay consecuencia clave, se ve un chip.

#### P0-5 · Feedback de pulsado global (todo "reacciona al dedo") **[M]**
- **Dónde**: crear `src/ui/components/PressableScale.tsx` (Pressable animado reutilizable:
  `scale 0.97` + baja de opacidad al presionar, `durInstant`) y adoptarlo en las
  superficies pulsables clave: `ListRow`, `Card` pulsable (accesos rápidos,
  `TarjetaTurno`, `FilaMas`, `AvisoNovedades`), tarjetas de cuerpo del onboarding.
- **Librería**: `react-native-reanimated`.
- **Criterio**: cualquier fila/tarjeta pulsable "se hunde" levemente al tocarla; el
  efecto es consistente en toda la app; se desactiva con reduce-motion.

### P1 — Pulido de dinamismo y coherencia

#### P1-6 · Ficha más escaneable en 3 s **[M]**
- **Dónde**: `FichaScreen.tsx`.
- **Qué**:
  - Convertir el bloque de importe en **tiles reales de 3 columnas** con el número en
    `displayL` (34) tabular y etiqueta pequeña debajo (hoy es `titleM` 20 en fila que
    envuelve; el importe debe verse "de refilón", 02-ui §7.2).
  - **Consecuencia crítica resumida por encima del pliegue** (grúa/inmovilización/
    detención) como tarjeta con icono + fuente + chevron, **antes** o junto al botón
    Copiar (01-ux §7.1). El detalle completo se queda abajo.
  - Coherencia de acento: la **variante seleccionada** usa `accentWeak`/`accent` (hoy
    usa `infoBg`/`brand` azul fijo — chirría con cuerpos verde/violeta). El spinner de
    carga usa `accent` (hoy `brand` en un punto y `accent` en otro).
  - Sustituir el spinner de carga por **skeleton** (P1-10).
- **Criterio**: sin hacer scroll se ven importe (grande), gravedad, consecuencia clave
  y el botón Copiar; el color de selección coincide con el acento del cuerpo.

#### P1-7 · Cuadrante más vivo y coherente **[M]**
- **Dónde**: `features/cuadrante/CuadranteScreen.tsx`.
- **Qué**:
  - `FlechaMes`: usar `ChevronLeft`/`ChevronRight` de Lucide (hoy son caracteres
    `‹ ›`), coherente con el resto.
  - **Háptico** `selectionAsync` al elegir tipo de servicio y `notificationAsync(Success)`
    al guardar el día.
  - **Swipe horizontal** para cambiar de mes (gesto natural), además de las flechas.
  - Chips de servicio/patrón seleccionados con `accentWeak`/`accent` (hoy `infoBg`/`brand`).
  - Animar la transición de mes (fade/slide corto de la rejilla) y la entrada del
    modal editor (ya usa `animationType="slide"`; añadir háptico al abrir).
- **Librería**: `react-native-gesture-handler` + `react-native-reanimated` + `expo-haptics`.
- **Criterio**: se puede pasar de mes deslizando; al tocar un tipo de turno vibra; el
  color de selección es el del cuerpo.

#### P1-8 · Swipe para gestionar favoritos **[M]**
- **Dónde**: `features/inicio/FavoritosScreen.tsx` (y filas de "Tus favoritas" en Home).
- **Qué**: `Swipeable` con acción "Quitar" al deslizar a la izquierda + háptico; con
  toast "Quitada · Deshacer" (patrón deshacer, no confirmar; 01-ux §4.5).
- **Librería**: `react-native-gesture-handler` (Swipeable) + `react-native-reanimated`.
- **Criterio**: deslizar una favorita ofrece quitarla; hay opción de deshacer 3–4 s.

#### P1-9 · Transiciones y gesto de cierre de la ficha **[QW]**
- **Dónde**: `app/_layout.tsx`.
- **Qué**: revisar `animation` del Stack para transiciones suaves y consistentes; para
  `ficha/[id]` valorar `presentation: 'modal'` + `gestureEnabled` (swipe-down para
  cerrar, 01-ux §4.1). Mantener `gestureEnabled: false` solo en onboarding.
- **Criterio**: la ficha se puede cerrar con gesto; las transiciones no son secas.

#### P1-10 · Skeletons en vez de spinners que saltan **[M]**
- **Dónde**: crear `src/ui/components/Skeleton.tsx` (bloque con **shimmer** suave en
  bucle, `react-native-reanimated`) y usarlo en las cargas de `FichaScreen`,
  `NormasListScreen`, `CuadranteScreen` (y resultados del buscador mientras busca, en
  vez del `ActivityIndicator`).
- **Librería**: `react-native-reanimated`.
- **Criterio**: al abrir una ficha/lista se ve el "esqueleto" del contenido, no un
  spinner centrado; la transición a contenido real es un fade, no un salto.

#### P1-11 · Estados vacíos y de error unificados con `EmptyState` **[QW]**
- **Dónde**: revisar todas las pantallas para que usen el `EmptyState` existente
  (Normas ya lo hace) con icono + frase + acción; el bloque de "no encontrada"/"sin
  contenido" de `FichaScreen` es texto plano hoy.
- **Criterio**: ninguna pantalla vacía o en error es un hueco de texto suelto.

### P2 — Mejoras de más recorrido

#### P2-12 · Onboarding con autodetección de territorio **[M]**
- **Dónde**: `app/onboarding.tsx` (Paso 2).
- **Qué**: `expo-location` con permiso **contextual** ("Parece que estás en Murcia,
  ¿correcto?") que rellena CCAA+Provincia de golpe; fallback manual si se deniega
  (01-ux §3.2). Animar el tinte de la app al elegir cuerpo (transición de color en vez
  de salto) + háptico de selección.
- **Nota**: `expo-location` va en Expo Go; el permiso se pide en contexto, nunca en seco.
- **Criterio**: elegir territorio es un toque de confirmación cuando hay GPS; el
  cambio de color al elegir cuerpo se ve fluido.

#### P2-13 · Pull-to-refresh donde aporta **[QW]**
- **Dónde**: `NovedadesScreen`, `NormasListScreen` (y "Mis marcadores").
- **Qué**: `RefreshControl` para releer el paquete de contenido / recargar la lista
  local. No en el camino crítico del buscador (offline-first, sin red).
- **Criterio**: tirar hacia abajo en Novedades/Normas recarga la lista con el
  indicador nativo.

#### P2-14 · Respeto global a "reducir movimiento" **[QW]**
- **Dónde**: helper `src/ui/motion.ts` que lea `AccessibilityInfo.isReduceMotionEnabled`
  (y lo cachee) para desactivar animaciones no esenciales en un único sitio.
- **Criterio**: con reduce-motion activo, las transiciones se reducen a cambios de
  estado sin movimiento; la app sigue siendo plenamente usable.

#### P2-15 · Búsqueda por voz (diferida — requiere dev build) **[M]**
- **Dónde**: `SearchBar` (micro ya pintado en P0-3) + `features/buscador`.
- **Qué**: `expo-speech-recognition` con transcripción en vivo, pulso de onda en el
  micro (reanimated) y háptico al iniciar; rellena el campo y lanza la búsqueda al
  detectar fin de habla (01-ux §6.2). **No entra en Expo Go**: se activa cuando exista
  el *dev build* / build de tiendas. Mantener el micro deshabilitado en Expo Go.
- **Criterio (cuando haya dev build)**: dictar "faro trasero roto" rellena y busca solo.

---

## 3. Resumen para el fundador

Con los **P0** (háptica, botón de copiar animado, buscador con foco+micro+placeholder,
resultados resaltados y animados, y feedback de pulsado global) la app pasa de
"correcta pero muerta" a "viva y a prueba de guantes", sin tocar la marca ni la
gravedad y todo dentro de Expo Go. Son en su mayoría *quick wins* de bajo riesgo. Los
P1 pulen ficha y cuadrante; los P2 (voz, GPS) dan el último salto pero piden más
trabajo o un dev build.

---

## 4. Checklist para mobile-dev

- [ ] Añadir `expo-haptics`, `react-native-reanimated` (+ plugin Babel),
      `react-native-gesture-handler` (+ `GestureHandlerRootView`).
- [ ] `src/ui/haptics.ts` respeta `hapticsEnabled` y reduce-motion (P0-1).
- [ ] `CopyBulletinButton` con crossfade + press-scale + háptico éxito (P0-2).
- [ ] Buscador: autofoco en frío, micro visible (voz diferida), placeholder rotatorio (P0-3).
- [ ] Resultados: match resaltado + chip de consecuencia + entrada con stagger (P0-4).
- [ ] `PressableScale` reutilizable adoptado en filas/tarjetas (P0-5).
- [ ] Ficha: tiles grandes, consecuencia crítica sobre el pliegue, acento coherente,
      skeleton (P1-6, P1-10).
- [ ] Cuadrante: chevrons Lucide, háptico, swipe de mes, acento coherente (P1-7).
- [ ] Swipe-to-quitar en favoritos con deshacer (P1-8).
- [ ] Transiciones de Stack + swipe-down para cerrar ficha (P1-9).
- [ ] `EmptyState` en todas las vistas vacías/error (P1-11).
- [ ] Onboarding: autodetección GPS contextual + tinte animado (P2-12).
- [ ] Pull-to-refresh en Novedades/Normas (P2-13).
- [ ] Respeto global a reduce-motion (P2-14).
- [ ] Voz cuando haya dev build (P2-15).
- [ ] Regla transversal: **animar solo opacity/transform**, respetar reduce-motion y el
      toggle de háptica; gravedad = color+texto+icono; sin símbolos oficiales; cuerpo
      ≥16 pt, toque ≥44 pt.

---

*Referencia visual interactiva: `docs/diseno/mockup-dinamismo.html` (abrir en un
navegador; muestra el botón de copiar animado y la lista de resultados con match
resaltado, skeleton y entrada escalonada). Documento vivo: se ajusta con la beta.*
