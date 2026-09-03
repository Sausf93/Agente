# Síntesis: batir a SPPLB — estrategia, producto y ejecución

> Documento vivo que sintetiza la sesión de análisis profundo (`docs/analisis/`). Reúne el
> teardown del competidor, la estrategia de superioridad, UX/UI/marca, marketing, motor de
> contenido y cuadrante. Fuente de verdad del producto: `docs/ESPECIFICACION.md`.
> Fecha: 2026-09-03.

## Tesis en una frase

SPPLB solo **consulta** (te da el artículo) y falla donde más duele (cuadrante roto, iOS
congelado desde nov-2023, sin importes ni consecuencias). **Agente resuelve** (te dice qué
hacer, con fuente y fecha), no pierde tus datos y está siempre al día. Mismo objetivo, mismas
fuentes públicas, pero un producto de otra liga.

---

## 1. Estrategia de superioridad (de `02-como-ganamos.md`)

### Los "10x moves" priorizados (impacto × facilidad)

| # | Jugada | Por qué gana | Fase |
|---|---|---|---|
| **M1** | **Ficha "qué hago"** | Consecuencia operativa arriba (grúa/inmoviliza/detención) + importe + puntos + boletín copiable con variantes, con fuente. EL diferenciador. | 1 |
| **M2** | **Buscador de jerga auto-mejorable** | Sinónimos + erratas + FTS5 offline, alimentado por las búsquedas sin resultado (~120 pares ya mapeados). | 1 |
| **M3** | **"Siempre al día" demostrable** | Fecha + fuente BOE por ficha + feed "qué cambió". SPPLB iOS congelado desde nov-2023. | 1 |
| **M4** | **Cuadrante que no se borra** | Guardado atómico + excepciones sagradas + backup cifrado + festivos locales + contador nocturnas/festivas. Batalla de la retención. | 3 |
| **M5** | **Árbol de detención orientativo con fuente** | LECrim + art. 33 CP como regla, no opinión. | 2 |
| **M6** | **PK offline al documento** | GPS→PK en carretera, sin cobertura. | 4 |
| **M7** | **Plantilla PDF al correo** + **"mi ordenanza personal"** (Local) | Ahorra el trabajo de oficina; cubre el hueco de ordenanzas municipales. | 4 |

### El MVP que ya gana (beta GC Tráfico del cofundador)
- Onboarding **sin login** + **tráfico impecable y acotado** (LSV/RGC/RGV/DGT: profundidad sobre
  amplitud) + tríada **M1-M2-M3** + **cuadrante GC fiable** en su núcleo.
- **Fuera del MVP**: PK, PDF, capa penal/detención, sustancias, ordenanzas, pagos.

### Fosos defensivos (6-12 meses)
Pipeline de contenido · diccionario de sinónimos auto-alimentado · contenido enriquecido
(importe/consecuencia/boletín) · ordenanzas por capas · PK/PostGIS · reputación de fiabilidad.

### Métricas de "lo estamos batiendo"
Boletines copiados/turno ≥3 · búsquedas con resultado ≥85 % · retención del cuadrante ≥70 % a
30 días · 0 pérdidas de datos · <1 error por 1.000 consultas.

---

## 2. Teardown de SPPLB (de `01-spplb-teardown.md`)

**Datos VERIFICADOS (iOS, vía API de Apple):** versión 2.5.5, última actualización **2-nov-2023**
(~2 años parada), **valoración 3,29/5 con 121 reseñas**, gratis, sin compras, dev. **Antonio
Puche Bañón**. **Android (no verificable en Play, vía mirrors):** v3.1.1 mantenida en 2025-2026,
~4,1★/~195 reseñas/10.000+ descargas; se actualiza pero con la misma UI y fallos.

**5 debilidades explotables (con cita):**
1. **iOS abandonado** desde 2023 [API de Apple].
2. **Cuadrante roto**: *"no guarda el color del texto ni el color de fondo"* (reseña 1★);
   varias versiones dedicadas solo a "corregir el cuadrante".
