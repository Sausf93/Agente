# Cuadrante — rediseño del arranque (para que CUADRE)

> Perspectiva: diseño de producto. Ejecuta: `mobile-dev`. No toca código en este documento;
> es la especificación sin ambigüedad para implementar.
> Sistema visual: `docs/perspectivas/02-ui.md` + `apps/mobile/src/ui/theme.ts` (acento por
> cuerpo, gravedad y turno SIEMPRE color + letra/texto). Nada de apariencia oficial.
> Lógica pura que hay que tocar: `packages/shared/src/cuadrante.ts` (nuevo anclaje).

---

## 0. El problema, en una frase

El arranque actual pide **patrón + "Primer día del ciclo" (AAAA-MM-DD) + jornada**. El agente
**no sabe qué día de su ciclo cae en esa fecha** (nadie piensa "mi ciclo empezó el 3 de
septiembre"), así que teclea una fecha cualquiera y **el calendario no coincide con su turno
real**. Resultado: "se lo inventa y no cuadra nada". Además el alta es un formulario (tres
campos de escribir, uno con teclado numérico y validación de fecha) → "poco dinámico y
complicado".

**La raíz es conceptual, no cosmética:** `inicioCiclo` es teoría de ciclos. Hay que sustituirlo
por una pregunta que el agente sí sabe responder sin pensar: **"¿Qué turno tienes HOY?"**.

---

## 1. La idea: anclar por (día, turno), no por "inicio de ciclo"

El motor sigue proyectando desde `PatronTurno` + `inicioCiclo` (ADR-014, no se rompe nada). Lo
único que cambia es **cómo obtenemos `inicioCiclo`**: ya no lo escribe el agente, lo **calcula
el motor** a partir de un dato trivial y real.

```
  Agente dice:  "HOY (07/09) hago NOCHE"
                         │
                         ▼
  Motor busca en la secuencia del patrón dónde hay una "noche",
  y coloca el desfase para que HOY caiga justo en esa posición.
                         │
                         ▼
  inicioCiclo calculado  →  todo el calendario cuadra con la realidad
```

El agente nunca ve la palabra "ciclo" ni escribe una fecha. Solo elige su patrón y toca el turno
de hoy. En ≤ 3 toques está configurado **y cuadrando**.

### 1.1 La matemática (para `packages/shared/src/cuadrante.ts`)

Recordatorio del motor actual (no cambia):

```
indicePatron(inicioCiclo, fecha, L) = ((diasEntre(inicioCiclo, fecha) % L) + L) % L
servicioDeHoy = secuencia[indicePatron(inicioCiclo, hoy, L)]
```

Queremos el inverso: dado que en `fechaAncla` el turno es `servicioAncla`, hallar `inicioCiclo`.

1. Buscar las posiciones del ciclo donde aparece ese turno:
   `I = [ i : secuencia[i] === servicioAncla ]`.
2. Elegir una ocurrencia `k` (por defecto 0; el preview permite cambiarla — ver §4.2).
3. `inicioCiclo = sumarDias(fechaAncla, -I[k])`.

Comprobación: `indicePatron(inicioCiclo, fechaAncla, L) = I[k]`, y `secuencia[I[k]] === servicioAncla`. ✔

**Ejemplo real** (patrón GC `M M T T N N · S · L L L`, longitud 10; hoy = 2026-09-07):

| El agente dice | Ocurrencias del turno | k=0 → índice | `inicioCiclo` | Proyección desde hoy |
|---|---|---|---|---|
| "hoy Mañana" | [0,1] | 0 | 2026-09-07 | M M T T N N S L L L |
| "hoy Noche"  | [4,5] | 4 | 2026-09-03 | N N S L L L M M T T |
| "hoy Saliente" | [6] | 6 | 2026-09-01 | S L L L M M T T N N |

### 1.2 Funciones puras a añadir en `shared` (con tests obligatorios)

```ts
/** Turnos DISTINTOS presentes en un patrón, en orden de aparición.
 *  Alimenta los botones "¿Qué haces hoy?": así nunca se ofrece un turno que el patrón no tiene. */
export function turnosDelPatron(patron: PatronTurno): TipoServicio[];

/** Índices de la secuencia donde aparece `servicio` (para desambiguar y contar ocurrencias). */
export function ocurrenciasEnPatron(
  secuencia: readonly TipoServicio[],
  servicio: TipoServicio,
): number[];

/** Calcula el `inicioCiclo` que hace que en `fechaAncla` el patrón proyecte `servicioAncla`.
 *  `ocurrencia` (0-based, se toma módulo nº de ocurrencias) elige la posición del ciclo cuando
 *  el turno se repite. Lanza si `servicioAncla` no está en el patrón (no debería pasar: los
 *  botones salen de `turnosDelPatron`). */
export function anclarInicioCiclo(
  secuencia: readonly TipoServicio[],
  fechaAncla: string,
  servicioAncla: TipoServicio,
  ocurrencia?: number,
): string;
```

Casos de test mínimos: cada turno de cada patrón predefinido; que la proyección en `fechaAncla`
devuelve `servicioAncla`; ocurrencia que envuelve (k ≥ nº ocurrencias usa módulo); turno ausente
lanza; anclaje idempotente (anclar y volver a proyectar da el mismo turno para cualquier k).

### 1.3 Persistir el ancla (recomendado, aditivo y compatible)

`Cuadrante` seguirá guardando `inicioCiclo` (nada se rompe). **Recomendado** añadir un campo
**opcional** en la config para recordar el ancla original:

```ts
ancla?: { fecha: string; servicio: TipoServicio; ocurrencia: number } | null
```

Por qué: si el agente **cambia de patrón** más adelante, recomputamos `inicioCiclo` con
`anclarInicioCiclo(nuevaSecuencia, ancla.fecha, ancla.servicio, ...)` sin volver a preguntarle
nada, y el cuadrante sigue cuadrando. Es aditivo: los cuadrantes sin `ancla` funcionan igual
(ya tienen `inicioCiclo`). Migración de datos = columna nueva NULL (una `user_version` más);
las excepciones manuales siguen siendo sagradas (ADR-014). Si el turno del ancla no existe en
el nuevo patrón, se re-pregunta el turno de hoy (mini-paso, no todo el alta).

---

## 2. Flujo de arranque, paso a paso (una sola pantalla, viva)

No son tres pantallas encadenadas: es **una pantalla que se va rellenando y muestra el preview
todo el rato**. Momento C (en casa, sin prisa), pero igualmente sobrio y a prueba de torpeza.

```
┌─────────────────────────────────────────────┐
│  Tu cuadrante                                 │  título titleXL
│  Dos toques y lo tienes cuadrado con tu turno │  body, textSecondary
│                                               │
│  🛡  No se pierde · sin cobertura · sobrevive  │  Banner success (una línea)
│      a las actualizaciones                    │
│                                               │
│  ①  ¿QUÉ TURNOS HACES?                         │  label
│  ┌───────────────────────────────────────┐   │
│  │ ● 6 servicios + saliente + 3 libres   │   │  ← tarjeta seleccionada (acento)
│  │   Ciclo de 10 días · MMTTNN·S·LLL     │   │     mini-tira de colores/letras
│  ├───────────────────────────────────────┤   │
│  │ ○ Semana sí, semana no (7+7)          │   │
│  │ ○ Rueda M/T/N (semanal)               │   │
│  │ ○ Oficina: L–V de mañana              │   │
│  └───────────────────────────────────────┘   │
│  Es un punto de partida: luego ajustas días.  │  caption, textTertiary
│                                               │
│  ②  ¿QUÉ HACES HOY, LUNES 7?                   │  label
│  ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐    │  botones 56dp, color+letra
│  │Mañana││Tarde ││Noche ││Salien││Libre │    │  (solo los del patrón)
│  └──────┘└──────┘└──────┘└──────┘└──────┘    │
│  ¿Hoy libras o es raro? [ Elegir otro día ▾ ]│  enlace, textSecondary
│                                               │
│  ─── VISTA PREVIA (esta semana) ────────────  │  se pinta al elegir turno
│   L    M    X    J    V    S    D             │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐          │
│  │N◉│ │N │ │S │ │L │ │L │ │L │ │M │          │  ◉ = HOY, borde de acento
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘          │
│  ¿No cuadra? tu turno de hoy es el 1.º        │  fila de desambiguación (§4.2)
│  [ ‹ ]  1.ª noche del ciclo  [ › ]            │
│                                               │
│  ▸ Ajustes finos (jornada, franja nocturna)   │  acordeón plegado (§3)
│                                               │
│  ┌───────────────────────────────────────┐   │
│  │           Empezar a usarlo             │   │  botón primario 52dp
│  └───────────────────────────────────────┘   │  (activo desde que hay turno de hoy)
└─────────────────────────────────────────────┘
```

### Recorrido de ≤ 3 toques

1. **Toque 1 — patrón.** Al tocar, la tarjeta se tiñe con el acento del cuerpo y aparece su
   mini-tira de ciclo (letras M/T/N/S/L con su color). Los botones del paso ② se rellenan con
   **solo los turnos que ese patrón contiene** (`turnosDelPatron`). *(El patrón por defecto ya
   viene preseleccionado según el cuerpo del perfil → este toque a veces sobra.)*
2. **Toque 2 — "¿Qué haces hoy?".** Al tocar el turno, se calcula `inicioCiclo`
   (`anclarInicioCiclo`) y **el preview de la semana se pinta al instante**, con HOY marcado.
   El botón "Empezar a usarlo" se activa.
3. **Toque 3 — "Empezar a usarlo".** Crea el cuadrante y entra en la vista de mes ya cuadrada.

La jornada y la franja nocturna **ya no bloquean el alta**: tienen valores por defecto
sensatos y se afinan en el acordeón "Ajustes finos" o después en Ajustes del cuadrante.

### Copys exactos

- Título: **"Tu cuadrante"**. Subtítulo: **"Dos toques y lo tienes cuadrado con tu turno."**
- Banner: **"No se pierde · funciona sin cobertura · sobrevive a las actualizaciones."**
- Paso ①: **"¿Qué turnos haces?"** · pie: **"Es un punto de partida: luego ajustas los días
  sueltos que no encajen."**
- Paso ②: **"¿Qué haces hoy, {díaSemana} {díaMes}?"** (p. ej. "¿Qué haces hoy, lunes 7?").
- Enlace de día alternativo: **"¿Hoy libras o es un día raro? Elegir otro día"**.
- Desambiguación: **"¿No cuadra? Dime cuál de tus turnos es el de hoy"** + etiqueta
  **"{ordinal} {turno} del ciclo"** (p. ej. "2.ª noche del ciclo").
- Botón: **"Empezar a usarlo"**.
- Ajustes finos (acordeón): **"Jornada de referencia (h/semana)"** con nota **"El exceso se
  calcula sobre esta cifra. No todos los cuerpos son 37,5 h."** y **"Franja nocturna"** (por
  defecto 22:00–06:00).

