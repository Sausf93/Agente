# 09 · Fuentes de contenido autonómicas y municipales

> **Tesis.** Para que "Agente" sirva a policías autonómicas (Mossos, Ertzaintza, Policía Foral,
> Policía Canaria) y a policías locales de cualquier municipio, el motor de contenido tiene que
> mirar **más allá del BOE**. Este documento inventaría las fuentes reales (boletines autonómicos,
> normativa policial autonómica, ordenanzas municipales), marca qué está verificado y qué no, y
> propone una **estrategia realista** de ingesta y mantenimiento coherente con el pipeline descrito
> en `06-motor-contenido.md` (fetch+hash → parse → diff/vigencia → validación → cola de revisión →
> build SQLite firmado).

Fuentes internas leídas: `docs/ESPECIFICACION.md` §8 (Contenido y pipeline) y §4.5 (Normativa),
`docs/analisis/06-motor-contenido.md` (§1.1 catálogo declarativo, §7 plan por fases, §8 riesgos).
Fuentes externas: ver enlaces al final; cada afirmación no verificada en fetch directo va marcada
**(sin verificar)**.

---

## 0. Hallazgo que cambia la estrategia: las **leyes** autonómicas están en el BOE

El pipeline de Fase 1 ya sabe descargar **legislación consolidada del BOE** por identificador
`BOE-A-AAAA-NNNN` (API de datos abiertos, XML en nodos `<bloque>`). Lo importante: **las normas
autonómicas de rango legal se consolidan también en el BOE** con su propio `BOE-A-...`. Confirmado
en fetch:

- **Ley 2/2008, de 28 de mayo, del Cuerpo General de la Policía Canaria** → `BOE-A-2008-12494`.
- **Ley 4/2003, de 7 de abril, de Ordenación del Sistema de Seguridad Pública de Cataluña** → `BOE-A-2003-9620`.

Consecuencia práctica para el diseño: **la capa legal autonómica (leyes de policía, de seguridad
pública, de espectáculos, de protección animal autonómica, de movilidad) se ingiere con el MISMO
cliente y parser del BOE** que la Fase 1, solo añadiendo entradas al catálogo `normas.json` con
`ambito:"autonomico"` y `territorioId`. No hace falta un parser nuevo por comunidad para las leyes.

Los **boletines autonómicos propios** (DOGC, BOPV, BORM…) siguen siendo necesarios para lo que el
BOE **no** consolida: **decretos, órdenes, reglamentos e instrucciones autonómicas** de rango
inferior a ley y para la **versión en lengua cooficial**. Ahí sí hace falta ingesta específica y es
donde está el trabajo real (y por eso va a Fase 5+, no a Fase 1).

---

## 1. Boletines autonómicos (17 CCAA + Ceuta y Melilla)

Nombres y siglas verificados contra `boe.es/legislacion/otros_diarios_oficiales.php`. La columna
"acceso máquina" indica si hay **datos abiertos / formatos estructurados** utilizables por el
pipeline; salvo DOGC, la mayoría se marca **(sin verificar)** a nivel de API estable y debe
confirmarse en el primer `fetch` real de cada comunidad (igual que se hizo con los `boeId` en Fase 1).

