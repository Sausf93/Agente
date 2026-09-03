# 08 · Arquitectura de contenido multi-territorio

> **Tesis.** "Agente" no sirve el BOE a todos por igual: cada agente ve una **pila de capas**
> (estatal → autonómica → municipal) resuelta por su **perfil** (cuerpo → CCAA → provincia →
> municipio). El reto no es tener 17 boletines y miles de ordenanzas, es **modelar la herencia
> y el solapamiento entre capas** con la menor cantidad de mecanismo posible, para que una sola
> persona técnica lo mantenga. Este documento fija ese modelo y lo deja como propuesta de ADR.

Fuentes leídas: `docs/ESPECIFICACION.md` (§4.5, §4.6, §6, §8), `docs/analisis/06-motor-contenido.md`,
`packages/shared/src/{content,enums,validators,user}.ts`, `docs/DECISIONES.md`, `CLAUDE.md`.

Principio rector (de `CLAUDE.md`): offline-first, `shared` como fuente única de tipos, TS estricto,
**simple y mantenible por una persona**. Todo lo que sigue evita sobre-ingeniería a propósito: se
reutiliza lo que ya existe (`ambito`, `territorioId`, `Territorio`, `Competencia`) y se añade lo mínimo.

---

## 1. Modelo de datos multi-territorio

### 1.1 Lo que ya tenemos (no se toca)

- `Territorio { id, tipo(ccaa|provincia|municipio), padreId, codigoIne }` — jerarquía INE completa.
- `Ambito = estatal | autonomico | municipal` y `territorioId?` en `Norma` e `Infraccion`.
- `Competencia { cuerpos[], via }` embebida en `Infraccion`.
- `PerfilUsuario { cuerpo, ccaaId, provinciaId, municipioId? }` (municipio obligatorio en Local).

La base ya es correcta. **El modelo de capas no necesita tablas nuevas**, solo tres campos y dos índices.

### 1.2 Regla de las tres capas y la "cadena territorial" del perfil

Cada `Norma`/`Infraccion` pertenece a **exactamente una capa** (`ambito`) y a **un territorio**
(`territorioId`, `null` = estatal). Un perfil ve el contenido cuyo `territorioId` está en su
**cadena territorial** (ancestros incluidos):

```
cadenaTerritorial(perfil) = [
  null,                 // ESTATAL (siempre)
  perfil.ccaaId,        // AUTONÓMICO de su comunidad
  perfil.provinciaId,   // (si hay contenido provincial, p. ej. festivos)
  perfil.municipioId,   // MUNICIPAL (solo Policía Local, y solo su municipio)
]
```

Un contenido es **candidato a visible** para un perfil si:
`contenido.territorioId ∈ cadenaTerritorial(perfil)`.
Esto por sí solo ya implementa "un Mosso ve estatal + Cataluña" y "un Local de Bilbao ve estatal +
País Vasco + ordenanzas de Bilbao": es un `IN (?, ?, ?, ?)` en SQL, nada más.

> El **cuerpo** NO restringe la capa: restringe la **competencia** (§4). Un Guardia Civil de Tráfico
> de Murcia ve la capa autonómica de Murcia como cualquiera; lo que cambia es qué puede **denunciar**
> él y por qué vía. Separar "qué se ve" (territorio) de "quién denuncia" (competencia) es clave para
> no acoplar dos ejes ortogonales.

### 1.3 Herencia y solapamiento: `sustituye` vs. `añade`

Una infracción de capa superior (autonómica o municipal) puede, respecto a la estatal:

- **AÑADIR** (caso mayoritario): un hecho que la capa inferior no regula (p. ej. VMP en acera por
  ordenanza municipal, tenencia de animales por normativa autonómica). Convive con la estatal.
- **SUSTITUIR / DESPLAZAR**: la capa superior regula el **mismo hecho** con importe/texto propios y
  desplaza a la estatal para ese territorio (p. ej. una ordenanza de ruido que concreta un tipo que
  la estatal deja abierto; o un régimen sancionador autonómico que sustituye al genérico).