3. **Solo da el artículo**: sin importe, puntos, consecuencia ni texto de boletín.
4. **Contenido desfasado e incoherente**: *"tráfico a marzo 2026 pero SOA de patinetes sin
   actualizar"*; *"estamos en 2020… última actualización de 2017"*.
5. **UI de 2017 sin personalización** por cuerpo/territorio.

**Modelo:** gratuita por patrocinio sindical (sindicato de policía **local**); monetización real
en formación/oposiciones; **bus factor ≈ 1** (una persona con varias apps).

**Paridad mínima obligatoria** (para no quedar por debajo): amplitud de contenido comparable
(tráfico + transportes + LO 4/2015 + extranjería + menores + armas + animales + VMP + CP + art.
520 multiidioma), prueba/gratis real, voz, velocidad + offline, lectura de derechos, sección
vehículos, sin publicidad, y cuadrante al nivel de las apps dedicadas (no el de SPPLB).

## 3. Battle card (para el vestuario, 30 s)

> "La del sindicato te da el artículo y ya. Esta te da **artículo + importe + puntos + si hay
> grúa o detención + boletín listo para copiar**, en 3 segundos y **sin cobertura**. Y está **al
> día**: la de iPhone lleva sin tocarse desde 2023. Son **3 cafés al mes**; 14 días gratis, si no
> la usas la quitas."

Los 4 diferenciadores que se nombran siempre: **importe+puntos · consecuencia · boletín copiable
· al día con fecha.** Posicionamiento: *"El BOE es gratis; tenerlo resuelto en 3 segundos y sin
errores, no. Pagas la herramienta, no la ley."*

## 4. UX (de `03-ux-v2.md`)

- **Consecuencia operativa primero** en la ficha (SIGUE / INMOVILIZO / GRÚA / ATESTADO /
  DETENCIÓN VALORA), sobre el pliegue y con artículo. Cambio respecto a la spec §4.4.
- **Flujo madre en ≤3 s / 3 toques**: buscar (4 letras o voz) → chip de consecuencia → COPIAR
  sin scroll; copiar no navega. Chip "Repetir última" permanente.
- **Onboarding <60 s sin correo**, autodetección de territorio por GPS con confirmación.
- **Cuadrante de dos capas** (patrón vs excepciones sagradas), guardado atómico sin botón.
- Microcopys de campo: *"SOLO EN ESTE MÓVIL · matrículas y personas nunca salen del
  dispositivo"*, *"Tu cuadrante se respalda cifrado. Nunca lo perderás."*

## 5. Marca y naming (de `04-ui-brand-v2.md`)

- **Nombres finalistas: Baliza (recomendado), Hito, Cotejo** — neutros, sin símbolos de autoridad.
- Marca "instrumento, no institución": la autoridad la da el rigor visible (artículo + fecha +
  fuente), no la heráldica. Monograma abstracto tipo baliza/hito; **nunca escudos**.
- Paleta: neutros fríos + azul pizarra `#2E5AAC` + acento `signal` graphite-teal `#2F6F76`
  reservado a marca y PK; gravedad (amarillo/naranja/rojo/vino) intacta.

## 6. Motor de contenido (de `06-motor-contenido.md`)

- Catálogo declarativo de normas → **fetch BOE** (API datos abiertos) → detección de cambios por
  hash (norma y por artículo) → **vigencia append-only** (nada se borra) → cruce del **codificado
  DGT** → **puerta de calidad** (`@agente/shared`) → SQLite+FTS5 firmado (Ed25519) + `ContentVersion`
  + `Novedad` → CDN con swap atómico.
- **"Siempre al día" demostrable**: cada ficha muestra *"Actualizado dd/mm · Fuente: art. · BOE"*.
  Es el foso frente a SPPLB y un argumento de venta de 3 segundos.

## 7. Cuadrante (de `07-cuadrante.md`)

