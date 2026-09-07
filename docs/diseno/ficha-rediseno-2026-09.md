---
title: "Agente — Rediseño de la ficha (adaptativa por tipo + leer-primero)"
autor: "Diseño de producto"
fecha: "2026-09-07"
estado: "Plan accionable — para que mobile-dev lo ejecute por prioridad"
alcance: "apps/mobile/src/features/ficha (FichaScreen.tsx + DetencionTree.tsx)"
bocetos:
  - "docs/diseno/boceto-ficha-delito.html"
  - "docs/diseno/boceto-ficha-trafico.html"
depende_de:
  - "docs/diseno/sistema-visual.md"
  - "docs/diseno/pulido-2026-09.md"
---

# Rediseño de la ficha de infracción/delito

> La ficha es **la pantalla estrella**: lo que el agente mira en la calle, de noche, con
> prisa y con guantes. El encargo tiene dos ejes:
> 1. **Adaptarse al tipo**: hoy una ficha de DELITO enseña "Importe / Pronto pago / Puntos"
>    en blanco ("—"). Eso es de TRÁFICO. Un delito no tiene ni importe ni puntos: tiene
>    **pena**, **vía penal** y, sobre todo, **orientación de detención**.
> 2. **Leer-primero**: en la calle el agente quiere LEER una respuesta y actuar, no operar
>    toggles. Ya se aplicó al árbol de detención (resultado arriba, "afinar" plegado).
>    Hay que extenderlo a TODA la ficha: lo accionable primero, lo interactivo debajo.

---

## 0. Diagnóstico (lo que está mal hoy)

Revisado `FichaScreen.tsx` + `DetencionTree.tsx` + el modelo `FichaInfraccion` (`ficha.ts`) y
los enums de `@agente/shared`:

| # | Problema | Evidencia en el código |
|---|---|---|
| **D1** | **La ficha no se adapta al tipo.** Los tres tiles `Importe / Pronto pago / Puntos` se pintan SIEMPRE, incondicionalmente. | `FichaScreen.tsx` L196-206: el bloque de tiles se renderiza fijo; `Pronto pago` y `Puntos` muestran `'—'` cuando son `null`. En un delito los tres son `null` → tres huecos vacíos e irrelevantes. |
| **D2** | **No hay bloque de PENA ni de marco penal.** El modelo no tiene dónde poner "Prisión de 6 a 18 meses". | `FichaInfraccion` (`ficha.ts` L29-52) no tiene campo `pena` ni `gravedadCp`; la única gravedad penal vive enterrada dentro de la `regla` de la consecuencia `detencion`. |
| **D3** | **La detención (lo más crítico de un delito) está enterrada.** Se pinta como una consecuencia más, después del boletín y del resto de consecuencias. | `FichaScreen.tsx` L288-311: el `DetencionTree` va dentro del `.map()` de consecuencias, en mitad-baja de la pantalla. En un delito debería estar arriba. |
| **D4** | **El bloque "boletín" no habla el idioma penal.** Un delito no se denuncia con boletín: se documenta en **atestado/minuta/diligencia**. | `FichaScreen.tsx` L208-286: etiqueta fija "Texto para el boletín", botón "Copiar boletín", "Generar documento" → `seed-boletin-denuncia`. Para un delito es lenguaje equivocado. |
| **D5** | **Tráfico y seguridad ciudadana se mezclan.** LO 4/2015 (seguridad ciudadana) NO tiene puntos, pero la ficha le pinta un tile "Puntos: —". | Mismo bloque fijo de tiles. No hay discriminador de marco sancionador. |
| **D6** | **Redundancia en la cabecera.** En un delito se ve a la vez el `SeverityChip` "Delito" (color vino) **y** el `Badge` "Vía penal" (danger). Dicen casi lo mismo con dos rojos distintos. | `FichaScreen.tsx` L178-183 + `severityMeta.delito` (label "Delito") + `TIPO_LABEL.penal` ("Vía penal"). |
| **D7** | **Orden de lectura invertido en la cabecera.** Van chips → título; lo natural es título → gravedad (ya señalado en `pulido-2026-09.md` §2 MEDIA). | `FichaScreen.tsx` L178-194: `SeverityChip`/`Badge` antes que el `Text` del título. |