Se modela con **un solo puntero opcional**, no con un grafo de reglas:

```ts
// nuevo en Infraccion
desplazaId: Id.nullable().default(null)  // id de la Infraccion (de capa inferior) que ESTA oculta
                                         // para los perfiles que ven esta. null = solo AÑADE.
```

Semántica de resolución (determinista, sin motor de reglas):

```
1. candidatos = infracciones con territorioId ∈ cadenaTerritorial(perfil) y validTo IS NULL
2. desplazadas = { c.desplazaId : c ∈ candidatos, c.desplazaId != null }
3. visibles = candidatos \ desplazadas
```

Es decir: si veo la autonómica que declara `desplazaId = <estatal-X>`, la estatal-X se me oculta.
Un agente de otra CCAA (que no ve esa autonómica) sigue viendo la estatal-X. **La resolución depende
solo del conjunto que el perfil puede ver**, así que es correcta por construcción y trivial de testear.

> Por qué un puntero y no `relacionCapa: 'base'|'sustituye'|'añade'`: "añade" es simplemente
> `desplazaId = null`, y "sustituye" es `desplazaId != null`. Un enum extra sería redundante y
> permitiría estados incoherentes (`'añade'` con puntero relleno). Menos es más.

### 1.4 Origen del contenido: oficial vs. personal (puente del Local)

Para el puente "mi ordenanza personal" (§5) el mismo modelo sirve, distinguiendo procedencia:

```ts
// nuevo en Norma e Infraccion
origen: z.enum(['oficial', 'personal']).default('oficial')
```

- `oficial`: viaja en el paquete SQLite firmado, solo lectura.
- `personal`: lo crea el agente en su dispositivo (tabla local aparte, ver §5); nunca sube al servidor
  salvo que lo done para curación. Se marca en la UI ("Tu ordenanza · pendiente de oficializar").

### 1.5 Consecuencias, sinónimos y artículos: heredan, no se re-etiquetan

`Consecuencia` y `Sinonimo` **no llevan `ambito`/`territorioId`**: cuelgan de una `Infraccion` o
`Articulo` y heredan su capa y territorio. Etiquetarlos otra vez sería duplicar la verdad y arriesgar
incoherencias. `Articulo` hereda de su `Norma`. Regla invariante testeada en el build:
*"ninguna Consecuencia/Sinónimo referencia contenido de un territorio distinto al de su padre"* — se
cumple sola porque no hay campo que poner mal.

`Festivo` es la única excepción y **ya** tiene `ambito(nacional|ccaa|municipio)`+`territorioId`, porque
un festivo se resuelve por la misma cadena territorial (nacional + CCAA + municipio del perfil). Se deja igual.

### 1.6 Cambios concretos propuestos a `packages/shared`

**`content.ts`:**

| Campo / cambio | Dónde | Motivo |
|---|---|---|
| `desplazaId: Id.nullable().default(null)` | `Infraccion` | Solapamiento de capas: marca qué infracción de capa inferior queda oculta. |
| `origen: z.enum(['oficial','personal']).default('oficial')` | `Norma` **e** `Infraccion` | Puente "mi ordenanza personal" y curación bajo demanda. |
| `.refine(...)` capa↔territorio | `Norma` e `Infraccion` | Invariante: `ambito==='estatal'` ⇔ `territorioId===null`; `autonomico/municipal` ⇒ `territorioId!=null`. Hoy no se valida y es la fuente nº1 de datos mal etiquetados. |
| `.refine(...)` sobre `desplazaId` | `Infraccion` | Solo capa `autonomico`/`municipal` puede desplazar; una estatal nunca desplaza (evita bucles). |

**`enums.ts`:**

| Cambio | Motivo |
|---|---|
| `OrigenContenido = z.enum(['oficial','personal'])` | Reutilizable por `Norma`/`Infraccion` y por la tabla local del puente. |
| (opcional) `RelacionCapa` **NO** se añade | Se descarta a propósito: el puntero `desplazaId` ya lo expresa sin estados incoherentes. |

