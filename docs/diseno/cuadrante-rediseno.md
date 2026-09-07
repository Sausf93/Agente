# Cuadrante — rediseño del arranque (para que CUADRE, sin teoría de ciclos)

> Perspectiva: diseño de producto. Ejecuta: `mobile-dev`. No toca código en este documento;
> es la especificación sin ambigüedad para implementar.
> Sistema visual: `docs/perspectivas/02-ui.md` + `apps/mobile/src/ui/theme.ts` (acento por
> cuerpo, gravedad y turno SIEMPRE color + letra/texto). Nada de apariencia oficial.
> Lógica pura que hay que tocar: `packages/shared/src/cuadrante.ts` (nuevo anclaje).

---

## 0. El problema, en una frase (y por qué la primera solución no bastó)

**Ronda 1 (formulario).** El arranque pedía **patrón + "Primer día del ciclo" (AAAA-MM-DD) +
jornada**. El agente **no sabe qué día de su ciclo cae en esa fecha** (nadie piensa "mi ciclo
empezó el 3 de septiembre"), tecleaba una fecha cualquiera y el calendario no cuadraba. Formulario
frío, tres campos de escribir. → Se sustituyó por **"¿Qué haces HOY?"** y anclaje calculado.

**Ronda 2 (la trampa del ordinal).** Preguntar solo "¿qué haces hoy?" no basta cuando el turno se
repite en el ciclo (en GC hay **dos mañanas, dos tardes, dos noches y tres libres**). La primera
iteración lo resolvía con una fila `‹ / ›`: *"¿1.ª o 2.ª mañana del ciclo?"*. **Ese es justo el
error de fondo que hay que matar:** obliga al agente a **pensar en términos de ciclo** —a saber si
la mañana de hoy es "la primera o la segunda del bloque"—, un concepto que **no tiene en la
cabeza**. Nadie razona "hoy es mi segunda noche del ciclo de diez días". Piensa: "hoy noche, mañana
noche, pasado saliente".

**La raíz, definitiva:** hay que eliminar **toda** teoría de ciclos de la interfaz —tanto la fecha
de inicio como el ordinal— y quedarnos con **lo único que el agente sabe sin pensar: qué hace cada
día**. La app deduce el ciclo a partir de **unos pocos días seguidos**, no al revés.

---

## 1. La idea correcta: anclar por DÍAS SEGUIDOS

El motor sigue proyectando desde `PatronTurno` + `inicioCiclo` (ADR-014, intacto). Lo único que
cambia es **cómo se obtiene `inicioCiclo`**: ya no se escribe ni se elige un ordinal. El agente
**dice qué hace hoy, mañana, pasado…**, y la app, tras **cada** día, calcula cuántas posiciones del
ciclo siguen siendo consistentes con lo dicho. En cuanto queda **una sola**, el cuadrante está
anclado y cuadra.

```
   Hoy (lun 7)   → NOCHE     ⇒ encajan 2 posiciones del ciclo   (necesito otro día)
   Mañana (mar 8)→ NOCHE     ⇒ encaja 1 posición                ✓ ya cuadra → preview → fin
```

El agente **nunca** ve la palabra "ciclo", ni escribe una fecha, ni elige "1.ª/2.ª". Solo toca lo
que hace cada día. La app le pide **exactamente los días que necesita** para desambiguar (casi
siempre 1 o 2; a veces 3 si empieza en una racha de libres) y **para de preguntar en cuanto cuadra**.

### 1.1 La matemática (para `packages/shared/src/cuadrante.ts`)

Recordatorio del motor actual (no cambia):

```
indicePatron(inicioCiclo, fecha, L) = ((diasEntre(inicioCiclo, fecha) % L) + L) % L
servicioDeHoy = secuencia[indicePatron(inicioCiclo, hoy, L)]
```

Definimos un **desfase** `d ∈ [0, L)` como una hipótesis: *"hoy (`fechaBase`) cae en la posición
`d` del ciclo"*. Bajo esa hipótesis, el turno del día `fechaBase + i` es `secuencia[(d + i) mod L]`.

Dada la secuencia de turnos que el agente ha ido diciendo en días **consecutivos** desde
`fechaBase`, `turnos = [t₀, t₁, …, tₙ₋₁]`, un desfase `d` es **compatible** si y solo si:

```
para todo i ∈ [0, n):  secuencia[(d + i) mod L] === turnos[i]
```

`offsetsCompatibles` devuelve **todos** los `d` compatibles. La cardinalidad de esa lista es el
motor de todo el flujo:

| `offsetsCompatibles(...).length` | Significado | Acción de UI |
|---|---|---|
| **1** | El ciclo queda fijado sin ambigüedad | Ancla: `inicioCiclo = fechaBase − d días`. Preview + "ya cuadra". Fin. |
| **> 1** | Aún ambiguo (varias posiciones encajan) | Revela **el siguiente día** automáticamente. "Necesito un día más para afinar." |
| **0** | Ningún desfase encaja con lo dicho | Aviso: no encaja con este patrón; ¿seguro que es tu patrón? ¿o ese día fue una excepción? Ofrece corregir. |

Anclaje final, cuando queda un único `d`:

```
inicioCiclo = sumarDias(fechaBase, -d)
```

Comprobación: `indicePatron(inicioCiclo, fechaBase, L) = d`, y `secuencia[d] === turnos[0]`. Y por
construcción cada `turnos[i]` coincide con la proyección de `fechaBase + i`. ✔

**Ejemplo real** (patrón GC `M M T T N N · S · L L L`, longitud 10; hoy = lun 2026-09-07). Los diez
desfases dan estas proyecciones desde hoy:

| d | Secuencia proyectada desde hoy |
|---|---|
| 0 | M M T T N N S L L L |
| 1 | M T T N N S L L L M |
| 2 | T T N N S L L L M M |
| 3 | T N N S L L L M M T |
| 4 | N N S L L L M M T T |
| 5 | N S L L L M M T T N |
| 6 | S L L L M M T T N N |
| 7 | L L L M M T T N N S |
| 8 | L L M M T T N N S L |
| 9 | L M M T T N N S L L |

Tres recorridos, para ver cómo converge:

| El agente dice (días seguidos) | Tras cada día, desfases compatibles | Resultado |
|---|---|---|
| Hoy **M** | día 1 → {0, 1} | ambiguo → pide mañana |
| … mañana **M** | día 2 → {0} | **✓ cuadra** (`inicioCiclo` = lun 7) |
| Hoy **S** | día 1 → {6} | **✓ cuadra** al primer día (saliente es único) |
| Hoy **L** | día 1 → {7, 8, 9} | ambiguo → pide mañana |
| … mañana **L** | día 2 → {7, 8} | sigue ambiguo → pide pasado |
| … pasado **L** | día 3 → {7} | **✓ cuadra** (`inicioCiclo` = jue 3) |

Y un caso de **0** (excepción o patrón equivocado):

| El agente dice | Compatibles | Resultado |
|---|---|---|
| Hoy **N**, mañana **T** | día 2 → {} | En GC ninguna noche va seguida de tarde → **aviso "no encaja"** |

> **Por qué converge tan rápido:** un turno suelto es ambiguo (M, T, N aparecen dos veces; L tres;
> solo S es único), pero **dos días seguidos** son muy discriminantes: la transición
> "mañana→mañana" solo ocurre en un punto del ciclo, "noche→saliente" en otro, etc. En el patrón GC
> el peor caso son **tres días** (arrancar dentro de la racha de tres libres). Nunca hace falta
> "pensar en el ciclo".

### 1.2 Funciones puras a añadir en `shared` (con tests obligatorios)

```ts
/** Turnos DISTINTOS presentes en un patrón, en orden canónico M,T,N,S,L.
 *  Alimenta los botones de cada día: así nunca se ofrece un turno que el patrón no tiene. */
export function turnosDelPatron(patron: PatronTurno): TipoServicio[];

/**
 * Desfases del ciclo (0..L-1) consistentes con una secuencia de turnos observados en días
 * CONSECUTIVOS a partir de `fechaBase`. Un desfase `d` significa "hoy (fechaBase) cae en la
 * posición d del ciclo". Es compatible si, para cada día i, secuencia[(d+i) mod L] === turnos[i].
 *
 *  - length === 0  → esos días NO encajan con este patrón (excepción o patrón erróneo).
 *  - length === 1  → el cuadrante YA está anclado (ver `inicioCicloDesdeOffset`).
 *  - length  >  1  → aún ambiguo: pedir el siguiente día.
 *
 * Con `turnos` vacío devuelve los L desfases (todo es posible aún). Sustituye por completo a la
 * desambiguación por ordinal: el agente nunca elige "1.ª/2.ª mañana".
 */
export function offsetsCompatibles(
  patron: PatronTurno,
  fechaBase: string,
  turnos: readonly TipoServicio[],
): number[];

/** `inicioCiclo` a partir de (fechaBase, desfase único). Solo se llama cuando
 *  `offsetsCompatibles(...).length === 1`, con `offset = offsetsCompatibles(...)[0]`. */
export function inicioCicloDesdeOffset(fechaBase: string, offset: number): string;
```

`offsetsCompatibles` es **pura y barata** (recorre L desfases × n días; L ≤ ~21, n ≤ 3). La UI
recalcula sobre el array completo `turnos` tras cada toque; no hay estado incremental que mantener.

Casos de test mínimos (núcleo crítico, cobertura al 100 % — regla `CLAUDE.md`):
- Con `turnos = []`, devuelve `[0..L-1]`.
- Cada recorrido del ejemplo §1.1 (M,M → {0}; S → {6}; L,L,L → {7}; N,T → {}).
- Convergencia: para **cualquier** `inicioCiclo` sembrado y cualquier `fechaBase`, si se alimenta la
  proyección real día a día, `offsetsCompatibles` llega a `length === 1` y el desfase resultante
  reproduce el `inicioCiclo` original (idempotencia anclaje↔proyección).
- Un turno que **no** está en el patrón produce `[]` (nunca lanza; el 0 es un estado válido de UI).
- `inicioCicloDesdeOffset(fechaBase, d)` proyecta en `fechaBase` el turno `secuencia[d]`.

### 1.3 Persistir el ancla (recomendado, aditivo y compatible)

`Cuadrante` seguirá guardando `inicioCiclo` (nada se rompe). **Recomendado** guardar además los
días que el agente tecleó, para poder re-anclar si cambia de patrón:

```ts
ancla?: { fechaBase: string; turnos: TipoServicio[] } | null
```

Por qué: si el agente **cambia de patrón** más adelante, recomputamos
`offsetsCompatibles(nuevoPatron, ancla.fechaBase, ancla.turnos)`:
- `length === 1` → re-anclamos con `inicioCicloDesdeOffset` **sin preguntar nada** y el cuadrante
  sigue cuadrando.
- `length !== 1` → los días guardados ya no bastan (o no encajan) con el patrón nuevo → se re-pide
  el mini-flujo de días (no todo el alta). Las excepciones manuales siguen intactas (ADR-014).

Es aditivo: los cuadrantes sin `ancla` funcionan igual (ya tienen `inicioCiclo`). Migración = columna
nueva NULL (una `user_version` más). **Sustituye** al `ancla?: { fecha, servicio, ocurrencia }` de la
iteración por ordinal (que ya no existe).

---

## 2. Flujo de arranque, paso a paso (una sola pantalla, viva)

No son varias pantallas: es **una pantalla que se va rellenando y muestra el preview todo el rato**.
Momento C (en casa, sin prisa), pero sobrio y a prueba de torpeza.

```
┌─────────────────────────────────────────────┐
│  Tu cuadrante                                 │  título titleXL
│  Dime qué haces estos días y lo cuadro solo   │  body, textSecondary
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
│  ②  ¿QUÉ HACES ESTOS DÍAS?                     │  label
│  ┌───────────────────────────────────────┐   │
│  │ Hoy · lun 7                            │   │  fila de día (activa)
│  │ [Mañana][Tarde][Noche][Salien][Libre]  │   │  botones 56dp, color+letra
│  ├───────────────────────────────────────┤   │
│  │ Mañana · mar 8            (se revela)   │   │  fila del día siguiente
│  │ [Mañana][Tarde][Noche][Salien][Libre]  │   │  aparece solo si hace falta
│  └───────────────────────────────────────┘   │
│  ↺ Encajan 2 posiciones · dime qué haces      │  contador de alineaciones
│     mañana para afinar                        │  (info)  →  ✓ "Ya cuadra" en verde
│  ¿Hoy libras o es raro? [ Empezar otro día ▾ ]│  enlace, textSecondary
│                                               │
│  ─── VISTA PREVIA (esta semana) ────────────  │  se pinta desde el 1.er turno
│   L    M    X    J    V    S    D             │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐          │
│  │N◉│ │N │ │S │ │L │ │L │ │L │ │M │          │  ◉ = HOY, borde de acento
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘          │  días dichos = confirmados
│                                               │
│  ▸ Ajustes finos (jornada, franja nocturna)   │  acordeón plegado (§5)
│                                               │
│  ┌───────────────────────────────────────┐   │
│  │           Empezar a usarlo             │   │  botón primario 52dp
│  └───────────────────────────────────────┘   │  (activo SOLO cuando cuadra)
└─────────────────────────────────────────────┘
```

### Recorrido (2–4 toques según convergencia)

1. **Elegir patrón.** Al tocar, la tarjeta se tiñe con el acento del cuerpo y aparece su mini-tira
   de ciclo (letras M/T/N/S/L con su color). Los botones del paso ② se rellenan con **solo los
   turnos que ese patrón contiene** (`turnosDelPatron`). *(El patrón por defecto ya viene
   preseleccionado según el cuerpo del perfil → este paso a veces sobra.)*
2. **"¿Qué haces hoy?"** El agente toca el turno de hoy. La app recalcula `offsetsCompatibles`:
   - queda **1** → se ancla, el preview se pinta nítido y aparece **✓ "Ya cuadra"**. El botón
     "Empezar a usarlo" se activa. **Fin en un solo día** (p. ej. si hoy es saliente).
   - quedan **varias** → aparece el **contador** ("Encajan N posiciones… dime qué haces mañana") y
     **se revela automáticamente la fila del día siguiente**.
3. **"¿Y mañana?" / "¿Y pasado?"** El agente toca el turno de mañana; se recalcula; el contador baja.
   En cuanto queda **1**, cuadra y se detiene (no pide días de más). Casi siempre termina en el 2.º día.
4. **"Empezar a usarlo".** Crea el cuadrante ya cuadrado y entra en la vista de mes.

La jornada y la franja nocturna **no bloquean el alta**: tienen defaults sensatos y se afinan en el
acordeón "Ajustes finos" o después en Ajustes del cuadrante.

### Copys exactos

- Título: **"Tu cuadrante"**. Subtítulo: **"Dime qué haces estos días y lo cuadro yo solo."**
- Banner: **"No se pierde · funciona sin cobertura · sobrevive a las actualizaciones."**
- Paso ①: **"¿Qué turnos haces?"** · pie: **"Es un punto de partida: luego ajustas los días
  sueltos que no encajen."**
- Paso ②: **"¿Qué haces estos días?"**. Etiqueta de cada fila de día: **"Hoy · {díaSem} {díaMes}"**,
  **"Mañana · {díaSem} {díaMes}"**, **"Pasado · {díaSem} {díaMes}"** y, del 4.º en adelante,
  **"{díaSem} {díaMes}"** (p. ej. "jue 10").
- Contador (varias): **"Encajan {n} posiciones del ciclo · dime qué haces {siguienteDía} para
  afinar"** (siguienteDía = "mañana", "pasado" o "el {díaSem}").
- Cuadra: **"✓ Ya cuadra con tu turno"** (en `success`).
- No encaja (cero): **"Esto no encaja con este patrón. ¿Seguro que es tu patrón? ¿O ese día fue una
  excepción (un cambio con un compañero, un refuerzo…)?"** con acciones **"Corregir el último día"**
  y **"Ese día fue una excepción"**.
- Enlace de día alternativo: **"¿Hoy libras o es un día raro? Empezar por otro día"**.
- Botón: **"Empezar a usarlo"**.
- Ajustes finos (acordeón): **"Jornada de referencia (h/semana)"** con nota **"El exceso se calcula
  sobre esta cifra. No todos los cuerpos son 37,5 h."** y **"Franja nocturna"** (por defecto
  22:00–06:00).