El encabezado de barra (`Stack.Screen title`) **ya** conmuta "Delito"/"Infracción" (L175). Eso
está bien; ver §4 para el matiz.

---

## 1. La idea central: **una ficha, tres variantes** (`fichaKind`)

La ficha decide su forma a partir de un discriminador `fichaKind`:

| `fichaKind` | Cuándo | Qué bloques de datos muestra | Qué OCULTA |
|---|---|---|---|
| **`penal`** (delito) | `tipo === 'penal'` (o `gravedad === 'delito'`) | **Marco penal** (pena + gravedad art. 33 CP + vía penal) → **Detención leer-primero** → texto para atestado | Importe, pronto pago, puntos, "boletín" |
| **`seguridad_ciudadana`** | administrativa + norma de seguridad ciudadana (LO 4/2015) | **Importe** + **Pronto pago** (si aplica) + **Tramo** (leve/grave/muy grave) | **Puntos** |
| **`trafico`** | administrativa + norma de tráfico (LSV/RGC/RGV) o con puntos | **Importe** + **Pronto pago** + **Puntos** (como hoy) | Marco penal / detención |
| **`administrativa`** (fallback) | resto de administrativas | **Importe** (+ pronto pago si aplica) | Puntos, tramo |

### 1.1 Cómo se decide `fichaKind` — regla para mobile-dev

**Lo correcto (ALTA, requiere coordinación con `ingesta-normativa` + `arquitecto-software`):**
añadir un discriminador explícito al modelo (`packages/shared`), p. ej.:

```ts
// enums.ts — nuevo
export const MarcoSancionador = z.enum(['trafico', 'seguridad_ciudadana', 'penal', 'otra']);
```

y un campo `marcoSancionador` en `Infraccion` que el pipeline rellena. Es un dato de dominio
estable y elimina toda heurística frágil.

**Puente mientras no exista el campo (para no bloquear la UI):** derivarlo en la carga de la
ficha (`ficha.ts`), sin heurística en la pantalla:

```ts
function fichaKindFrom(f: FichaInfraccion): FichaKind {
  if (f.tipo === 'penal' || f.gravedad === 'delito') return 'penal';
  if (f.puntos !== null) return 'trafico';                       // solo tráfico detrae puntos
  if (/\bLO ?4\/2015\b|seguridad ciudadana/i.test(f.normaCodigo)) return 'seguridad_ciudadana';
  if (/\bLSV\b|\bRGC\b|\bRGV\b|circulaci|tráfico/i.test(f.normaCodigo)) return 'trafico';
  return 'administrativa';
}
```

> Regla de oro adicional (independiente del kind): **un tile solo se pinta si tiene valor.**
> Nunca más un tile con `'—'`. Si `importeReducidoEur === null`, no hay tile de pronto pago;
> si `puntos === null`, no hay tile de puntos. Esto por sí solo mata el bug D1/D5.

### 1.2 Datos que faltan en el modelo (flag a `ingesta-normativa`)

Para que la variante `penal` sea completa hacen falta dos campos de contenido nuevos en
`Infraccion` (hoy no existen — ver D2):

- **`penaTexto: string | null`** — la pena legible del art. correspondiente del CP, p. ej.
  *"Prisión de 6 a 18 meses"* (hurto > 400 €, art. 234.1 CP). **ALTA** para la variante penal.
- **`gravedadPenal: 'leve' | 'menos_grave' | 'grave' | null`** — la clase del art. 33 CP. Ya
  existe DENTRO de la `regla` de la consecuencia `detencion` (`gravedadCp`); conviene
  **exponerla en la ficha** para pintar el chip sin abrir el árbol. **MEDIA.**