**Índices SQLite (en el build de `content-pipeline`, no en Zod):**

```sql
CREATE INDEX ix_infraccion_capa   ON infraccion(ambito, territorio_id, valid_to);
CREATE INDEX ix_infraccion_despl  ON infraccion(desplaza_id);
CREATE INDEX ix_norma_capa        ON norma(ambito, territorio_id);
CREATE INDEX ix_articulo_norma    ON articulo(norma_id, valid_to);
```

`ix_infraccion_capa` es el que sirve el filtro por cadena territorial + vigencia en cada búsqueda/listado.

### 1.7 Función única de resolución (en `shared`, testeada)

Para que app y panel resuelvan **igual**, la lógica vive una sola vez en `shared`:

```ts
// packages/shared/src/territorio.ts (nuevo)
export function cadenaTerritorial(p: Pick<PerfilUsuario,'ccaaId'|'provinciaId'|'municipioId'>): (string|null)[]
export function esVisible(territorioId: string|null, cadena: (string|null)[]): boolean
export function resolverVisibles<T extends {id:string; territorioId:string|null; desplazaId?:string|null}>(
  candidatos: T[], cadena: (string|null)[]
): T[]   // aplica cadena + desplazamiento; testeado con los 3 perfiles ejemplo
```

El SQL hace el filtro grueso (cadena territorial + `valid_to IS NULL`); `resolverVisibles` aplica el
desplazamiento en memoria sobre el conjunto ya pequeño. Es la única pieza de lógica nueva y lleva tests
obligatorios (regla `CLAUDE.md`: el buscador y el motor de reglas se testean).

---

## 2. Empaquetado y descarga

### 2.1 Las dos opciones

| | **A · Paquete único** (todo en un `.db`, filtrado en cliente) | **B · Paquetes por territorio** (estatal + pack CCAA + pack municipio, con `ATTACH`) |
|---|---|---|
| Tamaño en dispositivo | Todos cargan todo. Estatal+tráfico son pocos MB; 17 CCAA + N municipios curados **siguen siendo pocos MB** (texto comprimido). | Cada uno solo su capa. Ahorro real solo cuando el municipal crezca mucho. |
| Offline / swap atómico | **Idéntico al ya diseñado** (§4.4 doc 06): un `rename` atómico, una conexión. | N ficheros, N versiones, N verificaciones de firma, N swaps que coordinar. |
| Actualización | Un `ContentVersion`, un manifiesto, un delta. | Matriz de versiones por pack; deltas por pack; combinaciones a probar. |
| Búsqueda FTS5 | Un índice FTS, filtrado por `territorio_id` en el `WHERE`. Simple. | FTS por base atada; unir resultados de varias `ATTACH` y rankear entre ellas. Más frágil. |
| Complejidad para 1 persona | **Baja.** Es lo que ya está construido. | Alta: gestión de packs, compatibilidad de esquema entre packs, pruebas combinatorias. |
| Privacidad | Neutro. | Descargar "pack de Bilbao" filtra territorio del agente en el CDN (evitable, pero es ruido). |

### 2.2 Recomendación: **A — un solo paquete, filtrado en cliente** (con puerta de salida a B)

Para el volumen real (todo es texto legal, muy comprimible; el municipal entra **curado y bajo demanda**,
no los 8.000 ayuntamientos) el paquete único pesa unos pocos MB durante mucho tiempo. Gana en las cuatro
dimensiones que importan a un equipo de una persona: **offline** (reutiliza el swap atómico ya diseñado),
**actualización** (un manifiesto, un delta), **complejidad** (cero mecanismo nuevo) y **búsqueda** (un
FTS con `WHERE territorio_id IN (...)`).

El esquema queda **preparado para partir a B sin migración de datos** el día que haga falta: como
`territorio_id` y `ambito` están en cada fila, "sacar" el pack de una CCAA es un `SELECT ... WHERE
territorio_id = ?` a un `.db` aparte. **Disparadores para reconsiderar B** (dejar escrito el umbral):