---

## 3. Los tres casos, en detalle

### 3.1 Caso "1" — cuadra

`offsetsCompatibles(...).length === 1`. Se ancla con `inicioCicloDesdeOffset`, se pinta el preview
nítido con HOY marcado, aparece **✓ "Ya cuadra con tu turno"** en verde y el CTA se habilita. No se
revelan más filas de día. Es el final feliz; con S (saliente) ocurre al primer toque.

### 3.2 Caso "varias" — un día más

`length > 1`. La app **no** pide al agente que elija entre posiciones (eso era el ordinal
prohibido): simplemente muestra el contador honesto ("Encajan N posiciones… dime qué haces mañana")
y **revela la fila del día siguiente**, ya enfocada. El agente sigue contestando "qué hace",
que es lo único que sabe. El preview mientras tanto es **provisional**: los días ya dichos se
pintan **confirmados** (relleno del turno + tilde), y el resto se proyecta desde el primer desfase
compatible con una marca de **"estimado"** hasta que cuadre.

### 3.3 Caso "0" — no encaja

`length === 0`. Puede pasar aunque los botones solo ofrezcan turnos del patrón (p. ej. en GC teclear
"M, M, M": ningún punto del ciclo tiene tres mañanas seguidas). Significa **una de dos**:
- **El patrón elegido no es el suyo** → invita a volver al paso ① y probar otro, o a ajustar el
  patrón (los patrones son editables, ADR-014.4).