- Opcional (**BAJA**): para `seguridad_ciudadana`, `importeMinEur`/`importeMaxEur` del tramo.
  Mientras no estén, el "Tramo" se muestra como etiqueta cualitativa (leve/grave/muy grave)
  derivada de `gravedad`, sin cifras de rango.

Hasta que `penaTexto` exista, la variante penal muestra el chip de gravedad penal (derivado de
`regla.gravedadCp`) + "Consulta la pena en el artículo ↓", y el resto del bloque penal funciona.

---

## 2. Orden leer-primero, variante por variante

Principio: **sobre el pliegue va lo accionable** (qué es · qué procede · qué copio). Lo
interactivo/secundario, plegado o debajo. Mismo patrón que ya usa `DetencionTree` (resultado
arriba, "afinar" plegado).

### 2.1 Variante DELITO (`penal`) — la que hoy está peor

```
┌─ Barra: "Delito" ───────────────────────────────┐
│                                                  │
│  Hurto                              (titleXL)    │  1. Título primero (D7)
│  CP · art. 234.1                    (bodyStrong) │
│  ● Delito · vía penal    [A verificar]           │  2. UNA insignia penal (D6): sin
│                                                  │     duplicar chip+badge
│  ┌── MARCO PENAL ──────────────────────────────┐ │  3. Bloque penal (sustituye a los
│  │ Pena                                        │ │     tiles de tráfico)
│  │ Prisión de 6 a 18 meses        (titleM)     │ │
│  │ Gravedad penal: Menos grave (art. 33 CP)    │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  ┌── DETENCIÓN: QUÉ PROCEDE ───────────────────┐ │  4. LEER-PRIMERO: resultado del
│  │ 🛡  PROCEDE LA DETENCIÓN        (verde)      │ │     motor arriba, visible sin tocar
│  │ Delito menos grave: cabe detener…           │ │     nada. (Hoy esto está enterrado)
│  │ [LECrim 490] [LECrim 492]                   │ │
│  │ La valoración final es tuya y del juez.     │ │
│  └─────────────────────────────────────────────┘ │
│  [ Leer derechos al detenido (art. 520) ]        │
│  ▸ Afinar el caso (otra gravedad, circunstancias)│  (plegado)
│                                                  │
│  Texto para el atestado          (label)         │  5. Copiar (idioma penal, D4)
│  ┌─────────────────────────────────────────────┐ │
│  │ Se observa a … sustrayendo …                │ │
│  └─────────────────────────────────────────────┘ │
│  [ ⧉ Copiar para el atestado ]  (primario 54pt)  │
│  [ ★ Guardar ] [ 📄 Generar diligencia ]         │
│                                                  │
│  Otras consecuencias             (label)         │  6. Resto de consecuencias
│  ┌ 🚫 Decomiso — art. 127 CP ─────────────────┐  │     (decomiso, identificación…)
│  Competencia · Artículo completo · Pie fuente    │  7-10. igual que hoy
└──────────────────────────────────────────────────┘
```

Cambios respecto al código actual:
- **Se elimina el bloque de 3 tiles** para `penal`.
- **Aparece "Marco penal"** (card `surfaceAlt`): `penaTexto` en `titleM` + chip de gravedad
  penal art. 33 CP. Si no hay `penaTexto`, chip + enlace al artículo.
- **La detención sube** justo debajo del marco penal (extraer la consecuencia `detencion` del
  `.map()` y renderizarla como bloque propio y prominente). El `DetencionTree` ya está bien
  por dentro (resultado primero, afinar plegado) — solo cambia DÓNDE vive.
- **El bloque de copia habla penal:** etiqueta "Texto para el atestado", botón "Copiar para el
  atestado", "Generar diligencia" (no boletín de denuncia).
