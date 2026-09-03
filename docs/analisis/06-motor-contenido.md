# 06 · Motor de contenido — el foso defensivo de "Agente"

> **Tesis.** El fallo nº1 de SPPLB es quedarse desactualizado: iOS sin tocar desde 2023 y
> quejas recurrentes de "esta norma no está al día". Nuestro foso no es una funcionalidad
> vistosa, es un **pipeline de ingesta reproducible, versionado y demostrable** que convierte
> "siempre al día" en una propiedad del producto que el usuario **puede ver con fecha y fuente
> en cada ficha**. Este documento diseña ese motor de principio a fin.

Fuentes de código leídas: `docs/ESPECIFICACION.md` (secciones 6 y 8), `packages/content-pipeline/README.md`,
`packages/shared/src/{content,validators,enums}.ts`, `packages/content-pipeline/src/cli/build-content.ts`.
Fuentes externas confirmadas: API de legislación consolidada del BOE (datos abiertos) y publicación del Codificado DGT (ver sección 8, Riesgos y referencias).

---

## 0. Vista de conjunto

```
                        ┌─────────────────────── FUENTES ───────────────────────┐
   BOE datos abiertos ──┤ /legislacion-consolidada/id/{id}  (XML consolidado)    │
   DGT codificado ──────┤ Guía Codificada de Infracciones (PDF/Excel/ePUB)       │
   Boletines auton. ────┤ BORM, BOC, DOGC… (HTML/PDF, sin API uniforme)          │
   Ordenanzas munic. ───┤ Web del ayuntamiento (PDF) → carga por panel           │
   Carreteras/PK ───────┤ Red de Carreteras del Estado + autonómicas (PostGIS)   │
                        └───────────────────────────────────────────────────────┘
        │
        ▼   (1) FETCH + HASH        (2) PARSE            (3) DIFF + VIGENCIA
   ┌──────────────┐  cambia?   ┌──────────────┐  art.  ┌───────────────────────┐
   │ sources/*    │──────────▶ │ parsers/*    │──────▶ │ diff por Articulo:     │
   │ ETag/hash    │  sí→sigue  │ XML→Markdown │        │ cierra validTo antiguo │
   │ no→termina   │            │ DGT→Infrac.  │        │ alta validFrom nuevo   │
   └──────────────┘            └──────────────┘        └───────────┬───────────┘
                                                                    ▼
   (4) VALIDACIÓN CALIDAD          (5) COLA REVISIÓN        (6) BUILD + FIRMA
   ┌────────────────────────┐   ┌──────────────────┐   ┌────────────────────────┐
   │ validarImporte         │   │ panel admin:     │   │ SQLite + FTS5 +         │
   │ validarMinimosPublic.  │──▶│ "requiere        │──▶│ sinónimos + normaliz.   │
   │ (packages/shared)      │   │  revisión"       │   │ → firma → ContentVersion│
   │ + tests + integridad   │   │ + 2 ojos         │   │ → Novedad → CDN         │
   └────────────────────────┘   └──────────────────┘   └───────────┬────────────┘
                                                                     ▼
                                          (7) ENTREGA: delta/completa + swap atómico
                                                    en el dispositivo (expo-sqlite)
```

El pipeline es **idempotente y determinista**: dada una foto de las fuentes, produce siempre
el mismo paquete SQLite y el mismo hash. Eso permite reejecutarlo, auditarlo y firmar el resultado.

---

## 1. Arquitectura del pipeline BOE → app

### 1.1 Fuentes y catálogo de normas

El pipeline se gobierna por un **catálogo declarativo** (`packages/content-pipeline/catalog/normas.json`)
que enumera cada norma a vigilar. Es la única cosa que el cofundador toca para "empezar a vigilar" algo nuevo:

```jsonc
[
  { "codigo": "LSV",  "boeId": "BOE-A-2015-11722", "tipo": "ley",        "ambito": "estatal", "prioridad": 1 },
  { "codigo": "RGC",  "boeId": "BOE-A-2003-23514", "tipo": "reglamento", "ambito": "estatal", "prioridad": 1 },
  { "codigo": "RGV",  "boeId": "BOE-A-1999-1826",  "tipo": "reglamento", "ambito": "estatal", "prioridad": 1 },
  { "codigo": "RGCond","boeId":"BOE-A-2009-9481",  "tipo": "reglamento", "ambito": "estatal", "prioridad": 2 }
  // … LO 4/2015, CP, LECrim, extranjería, menores, armas, animales, LOTT/ROTT
]
```

> Los `boeId` concretos se confirman en el primer `fetch` real de Fase 1 (el buscador del BOE los
> devuelve). El catálogo es la fuente de verdad de "qué vigilamos", no el código.

### 1.2 Descarga del XML consolidado por norma (`sources/boe`)

La API de datos abiertos del BOE expone la legislación consolidada por identificador `BOE-A-AAAA-NNNN`:

| Endpoint | Uso en el pipeline |
|---|---|
| `/datosabiertos/api/legislacion-consolidada/id/{id}/metadatos` | Metadatos: título, fecha de última actualización/consolidación. **Sonda barata** para decidir si merece descargar todo. |
| `/datosabiertos/api/legislacion-consolidada/id/{id}/texto` | Texto consolidado completo en **XML**, estructurado en nodos `<bloque>` (cada bloque ≈ un artículo/disposición). Es la fuente primaria del parseo. |
| `/datosabiertos/api/legislacion-consolidada/id/{id}/texto/indice` | Índice de bloques (id + título) en XML/JSON. Permite parseo incremental por bloque. |
| `/datosabiertos/api/legislacion-consolidada/id/{id}/texto/bloque/{idBloque}` | Un bloque concreto. Útil para reprocesar solo lo que cambió. |
| `/datosabiertos/api/legislacion-consolidada/id/{id}/analisis` | **Historial de modificaciones** (qué norma modifica a cuál, con fechas). Fuente de la "razón del cambio" para la `Novedad`. |

Cliente (`sources/boe/client.ts`):
- Cabecera `Accept: application/xml` (JSON donde el endpoint lo permite, p. ej. `indice`/`analisis`).
- `User-Agent` identificable, **rate limit propio** (1 req/s, backoff exponencial), reintentos con jitter.
- Cache HTTP: se guarda `ETag`/`Last-Modified` por norma en `.cache/boe/{codigo}.meta.json`. En la
  siguiente ejecución se manda `If-None-Match`; un `304 Not Modified` corta el trabajo antes de parsear.
- Todo lo descargado se **archiva crudo** en `raw/boe/{codigo}/{fechaISO}.xml` (WORM: nunca se sobrescribe).
  Ese archivo es la evidencia auditable de qué decía el BOE ese día.

### 1.3 Detección de cambios por hash (dos niveles)

1. **Nivel norma (barato):** `sha256` del XML consolidado completo (normalizado: se colapsan espacios,
   se ignoran atributos de fecha de generación del documento para evitar falsos positivos). Se compara
   con `hashNorma` guardado. Si coincide → la norma no ha cambiado, se termina. Esto evita reparsear
   normas estables (la inmensa mayoría de las ejecuciones).
2. **Nivel artículo (fino):** solo si el hash de norma cambió, se parsea a artículos y se calcula el
   `hash` de cada `Articulo` (campo ya presente en el modelo, `content.ts:68`). La comparación
   artículo-a-artículo dice **exactamente qué artículos cambiaron**, no solo "algo cambió".

El hash de artículo se computa sobre el **texto Markdown normalizado** (no sobre el XML), para que un
cambio cosmético de maquetación del BOE no dispare un falso cambio. Regla: `hash = sha256(normalizar(markdown))`
donde `normalizar` = trim + colapsar espacios + normalizar saltos de línea + NFC Unicode.