| CCAA / Ciudad | Boletín | Sigla | Acceso máquina (a confirmar en fetch) | Normativa policial relevante que publica |
|---|---|---|---|---|
| Cataluña | Diari Oficial de la Generalitat de Catalunya | **DOGC** | **Verificado:** datos abiertos con XML **Akoma Ntoso**, RDF/Turtle y metadatos **ELI**, además de HTML/PDF (portal EADOP / Portal Jurídic). El mejor punto de partida técnico. | Seguridad pública (Ley 4/2003), Mossos (Ley 10/1994), policías locales, espectáculos, animales, movilidad |
| País Vasco | Boletín Oficial del País Vasco / Euskal Herriko Agintaritzaren Aldizkaria | **BOPV / EHAA** | Open Data Euskadi + Legegunea (legislación consolidada). API/datasets **(sin verificar)**; buscador de consolidado y textos bilingües es/eu | Policía del País Vasco (Ley 4/1992 Ertzaintza), seguridad pública, espectáculos, animales |
| Galicia | Diario Oficial de Galicia | **DOG** | Portal DOG + datos abiertos Xunta **(sin verificar)**; textos bilingües gl/es | Policía de Galicia / policías locales, espectáculos, animales, movilidad |
| C. Valenciana | Diari Oficial de la Generalitat Valenciana | **DOGV** | Datos abiertos GVA **(sin verificar)**; textos bilingües va/es | Coordinación policías locales, espectáculos, animales, movilidad |
| Andalucía | Boletín Oficial de la Junta de Andalucía | **BOJA** | Sede eBOJA; base con disposiciones desde 1978; API/datos abiertos **(sin verificar)** | Coordinación policías locales, espectáculos, animales, movilidad |
| Murcia | Boletín Oficial de la Región de Murcia | **BORM** | Sede BORM (HTML/PDF); API **(sin verificar)** | Coordinación policías locales, animales, espectáculos, movilidad. **Prioridad beta** |
| Canarias | Boletín Oficial de Canarias | **BOC** | Sede BOC (HTML/PDF); datos abiertos Gobierno de Canarias **(sin verificar)** | **Policía Canaria (Ley 2/2008)**, coordinación policías locales, espectáculos, animales. **Prioridad beta** |
| Aragón | Boletín Oficial de Aragón | **BOA** | Sede BOA (HTML/PDF); API **(sin verificar)** | Coordinación policías locales, espectáculos, animales |
| Asturias | Boletín Oficial del Principado de Asturias | **BOPA** | Sede BOPA (HTML/PDF); API **(sin verificar)** | Coordinación policías locales, espectáculos, animales |
| Illes Balears | Butlletí Oficial de les Illes Balears | **BOIB** | Sede BOIB; textos bilingües ca/es; API **(sin verificar)** | Coordinación policías locales, espectáculos, animales |
| Cantabria | Boletín Oficial de Cantabria | **BOC** | Sede BOC (HTML/PDF); API **(sin verificar)**. *Ojo: misma sigla que Canarias — desambiguar por `territorioId`* | Coordinación policías locales, espectáculos, animales |
| Castilla-La Mancha | Diario Oficial de Castilla-La Mancha | **DOCM** | Sede DOCM (HTML/PDF); API **(sin verificar)** | Coordinación policías locales, espectáculos, animales |
| Castilla y León | Boletín Oficial de Castilla y León | **BOCYL** | Sede BOCYL (HTML/PDF); API **(sin verificar)** | Coordinación policías locales, espectáculos, animales |
| Extremadura | Diario Oficial de Extremadura | **DOE** | Sede DOE (HTML/PDF); API **(sin verificar)** | Coordinación policías locales, espectáculos, animales |
| La Rioja | Boletín Oficial de La Rioja | **BOR** | Sede BOR (HTML/PDF); API **(sin verificar)** | Coordinación policías locales, espectáculos, animales |
| Madrid | Boletín Oficial de la Comunidad de Madrid | **BOCM** | Sede BOCM (HTML/PDF); API **(sin verificar)** | Coordinación policías locales (BESCAM), espectáculos, animales, movilidad |
| Navarra | Boletín Oficial de Navarra | **BON** | Sede BON; consulta libre desde 1996; API **(sin verificar)** | **Policía Foral (Ley Foral 8/2007 de Policías de Navarra)**, espectáculos, animales |
| Ceuta | Boletín Oficial de la Ciudad Autónoma de Ceuta | **BOCCE** | Sede/BOP; API **(sin verificar)** | Ordenanzas de ciudad (régimen local), convivencia, movilidad |
| Melilla | Boletín Oficial de la Ciudad Autónoma de Melilla | **BOME** | Sede; API **(sin verificar)** | Ordenanzas de ciudad, convivencia, movilidad |