- **Uno de esos días fue una excepción** (cambio con un compañero, refuerzo, permiso) → **"Ese día
  fue una excepción"** descarta ese día del anclaje (no cuenta para deducir el ciclo; se podrá
  marcar luego como excepción manual en el mes) y sigue con el resto. **"Corregir el último día"**
  deshace el último toque por si fue un desliz.

Nunca es un callejón sin salida ni un error rojo de "datos inválidos": es una conversación.

---

## 4. Dinamismo (lo que sube la sensación de "vivo")

### 4.1 Mini-tira del ciclo y preview en vivo

- El patrón trae una **mini-tira del ciclo** (fila de celdas M/T/N/S/L con su color y letra) que se
  ve al seleccionarlo, **antes** de anclar (§8.5 UX).
- El **preview de la semana** (L–D con HOY resaltado, `focusRing`) se pinta en cuanto hay un primer
  turno y se **re-pinta** con cada día que se añade (fade+translate ≤ 240 ms, `durBase`; respeta
  reduce-motion). Reusa la `CeldaDia` del mes.

### 4.2 El contador de alineaciones sustituye a la desambiguación por ordinal

Donde antes había una fila `‹ 2.ª noche del ciclo ›` (teoría de ciclo), ahora hay una **línea de
estado honesta** que refleja `offsetsCompatibles(...).length`:
- `> 1` → "Encajan N posiciones del ciclo · dime qué haces mañana para afinar" (tono `info`), y se
  revela el día siguiente. El agente **ve el número bajar** a medida que contesta: es el feedback
  de que la app está "afinando" con sus respuestas.