---

## 3. "Elegir otro día" y ajustes finos (casos de borde, sin ensuciar el camino)

- **Elegir otro día**: si hoy el agente libra o está de vacaciones (turno que quizá no está en
  el patrón), el enlace abre un selector de fecha compacto (rueda nativa o los tres campos, pero
  **por debajo del pliegue**). Cambia el rótulo del paso ② a **"¿Qué haces el {fecha}?"** y el
  anclaje usa esa fecha. El 95 % de la gente no lo tocará: el ancla natural es HOY.
- **Ajustes finos** (acordeón plegado por defecto): jornada de referencia (default 37.5) y
  franja nocturna (default 22:00–06:00). No son requisito para crear; se pueden dejar y cambiar
  luego. Nunca deben aparecer como campos obligatorios de escritura en el camino principal.

---

## 4. Dinamismo (lo que sube la sensación de "vivo")

### 4.1 Vista previa en vivo

- El patrón trae una **mini-tira del ciclo** (una fila de celdas M/T/N/S/L con su color y letra)
  que se ve al seleccionarlo, **antes** de anclar. Es "ver el ciclo pintado al elegir" (§8.5 UX).
- Al tocar el turno de hoy, aparece/actualiza el **preview de la semana actual** (L–D), con la
  celda de HOY resaltada con borde de acento (`focusRing`). Cambiar el turno de hoy **re-pinta**
  el preview con una transición suave (fade+translate ≤ 240 ms, `durBase`; se respeta
  reduce-motion). Reusa el componente de celda del mes (misma `CeldaDia`).