- el `.db` comprimido supera ~**40–50 MB**, o
- el pack municipal de un solo municipio popular supera al estatal, o
- las métricas muestran que el 90 % descarga territorio que nunca consulta.

Hasta entonces, B es sobre-ingeniería. **ADR-008.**

### 2.3 Detalle operativo (encaja con doc 06 §4)

- Un único `ContentVersion` y `content/{major}/latest.json` como hoy.
- El `.db` incluye **todas las capas oficiales publicadas**; el `changelog`/`Novedad` ya distingue por
  `normaId`, así que "novedad autonómica de Murcia" se filtra por territorio en la pantalla de Novedades.
- El paquete **no** incluye contenido `origen='personal'`: ese vive solo en la tabla local del dispositivo (§5).

---

## 3. Filtrado y búsqueda por perfil

### 3.1 Consulta FTS5 con sesgo territorial

El buscador (expo-sqlite + FTS5, doc 06 §4.1) añade a su ranking BM25 un **filtro por cadena territorial**
y un **boost por cercanía al perfil**. Una sola consulta, sin lógica en JS salvo el `resolverVisibles` final:

```sql
SELECT i.*, bm25(infraccion_fts) AS rank
FROM infraccion_fts f JOIN infraccion i ON i.rowid = f.rowid
WHERE infraccion_fts MATCH :q
  AND i.valid_to IS NULL
  AND (i.territorio_id IS :estatal OR i.territorio_id IN (:ccaa, :prov, :muni))
ORDER BY
  -- 1) exactitud (sinónimo/título) ya en el MATCH/rank
  rank
  -- 2) sesgo de capa: primero lo MÁS específico de MI territorio
  + CASE i.ambito WHEN 'municipal' THEN -3 WHEN 'autonomico' THEN -2 ELSE 0 END
  -- (menor = mejor; lo del propio municipio/CCAA sube sobre lo estatal a igualdad)
LIMIT 50;
```

Después, `resolverVisibles()` (§1.7) retira las estatales desplazadas por una autonómica/municipal que
el perfil sí ve. Resultado: **lo del cuerpo/territorio del agente aparece primero y sin duplicar** el hecho
que su ordenanza ya sustituye.

> El sesgo es de **orden**, no de exclusión: lo estatal sigue apareciendo (más abajo) salvo que esté
> desplazado. Un Local de Bilbao que busca "ruido" ve primero su ordenanza; un Guardia Civil ve la estatal.

### 3.2 Chips de ámbito en resultados y ficha

Cada resultado y cada ficha muestran un **chip de capa** derivado de `ambito` (sin campo nuevo):

- `ESTATAL` (neutro) · `AUTONÓMICO · <CCAA>` · `MUNICIPAL · <municipio>`.
- Si la ficha **desplaza** a una estatal: nota "Sustituye a la norma estatal en <territorio>" con enlace
  a la desplazada (para el agente que quiera ver el régimen general).
- Si es `origen='personal'`: chip "Tu ordenanza" + aviso de no oficial (§5).

Los chips reutilizan el color-por-gravedad ya definido (§5 spec) pero en **posición distinta** para no
competir: gravedad = color del tile de importe; capa = chip de texto en la cabecera. Nunca solo color.

### 3.3 Búsquedas sin resultado como oro territorial

`EventoUso` ya lleva `cuerpo` y `ccaaId`. Una búsqueda sin resultado de un Local de un municipio sin
ordenanza cargada es la **señal de demanda** que prioriza qué municipio curar siguiente (§5, §6). No se
añade nada: se explota lo que ya se registra.

---

## 4. Competencias: "¿es esto de mi competencia?"

### 4.1 Lo que ya hay y qué falta

`Competencia { cuerpos: string[], via: 'urbana'|'interurbana'|'ambas' }` embebida en `Infraccion`.
Basta para el aviso, pero conviene **fijar el vocabulario** de `cuerpos` (hoy es `string[]` libre) y
resolver el matiz autonómico (un Mosso "sustituye" a Policía Nacional en Cataluña para ciertas competencias).