### 1.4 Parseo XML → artículos Markdown (`parsers/boe-xml`)

- Se recorre cada `<bloque>` del texto consolidado. Tipos de bloque relevantes: artículos,
  disposiciones (adicionales, transitorias, finales), anexos. Se mapea:
  - `Articulo.numero` ← identificador del bloque ("11", "11.1", "D.A. 1ª", "Anexo I").
  - `Articulo.titulo` ← rúbrica del bloque si existe.
  - `Articulo.texto` ← contenido convertido a **Markdown** (párrafos, listas de apartados, tablas de anexos).
  - `Articulo.orden` ← posición secuencial en el índice (para navegación norma→artículo).
- Conversión XML→Markdown con reglas explícitas y **snapshot tests** (un XML de referencia del RGC en
  `parsers/boe-xml/__fixtures__/` cuyo Markdown esperado se versiona en git; cualquier deriva del parser
  rompe el test antes de tocar producción).
- Artículos **derogados**: el BOE los marca; se conservan con su texto tachado/nota y se les fija
  `validTo` (no se borran — el modelo es append-only, `ESPECIFICACION.md:280`).

### 1.5 Diff por artículo y gestión de vigencia (`valid_from` / `valid_to`)

Este es el núcleo del versionado y donde el diseño de datos ya nos ayuda (`Vigencia` en `content.ts:28`).
Algoritmo, por norma que cambió:

```
Sea A_old = artículos vigentes actuales (validTo == null) de la norma.
Sea A_new = artículos recién parseados del XML.

Para cada artículo n (emparejado por `numero`):
  - existe en old y new, mismo hash     → sin cambio. No se toca.
  - existe en old y new, hash distinto   → CAMBIO:
        · cerrar el viejo:  old.validTo = fechaConsolidacionBOE
        · alta del nuevo:   new.validFrom = fechaConsolidacionBOE, validTo = null, id nuevo
        · registrar diff(old.texto, new.texto) para la Novedad y el panel
  - existe solo en new                   → ALTA de artículo (validFrom = fecha, validTo = null)
  - existe solo en old                   → DEROGADO: old.validTo = fecha; no hay sucesor
```

- La `fechaConsolidacionBOE` sale de los metadatos (`fechaConsolidacion` en `Norma`, `content.ts:56`).
- El diff se guarda a dos resoluciones: **textual por líneas** (para el panel, con resaltado) y
  **resumen en 2 líneas** generado por plantilla/LLM asistido y revisado por humano (para la `Novedad`
  que ve el usuario, `content.ts:247`).
- **Nunca se hace UPDATE destructivo.** Cerrar `validTo` + alta de fila nueva = historia completa
  reconstruible. La app solo consulta filas con `validTo IS NULL` (o `validTo > now`).

### 1.6 Propagación a infracciones

Cuando un artículo cambia, **toda `Infraccion` cuyo `articuloId` apunta a ese artículo** (o a su número)
se marca `requiere_revision = true` y **no se republica automáticamente** con el artículo nuevo: el texto
del boletín, el importe o los puntos podrían haber cambiado con la reforma. Va a la cola de revisión
(sección 3). Este acoplamiento controlado es lo que impide publicar un importe obsoleto sin que un humano
lo confirme.

---

## 2. Parseo del Codificado DGT y cruce con RGC/RGV/LSV

El **Codificado de Infracciones** de la DGT es el puente entre "texto legal" y "ficha accionable en la
calle": para cada código de infracción da la norma y artículo infringidos, la gravedad, la sanción
económica, los puntos y notas de posible delito. Es exactamente el `Infraccion` del modelo (`content.ts:94`).

### 2.1 Ingesta (`parsers/dgt`)