- `1` → "✓ Ya cuadra con tu turno" (tono `success`).
- `0` → el bloque de aviso del §3.3.

El agente nunca elige un ordinal ni piensa en el ciclo; solo responde qué hace y observa cómo la app
converge. Un dato por toque, cero abstracción.

### 4.3 Turno = color + LETRA (regla dura)

Cada celda (preview, mini-tira y mes) lleva **siempre** su abreviatura (M/T/N/S/L) además del color
(`servicioVisual.ts`, 02-ui.md §5.7). Nunca solo color. Festivo = punto + número en `danger`.

### 4.4 Editar un día en un toque (ya existe, se conserva)

Tocar un día del mes abre la hoja inferior con los turnos como chips grandes: 1 toque abre + 1 toque
cambia + guardar. La edición manual es **sagrada** (ADR-014). Un día editado a mano lleva borde de
acento para distinguirlo del proyectado.

### 4.5 Resumen de horas SIEMPRE arriba

La tarjeta de resumen (Total · Nocturnas · Festivas · Noches + exceso sobre referencia) se mantiene
fija en la parte alta de la vista de mes.

### 4.6 Deslizar entre meses

Además de las flechas ‹ ›, permitir **swipe horizontal** para cambiar de mes (gesto grande, apto
para guantes). Transición `durBase`.