### 4.2 Cambio propuesto (mínimo)

```ts
// enums.ts — vocabulario cerrado para competencia (reutiliza Cuerpo + las autonómicas concretas)
export const CuerpoCompetente = z.enum([
  'guardia_civil','policia_nacional','policia_local','policia_autonomica', // genéricos
  'trafico',            // subrol GC de Tráfico (competencia interurbana específica)
]);
```

`Competencia.cuerpos` pasa de `string[]` a `z.array(CuerpoCompetente)`. **No** se modela el árbol
completo de competencias por CCAA (sería sobre-ingeniería para v1): basta con `policia_autonomica`
como competente y que el filtro territorial ya garantice que ese chip solo lo ve quien está en esa CCAA.

### 4.3 Regla de aviso en la ficha (en `shared`, testeada)

```ts
// territorio.ts / competencia.ts
export function avisoCompetencia(inf: Infraccion, perfil: PerfilUsuario): AvisoCompetencia | null
// Devuelve null si es de tu competencia; si no:
//  - motivo 'cuerpo'  → "Competencia habitual de: Policía Local" (tu cuerpo no está en cuerpos[])
//  - motivo 'via'     → "Vía urbana: no corresponde a Guardia Civil de Tráfico (interurbana)"
```

Lógica de `via` (el matiz de tráfico, del ejemplo del enunciado):
- `via='urbana'` + cuerpo interurbano (GC Tráfico) → aviso "no es tu vía".
- `via='interurbana'` + `policia_local` → aviso "vía interurbana".
- `via='ambas'` → nunca avisa por vía.

El aviso es **orientativo, no bloqueante** (regla `CLAUDE.md`: lenguaje no imperativo): la ficha se ve
igual, con un banner "Esto suele denunciarlo <cuerpo> · <vía>. Comprueba tu competencia." La valoración
final es del agente. Nunca se oculta contenido por competencia; solo por territorio.

---

## 5. Gestión del crecimiento

### 5.1 Catálogo de territorios activos (una lista, no código)

Igual que el catálogo de normas (doc 06 §1.1), un **catálogo declarativo** gobierna qué territorios
están "encendidos":

```jsonc
// content-pipeline/catalog/territorios.json
[
  { "codigoIne": "00", "tipo": "estatal", "estado": "publicado" },
  { "codigoIne": "14", "tipo": "ccaa",     "nombre": "Murcia",   "boletin": "BORM", "estado": "publicado" },
  { "codigoIne": "05", "tipo": "ccaa",     "nombre": "Canarias", "boletin": "BOC",  "estado": "beta" },
  { "codigoIne": "30030", "tipo": "municipio", "nombre": "Murcia", "estado": "beta" }
  // se añaden filas conforme entran comunidades/municipios; el código no cambia
]
```

Orden de arranque: **estatal (tráfico) → CCAA de la beta (Murcia, Canarias) → municipios de los agentes
beta**. Añadir cobertura = añadir una fila + curar su contenido, no tocar arquitectura.

### 5.2 El puente "mi ordenanza personal" del Local

Mientras el municipio de un agente Local no esté publicado, **no se queda sin nada**:

1. El agente sube el PDF de su ordenanza (o pega artículos) desde la app.
2. Se crea contenido **local en el dispositivo**: `Norma`/`Infraccion` con `ambito='municipal'`,
   `territorioId = perfil.municipioId`, `origen='personal'`, en una **tabla SQLite aparte del paquete
   firmado** (`local_norma`, `local_infraccion`) para no contaminar el `.db` de solo-lectura ni romper el
   swap atómico. La búsqueda hace `UNION` de la tabla oficial y la local; `resolverVisibles` las trata igual.
3. En la ficha: chip "Tu ordenanza · no oficial · la valoración es tuya".
4. **Promoción a oficial**: si el agente la dona, va a la cola de revisión del panel (doc 06 §3); una vez
   curada y publicada como `origen='oficial'` para ese `territorioId`, beneficia a todos los de su municipio
   y la copia personal se puede retirar. Así la cobertura municipal crece **bajo demanda real** medida por
   `EventoUso` (§3.3), no intentando ingerir miles de ayuntamientos de golpe.

