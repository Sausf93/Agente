---
title: "Agente — Sistema visual v2 (rediseño: simple pero bonito)"
autor: "Diseño de producto"
fecha: "2026-09-07"
estado: "Propuesta accionable — para que mobile-dev la implemente"
mockup: "docs/diseno/mockup-agente.html"
---

# Agente — Sistema visual v2

> Rediseño visual **evolutivo, no revolucionario**. Mantiene y respeta los tokens
> actuales de `apps/mobile/src/ui/theme.ts` (neutros, gravedad, tipografía,
> espaciado) y las reglas de `docs/perspectivas/02-ui.md`. Añade tres cosas:
> **(1) un acento de color por cuerpo**, **(2) una barra inferior con carácter**
> y **(3) una ficha y unos estados vacíos más bonitos y con jerarquía**.
>
> El listón: *"que un agente con prisa, una mano, de noche y con guantes lo use
> sin pensar"* (usabilidad) + *"moderno, sobrio, de confianza"* (estética).
>
> Referencia viva y visible: **`docs/diseno/mockup-agente.html`** (ábrelo en un
> navegador; el selector de arriba cambia el cuerpo y el modo claro/oscuro).

---

## 0. Qué cambia y qué NO cambia (para mobile-dev)

**NO cambia (se conserva tal cual de `theme.ts`):**
- La escala de **neutros**, el **espaciado** (4 pt), los **radios**, la **elevación**,
  la **tipografía** (cuerpo mínimo 16 pt) y los **tokens de motion**.
- La **semántica de gravedad** (leve/grave/muy grave/delito): mismos HEX, mismas
  reglas. **Sigue siendo color + texto + icono**, y **no cambia con el cuerpo**.
- El principio "modo oscuro por defecto de noche", el pie de fuente, el aviso legal
  no imperativo y la prohibición de símbolos oficiales.

**Cambia / se añade:**
1. Se introduce un **token de acento por cuerpo** (`accent`) que **sustituye a
   `brand`** en el rol de "color de acción/identidad" dentro de la app, elegido en
   onboarding. `brand` (azul pizarra) queda como valor por defecto y como color de
   `info`.
2. La **barra inferior** pasa de flechas grises a **iconos Lucide** con pastilla de
   acento en la pestaña activa.
3. La **ficha** adopta el patrón de "tiles" de importe + copiar sobre el pliegue
   (ADR-004) con mejor jerarquía visual.
4. **Estados vacíos con gracia** (búsqueda sin resultados, pestañas aún sin
   contenido) en vez de pantallas en blanco.
5. **Onboarding** de 2 pasos que fija el acento y el territorio.

---

## 1. El acento por cuerpo (la decisión central)

### 1.1 Concepto y límite legal

El agente elige su cuerpo en el onboarding. Ese cuerpo define un **acento de
color** que tiñe **solo cuatro cosas**:

1. **Pestaña activa** de la barra inferior (icono + etiqueta + pastilla de fondo).
2. **Botones primarios** (Copiar boletín, CTAs del onboarding).
3. **Enlaces y elementos interactivos** (chip "Repetir última", números destacados
   como el pronto pago o el resumen de horas, borde del buscador en foco, micro).
4. **Detalles**: borde de selección, "día de hoy" en el cuadrante, resaltado del
   término buscado, tinte de la pastilla activa.

**Todo lo demás es la base neutra gris.** El acento es **personalización sutil**,
no un tema envolvente. Regla mental: *si tapas la barra inferior y los botones, no
deberías poder adivinar el cuerpo.*

> **RESTRICCIÓN CRÍTICA (innegociable).** La app **no puede parecer oficial** de
> ningún cuerpo. Por eso:
> - Los acentos son **tonos desaturados y sobrios**, deliberadamente **distintos**
>   del color institucional exacto (no es "el verde de la Guardia Civil", es un
>   verde pino apagado de herramienta).
> - **Prohibido**: escudos, emblemas, coronas, laureles, banderas, réplicas de
>   uniforme, denominaciones oficiales, tipografías o composiciones que imiten la
>   imagen corporativa de un cuerpo.
> - En el onboarding y en Ajustes aparece el aviso fijo: **"Agente es una
>   herramienta independiente. No es una app oficial de ningún cuerpo."**
> - El **icono de la tienda y el wordmark NO usan el acento del cuerpo**: son
>   neutros (marca `brand` azul pizarra). El acento vive **dentro** de la app, tras
>   la elección personal del usuario, nunca en la ficha de la tienda.