- Modelo de **dos capas**: `cuadranteDelDia = excepcionManual ?? proyeccionDelPatron`. Las
  excepciones manuales son **sagradas**: regenerar el patrón nunca las pisa (imposible reproducir
  el bug de SPPLB por construcción).
- Horas por **instante real** (nocturnas por solape con franja configurable; festivas incluyendo
  **locales**; exceso sobre jornada **configurable por cuerpo**, no 37,5 fijo).
- No pierde datos: SQLite WAL + transacción atómica + autosave por campo + migraciones no
  destructivas + respaldo cifrado opt-in. 12 tests (medianoche, cambio de mes, festivo en libre,
  DST…). **Ya portado a `packages/shared`** (`DefinicionServicio`, `schemaVersion`, `franjaNocturna`,
  `festivosExtra`, `origen`/`editadoEl`).

## 8. Roadmap confirmado

Sin cambios de fondo respecto a `PLANIFICACION.md`. Refuerzos de esta sesión: (a) el **MVP** se
acota a **tráfico impecable + tríada M1-M2-M3 + cuadrante GC fiable**, profundidad sobre amplitud;
(b) prioridad absoluta a la **fiabilidad del contenido y del cuadrante** (donde SPPLB pierde);
(c) decidir **nombre** (Baliza/Hito/Cotejo) antes de las fichas de tienda.

## 9. Multi-territorio: "adaptado a ti" (de `08`, `09`, `10`, `11`)

La app no sirve solo el BOE. Se adapta por **capas** según el perfil:

- **Estado → Comunidad → Municipio.** El perfil (cuerpo → CCAA → provincia → municipio si es
  Local) enciende las capas que le aplican. Un Mosso ve estatal + Cataluña; la Policía Municipal
  de Bilbao ve estatal + País Vasco + ordenanzas de Bilbao; la Guardia Civil, estatal.
- **Hallazgo clave:** las **leyes autonómicas también se consolidan en el BOE** (con su `BOE-A-…`),
  así que entran por el **mismo pipeline** que el estatal, solo etiquetadas por comunidad. Solo los
  reglamentos/decretos y las versiones en lengua cooficial requieren el boletín propio.
- **Ordenanzas municipales** (~8.100 municipios, sin API): estrategia realista = ordenanza tipo
  FEMP parametrizable + curación manual de los municipios beta + puente **"mi ordenanza personal"**
  (el Local la carga en su móvil hasta que su municipio esté curado).
- **Onboarding <60 s sin registro**: cuerpo → (cuál autonómica) → territorio por GPS → municipio si
  Local. La app se adapta: home por cuerpo, buscador que prioriza tu territorio, **chip de ámbito**
  (🌐 estatal / 🟪 autonómico / 🏛 municipal) y aviso **orientativo** de competencia (nunca oculta).
- **Ya implementado en `packages/shared`**: capas por territorio (`ambito`+`territorioId`),
  desplazamiento (`desplazaId`), `avisoCompetencia`, perfil con policía autonómica concreta, idioma
  cooficial en artículos, y validador de importes municipal/autonómico. ADR-006 a 009.

## 10. Economía (de `12-economia.md`)

- **Neto por suscriptor** ≈ **2,10 €/mes** (2,99 € − IVA − 15 % comisión de tienda; conservador).
- **Coste real imprescindible: ~8 €/mes** (cuenta Apple 99 €/año + Google 25 € una vez + política
  de privacidad gratis). Todo lo demás (backend, RevenueCat, Sentry, CDN) tiene **plan gratuito** y
  solo se paga —poco— si la app crece. Local-first = sin servidores caros.
- **Punto de equilibrio: ~15-20 suscriptores.** Inversión inicial: **~124 €**.
- **Beneficio a repartir entre dos**: 500 subs (0,2 %) ≈ **~500 €/mes cada uno**; 2.500 subs (1 %)
  ≈ **~2.535 €/mes cada uno** (hasta ~3.000 € en el mejor caso). Casi todo lo que entra es beneficio.