- El documento se publica en **PDF/Excel/ePUB**. Estrategia por robustez decreciente:
  1. Si hay Excel/CSV → parseo tabular directo (columnas: código, artículo, apartado, opción, hecho
     denunciado, norma, gravedad, puntos, importe). **Preferido.**
  2. Si solo hay PDF → extracción de tablas con `camelot`/`tabula` (Python) o `pdfplumber`; el codificado
     tiene estructura tabular regular, se extrae bien.
- El codificado se trata como **fuente semiestructurada versionada**: cada edición nueva (la DGT publica
  actualizaciones periódicas) se archiva cruda en `raw/dgt/{fecha}.pdf` y se le calcula hash.

### 2.2 Cruce (join) con los artículos del BOE

Cada fila del codificado trae una referencia tipo "RGC art. 118.1 5A" o "LSV 77 e)". El parser:

1. **Normaliza la referencia**: extrae `{normaCodigo, numeroArticulo, apartado, opcion}` con una gramática
   de expresiones regulares tolerante (maneja "art.", "artículo", "apdo", letras y números romanos).
2. **Resuelve el `articuloId`** buscando en la tabla `Articulo` **vigente** (`validTo IS NULL`) el par
   `(normaId por codigo, numero)`. Si el número trae apartado ("118.1"), se intenta match exacto y, si no,
   match al artículo padre ("118") dejando el apartado como metadato.
3. **Genera la `Infraccion`** enlazada: `codigoDgt` = código DGT, `articuloId` = el resuelto,
   `gravedad`/`puntos`/`importeEur` del codificado, `tituloCorto` = hecho denunciado depurado,
   `textoBoletin` = borrador a partir del hecho denunciado (lo pule el cofundador),
   `ambito='estatal'`, `tipo='administrativa'` (o `penal`/`delito` si el codificado nota posible delito).
4. **No resueltos → cola de revisión.** Si una referencia no casa con ningún artículo vigente (cambió la
   numeración, error del codificado, artículo aún no ingerido), la fila va a un informe
   `dgt-huerfanas.json` que aparece en el panel. Nunca se inventa un enlace.

### 2.3 Importe reducido y puntos

- `importeReducidoEur` (pronto pago, 50 % en tráfico, art. 94 LSV) se **calcula** (`importeEur * 0.5`)
  y se marca como derivado, salvo que el codificado dé el valor explícito.
- Los puntos vienen del codificado; se validan contra el anexo de LSV en un test de coherencia.

---

## 3. Validación de calidad y revisión humana

La calidad no es un paso final opcional: es una **puerta que ninguna `ContentVersion` cruza sin pasar**.

### 3.1 Integración de los validadores de `@agente/shared`

Los validadores ya existen y son la fuente de verdad de "qué es publicable" (`packages/shared/src/validators.ts`):

- **`validarImporte(infraccion, marco)`** — comprueba el importe contra los rangos legales por gravedad.
  El pipeline elige el `marco` según la norma de origen: `'trafico'` para infracciones cuyo artículo
  pertenece a LSV/RGC/RGV; `'seguridad_ciudadana'` para LO 4/2015. (Se ampliará el enum `MarcoImporte`
  cuando entren otros marcos; hoy cubre los dos rangos del `ESPECIFICACION.md:406`.)
- **`validarMinimosPublicacion(infraccion, numSinonimos)`** — exige artículo enlazado, texto de boletín,
  importe (si administrativa) y **≥ 2 sinónimos**. `numSinonimos` se pasa aparte porque los sinónimos
  viven en otra tabla; el pipeline lo cuenta al construir el paquete.

Punto de integración concreto en el CLI (evoluciona `build-content.ts`, hoy stub):

```ts
// stage: validate/index.ts
for (const inf of infracciones) {
  const marco = marcoPorNorma(inf.articuloId);           // 'trafico' | 'seguridad_ciudadana'
  const numSin = contarSinonimos(inf.id);
  const problemas = [
    ...validarImporte(inf, marco),
    ...validarMinimosPublicacion(inf, numSin),
  ];
  if (problemas.length > 0) marcarRequiereRevision(inf, problemas); // NO entra al build
}
if (hayInfraccionesRequierenRevisionCriticas()) abortarPublicacion();
```