### 1.2 Tokens de acento por cuerpo (claro y oscuro)

Cada cuerpo define `accent` (color principal de acción), `accentPressed` (estado
presionado) y `accentOn` (color del texto/icono sobre el acento). El **tinte débil**
(`accentWeak`, fondo de la pastilla de tab activa y fondos suaves) se calcula por
mezcla y no necesita fijarse a mano.

| Cuerpo | Modo | `accent` | `accentPressed` | `accentOn` | Contraste texto |
|---|---|---|---|---|---|
| **Guardia Civil** (verde pino) | claro | `#2E6A4E` | `#245840` | `#FFFFFF` | blanco/`accent` ≈ 6.4:1 (AA) |
| | oscuro | `#6FC79B` | `#4FA97D` | `#0A0C10` | texto oscuro ≈ 9.6:1 (AAA) |
| **Policía Nacional** (azul marino) | claro | `#1F3A63` | `#172C4B` | `#FFFFFF` | blanco/`accent` ≈ 11.4:1 (AAA) |
| | oscuro | `#7FA4D6` | `#4E79B5` | `#0A0C10` | texto oscuro ≈ 7.6:1 (AAA) |
| **Policía Local** (azul claro/cerúleo) | claro | `#0E6BA8` | `#0A5688` | `#FFFFFF` | blanco/`accent` ≈ 5.7:1 (AA) |
| | oscuro | `#6FBEE8` | `#2E9BD6` | `#0A0C10` | texto oscuro ≈ 9.5:1 (AAA) |
| **Autonómica** (pizarra-teal neutro) | claro | `#3E6B70` | `#325A5E` | `#FFFFFF` | blanco/`accent` ≈ 5.9:1 (AA) |
| | oscuro | `#7FB8BC` | `#4F9298` | `#0A0C10` | texto oscuro ≈ 8.8:1 (AAA) |

Notas de diseño:
- **Guardia Civil = verde**, **P. Nacional = azul marino oscuro**, **P. Local =
  azul claro**, **Autonómica = un neutro propio** (pizarra-teal) que no compite con
  los otros tres ni evoca una autonómica concreta. Sirve como acento por defecto
  para Ertzaintza, Mossos, Policía Foral y Policía Canaria (todas comparten el mismo
  acento neutro; no se replica ninguna identidad autonómica).
- En **modo oscuro** el acento se **aclara** (igual que `brand300` vs `brand500` en
  el sistema actual) para mantener contraste sobre superficies oscuras; el texto que
  va **encima** del acento pasa a ser oscuro (`accentOn = #0A0C10`).
- El valor **por defecto antes de elegir cuerpo** (o si se resetea) es la marca
  neutra `brand` (`#2E5AAC` claro / `#8FB0E6` oscuro): la app arranca neutra.

### 1.3 Convivencia acento ↔ gravedad (contraste garantizado)

La gravedad **es fija** y usa la familia **amarillo → naranja → rojo → vino**.
**Ningún acento de cuerpo usa esa familia** (son verdes, azules y un teal), por lo
que:
- Un chip de gravedad **nunca se confunde** con un elemento de acento aunque estén
  juntos (p. ej. chip "Muy grave" rojo al lado del botón "Copiar" verde de GC).
- La pastilla de gravedad se pinta con sus propios `bg`/`fg` (autocontenida), así
  que el acento del fondo no altera su legibilidad.
- **Regla para mobile-dev:** un elemento **nunca** codifica a la vez acento y
  gravedad. La gravedad manda siempre con su color propio + texto + icono.

### 1.4 Convivencia acento ↔ info (cuerpos azules)