Este puente **no requiere backend nuevo** en v1 (encaja con ADR-001/002, local-first): el contenido
personal es un dato de dispositivo más, como el cuadrante. La donación es un envío puntual opt-in.

### 5.3 Coste incremental de añadir un territorio

- **CCAA con policía propia** (Mossos, Ertzaintza, Foral, Canaria): normativa autonómica + su régimen;
  parser semiautomático por boletín (doc 06 §7 Fase 5). El filtro por `policia_autonomica` en competencia
  ya está resuelto por el territorio.
- **CCAA sin policía propia**: solo capa autonómica de contenido (p. ej. animales, espectáculos); los
  cuerpos que la ven son los estatales/locales de esa CCAA. Cero mecanismo extra.
- **Municipio**: ordenanzas por el puente + curación. El más barato de todos porque el modelo personal
  amortigua la espera.

---

## 6. Riesgos y mitigación (priorizada)

| # | Riesgo | Impacto | Mitigación | Prioridad |
|---|---|---|---|---|
| 1 | **17 boletines autonómicos heterogéneos** (BORM, BOC, DOGC, BOJA, BOPV… sin API uniforme) | Ingesta no automatizable; cuello de botella de 1 persona | **No intentar los 17**: catálogo de territorios activos (§5.1); entrar solo los de la beta; parser semiautomático + carga por panel; el modelo no distingue "cómo entró" el dato, solo su capa. Priorizar por demanda (`EventoUso`). | **Alta** |
| 2 | **Miles de municipios sin API** | Cobertura municipal imposible por fuerza bruta | Puente "mi ordenanza personal" (§5.2) + promoción bajo demanda; crecer por municipios con usuarios reales, no por catálogo total. | **Alta** |
| 3 | **Etiquetado erróneo de capa/territorio** (una estatal con `territorioId`, o autonómica sin él) | Un agente ve o no ve lo que no debe → pérdida de confianza | `.refine` capa↔territorio en `shared` (§1.6) + test de integridad en el build: *ninguna fila incoherente entra al paquete*. | **Alta** |
| 4 | **Desplazamiento mal puesto** (`desplazaId` a una infracción de otra CCAA, o bucle) | Se oculta contenido que debía verse | `.refine` (solo autonómica/municipal desplaza; nunca estatal) + test: *la desplazada es de capa igual o inferior y territorio compatible*. `resolverVisibles` testeado con los 3 perfiles ejemplo. | **Media** |
| 5 | **Solapamiento real ambiguo** (¿la ordenanza sustituye o solo añade? criterio jurídico) | Decisión de contenido, no de código | Es trabajo del `revisor-juridico`: el puntero `desplazaId` lo rellena un humano en el panel, con fuente; por defecto `null` (solo añade), la opción conservadora. | **Media** |
| 6 | **Crecimiento del paquete** al sumar CCAA/municipios | `.db` grande, descargas pesadas | Umbral explícito (§2.2) para pasar a packs por territorio; hasta ahí, uno solo. Todo texto → compresión alta. | **Baja** (vigilar) |
| 7 | **Contenido personal contamina lo oficial** o rompe el swap | App sin contenido / dato no auditable en servidor | Tablas locales separadas del `.db` firmado (§5.2); `origen='personal'` nunca viaja salvo donación opt-in; swap atómico solo sobre el paquete oficial. | **Media** |

---

## 7. Propuestas de ADR (para `docs/DECISIONES.md`)

> Se entregan redactadas en el formato de `docs/DECISIONES.md` para copiar tras revisión de los fundadores.

### ADR-006 · Modelo de capas por territorio con puntero de desplazamiento

- **Estado:** propuesta.
- **Fecha:** 2026-09-03.
- **Contexto:** la app debe adaptar el contenido por capas (estatal/autonómico/municipal) según el
  perfil, con casos de "añadir" y de "sustituir" entre capas. `shared` ya tiene `ambito` y `territorioId`.