### 4.2 Desambiguación por preview (turnos repetidos)

Cuando el turno elegido aparece varias veces en el ciclo (p. ej. dos noches seguidas en GC),
por defecto se ancla a la **1.ª ocurrencia** (`k=0`). Debajo del preview aparece una fila:

```
¿No cuadra? Dime cuál de tus turnos es el de hoy
[ ‹ ]   2.ª noche del ciclo   [ › ]
```

Cada toque en ‹ / › hace `k = (k±1) mod nOcurrencias`, recalcula `inicioCiclo` y **re-pinta el
preview**. El agente ve literalmente cómo se desplazan los días de alrededor hasta que coincide
con su realidad (mañana saliente vs. mañana otra noche). Un toque, sin teoría. Si el turno
aparece una sola vez, esta fila no se muestra.

### 4.3 Turno = color + LETRA (regla dura)

Cada celda (preview y mes) lleva **siempre** su abreviatura (M/T/N/S/L) además del color
(`servicioVisual.ts`, 02-ui.md §5.7). Nunca solo color. Festivo = punto + número en `danger`.

### 4.4 Editar un día en un toque (ya existe, se conserva)

Tocar un día abre la hoja inferior con los turnos como chips grandes: 1 toque abre + 1 toque
cambia + guardar. La edición manual es **sagrada** (ADR-014). Un día editado a mano lleva borde
de acento para distinguirlo del proyectado.