`info` usa el azul de marca `#2E5AAC`. Para P. Nacional y P. Local (acentos
azules) esto podría solaparse. Solución: los **banners de info/aviso no dependen
del color**; llevan **icono + texto + borde izquierdo**. No se usa el acento como
color de banner. Así un banner informativo se distingue por forma, no por matiz.

### 1.5 Implementación sugerida (sin tocar la semántica de gravedad)

Extender `theme.ts` con una tabla de acentos y resolver el tema activo combinando
`mode` (claro/oscuro) + `cuerpo` (persistido en el store del perfil):

```ts
// Añadir a theme.ts — NO se toca `severity`, ni neutros, ni tipografía.
export type CuerpoAccent = 'guardiaCivil' | 'policiaNacional' | 'policiaLocal' | 'autonomica';

export const accentByCuerpo = {
  guardiaCivil:   { light:{ accent:'#2E6A4E', pressed:'#245840', on:'#FFFFFF' },
                    dark: { accent:'#6FC79B', pressed:'#4FA97D', on:'#0A0C10' } },
  policiaNacional:{ light:{ accent:'#1F3A63', pressed:'#172C4B', on:'#FFFFFF' },
                    dark: { accent:'#7FA4D6', pressed:'#4E79B5', on:'#0A0C10' } },
  policiaLocal:   { light:{ accent:'#0E6BA8', pressed:'#0A5688', on:'#FFFFFF' },
                    dark: { accent:'#6FBEE8', pressed:'#2E9BD6', on:'#0A0C10' } },
  autonomica:     { light:{ accent:'#3E6B70', pressed:'#325A5E', on:'#FFFFFF' },
                    dark: { accent:'#7FB8BC', pressed:'#4F9298', on:'#0A0C10' } },
} as const;

// Acento por defecto = marca neutra (antes de elegir cuerpo).
export const accentDefault = {
  light:{ accent:'#2E5AAC', pressed:'#254A8F', on:'#FFFFFF' },
  dark: { accent:'#8FB0E6', pressed:'#5C86D6', on:'#0A0C10' },
} as const;
```

- `useAppTheme()` recibe (además del `mode`) el `cuerpo` del store y devuelve el
  tema con `color.brand`/`brandPressed`/`textOnBrand` **sobrescritos** por el acento.
  Así **todos los componentes actuales que ya leen `color.brand` heredan el acento
  sin cambios** (Button primario, foco del buscador, tab activa, enlaces).
- `accentWeak` = mezcla del acento con la superficie (14 % claro / 22 % oscuro),
  para el fondo de la pastilla de tab activa y realces suaves. En RN, precalcular
  por combinación o usar una util de mezcla.
- Cambiar de cuerpo en Ajustes reconstruye el tema en caliente (Zustand → re-render).

---

## 2. Tipografía, espaciado, radios, elevación

Sin cambios respecto a `theme.ts` / `02-ui.md`. Recordatorio de lo que hace bonita
la pantalla sin salirse del sistema:

- **Jerarquía por tamaño y peso**, no por color tenue. El título de ficha en
  `titleL` (22/600), el importe en `displayL`/22–24 tabular, metadatos en `caption`.
- **Números tabulares** en importes, horas y contadores (`fontVariant:
  ['tabular-nums']`) para que no "bailen".
- **Aire**: padding lateral 16, separación entre tarjetas 12, interior de tarjeta
  16. La sensación "premium" viene del espacio en blanco y la retícula, no de
  adornos.
- **Elevación muy sutil** (e1) en tarjetas en claro; en oscuro, borde + diferencia
  de superficie (las sombras no se ven sobre negro).
- **Radios medios** (12 botones/celdas, 16 tarjetas, 24 hojas inferiores):
  "herramienta seria pero amable".

---

## 3. Barra inferior (rediseño)

Se mantiene la barra inferior (uso a una mano) pero con carácter. Pestañas de
ADR-003: **Buscar · Normas · Documentos · Cuadrante · Más**.

### 3.1 Anatomía

- Barra `surface`, borde superior `border`, safe-area inset. Altura **56 + safe
  area**; cada ítem ≥ 44 de ancho táctil.