- **Decisión propuesta:** cada contenido pertenece a una capa+territorio; un perfil ve su **cadena
  territorial** `[estatal, ccaa, provincia, municipio]`. El solapamiento se modela con **un único puntero
  `Infraccion.desplazaId`** (null = añade; relleno = sustituye/oculta a la de capa inferior). La resolución
  vive en `shared` (`resolverVisibles`), es determinista y testeada. Se descarta un enum `RelacionCapa` por
  redundante.
- **Consecuencias:** cero tablas nuevas; tres campos y dos `.refine`; una función de resolución compartida
  por app y panel. El cuerpo del agente **no** filtra capa (eso es competencia, ADR-007).
- **Reconsiderar si:** aparecen solapamientos que no sean 1→1 (una autonómica que desplaza varias estatales
  a la vez); entonces `desplazaId` pasaría a `desplazaIds[]`.

### ADR-007 · Competencia como aviso orientativo, no como filtro de visibilidad

- **Estado:** propuesta.
- **Fecha:** 2026-09-03.
- **Contexto:** la ficha debe avisar si un hecho no es de la competencia del agente (cuerpo/vía), sin
  ocultarlo.
- **Decisión propuesta:** `Competencia.cuerpos` con vocabulario cerrado (`CuerpoCompetente`); función
  `avisoCompetencia(inf, perfil)` que devuelve un banner **orientativo** (motivo cuerpo o vía). La
  competencia **nunca** oculta contenido; solo el territorio filtra. No se modela el árbol completo de
  competencias por CCAA en v1 (el filtro territorial ya acota `policia_autonomica`).
- **Consecuencias:** aviso útil sin falsos "no puedes"; lenguaje no imperativo (regla `CLAUDE.md`).
- **Reconsiderar si:** hay que distinguir competencias autonómicas finas (tráfico transferido, etc.);
  entonces se añade un mapa competencia×CCAA.

### ADR-008 · Un solo paquete SQLite con filtrado en cliente (no packs por territorio)

- **Estado:** propuesta.
- **Fecha:** 2026-09-03.
- **Contexto:** ¿un `.db` con todo filtrado por territorio, o packs por capa combinados con `ATTACH`?
- **Decisión propuesta:** **un solo paquete** con todas las capas oficiales; el cliente filtra por cadena
  territorial. Reutiliza el swap atómico, el manifiesto y el delta ya diseñados (doc 06 §4); mínima
  complejidad para una persona. El esquema (con `territorio_id`/`ambito` en cada fila) queda listo para
  partir a packs **sin migración** si se cruza el umbral (~40–50 MB comprimidos, o municipal desbordado).
- **Consecuencias:** cero mecanismo nuevo de empaquetado en v1; una sola verificación de firma; búsqueda
  FTS con un `WHERE territorio_id IN (...)`.
- **Reconsiderar si:** se cruzan los umbrales de §2.2.

### ADR-009 · "Mi ordenanza personal" en tabla local, con promoción a oficial

- **Estado:** propuesta (concreta la decisión abierta de `DECISIONES.md` §"aún abiertas").
- **Fecha:** 2026-09-03.
- **Contexto:** un Local cuyo municipio aún no está publicado necesita sus ordenanzas ya.
- **Decisión propuesta:** contenido `origen='personal'` en **tablas SQLite locales separadas** del
  paquete firmado (`local_norma`/`local_infraccion`), unido en la búsqueda por `UNION`; nunca sube al
  servidor salvo donación opt-in. Al curarse, se publica como `origen='oficial'` para ese `territorioId` y
  beneficia a todo el municipio. La demanda se prioriza con `EventoUso` (búsquedas sin resultado por CCAA).
- **Consecuencias:** encaja con local-first (ADR-001/002), sin backend nuevo; no contamina el `.db`
  oficial ni el swap atómico; cobertura municipal bajo demanda real.
- **Reconsiderar si:** el volumen de donaciones exige un flujo de curación más industrial que el panel.