**Regla de oro:** una infracción con problemas de validación **no se incluye en el paquete publicado**;
se queda en estado `requiere_revision`. El paquete puede publicarse con las buenas y dejar las malas para
la siguiente versión (el usuario nunca ve un importe fuera de rango).

### 3.2 Tests automáticos (Vitest, ya configurado en el paquete)

- **Unitarios de validadores**: rangos límite (0/100/200/500 €, 601, 30.000…), reducido > base, faltas
  de campo. (Extienden los tests que ya sugiere el diseño.)
- **De parser** (snapshot): XML de referencia → Markdown esperado; codificado de referencia → `Infraccion[]`
  esperadas.
- **De integridad del paquete** (post-build, sobre el SQLite):
  - todo `Infraccion.articuloId` resuelve a un `Articulo` presente;
  - todo `Articulo` vigente tiene `validTo IS NULL` y no hay dos vigentes con el mismo `(normaId, numero)`;
  - toda infracción publicada tiene ≥ 2 sinónimos y fuente;
  - FTS5 devuelve resultado para una batería de consultas "de calle" de regresión ("faro roto", "sin seguro",
    "móvil", "sin itv"…). Si una deja de encontrar su ficha, falla el build.
- **De rangos de puntos** contra el anexo LSV.

### 3.3 Cola "requiere revisión" y revisión a dos ojos

Flujo en el panel de administración (`apps/admin`):