- Cada ítem = **icono Lucide (24)** + **etiqueta** (`caption`, 11–12 pt) debajo.
- **Pestaña activa**: icono con **pastilla de fondo `accentWeak`** (píldora de ~52×30
  bajo el icono) + icono y etiqueta en `accent` + **trazo del icono más grueso**
  (2.4 vs 2.0). Tres señales redundantes (fondo + color + grosor), nunca solo color.
- **Pestaña inactiva**: icono trazo 2.0 en `textSecondary`, etiqueta `textSecondary`.

### 3.2 Set de iconos Lucide por pestaña

| Pestaña | Icono Lucide | Motivo |
|---|---|---|
| **Buscar** | `search` | Verbo dominante; el buscador es el producto |
| **Normas** | `book-open` | Articulado navegable (metáfora de objeto, no de autoridad) |
| **Documentos** | `file-text` | Plantillas/PDF; "el documento que necesito" |
| **Cuadrante** | `calendar-days` (alt. `calendar-clock`) | Calendario de turnos |
| **Más** | `layout-grid` (alt. `ellipsis`) | Hub de tarjetas (Mapa/PK, Derechos, Sustancias, Vehículos, Ajustes) |

> Prohibido cualquier icono de escudo, estrella de sheriff, gorra o coche patrulla
> (regla 02-ui.md §6.3). Metáforas de objeto/acción siempre.

### 3.3 A11y

