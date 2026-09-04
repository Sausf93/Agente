---
title: "Agente — Revisión UX/UI de apps/mobile (estado Fase 0)"
autor: "Diseño de producto"
fecha: "2026-09-04"
estado: "Revisión priorizada + refinamientos aplicados"
alcance: "apps/mobile en el commit de cimientos + pantalla de Sugerencias"
---

# Revisión UX/UI de `apps/mobile`

Listón del proyecto: **tan simple como la app que ya usan los agentes (SPPLB), pero
bonita, moderna y fiable**. Marca neutra, cero apariencia oficial. Contexto de uso:
una mano, de noche, en el coche, con guantes y prisa.

Estado revisado: scaffold de Fase 0 (ADR-010). Cinco pestañas
(Buscar · Normas · Documentos · Cuadrante · Más), casi todas `PlaceholderScreen`. La
única pantalla real es **Sugerencias/Feedback** (ADR-011). El `theme.ts` es fiel al
sistema visual (`02-ui.md`).

**Veredicto global:** los cimientos son sólidos y fieles al sistema visual. El
principal riesgo hoy no es lo que está mal, sino lo que **falta y se está
improvisando por pantalla**: no hay primitivas de UI, así que cada pantalla
reimplementa botón/tarjeta/chip/input con estilos inline. Eso, multiplicado por 5
features, es la vía rápida a la inconsistencia que el sistema visual quiere evitar
(principio 1.5 "Consistencia > creatividad"). La palanca de mayor impacto ahora es
**fijar el set de primitivas** antes de que cada feature invente la suya.

---

## 1. Hallazgos priorizados

Prioridad: **P0** bloquea coherencia/uso; **P1** mejora clara; **P2** pulido.

### P0 — Faltan primitivas de UI; cada pantalla reimplementa el sistema visual
`theme.ts` da tokens excelentes, pero no hay componentes. `FeedbackScreen` define
inline su botón (dos veces: sólido y outline), su tarjeta, su chip de estado y su
banner. Cuando lleguen buscador, ficha y cuadrante, cada uno reinventará lo mismo con
pequeñas divergencias (radios, alturas, estados `pressed`, colores de `disabled`).
Es exactamente el fallo que mata la sensación de "herramienta seria y previsible".
→ **Refinado**: creado un set mínimo de primitivas (`Button`, `Card`, `Banner`,
`Badge`) en `src/ui/components/` y `FeedbackScreen` migrada a ellas como prueba.
Ver §3 el patrón para mobile-dev.

### P0 — El aviso de privacidad "agobiaba" (naranja de alerta para algo que no es alerta)
El `AvisoPrivacidad` usaba `warningBg` + borde naranja completo (`warning`) rodeando
todo el bloque. Un recuadro naranja de advertencia para un mensaje que es
**informativo y permanente** (no una alarma) genera ansiedad y, peor, **quema el
naranja**: cuando de verdad haya que avisar de "contenido caducado" o "error", el
usuario ya está anestesiado al naranja. El sistema visual (§5.9) pide banner con
**barra de acento de 3 pt a la izquierda**, no borde envolvente.
→ **Refinado**: el aviso pasa a `Banner tone="info"` (azul calmado, acento lateral
de 3 pt). Sigue perfectamente visible y con título "Privacidad", pero deja de gritar.
Texto acortado para bajar la carga visual.

### P1 — Selector de "Tipo": etiquetas largas que descuadran en 3 columnas
Los tres botones segmentados mostraban `Sugerencia` / `Error de contenido` /
`Error técnico` a 14 pt en columnas de 1/3 de ancho: las dos largas se parten en 2–3
líneas y descuadran las alturas. Además 14 pt (`caption`) es pequeño para un control.
→ **Refinado**: etiquetas cortas (`Sugerencia` / `Contenido` / `Técnico`) a 15 pt
(`label`), `numberOfLines={1}`, y **la etiqueta larga se conserva como
`accessibilityLabel`** para el lector de pantalla (no se pierde claridad para a11y).

### P1 — Navegación: etiquetas correctas, pero el estado activo depende casi solo del color
`(tabs)/_layout.tsx` ya aplica ADR-003 (Buscar · Normas · Documentos · Cuadrante ·
Más) y distingue activo por color de marca + peso de etiqueta. Bien. Pero mientras no
haya iconos, el activo/inactivo se apoya **casi solo en color** (peso 600 fijo para
todas), lo que roza la regla 2.4. No es urgente (aún no hay iconos), pero **la
estrategia de iconos hay que fijarla ya** para no re-tocar la barra: Lucide (línea) +
señal de relleno para el activo. Ver §4.