---

## 5. "Empezar por otro día" y ajustes finos (bordes, sin ensuciar el camino)

- **Empezar por otro día**: si hoy el agente libra o es un día raro y prefiere anclar desde otra
  fecha, el enlace abre un selector de fecha compacto (rueda nativa, **por debajo del pliegue**).
  Cambia `fechaBase` y las etiquetas de las filas ("Hoy" pasa a ser esa fecha; las siguientes son
  sus consecutivas). El anclaje funciona igual. El 95 % no lo tocará: el ancla natural es HOY.
- **Ajustes finos** (acordeón plegado): jornada de referencia (default 37.5) y franja nocturna
  (default 22:00–06:00). No son requisito para crear.

---

## 6. Cambios para mobile-dev (resumen accionable)

1. **`packages/shared/src/cuadrante.ts`**: añadir `turnosDelPatron`, `offsetsCompatibles` e
   `inicioCicloDesdeOffset` (§1.2) con tests al 100 %. **Eliminar** `anclarInicioCiclo` /
   `ocurrenciasEnPatron` de la iteración por ordinal (o dejarlos deprecados) — ya no se usan en UI.
2. **`packages/shared/src/user.ts`**: `Cuadrante.ancla` pasa a `{ fechaBase, turnos }` (§1.3).
   Aditivo respecto a `inicioCiclo`.