`accessibilityRole="tab"`, estado `selected`, etiqueta leída ("Buscar,
seleccionado"). La etiqueta de texto siempre visible (no solo icono).

---

## 4. Ficha de infracción (más bonita, misma jerarquía de ADR-004)

Orden sobre el pliegue (sin scroll): **título → gravedad → tiles → copiar →
consecuencia crítica**. Debajo: variantes + texto del boletín, resto de
consecuencias, artículo completo, competencia, pie de fuente.

Mejoras estéticas concretas:
- **Título** `titleL` 22/700 + subtítulo con el término buscado en gris y la norma
  (`RGV art. 11.1 · Anexo I`) en `caption`.
- **Fila de chips**: `SeverityChip` (fijo) + chip tipo (`Administrativa`/`Penal`).
- **Tiles de datos** (3 columnas): `importe`, `pronto pago` (número en **acento**),
  `puntos`. Número grande tabular + etiqueta pequeña. Escaneable de un vistazo.
- **Botón "Copiar texto del boletín"**: primario, ancho completo, **54 pt**, fondo
  `accent`, icono `copy` → al pulsar muta 1,2 s a `success` + check "Copiado"
  (háptico éxito). Va **antes** del texto largo.
- **Consecuencia crítica** en tarjeta con icono a la izquierda (`lock`/`truck`/
  `gavel`), título + fuente (`art. 104 LSV`) y chevron para desplegar. Si es
  coercitiva (detención) el icono toma `danger` y el lenguaje es **no imperativo**
  ("procede según…", nunca "detén").
- **Variantes** (delantero/trasero, izq/der) como **segmented control** en acento,
  encima del texto del boletín. Cambian el texto que se copia; no crean fichas
  nuevas.
- **Caja del boletín** `surfaceAlt`, `radiusMd`, texto `bodyL` (17–18) seleccionable.
- **Banner de aviso** legal (icono + texto + borde izquierdo), fuera del camino del
  importe/copiar.
- **Pie de fuente** con icono documento + "Actualizado el … · Fuente: BOE-A-…".

---

## 5. Estados vacíos con gracia (adiós a las pantallas en blanco)

El estado actual "sobrio pero soso" viene sobre todo de pestañas vacías. Regla:
**ninguna pantalla vacía es un hueco en blanco**; siempre tiene icono, una frase y
una acción.

- **Búsqueda sin resultados**: icono grande tenue + "Nada exacto para esto" +
  sugerencias por proximidad + botón "Prueba por voz" + "Reportar que falta esto"
  (cierra el bucle de contenido, 01-ux §6.3).
- **Normas / Documentos aún sin contenido (beta)**: tarjeta ilustrada con icono
  Lucide grande al 40 % de opacidad, título ("Próximamente") y subtítulo honesto
  ("Estamos cargando la normativa de tu territorio"). Nada de spinners infinitos.
- **Cuadrante sin configurar**: tarjeta con `calendar-days`, "Configura tu turno" y
  botón primario "Elegir mi patrón" (patrones predefinidos por cuerpo, ADR-014).
- **Favoritos vacío**: icono `star`, "Tus infracciones fijadas aparecerán aquí".

Composición del estado vacío: icono 40–48 (color `textTertiary`), título `titleM`,
texto `body` `textSecondary`, botón primario o outline en acento. Centrado, con aire.

---

## 6. Onboarding (2 pasos, local, sin login)

Coherente con ADR-001 (local-first, sin cuenta) y 01-ux §3. Fija el **acento** y el
**territorio**; filtra contenido. Máximo 2 pasos + barra de progreso honesta.

### Paso 1 — ¿A qué cuerpo perteneces?
- **4 tarjetas grandes** (Guardia Civil, Policía Nacional, Policía Local, Policía
  Autonómica), cada una con un **swatch** del color-acento y el nombre. Un toque
  selecciona (borde + fondo `accentWeak` + check) y **la app ya se tiñe** con ese
  acento (feedback inmediato de personalización).
- Aviso fijo al pie: **"Agente es una herramienta independiente. No es una app
  oficial de ningún cuerpo ni está asociada a ellos."**
- Botón "Continuar" en acento.

### Paso 2 — ¿Dónde trabajas?
- **Autodetección por GPS con confirmación** ("Parece que estás en Murcia. ¿Es
  correcto?") que rellena CCAA + Provincia de golpe; fallback manual si se deniega.
- Selectores **Comunidad autónoma** y **Provincia** (rellenos por la detección).
- **Municipio** solo obligatorio para **Policía Local** (para el resto se muestra
  opcional/atenuado con nota "solo obligatorio para Policía Local").
- **Unidad/especialidad NO** se pide aquí (a Ajustes o en contexto). Cero campos de
  texto libre obligatorios.
- Botón "Empezar a usar Agente" → cae directo en **Buscar**, sin tour.

Reglas anti-abandono: todo cambiable después ("Podrás cambiarlo en Ajustes"), sin
pedir permisos en seco (ubicación y notificaciones se piden en contexto).

---

## 7. Checklist para QA / implementación

- [ ] `theme.ts` extendido con `accentByCuerpo` + `accentDefault`; `useAppTheme`
      sobrescribe `brand`/`brandPressed`/`textOnBrand` con el acento del cuerpo.
- [ ] **La semántica de gravedad NO cambia** con el cuerpo (mismos HEX de `theme.ts`).
- [ ] Todos los acentos verifican **AA** para blanco/texto sobre acento (tabla §1.2).
- [ ] Ningún elemento codifica acento y gravedad a la vez.
- [ ] Barra inferior: iconos Lucide, activa con pastilla `accentWeak` + color +
      grosor de trazo; etiqueta siempre visible; ítems ≥ 44; `role="tab"`.
- [ ] Ficha: tiles + "Copiar" (54 pt, acento) sobre el pliegue, antes del texto;
      feedback de copiado (visual + háptico + "Copiado").
- [ ] Estados vacíos con icono + frase + acción (nunca blanco).
- [ ] Onboarding de 2 pasos; municipio condicional a Policía Local; aviso "no
      oficial" presente; sin permisos en seco.
- [ ] Cero escudos/emblemas/denominaciones oficiales en UI, icono y wordmark.
- [ ] Cuerpo ≥ 16 pt, toque ≥ 44 pt, contraste AA (AAA en importes/artículos),
      modo oscuro por defecto de noche, gravedad = color + texto + icono.
- [ ] Pie de fuente en toda ficha; lenguaje no imperativo en detención.

---

*Referencia visual: `docs/diseno/mockup-agente.html` (selector de cuerpo y de tema
claro/oscuro arriba). Documento vivo: se ajusta con lo que devuelva la beta.*