- **Las demás consecuencias** (decomiso, identificación) quedan abajo como fila-tarjeta (patrón
  ya definido en `pulido-2026-09.md` §2, ya implementado en `FilaConsecuencia`).

### 2.2 Variante TRÁFICO (`trafico`) — casi como hoy, mejor jerarquía

```
┌─ Barra: "Infracción" ───────────────────────────┐
│  Conducir usando el móvil            (titleXL)   │  1. Título primero
│  LSV · art. 76.c                                 │
│  ▲ Grave · vía administrativa                    │  2. Gravedad (chip) + tipo
│  ┌────────┐ ┌────────┐ ┌────────┐                │  3. Tiles (importe manda)
│  │  200 € │ │  100 € │ │   6    │                │     — SOLO los que tienen valor
│  │ Importe│ │ P.pago │ │ Puntos │                │
│  └────────┘ └────────┘ └────────┘                │
│  Texto para el boletín                           │  4. Copiar boletín + variantes
│  ┌─────────────────────────────────────────────┐ │
│  │ Conduce el vehículo … utilizando …          │ │
│  └─────────────────────────────────────────────┘ │
│  [ delantero ][ trasero ]  (variantes)           │
│  [ ⧉ Copiar boletín ]  (primario 54pt)           │
│  [ ★ Guardar ] [ 📄 Generar boletín ]            │
│  Consecuencias · Competencia · Artículo · Pie    │
└──────────────────────────────────────────────────┘
```

Cambios: título antes que chips (D7); tiles condicionales (si no hay pronto pago o puntos, se
cae a 2 o 1 tile, sin huecos "—"); el importe conserva su énfasis de acento.

### 2.3 Variante SEGURIDAD CIUDADANA (`seguridad_ciudadana`)

Igual que tráfico pero **sin tile de puntos** y con un **tile "Tramo"** en su lugar:

```
│  ┌────────┐ ┌────────┐ ┌──────────┐              │
│  │  601 € │ │  300 € │ │  Grave   │              │
│  │ Importe│ │ P.pago │ │  Tramo   │              │
│  └────────┘ └────────┘ └──────────┘              │
```

- **Importe** con énfasis (igual que tráfico).
- **Pronto pago** solo si `importeReducidoEur !== null` (LO 4/2015 art. 54 permite reducción).
- **Tramo**: etiqueta cualitativa (Leve / Grave / Muy grave) derivada de `gravedad`; si más
  adelante hay `importeMinEur`/`importeMaxEur`, mostrar el rango en `caption` bajo el tile.
- **Nunca** tile de puntos.
- El resto (copiar boletín, consecuencias, competencia, artículo, pie) igual que tráfico.

---

## 3. Componentes concretos (para implementar)

### 3.1 `DataStrip` — el bloque de datos adaptativo (ALTA)
Sustituye al `View` fijo de 3 `Tile` (`FichaScreen.tsx` L196-206). Recibe `fichaKind` y decide:
- `penal` → renderiza `<MarcoPenal>` (no tiles).
- `trafico` → tiles `[Importe*, Pronto pago?, Puntos?]` (los `?` solo si no-null).
- `seguridad_ciudadana` → tiles `[Importe*, Pronto pago?, Tramo]`.
- `administrativa` → tiles `[Importe*, Pronto pago?]`.

`*` = tile con énfasis de acento (`enfasis` ya existe en `Tile`). Un tile solo se pinta con
valor; si al final queda 1 solo tile, ocupa ancho cómodo (no estirado a 3 columnas).

### 3.2 `MarcoPenal` (ALTA)
Card `surfaceAlt`, radio `md`, padding `md`:
- Etiqueta "Pena" (`caption`, `textSecondary`).
- `penaTexto` en `titleM`, `textPrimary`, `tabular-nums` en los números de meses/años.
- Chip "Gravedad penal: Menos grave (art. 33 CP)" — chip NEUTRO (`surface`+`border`), **no**
  usa la familia de gravedad administrativa (que es fija) ni el acento.