### P1 — Falta feedback de confirmación en "Guardar" (momento de confianza)
Al guardar una aportación, el único feedback es que aparece en la lista más abajo
(fuera de vista tras el teclado). En una app cuyo ADN es "confía en que la acción
ocurrió" (el `Copiar boletín` es el caso extremo), conviene **confirmar siempre**.
No lo implemento ahora (evito tocar el flujo/añadir háptico nativo), pero queda
señalado: háptico `selectionAsync` + toast breve "Guardado" cuando mobile-dev traiga
`expo-haptics` y el componente `Toast`.

### P2 — Inconsistencia de nombres del feature
El título de la pantalla es "Sugerencias y reportes", el header nativo dice
"Sugerencias", y la fila de "Más" dice "Sugerencias / reportar problema". Tres
nombres para lo mismo. Sugerencia: unificar a **"Sugerencias"** (corto) en navegación
y fila, dejando el subtítulo explicativo para el cuerpo. No lo cambio para no tocar
copy sin acuerdo, pero es un pulido fácil.

### P2 — `PlaceholderScreen` no usa `maxFontSizeMultiplier` ni límites de escala
El sistema visual (§3.2) pide limitar `maxFontSizeMultiplier` (~1.6) en zonas
críticas para no romper la retícula a 200 %. Aún no hay zonas críticas (todo
placeholder), pero cuando lleguen la ficha y el cuadrante hay que aplicarlo. Anotado
para el checklist de QA de cada feature.

### P2 — Modo oscuro correcto, pero conviene fijar el default "oscuro de noche"
`useAppTheme` cae a `light` si el sistema no informa. `02-ui.md` habla de "oscuro por
defecto de noche"; hoy eso lo aporta el `useColorScheme` del sistema, lo cual es
correcto y suficiente. Solo dejar constancia de que el fallback a claro es
deliberado (cuando no hay dato del sistema), no un olvido.

---

## 2. Lo que está bien (no tocar)

- **`theme.ts` es fiel y completo**: neutros, marca azul pizarra, gravedad
  leve/grave/muy grave/delito en claro y oscuro, `severityMeta` con icono+etiqueta,
  `severityFromGravedad` como único puente enum→visual. No inventar paleta.
- **Regla "nunca solo color" ya codificada** en `severityMeta` y respetada en el
  `EstadoBadge` (texto Pendiente/Enviado, no solo color).
- **Toques ≥ 44** y `hitSlop` en el "Borrar". Alturas de botón 52.
- **Local-first y aviso de privacidad presente** (ADR-011, regla CLAUDE.md): correcto
  que el feedback no salga solo y que se advierta de no meter datos de terceros.
- **Arranque sin splash bloqueante** (`_layout.tsx`), fiel a UX F1.

---

## 3. Refinamientos aplicados en este PR (bajo riesgo, sin features nuevas)

Todos mantienen `typecheck` y `test` de mobile en verde y **no añaden dependencias
nativas** (compatibles con Expo Go).

1. **Set de primitivas de UI** en `apps/mobile/src/ui/components/`:
   - `Button.tsx` — variantes `primary` (marca) y `secondary` (outline de marca).
     Alto 52, radio `md`, estado `pressed` (muta color) y `disabled` (superficie
     tenue), `accessibilityRole/label/hint/state`. Sustituye los dos botones inline.
   - `Card.tsx` — superficie + borde + radio + padding consistentes. En oscuro la
     separación la da el borde (no la sombra).
   - `Banner.tsx` — aviso con **acento lateral de 3 pt** (§5.9), tonos
     info/warning/success/danger. Acepta texto o nodos.
   - `Badge.tsx` — pastilla de estado color + texto (Pendiente/Enviado, etc.).
     Explícitamente **no** es el chip de gravedad (ese lleva icono; ver §4).
2. **`FeedbackScreen` migrada** a las primitivas: aviso de privacidad ahora `Banner`
   info; botones Guardar/Enviar ahora `Button`; tarjetas `Card`; estado `Badge`.
3. **UX del formulario**: etiquetas de tipo cortas + `accessibilityLabel` largo,
   texto a 15 pt, `numberOfLines={1}`; `accessibilityRole="header"` en los títulos;
   `accessibilityLabel` en el `TextInput` y en el "Borrar".

