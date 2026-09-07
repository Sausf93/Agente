# QA — Ronda penal / seguridad ciudadana (2026-09-08)

Alcance: 5 fichas nuevas — violencia de género (CP 153 / 173.2), desórdenes públicos (CP 557),
resistencia/desobediencia grave (CP 556), estafa (CP 249) e identificación art. 16 LO 4/2015 con
el nuevo marco `no_sancionador`. Solo lectura. No se toca código de features.

Veredicto: **CASI** — la puerta de calidad y la integridad de contenido están limpias; hay **2
defectos de presentación** en la ficha de la entrada no sancionadora (art. 16 LOSC) que hay que
corregir antes de dar por buena esa ficha. Ninguno bloquea al resto.

---

## 1. Puerta de calidad (ejecutada)

| Paso | Comando | Resultado |
|---|---|---|
| Lint | `corepack pnpm lint` (`eslint .`) | **OK**, sin avisos |
| Typecheck | `corepack pnpm -r typecheck` | **OK** en los 3 proyectos (shared, mobile, content-pipeline) |
| Tests | `corepack pnpm -r test` | **OK — 618/618** |

Desglose de tests (0 fallos, 0 flaky en esta corrida):
- `@agente/shared`: 182 (10 ficheros) — incluye `detencion` (20), `cuadrante` (58), `validators` (35).
- `@agente/content-pipeline`: 129 (11 ficheros) — incluye `penalSeed` (13), `seguridadCiudadanaSeed` (22), `buildPackage` (14).
- `@agente/mobile`: 307 (28 ficheros) — incluye `ficha` (25), `search` + `search.integration` (26).

---

## 2. Integridad de contenido (sobre la `.db` real)

`.db` verificada: `apps/mobile/assets/content/contenido-0.1.0.db` (consultada con `node:sqlite`, solo lectura).

- **Recuento total**: 53 infracciones. Ámbito: 47 estatal + 6 municipal.
- **Estado de revisión**: las 53 en `pendiente_revision` (0 en `verificada`). Cumple el requisito.
- **Artículo fuente**: 0 infracciones sin artículo (JOIN `articulo` completo en todas).
- **Las 4 penales nuevas** (`del-violencia-genero` CP 153, `del-desordenes-publicos` CP 557,
  `del-resistencia-desobediencia` CP 556, `del-estafa` CP 249):
  - `tipo=penal`, `gravedad=delito`, `importe_eur=NULL`, `puntos=NULL` — correcto (un delito no lleva importe/puntos).
  - `pena_texto` presente y `gravedad_penal=menos_grave` en las 4.
  - Consecuencia de **detención** con `regla` (JSON del árbol) en las 4, con fuente que encadena el
    precepto penal + LECrim (p. ej. `CP art. 153; LECrim art. 490; LECrim art. 492.1`).
  - Invariantes verificadas en todo el corpus penal: **0** penales con importe/puntos, **0** sin
    `pena_texto`/`gravedad_penal`, **0** sin consecuencia de detención.
- **Identificación art. 16 LOSC** (`sc-identificacion-requerimiento`, marco `no_sancionador`):
  - `tipo=administrativa`, `importe_eur=NULL`, `importe_reducido_eur=NULL`, `puntos=NULL` — **NO
    lleva importe**, como exige el marco no sancionador. No rompe validadores (build + tests verdes).
  - Consecuencia única `identificacion`, fuente `LO 4/2015 art. 16`, con texto orientativo correcto
    (traslado por tiempo mínimo, NO detención, no se leen derechos del 520 LECrim, libro-registro).
  - **Campo de relleno**: `gravedad='leve'` (no hay gravedad real; es una entrada no sancionadora).
    Este relleno es el origen de los defectos de presentación del punto 3.
- **Buscador (FTS `busqueda`)**: las nuevas son localizables — `estafa` (1), `desordenes` (2),
  `resistencia` (3), `identificacion` (3) hits.

---

## 3. Defectos de presentación de la entrada NO sancionadora (art. 16 LOSC)

La ficha deriva su forma del código de norma. Como `sc-identificacion-requerimiento` viaja con
`normaCodigo='LOSC'`, `fichaKindFrom` devuelve `seguridad_ciudadana` (rama `\bLOSC\b`). A partir de
ahí, dos comportamientos pintan datos jurídicamente engañosos:

### DEF-1 (Media) — Chip "Tramo: Leve" en una ficha que no sanciona
`tilesFicha` (en `apps/mobile/src/features/ficha/ficha.ts`, ~líneas 183-185): cuando
`fichaKind==='seguridad_ciudadana'` añade un tile **Tramo** con `TRAMO_LABEL[gravedad]`. Con
`gravedad='leve'` de relleno, la ficha renderiza un tile grande **"Leve / Tramo"**
(`FichaScreen.tsx`, rama `tiles.length > 0`). Para una entrada **no sancionadora** eso sugiere un
tramo/gravedad de sanción que no existe. Confirmado tal como avisó quien la sembró.
- Reproducción: abrir la ficha de `sc-identificacion-requerimiento` → aparece el tile "Tramo: Leve".
- Esperado: sin tile de tramo/gravedad (no hay sanción).

### DEF-2 (Alta) — El banner de acción operativa cita la ley equivocada (LOEX/extranjería)
`accionOperativaFrom` (`ficha.ts`, ~líneas 295-313): para `seguridad_ciudadana` + consecuencia
`identificacion`, devuelve el banner `kind='identificacion'` cuyo **detalle está cableado a
extranjería**: *"…la situación se tramita por vía administrativa (multa o expulsión, **art. 53.1.a
LOEX**). Cualquier internamiento cautelar… **art. 61 LOEX**."* Esa rama se escribió para la estancia
irregular (LOEX); reutilizada aquí, la ficha de identificación del **art. 16 LOSC** muestra en su
banner leer-primero referencias a **multa o expulsión y al internamiento del art. 61 LOEX**, que no
tienen nada que ver con un requerimiento de identificación. Es contenido legal incorrecto en el
elemento más visible de la ficha; por eso lo clasifico por encima de DEF-1.
- Reproducción: abrir `sc-identificacion-requerimiento` → banner "Identificar · vía administrativa ·
  NO detención penal" con detalle que menciona art. 53.1.a y 61 LOEX.
- Esperado: texto propio del art. 16 LOSC (identificar por tiempo mínimo, no es detención,
  libro-registro), sin referencias a LOEX/expulsión/internamiento.

Nota: no hay test que proteja este caso concreto. Los tests actuales de `ficha.test.ts` afirman el
comportamiento genérico (Tramo para `seguridad_ciudadana`; banner `identificacion`), así que la
corrección deberá diferenciar el marco `no_sancionador` (o el par norma+artículo) y añadir su test.

Sugerencia de arreglo (para la fase de fix, NO hecho aquí): que la ficha conozca el marco
`no_sancionador` de forma explícita (columna/derivación) en lugar de deducir "seguridad ciudadana"
del código LOSC, de modo que ni pinte tramo ni entre en la rama de banner de extranjería.

---

## 4. Regresiones

- **Filtro territorial del buscador**: verde. `search.test` (9) + `search.integration` (17) pasan;
  el esquema conserva `ambito`/`territorio_id`/`desplaza_id` y la distribución (47 estatal / 6
  municipal) es coherente. No se observa pérdida de datos.
- **Fichas previas**: sin cambios de forma; typecheck y `ficha.test` (25) verdes. Las 4 penales
  nuevas reutilizan el marco penal ya existente (marco penal + detención arriba) sin romperlo.
- **Cuadrante / detención (núcleo con cobertura obligatoria)**: `cuadrante` (58) y `detencion` (20)
  verdes; sin regresión.

---

## 5. Veredicto y lista corta

**CASI** para seguir. Bloqueos previos a dar por buena la ficha de identificación:

1. **DEF-2 (Alta)** — banner de acción operativa con referencias a LOEX en la ficha del art. 16
   LOSC. Corregir el texto/rama antes de exponer la ficha.
2. **DEF-1 (Media)** — suprimir el chip "Tramo: Leve" en la entrada `no_sancionador`.
3. Añadir test que fije el comportamiento de una entrada `no_sancionador` (sin tramo, banner propio).
4. Puerta de revisión jurídica (`revisor-juridico` / `revisar-contenido`) sobre las 4 penales antes
   de pasar cualquiera de `pendiente_revision` a `verificada` (contenido MUY sensible: violencia de
   género, fronteras 556/550 y 249 leve/menos grave).

El resto (puerta de calidad, integridad del resto del contenido, buscador) queda **APTO**.