Notas de diseño:
- **Estándar ELI / Akoma Ntoso**: DOGC ya lo expone y es una tendencia europea. Donde exista ELI,
  el parser puede ser casi común (metadatos normalizados). Priorizar comunidades con ELI reduce
  drásticamente el coste de un parser por boletín.
- **Colisión de siglas BOC** (Canarias y Cantabria): el catálogo debe distinguir por `territorioId`
  (código INE de CCAA), nunca por la sigla.
- Regla del proyecto (`LEGAL-PLAGIO`): se ingiere **siempre de la fuente primaria oficial** (sede
  del boletín / datos abiertos), nunca de agregadores privados (vLex, Iberley, noticias.juridicas)
  aunque aparezcan en las búsquedas; esos solo sirven para localizar el identificador oficial.

---

## 2. Policías autonómicas: normativa propia y particularidades

Las cuatro policías autonómicas "integrales" y la norma marco que consultarían. Todas las **leyes**
citadas tienen `BOE-A-...` y entran por el pipeline BOE (ver §0).

### 2.1 Mossos d'Esquadra (Cataluña)
- **Norma marco:** Ley 10/1994 de la Policía de la Generalitat-Mossos d'Esquadra; **Ley 4/2003 de
  Ordenación del Sistema de Seguridad Pública de Cataluña** (`BOE-A-2003-9620`, integra policía,
  tráfico, protección civil, juego y espectáculos, seguridad privada).
- **Competencias:** policía integral; **competencia plena en tráfico interurbano** en Cataluña
  (transferida), seguridad ciudadana y orden público, policía judicial. Consultan por tanto tráfico
  (LSV/RGC/RGV estatales) **más** normativa catalana de movilidad y espectáculos.
- **Reglamentos y órdenes** (no consolidados en BOE) → **DOGC**.

### 2.2 Ertzaintza (País Vasco)
- **Norma marco:** Ley 4/1992 de Policía del País Vasco (y su desarrollo).
- **Competencias:** policía integral vasca; seguridad ciudadana, orden público, **tráfico** (con
  competencias propias), policía judicial, juego y espectáculos.
- **Reglamentos/instrucciones** → **BOPV/EHAA**; consolidado en **Legegunea**.

### 2.3 Policía Foral de Navarra
- **Norma marco:** **Ley Foral 8/2007 de las Policías de Navarra** (denominación a confirmar en fetch).
- **Competencias:** policía integral de Navarra; **competencia exclusiva en tráfico** (interurbano),
  comparte seguridad ciudadana/orden público/juego y espectáculos con las FCSE. (Contexto: acuerdo
  político de ampliación de transferencias de tráfico — **sin verificar** el alcance vigente.)
- **Reglamentos/órdenes forales** → **BON**.

### 2.4 Cuerpo General de la Policía Canaria
- **Norma marco:** **Ley 2/2008 del Cuerpo General de la Policía Canaria** (`BOE-A-2008-12494`).
- **Competencias:** menos "integral" que las anteriores; vigilancia de espacios públicos y edificios,
  orden en concentraciones, colaboración en policía judicial, protección del medio ambiente
  autonómico. **Tráfico: aplica LSV/RGC/RGV estatales** (no hay transferencia de tráfico como en
  Cataluña/Navarra). Coexiste con policías locales insulares y FCSE.
- **Reglamentos/decretos** → **BOC (Canarias)**. **Prioridad beta.**

### 2.5 Idioma: ¿hace falta contenido bilingüe?
Sí, para las policías autonómicas con **lengua cooficial**, aunque de forma escalonada:

- **Necesario a medio plazo:** catalán (Mossos, y policías locales de Cataluña/Baleares/C.
  Valenciana), euskera (Ertzaintza), gallego (Galicia). Los boletines publican **versión oficial en
  las dos lenguas**; el texto legal se puede ingerir en ambas y el modelo `Articulo`/`Norma` debe
  admitir **campo idioma** (o filas paralelas `es`/`ca`/`eu`/`gl`) — hoy el modelo (`content.ts`) no
  tiene `idioma`; es un cambio a valorar (menor de esquema).
- **Práctico para la beta:** los textos de **denuncia/boletín** en la calle se redactan mayormente en
  castellano; el bilingüismo del **texto legal consolidado** es lo primero (para "ver artículo
  completo" con fuente en la lengua oficial). El **texto de boletín** en lengua cooficial y los
  **sinónimos de calle** (jerga policial en catalán/euskera) son fase posterior y requieren un
  revisor nativo del cuerpo (encaja con "mi ordenanza personal" / promoción por comunidad).
- **No bloquea Fase 1:** tráfico estatal en castellano. El bilingüismo entra cuando entren las
  comunidades con lengua cooficial en el plan de expansión.

---

## 3. Ordenanzas municipales: el problema y la estrategia realista

### 3.1 El problema (por qué no se puede "ingerir todo")
- **Escala:** ~8.100 municipios en España. Cada uno con sus propias ordenanzas.
- **Publicación fragmentada:** las ordenanzas se aprueban por el pleno y se publican **íntegras en
  el Boletín Oficial de la Provincia (BOP)** correspondiente (no en el boletín autonómico salvo
  ciudades autónomas), y suelen colgarse también en la **web/sede electrónica del ayuntamiento**
  (a menudo un PDF, sin versión consolidada tras modificaciones).
- **Sin API uniforme:** ~50 BOPs distintos + miles de webs municipales heterogéneas. No hay
  identificador tipo `BOE-A-...`. Formatos: PDF escaneado, PDF nativo, HTML.
- **Cambian con frecuencia** y con calendarios locales; una ordenanza puede modificarse por acuerdo
  de pleno sin que nadie "avise" a un pipeline.

### 3.2 Tipos de ordenanza más consultados por Policía Local (priorizar por uso real)
1. **Tráfico y movilidad urbana** (estacionamiento/ORA, zonas peatonales, ZBE, carga y descarga).
2. **VMP / patinetes** (circulación, cascos, seguros, edad) — muy demandado y cambiante.
3. **Convivencia / civismo** (ruido en vía pública, consumo de alcohol en la calle, grafitis,
   necesidades fisiológicas, uso del espacio público) — base FEMP.
4. **Animales / PPP** (tenencia, censo, razas peligrosas, correa/bozal, deposiciones).
5. **Ruido y contaminación acústica** (ocio nocturno, terrazas, vehículos).
6. **Venta ambulante** (licencias, ubicaciones, top manta).
7. **Terrazas y ocupación de vía pública (OVP)** (mesas/sillas, horarios, veladores).
8. **Limpieza y residuos** (vertidos, contenedores, poda).

### 3.3 Estrategia realista de ingesta y mantenimiento (por capas)
Coherente con `06-motor-contenido.md §7` (Fase 5+). **No** intentar automatizar 8.100 municipios.

1. **Ordenanza base "tipo FEMP" parametrizable (contenido de partida).**
   La FEMP publica **ordenanzas tipo** (verificado): *Ordenanza Tipo de Seguridad y Convivencia
   Ciudadana*, *Ordenanza Tipo de ZBE* (tras RD 1052/2022), y modelos autonómicos (FVMP en la C.
   Valenciana, FEMP CLM). Son de referencia y **de uso libre por los ayuntamientos**. Estrategia:
   ingerir la ordenanza tipo como **plantilla de infracciones municipales genéricas** (`ambito:
   "municipal"`, `territorioId: null` = "genérica"), con importes/artículos **parametrizables**.
   Da cobertura útil "de arranque" a *cualquier* policía local antes de tener su ordenanza real, con
   el aviso claro "**modelo orientativo FEMP — verifica tu ordenanza municipal**".

2. **Municipios beta: ingesta manual/semiautomática y curada.**
   Para los municipios de los usuarios beta (territorio del cofundador + Murcia + Canarias), el
   cofundador (o el agente local) localiza el **PDF oficial en el BOP / sede del ayuntamiento**, se
   parsea semiautomáticamente a `Norma(ambito:"municipal", territorioId=INE_municipio)` +
   `Infraccion` locales, y pasa por la **cola "requiere revisión"** con doble ojo antes de publicar.
   Se archiva el PDF crudo (WORM) y se hashea, igual que el BOE, para detectar cambios al recomprobar.

3. **Puente "mi ordenanza personal" (crecimiento bajo demanda real).**
   Un agente local sube el PDF de la ordenanza de **su** municipio desde el panel/app. Al principio
   es "personal" (visible solo para él / su municipio). Cuando un municipio acumula usuarios y la
   ordenanza está curada, se **promueve a contenido oficial** para ese `territorioId`. Así el trabajo
   de un usuario beneficia a todos los de su municipio y la cobertura municipal crece **donde hay
   demanda**, sin ingerir el país entero de golpe. (El modelo ya soporta `ambito`/`territorioId`.)

4. **Mantenimiento:** revisión periódica ligera de los municipios ya cubiertos (re-fetch del PDF de
   la sede + hash; alerta si cambia). Aceptar que la frescura municipal es "mejor esfuerzo" y
   **marcarlo con fecha visible** en cada ficha municipal (misma prueba de "al día" que el resto).

> Regla dura del proyecto: **nada de copiar de la app competidora** (SPPLB) ni de agregadores
> privados. Siempre BOP/sede oficial del ayuntamiento o texto tipo FEMP. Todo lo municipal entra a
> la app **marcado "requiere revisión"** para el panel, no se publica directo.

---

## 4. Priorización (alineada con la beta) y plan de expansión

**Beta (territorio del cofundador + Murcia + Canarias):**
- **Autonómico:** ingerir por pipeline BOE las **leyes** de policía/seguridad de las CCAA beta
  (p. ej. Canarias: `BOE-A-2008-12494`) + parser inicial de **BORM** y **BOC (Canarias)** para
  decretos/órdenes relevantes. Empezar por lo que de verdad se consulta (tráfico, animales,
  espectáculos, convivencia).
- **Municipal:** 2-5 municipios reales de los usuarios beta (los del cofundador + capitales de
  Murcia/Canarias donde haya usuarios). Ordenanza tipo FEMP como red de seguridad para el resto.

**Expansión (por número de agentes y facilidad técnica):**
1. **Cataluña** (Mossos + policías locales + DOGC con ELI/Akoma Ntoso → parser barato + gran base de
   agentes). Aporta además el reto bilingüe resuelto una vez, reutilizable.
2. **País Vasco** (Ertzaintza + BOPV, bilingüe eu/es).
3. **Navarra** (Policía Foral + BON), Galicia, C. Valenciana, Madrid, Andalucía.
4. Resto de CCAA por demanda de usuarios.
- **Municipal:** priorizar por concentración de usuarios (los BOP y sedes de las provincias con más
  altas), reutilizando el patrón "mi ordenanza personal → promoción a oficial".

---

## 5. Calidad y riesgos específicos de lo autonómico/municipal

| Riesgo | Impacto | Mitigación |
|---|---|---|
| **Heterogeneidad de formatos** de boletines/BOP (HTML, PDF nativo, PDF escaneado) | Parser frágil, un parser por fuente | Priorizar fuentes con **ELI/Akoma Ntoso** (DOGC) y datos abiertos; para PDF, extracción tabular/OCR con validación; **fixtures y snapshot tests por boletín**; si el parser falla, no se publica y salta alerta (igual que BOE). |
| **Cambios frecuentes de ordenanzas** sin aviso | Contenido municipal obsoleto (el pecado capital de SPPLB) | Re-fetch + hash del PDF oficial; frescura "mejor esfuerzo" **con fecha visible** en cada ficha; canal "reportar error" realimenta la cola. |
| **Sin identificador estable** municipal (no hay `BOE-A-...`) | Difícil versionar y deduplicar | Clave propia `territorioId (INE) + tipo ordenanza + fecha BOP`; archivo WORM del PDF como evidencia. |
| **Importes municipales fuera de los marcos estatales** | `validarImporte` no cubre marcos municipales | Añadir marco `municipal`/`autonomico` al enum `MarcoImporte` (hoy solo `trafico`/`seguridad_ciudadana`); mientras tanto, ordenanzas municipales pasan **solo con revisión humana a dos ojos**. |
| **Colisión de siglas / territorios** (BOC Canarias vs Cantabria) | Ingesta cruzada errónea | Catálogo indexado por `territorioId` (código INE), nunca por sigla. |
| **Contenido oficial autonómico/municipal "requiere revisión"** | Publicar algo mal atribuido | Todo lo autonómico/municipal entra **marcado "requiere revisión"** al panel; doble ojo obligatorio antes de publicar; fuente primaria oficial siempre. |
| **Lengua cooficial** mal traducida | Pérdida de confianza en Cataluña/Euskadi/Galicia | Ingerir la **versión oficial** del boletín en cada lengua (no traducir nosotros el texto legal); revisor nativo del cuerpo para textos de boletín/sinónimos. |
| **Verificación a dos ojos** | Cuello de botella con muchas fuentes | El pipeline deja diff + borrador + validación señalados; el humano solo confirma; promoción "personal → oficial" reparte el trabajo entre usuarios del municipio. |

---

## Referencias externas
- BOE — Otros diarios oficiales (nombres y siglas de boletines autonómicos): <https://www.boe.es/legislacion/otros_diarios_oficiales.php>
- BOE — API de datos abiertos (legislación consolidada, también leyes autonómicas): <https://www.boe.es/datosabiertos/api/api.php>
- DOGC — Datos abiertos (XML Akoma Ntoso, RDF/Turtle, ELI): <https://dogc.gencat.cat/es/serveis/Dades_obertes/index.html>
- BOPV — Boletín Oficial del País Vasco (buscador consolidado, bilingüe): <https://www.euskadi.eus/gobierno-vasco/-/boletines-y-diarios-oficiales/>
- BOJA — Sede electrónica (Andalucía): <https://www.juntadeandalucia.es/eboja.html>
- Ley 2/2008 del Cuerpo General de la Policía Canaria (BOE-A-2008-12494): <https://www.boe.es/buscar/doc.php?id=BOE-A-2008-12494>
- Ley 4/2003 de Ordenación del Sistema de Seguridad Pública de Cataluña (BOE-A-2003-9620): <https://www.boe.es/buscar/act.php?id=BOE-A-2003-9620>
- FEMP — Ordenanza Tipo de Seguridad y Convivencia Ciudadana: <http://femp.femp.es/>
- FEMP — Ordenanza Tipo de ZBE (marzo 2023, tras RD 1052/2022): <https://www.femp.es/sites/default/files/multimedia/20230302_ordenanza_tipo_zbe_marzo_23.pdf>

> **Estado de verificación.** Verificado por fetch: nombres/siglas de boletines, datos abiertos del
> DOGC, identificadores BOE de Ley 2/2008 (Canaria) y Ley 4/2003 (Catalunya), existencia de
> ordenanzas tipo FEMP. **Sin verificar** (pendiente de primer fetch en su fase): APIs/datasets
> concretos de los demás boletines, denominación exacta de la Ley Foral de Policías de Navarra y el
> alcance vigente de la transferencia de tráfico a Navarra.