3. **`apps/mobile` store (`crear`)**: aceptar `{ patron, ancla: { fechaBase, turnos },
   jornadaRefHorasSemana? }` y derivar `inicioCiclo` con
   `inicioCicloDesdeOffset(ancla.fechaBase, offsetsCompatibles(patron, ancla.fechaBase, ancla.turnos)[0])`
   (garantizado `length === 1` en el momento de crear). Persistir `ancla`. Nueva `user_version`.
   `cambiarPatron` recomputa desde `ancla` (§1.3): si `length === 1` re-ancla en silencio; si no,
   re-lanza el mini-flujo de días sin borrar excepciones.
4. **`CuadranteScreen` — `Onboarding`**: reescribir según §2. Fuera el campo de texto "Primer día
   del ciclo", fuera el bloqueo por jornada y **fuera la fila `‹/›` de ordinal**. Dentro: patrón con
   mini-tira, **filas de día que se revelan una a una** con botones grandes (turnos de
   `turnosDelPatron`), **contador de alineaciones** que refleja `offsetsCompatibles(...).length`,
   preview en vivo, bloque de aviso del caso 0, acordeón de ajustes finos, CTA activo solo al cuadrar.
5. **`VistaMes`**: swipe entre meses (§4.6). El resto se conserva.
6. **Tema**: todo con `useAppTheme` y acento por cuerpo; cero colores sueltos; turno siempre color +
   letra.

---

## 7. Criterios de aceptación

- [ ] El alta **no** contiene ningún campo de fecha escrita, ni la palabra "ciclo", ni una elección
      de "1.ª/2.ª {turno}". No se pide al agente pensar en el ciclo en ningún punto.
- [ ] El paso ② pregunta **qué hace cada día**, empezando por hoy, y **solo revela el día siguiente
      cuando hace falta** para desambiguar (cuando `offsetsCompatibles(...).length > 1`).
- [ ] En cuanto `offsetsCompatibles(...).length === 1`, aparece **✓ "Ya cuadra"**, se pinta el
      preview y "Empezar a usarlo" se habilita; **no se piden más días**.
- [ ] Si `length > 1`, se ve el **contador** ("Encajan N posiciones…") y baja a medida que el agente
      añade días. Si `length === 0`, se ve el aviso "no encaja" con "Corregir el último día" y "Ese
      día fue una excepción".
- [ ] La proyección resultante hace que **el turno de cada día indicado coincida** en el calendario
      (verificable en el preview y en la vista de mes).
- [ ] Los botones de turno solo ofrecen turnos presentes en el patrón elegido.
- [ ] Jornada y franja nocturna tienen defaults y **no bloquean** el alta.
- [ ] Cambiar de patrón después re-ancla desde `ancla` sin volver a pedir fecha, y si no cuadra
      pide solo el mini-flujo de días; **no** borra excepciones manuales.
- [ ] Cada celda de turno lleva color **y** letra; festivo con doble señal; celda de HOY con borde
      de acento. Contraste AA; toques ≥ 44 dp; botones de turno ≥ 56 dp.
- [ ] Se puede deslizar entre meses además de las flechas.
- [ ] Tests puros nuevos en `shared` en verde (`offsetsCompatibles`, idempotencia
      anclaje↔proyección). Sin apariencia oficial en ningún punto.

---

## 8. Mockup

`docs/diseno/cuadrante-arranque.html` — mockup navegable (modo oscuro, acento GC): selección de
patrón con mini-tira, **filas de día que se rellenan una a una** empezando por hoy, **contador de
alineaciones restantes** que baja tras cada día, revelado automático del día siguiente, caso
"cuadra" (1), caso "un día más" (varias) y caso "no encaja" (0), y preview de semana en vivo con los
días ya dichos marcados como confirmados. Abrir en el navegador para ver el dinamismo.