- Si falta `penaTexto`: solo el chip + enlace "Consulta la pena en el artículo ↓" (ancla al
  artículo desplegable).

> Importante: la gravedad penal (leve/menos_grave/grave del art. 33 CP) **no** es la misma
> escala que `Gravedad` administrativa (leve/grave/muy_grave/delito). Se muestra como texto
> neutro, sin color de gravedad, para no confundir escalas.

### 3.3 Bloque de detención elevado (ALTA)
- Extraer la consecuencia `tipo === 'detencion'` del `.map()` de consecuencias.
- Renderizarla como **bloque propio** entre `MarcoPenal` y el bloque de copia, con un pequeño
  encabezado de sección. El `DetencionTree` interno **no cambia** (ya es leer-primero:
  resultado arriba, "afinar" plegado, "Leer derechos" condicionado).
- Las consecuencias restantes (`decomiso`, `identificacion`, etc.) se pintan abajo como
  fila-tarjeta, igual que hoy.

### 3.4 Bloque de copia adaptado por vía (MEDIA)
Un objeto de copy por `via`:

```ts
const COPIA = {
  administrativa: { label: 'Texto para el boletín', copiar: 'Copiar boletín',
                    generar: 'Generar boletín',   plantilla: 'seed-boletin-denuncia' },
  penal:          { label: 'Texto para el atestado', copiar: 'Copiar para el atestado',
                    generar: 'Generar diligencia', plantilla: 'seed-diligencia' /* si existe */ },
};
```

- Fila de dos acciones secundarias (`★ Guardar` + `Generar…`) lado a lado, como pide
  `pulido-2026-09.md` §2 MEDIA (hoy van en columna, compitiendo). Copiar primario full-width
  arriba.
- Si aún no existe plantilla penal, "Generar diligencia" cae al boletín genérico pero con
  `hecho` prerelleno; no bloquea.

### 3.5 Cabecera reordenada (MEDIA)
- **Título primero** (`titleXL`), luego norma+art (`bodyStrong` `textSecondary`), luego la
  fila de insignias.
- **Una sola insignia penal** para delito (D6): sustituir el par `SeverityChip "Delito"` +
  `Badge "Vía penal"` por **un** chip "Delito · vía penal" en color de gravedad `delito`
  (vino). Para administrativa se mantiene `SeverityChip` (leve/grave/muy grave) + `Badge`
  "vía administrativa".
- `A verificar` sigue igual cuando `pendiente_revision`.

---

## 4. Encabezado de barra y nombre (respuesta a la pregunta 3)

**Confirmado:** el título de la barra ya conmuta correctamente `"Delito"` / `"Infracción"`
según `ficha.tipo` (`FichaScreen.tsx` L175). Mantener.

**Recomendación sobre el nombre:** que el nombre del delito/infracción **siga en el cuerpo,
grande (`titleXL`), y NO en la barra** como texto fijo. Motivos:
- Los nombres son largos ("Conducir superando la tasa de alcohol permitida") y se truncan feo
  en una barra estrecha; el `titleXL` del cuerpo se lee de un vistazo con guantes.
- La barra da **contexto de categoría constante** ("Delito"/"Infracción") mientras se hace
  scroll — más útil que repetir el nombre.
- Mejora opcional (**BAJA**): **título colapsable** — al hacer scroll y perder de vista el
  `titleXL`, revelar el nombre en la barra (patrón "large title" nativo). Es un plus, no
  bloquea; requiere un header animado.

No duplicar el nombre en barra + cuerpo de forma estática (ruido sin valor).

---

## 5. Reglas transversales que este rediseño respeta (recordatorio QA)

- **Gravedad = color fijo + texto + icono**, no cambia con el cuerpo. La gravedad penal del
  art. 33 CP se muestra como **texto neutro**, sin robar la familia de color de gravedad.
- **El acento del cuerpo** solo tiñe acción/identidad (importe con énfasis, botón copiar,
  variantes activas, enlaces). Ningún elemento codifica acento y gravedad a la vez.