### 4.5 Resumen de horas SIEMPRE arriba

La tarjeta de resumen (Total · Nocturnas · Festivas · Noches + exceso sobre referencia) se
mantiene fija en la parte alta de la vista de mes. Es a lo que entra el agente ("¿cuántas
nocturnas llevo?"); dárselo sin un toque más.

### 4.6 Deslizar entre meses

Además de las flechas ‹ ›, permitir **swipe horizontal** para cambiar de mes (gesto grande, no
de precisión; apto para guantes). La cabecera "Mes AAAA" hace de ancla. Transición `durBase`.
Implementación sugerida: `react-native-gesture-handler` + `react-native-reanimated` (ya previstos
en el stack) o `FlatList` paginado horizontal de meses; evitar dependencias nuevas si es posible.

---

## 5. Cambios para mobile-dev (resumen accionable)

1. **`packages/shared/src/cuadrante.ts`**: añadir `turnosDelPatron`, `ocurrenciasEnPatron` y
   `anclarInicioCiclo` (§1.2) con tests al 100 % (núcleo crítico, CLAUDE.md).
2. **`packages/shared/src/user.ts`**: `Cuadrante` gana `ancla?` opcional (§1.3). Aditivo.
3. **`apps/mobile` store (`crear`)**: aceptar `{ patron, ancla, jornadaRefHorasSemana? }` y
   derivar `inicioCiclo = anclarInicioCiclo(patron.secuencia, ancla.fecha, ancla.servicio,
   ancla.ocurrencia)`. Persistir `ancla`. Nueva `user_version` para la columna. `cambiarPatron`
   recomputa `inicioCiclo` desde `ancla` si existe y el turno sigue en el patrón.
4. **`CuadranteScreen` — `Onboarding`**: reescribir según §2. Fuera el campo de texto "Primer
   día del ciclo" y el bloqueo por jornada. Dentro: selección de patrón con mini-tira, botones
   grandes "¿Qué haces hoy?" derivados de `turnosDelPatron`, preview de semana en vivo, fila de
   desambiguación, acordeón de ajustes finos, botón "Empezar a usarlo".
5. **`VistaMes`**: añadir swipe entre meses (§4.6). El resto se conserva.
6. **Tema**: todo con `useAppTheme` y acento por cuerpo; cero colores sueltos; turno siempre
   color + letra.

---

## 6. Criterios de aceptación

- [ ] El alta **no** contiene ningún campo donde escribir una fecha ni la palabra "ciclo".
- [ ] Tras elegir patrón (o con el de por defecto) y tocar **un** turno de hoy, el preview de la
      semana se pinta y "Empezar a usarlo" queda activo. **≤ 3 toques** hasta crear.
- [ ] La proyección resultante hace que **el turno de HOY en el calendario coincida** con el que
      el agente indicó (verificable en el propio preview y en la vista de mes).
- [ ] Si el turno de hoy se repite en el ciclo, la fila ‹/› permite corregir la ocurrencia y el
      preview cambia en vivo; con una sola ocurrencia, la fila no aparece.
- [ ] Los botones "¿Qué haces hoy?" solo ofrecen turnos presentes en el patrón elegido.
- [ ] Jornada y franja nocturna tienen defaults y **no bloquean** el alta.
- [ ] Cambiar de patrón después **no** vuelve a pedir la fecha de inicio (usa `ancla`) y **no**
      borra excepciones manuales.
- [ ] Cada celda de turno lleva color **y** letra; festivo con doble señal; celda de HOY con
      borde de acento. Contraste AA; toques ≥ 44 dp; botones de turno ≥ 56 dp.
- [ ] Se puede deslizar entre meses además de las flechas.
- [ ] Tests puros nuevos en `shared` en verde (anclaje). Sin apariencia oficial en ningún punto.

---

## 7. Mockup

`docs/diseno/cuadrante-arranque.html` — mockup navegable del arranque (modo oscuro, acento GC):
selección de patrón con mini-tira, botones "¿Qué haces hoy?", preview de semana que se re-pinta
al elegir turno y desambiguación ‹/› en vivo. Abrir en el navegador para ver el dinamismo.