1. El job deja en estado `requiere_revision` (con el motivo: "art. 118 RGC cambió el dd/mm", "importe fuera
   de rango", "referencia DGT huérfana", "diff textual detectado").
2. La cola muestra, por ítem: **diff del artículo** (resaltado), la infracción afectada, los problemas de
   validación y un borrador del resumen de la `Novedad`.
3. **Revisor 1** (cofundador agente) edita texto de boletín / importe / sinónimos y marca "revisado".
4. **Revisión a dos ojos** para lo sensible — consecuencias (detención/decomiso) y sustancias exigen
   `aprobadoPor` distinto de `revisadoPor` (`ESPECIFICACION.md:408`, `4.7`, `13`). El panel bloquea la
   publicación de esos ítems si solo hay una firma. Se registra quién y cuándo (auditoría).
5. Solo cuando **no queda ningún ítem crítico pendiente** se habilita "Publicar `ContentVersion`".

El diseño premia el avance: marcar "requiere revisión" no bloquea toda la publicación, solo retiene el
ítem afectado (`ESPECIFICACION.md:548`).

---

## 4. Empaquetado, firma y entrega

### 4.1 Build del SQLite (`build/`)

- Base **SQLite** con `expo-sqlite` en el dispositivo. El build genera un `.db` desde cero (determinista):
  tablas `norma`, `articulo`, `infraccion`, `sinonimo`, `consecuencia`, `sustancia`, `plantilla`,
  `texto_derechos`, `festivo`, más las **tablas FTS5**.
- **FTS5**: tabla virtual `infraccion_fts` (y `articulo_fts`) sobre `titulo_corto`, `texto_boletin`,
  `texto` y los sinónimos agregados. Configuración:
  - `tokenize = "unicode61 remove_diacritics 2"` → tildes y mayúsculas normalizadas ("faró" = "faro").
  - Columna de sinónimos materializada: al construir, cada infracción concatena sus `Sinonimo.termino`
    en un campo indexado, con `peso` reflejado en el **ranking** (BM25 + boost por sinónimo exacto).
  - Ranking replicado del `ESPECIFICACION.md:157`: sinónimo exacto > título > texto > popularidad.
- **Sinónimos y normalización**: además del `remove_diacritics` de FTS5, se materializa una tabla
  `sinonimo` y un diccionario de **normalización de calle** (mismo que mantiene el cofundador en el panel).
  La distancia de edición 1-2 para erratas se resuelve en la app (no en SQLite), con `trigram` como red.
- **Tamaño**: el paquete de tráfico (Fase 1) es pequeño (pocos MB). Se comprime (gzip/br) para el CDN.

### 4.2 Firma e integridad

- Tras el build se calcula `sha256` del `.db` y se **firma** (Ed25519; clave privada solo en el secreto
  de CI, clave pública embebida en la app). El `hash`/firma va en `ContentVersion.hash` (`content.ts:243`).
- La app **verifica la firma antes de instalar** el paquete (`ESPECIFICACION.md:373`). Un paquete no
  firmado o alterado se rechaza y se conserva el anterior.

### 4.3 `ContentVersion` (semver) y `Novedad`

- `ContentVersion.version` sigue **semver** (`content.ts:239`):
  - **patch** (`x.y.Z`): correcciones de contenido sin cambio estructural (un importe, un sinónimo).
  - **minor** (`x.Y.0`): nuevas normas/infracciones, nuevas `Novedad`, cambios normativos ingeridos.
  - **major** (`X.0.0`): cambio de **esquema** del SQLite (obliga a app compatible; se negocia con
    `min_app_version`).
- `changelog` (json) lista normas y artículos afectados. Por cada bloque de cambios se crea una `Novedad`
  (`content.ts:247`): `normaId`, `articulos[]`, `resumen` (2 líneas), `fecha`. Es lo que alimenta la
  pantalla de novedades y el push opcional.

### 4.4 Entrega por CDN, delta/completa y swap atómico

- Los paquetes viven en un bucket con **CDN** (`ESPECIFICACION.md:366`). Estructura:
  `content/{major}/full/{version}.db.br` y `content/{major}/delta/{from}->{to}.patch`.
- Un **manifiesto** `content/{major}/latest.json` (firmado) publica: última `version`, `hash`, `url` full,
  lista de deltas disponibles, `min_app_version`.
- **La app, al abrir y en segundo plano**, lee el manifiesto:
  - si su versión local == latest → nada;
  - si hay **delta** desde su versión → descarga el patch pequeño y lo aplica;
  - si no hay cadena de deltas → descarga el **full**.
- **Sustitución atómica** en el dispositivo: se descarga a `content.new.db`, se verifica firma+hash, se
  abre para sanity-check (una query FTS de prueba) y solo entonces se hace `rename` atómico
  `content.new.db → content.db` (y se cierra/reabre la conexión `expo-sqlite`). Si algo falla en cualquier
  paso, se descarta el `.new` y se sigue con el paquete anterior: **el usuario nunca se queda sin contenido**.
- Todo offline-first: el contenido vive en el dispositivo; el servidor solo sirve actualizaciones
  (`ESPECIFICACION.md:121, 347`).

---

## 5. "Siempre al día" demostrable → argumento de marketing

La actualización no vale de nada si el usuario no la **ve**. El diseño ya reserva los campos para probarlo;
el motor los rellena siempre:

**En cada ficha de infracción/artículo** (pie, `ESPECIFICACION.md:174`):
> *"Actualizado el 12/06/2026 · Fuente: RGC art. 118.1 · BOE-A-2003-23514"* con enlace directo a la norma
> consolidada en el BOE. La fecha sale de `Articulo.validFrom`/`Norma.fechaConsolidacion`, no es decorativa:
> es el dato real de cuándo el BOE consolidó ese texto.

**En Normativa**: indicador *"cambió el dd/mm/aaaa"* en artículos modificados recientemente, con el diff
resumido (`ESPECIFICACION.md:181`). El agente ve qué frase cambió, no solo que "algo" cambió.

**Pantalla de Novedades**: lista de `Novedad` desde la última apertura ("Ha cambiado el art. X del RGC:
sube el importe de 200 a 500 €"), con push opcional (`ESPECIFICACION.md:120, 259`).

**Conversión a ventaja de marketing/venta** (el cofundador agente es el vendedor, boca a boca):
- *Prueba visible frente a SPPLB*: "abre cualquier ficha y mira la fecha y la fuente. En la otra app no
  sabes de cuándo es". Es un argumento que se demuestra en 3 segundos delante de un compañero.
- *Historial público de actualizaciones*: una página "Novedades" (en la app y en la landing) que se
  actualiza sola con cada `ContentVersion` — evidencia continua de que el producto está vivo, justo lo
  contrario del "iOS sin tocar desde 2023".
- *Compromiso medible*: "cambio en el BOE reflejado en la app en < X días", con la fecha visible que lo
  respalda. El foso es que **cada ficha lleva encima la prueba de que está al día**.

---

## 6. Cadencia y operación (trabajo humano mínimo)

**Jobs (GitHub Actions, cron):**

| Job | Frecuencia | Qué hace | Interacción humana |
|---|---|---|---|
| `boe-watch` | **Diario** (madrugada) | `metadatos`+hash de cada norma del catálogo. Si nada cambió, termina en segundos y **no notifica**. | Ninguna en el 99 % de días. |
| `boe-ingest` | Disparado por `boe-watch` si hay cambio | Descarga XML, parsea, diff, vigencia, marca infracciones `requiere_revision`, abre PR/entrada en la cola. | Alerta al cofundador. |
| `dgt-check` | **Semanal** | Comprueba si hay nueva edición del codificado (hash del PDF/URL). | Alerta si hay edición nueva. |
| `content-build` | Manual / al aprobar la cola | Valida, construye SQLite, firma, sube a CDN, publica `ContentVersion`+`Novedad`. | 1 clic "Publicar" tras revisión. |
| `verify-published` | Tras publicar | Descarga el paquete del CDN como lo haría la app, verifica firma y corre los tests de integridad contra él. | Ninguna (alerta si falla). |

**Alertas**: a un canal (correo/Telegram/Slack del cofundador) solo cuando **hay algo que revisar** o
**algo falla**. Silencio = todo al día. Nunca ruido diario.

**Trabajo humano mínimo del cofundador agente** (el foso depende de que sea *poco*):
- Días normales: **cero**.
- Cuando salta un cambio: revisar el diff en el panel, ajustar texto de boletín/importe/sinónimos de las
  infracciones afectadas, dar el visto bueno. Minutos, no horas, porque el pipeline ya deja el diff, el
  borrador de resumen y los problemas de validación señalados.
- Publicar: 1 clic cuando la cola está limpia. Consecuencias/sustancias requieren la segunda firma.

---

## 7. Plan por fases del contenido

**Fase 1 — Tráfico (el corazón, primero):** LSV, RGC, RGV (+ Reglamento de Conductores). Pipeline BOE
completo + parseo del codificado DGT + build + descarga en app. Es donde el "siempre al día" se demuestra
y donde está el 80 % del uso diario. **Entrega beta 1** (`ESPECIFICACION.md:439`).

**Fase 2 — Resto estatal y capa penal:** LO 4/2015 (con su `marco` de importes), Código Penal + LECrim
(reglas de detención), extranjería, menores, armas, animales, transportes (LOTT/ROTT), VMP. Tabla de
sustancias (carga manual con doble revisión). Mismo pipeline BOE; el codificado ya no aplica, las
infracciones se cargan/curan por panel con los validadores.

**Fase 5+ — Autonómicas y municipales.** Aquí no hay API uniforme. Estrategia por capas:
1. **Autonómicas** (empezar por Murcia/Canarias, las de los beta): parsers específicos por boletín
   (BORM, BOC). Menos automatizable; se prioriza descarga+parseo semiautomático y carga por panel.
2. **Ordenanzas municipales**: sin API. Aquí entra el **modelo "mi ordenanza personal" como puente**:
   - El agente local sube el PDF de la ordenanza de **su** municipio desde el panel/app; la parseamos
     (o el cofundador la introduce) a `Norma(ambito='municipal', territorioId)` + `Infraccion` locales.
   - Al principio esa ordenanza es "personal" (visible para ese usuario/municipio). Cuando un municipio
     acumula usuarios, su ordenanza ya curada se **promueve a contenido oficial** del paquete para ese
     `territorioId`. Así el trabajo de un usuario beneficia a todos los de su municipio, y crecemos la
     cobertura municipal **bajo demanda real**, sin intentar ingerir 8.000 ayuntamientos de golpe.
   - El modelo de datos ya lo soporta: `ambito`/`territorioId` en `Norma` e `Infraccion` (`content.ts`),
     y el filtrado por perfil (cuerpo+territorio) hace que cada agente solo vea lo suyo.

---

## 8. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| **El BOE cambia el formato del XML** (nodos, esquema) | El parser rompe silenciosamente o mete basura | **Snapshot tests** del parser con fixtures versionadas; validación contra el XSD que publica el BOE; el `verify-published` corre tests de integridad; si el parser falla, **no se publica** y salta alerta. El paquete anterior sigue sirviéndose. |
| **La API del BOE cae o cambia endpoints** | No se detectan cambios | Cache/archivo crudo permite reintentar; el catálogo desacopla "qué vigilar" del código; fallback a scraping del HTML consolidado (`buscar/act.php?id=`) si la API falla. Silencio del job ≠ "al día": monitor de "última ejecución con éxito". |
| **Falso positivo de cambio** (BOE reescribe maquetación sin cambio legal) | Ruido de revisión | Hash sobre Markdown **normalizado**, no sobre XML crudo; diff a nivel artículo para ver que el cambio es cosmético y descartarlo en 1 clic. |
| **Codificado DGT en PDF sin estructura estable** | Parseo frágil | Preferir Excel/CSV; extracción tabular con validación de columnas; filas no resueltas → cola de huérfanas, nunca enlace inventado; el codificado se archiva versionado. |
| **Referencia DGT que no casa con artículo** (cambió numeración) | Infracción sin fuente válida | Resolución tolerante + cola `dgt-huerfanas`; una infracción sin `articuloId` resoluble **no pasa** `validarMinimosPublicacion`. |
| **Ordenanzas municipales sin API** | Cobertura municipal lenta | Modelo "mi ordenanza personal" como puente: carga por usuario/panel, promoción a oficial bajo demanda. |
| **Error humano en revisión** (importe mal aprobado) | Pérdida de confianza (el pecado capital) | `validarImporte` bloquea rangos imposibles; doble firma en lo sensible; canal "reportar error" en la ficha realimenta la cola; append-only permite revertir a la versión anterior por `validTo`. |
| **Publicar un paquete corrupto** | App sin contenido | Firma Ed25519 + verificación en dispositivo + swap atómico con sanity-check; `verify-published` descarga y prueba el paquete real antes de dar por buena la release. |
| **Dependencia de una sola persona para revisar** | Cuello de botella | El pipeline hace el trabajo pesado (diff, borrador, validación); marcar "requiere revisión" retiene solo el ítem, no bloquea la release; segundo revisor para lo crítico. |

**Referencias externas confirmadas:**
- API de legislación consolidada del BOE (datos abiertos): endpoints `/legislacion-consolidada/id/{id}`,
  `/metadatos`, `/texto`, `/texto/indice`, `/texto/bloque/{id}`, `/analisis`; texto consolidado en XML
  estructurado en nodos `<bloque>`; identificador `BOE-A-AAAA-NNNN`.
  <https://www.boe.es/datosabiertos/api/api.php> · <https://www.boe.es/datosabiertos/faq/consolidada.php>
- Codificado / Guía Codificada de Infracciones de la DGT (documento público, PDF/Excel/ePUB; norma,
  gravedad, sanción, puntos y notas de delito por código). CPAGE / DGT.
```