Deliberadamente **no** tocado: el flujo de datos (store, serialize, envío), el copy
de navegación (acuerdo pendiente) y `mas.tsx` (su fila usa `Link asChild` sobre un
`Pressable`, y `Card` es un `View`: mezclarlos rompería el patrón de Expo Router;
mejor un futuro `PressableCard` o `ListRow` dedicado).

---

## 4. Recomendaciones para mobile-dev (sistema de componentes)

Patrón a seguir para todo lo que viene. Consumir **siempre** estas primitivas en vez
de estilos inline; si algo no encaja, ampliar la primitiva, no clonarla.

### 4.1 Convenciones
- Cada primitiva llama a `useAppTheme()` internamente (no recibe `t` por props). Las
  pantallas pasan `t` solo a sus sub-componentes privados de layout, como hoy.
- Nada de literales de color/tamaño/radio en las pantallas: todo desde tokens.
- A11y de serie: `accessibilityRole`, `label`, `state`, y `header` en títulos.

### 4.2 Cola de componentes a crear (por orden de necesidad)
1. **`SeverityChip`** (bloqueado por Lucide): pastilla `radiusPill` con
   **color `bg` + texto `fg` + icono** de `severityMeta` (regla 2.4). Consume
   `severityFromGravedad(gravedad)`. Es la pieza que hace "no solo color" en la ficha.
   Hasta tener `lucide-react-native`, se puede lanzar una versión solo color+texto
   (ya cumple la regla) y añadir el icono después.
2. **`CopyBulletinButton`** — variante de `Button` con el ciclo de éxito de §8.2 del
   sistema visual: háptico `notificationSuccess` + mutación a estado "Copiado" 1,2 s
   + `announceForAccessibility`. Es la acción estrella; merece componente propio.
3. **`SearchBar`** (§5.1): alto 56, lupa + input + micrófono 44×44, foco con
   `focusRing` 2 pt. Es el producto; que nazca como primitiva, no dentro de Inicio.
4. **`Toast`** (§5.9) y **`FooterSource`** (§5.9): transversales; el Toast lo pide ya
   la confirmación de "Guardar" del feedback.
5. **`PressableCard` / `ListRow`** — tarjeta pulsable para hubs (el "Más") y listas
   de resultados; resuelve el caso `Link asChild` que hoy impide reusar `Card`.
6. **`Field`** — envoltorio etiqueta + input (+ ayuda/error) para unificar el
   `TextInput` del feedback y los formularios de Documentos.

### 4.3 Iconos (fijar ya la estrategia, aunque se instale después)
- **Lucide** (`lucide-react-native` + `react-native-svg`), un solo set (§6.1). Trae
  dependencia nativa → entra **con su primera feature**, no antes (respeta ADR-010 y
  Expo Go actual). No mezclar con Phosphor.
- **Estado activo del tab = línea (inactivo) → relleno/pastilla (activo)**, además del
  color de marca, para no depender solo del color en la barra (regla 2.4). Dejar el
  `_layout.tsx` preparado para intercambiar `tabBarIcon` cuando Lucide entre.
- Mapa de iconos por concepto ya está en `02-ui.md §6.3`: usarlo tal cual. Prohibido
  cualquier símbolo de autoridad (escudo, gorra, coche patrulla).

### 4.4 Microinteracciones y háptico (cuando entre `expo-haptics`)
- "Guardar" feedback → `selectionAsync` + `Toast` "Guardado".
- "Copiar boletín" → `notificationAsync(Success)` + estado éxito del botón.
- Respetar `AccessibilityInfo.isReduceMotionEnabled` y el toggle `hapticsEnabled`
  (ya existe en `settings.ts`).

---

## 5. Checklist de aceptación por feature (para QA de campo)

- [ ] Cuerpo de contenido ≥ 16 pt; metadatos ≥ 14 pt.
- [ ] Todo control ≥ 44×44 (hitSlop si el visual es menor).
- [ ] Ninguna info solo por color (gravedad, estado, tab activo, festivo).
- [ ] Consume primitivas del sistema, cero estilos inline de color/tamaño.
- [ ] Modo oscuro real, sin bloques blancos a pantalla completa de noche.
- [ ] `maxFontSizeMultiplier` acotado en zonas de retícula crítica (ficha, cuadrante).
- [ ] Confirmación de acciones importantes (visual + háptico opcional).
- [ ] Cero símbolos oficiales; wordmark neutro.