- **Lenguaje orientativo** en detención ("procede según…", nunca "detén"); el pie de
  responsabilidad se mantiene.
- **Sin escudos ni denominaciones oficiales.** El bloque penal usa iconos de objeto/acción
  (balanza/candado/prohibido), nunca símbolos de autoridad.
- **Cuerpo ≥ 16 pt, toque ≥ 44 pt, contraste AA**, modo oscuro, números tabulares.
- **Pie de fuente** (Actualizado el… · Fuente) en TODA variante.
- **Nada de datos de terceros al servidor:** el texto para atestado/boletín es local, como hoy.

---

## 6. Prioridades

| Prioridad | Cambio | Dónde |
|---|---|---|
| **ALTA** | `fichaKind` + `DataStrip` adaptativo (tile solo con valor; nunca "—") | `ficha.ts` (derivación) + `FichaScreen.tsx` |
| **ALTA** | Bloque `MarcoPenal` (pena + gravedad art. 33) para delitos | `FichaScreen.tsx` |
| **ALTA** | Detención elevada leer-primero (extraer del `.map`, subir el bloque) | `FichaScreen.tsx` |
| **ALTA** | Campos de contenido `penaTexto` (+ exponer `gravedadPenal`) | `packages/shared` + pipeline (coordinar) |
| **MEDIA** | Copia adaptada por vía (atestado vs boletín; generar diligencia) | `FichaScreen.tsx` |
| **MEDIA** | Cabecera reordenada (título→chips) + insignia penal única (D6) | `FichaScreen.tsx` |
| **MEDIA** | Variante seguridad ciudadana (tile "Tramo", sin puntos) | `ficha.ts` + `FichaScreen.tsx` |
| **MEDIA** | Discriminador explícito `marcoSancionador` en el modelo | `packages/shared` + pipeline |
| **BAJA** | Fila de acciones secundarias en 2 columnas (Guardar + Generar) | `FichaScreen.tsx` |
| **BAJA** | Título colapsable a la barra al hacer scroll | header animado |
| **BAJA** | Tramo con rango numérico (`importeMinEur/MaxEur`) | modelo + pipeline |

---

## 7. Resumen ejecutivo — TOP de mayor impacto

1. **Ficha adaptativa por `fichaKind` + "tile solo con valor".** Mata de raíz el bug del
   usuario: un delito deja de mostrar "Importe/Pronto pago/Puntos" en blanco. **El cambio de
   mayor impacto y relativamente barato** (discriminador + render condicional).
2. **Bloque "Marco penal"** (pena + gravedad art. 33 CP) en lugar de los tiles de tráfico:
   para un delito, lo que el agente necesita ver es la PENA y la vía, no importes que no
   existen. Requiere el campo de contenido `penaTexto`.
3. **Detención leer-primero, arriba.** Para un delito, "qué procede con la detención" es LA
   decisión; hoy está enterrada tras el boletín y otras consecuencias. Subirla justo bajo el
   marco penal, con el resultado del motor visible sin tocar nada (el "afinar" ya está plegado).
4. **El bloque de copia habla el idioma de la vía:** "atestado/diligencia" en penal,
   "boletín/denuncia" en administrativa. Coherencia que evita que el agente copie un "boletín"
   para un delito.
5. **Cabecera título-primero + una sola insignia penal:** menos redundancia (fuera el doble
   "Delito"/"Vía penal"), lectura natural, y la barra sigue dando la categoría ("Delito"/
   "Infracción") mientras se hace scroll.

Ver los bocetos **`boceto-ficha-delito.html`** (Hurto: sin importe/puntos, con pena +
detención leer-primero) y **`boceto-ficha-trafico.html`** (móvil al volante: importe / pronto
pago / puntos; incluye también el panel de seguridad ciudadana con "Tramo", sin puntos).
</content>
</invoke>
