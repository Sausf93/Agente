---
title: "02 · Cómo ganamos — Estrategia competitiva de superioridad frente a SPPLB"
proyecto: "Agente"
autor: "Dirección de producto (CPO) — estrategia competitiva"
fecha: "2026-09-03"
estado: "v1 — plan de superioridad y MVP que ya gana"
aviso: "Todo dato legal concreto (importes, puntos, artículos, umbrales) va marcado 'a verificar' y debe pasar por el pipeline BOE/DGT + revisión a dos ojos antes de publicarse."
---

# 02 · Cómo ganamos

> **Tesis en una línea.** SPPLB te da el artículo; nosotros te damos **la decisión resuelta,
> con su consecuencia y su fuente, en 3 segundos y sin cobertura** — y no perdemos tu
> cuadrante. No competimos por "más temario gratis": competimos por **resolver la
> intervención**. Ese es un salto de categoría, no una mejora incremental.

Este documento traduce la especificación, la planificación y las cuatro perspectivas (competencia + Policía Local + Guardia Civil + Policía Nacional) en un plan de ejecución: dónde ganamos feature a feature, las jugadas 10x, el MVP que ya se siente de otra liga, los fosos defensivos, las métricas de "lo estamos batiendo" y los riesgos de ejecución.

---

## 1. Mapa de superioridad — feature por feature

Leyenda de "por qué gana (lo nota)": el momento concreto en el que el agente **siente** la diferencia. No es teoría de producto; es la escena de calle.

### 1.1 Consulta y contenido (el corazón)

| Función | SPPLB (hoy) | Agente | Por qué gana (lo nota) |
|---|---|---|---|
| Resultado de una búsqueda | Solo el **artículo/texto** de la norma | **Ficha "qué hago"**: artículo + importe + pronto pago + puntos + **consecuencia con fuente** + texto de boletín | El agente deja de saberse el importe de memoria. Zanja la discusión con el ciudadano delante, con fundamento |
| Consecuencia operativa (¿grúa? ¿inmovilizo? ¿detengo?) | **No existe** | **Chip grande arriba**: "SIGUE / INMOVILIZO / GRÚA / ATESTADO+DETENCIÓN / SOLO DENUNCIA" con su artículo (LSV 104/105, LECrim 490/492/495 — *a verificar*) | Es la duda nº1 del arcén y de la calle. Decidir bien en 5 s evita pasarse o quedarse corto |
| Texto de denuncia / hecho denunciado | **No lo da**; se redacta a mano | Párrafo redactado, **copiable de un toque**, con **variantes** (delantero/trasero, izq/dcho, acera/calzada, diurno/nocturno) | Ahorra ~10 min por boletín. 5 boletines/día = media hora diaria recuperada |
| Importe y pronto pago | No | Importe + **importe reducido 50%** (art. 94 LSV — *a verificar*) + puntos | Sabe al instante lo que cuesta y lo que se detrae, sin memoria |
| Capa de detención (penal) | No | **Árbol LECrim orientativo** (490/492/493/495 + art. 33 CP) con semáforo+texto y pie fijo "orienta, no ordena" | A las 3 de la mañana responde "¿me lo llevo o no?" con artículo. Nadie más lo hace |
| Tabla de sustancias | No | Consumo (36.16 LO 4/2015) vs. tráfico (368 CP) con umbrales, pureza e indicadores; aviso "calificación judicial" (*a verificar*) | Encuadra el hallazgo en el arcén sin jugarse el atestado |
| Distinción administrativo vs. penal | Mezclado | Explícita y con color+texto (alcoholemia 0,60 mg/l → 379 CP; estancia irregular = administrativa, no delito) (*a verificar*) | Evita el error grave (tratar irregularidad como delito, confundir tasa) |
| Fecha y fuente por ficha | **Opaco**; actualización a golpes | **"Actualizado dd/mm/aaaa · fuente BOE"** en cada ficha | El guardia se fía para ponerlo en un boletín. Ver "12/2024" en tráfico = no me fío; ver "hace 2 semanas" = pago |

### 1.2 Buscador

| Función | SPPLB | Agente | Por qué gana (lo nota) |
|---|---|---|---|
| Motor | Literal, término exacto | **FTS5 local + sinónimos + tolerancia a erratas** (distancia edición 1-2) | Escribe "tubarro", "sin papeles del coche", "le trinqué in fraganti" y llega a la ficha |
| Jerga de calle | No | Diccionario "faro roto → alumbrado deficiente" alimentado por las perspectivas (ya hay ~120 pares mapeados) | "Esto me entiende como hablo yo" — efecto sorpresa inmediato |
| Búsqueda por artículo/código | Parcial | Por artículo ("11.1 RGV"), código DGT, palabra clave, importe | El instructor y el veterano buscan como piensan |
| Voz | Sí (paridad) | Dictado nativo (paridad, no diferencial) | Menos pantalla, más calle |
| Velocidad/offline | Contenido de servidor (parcial) | **<300 ms, 100% offline** (índice en dispositivo) | En garaje/polígono/carretera sin cobertura, funciona igual |

### 1.3 Cuadrante (la batalla de la retención)

| Función | SPPLB | Agente | Por qué gana (lo nota) |
|---|---|---|---|
| Persistencia | **Roto**: no guarda colores/config; pierde datos al actualizar o cambiar de móvil | **Guardado atómico + backup cifrado**; excepciones manuales "sagradas" separadas del patrón | El pecado original de SPPLB. "Si pierde datos una vez, no lo vuelvo a usar" |
| Patrones por cuerpo | Genéricos (sesgo local) | GC "6+saliente+3" y **noche partida/saliente bien computados**; CNP "7x7"; local con **editor flexible** para ciclos raros | Cada cuerpo se ve reflejado; el saliente y la noche a caballo de medianoche cuadran |
| Festivos locales | Solo nacional/autonómico | **Festivos locales del municipio** precargados/editables | Las fiestas del pueblo es justo lo que más trabaja el local; ahí está el dinero |
| Cómputo de horas | Débil | Totales, **nocturnas, festivas/domingos, exceso sobre jornada configurable** (no 37,5 h genéricas) | Cotejar con la nómina y reclamar complementos: dinero real |
| Cambios de servicio y extra | Rompen el conteo | Registrables sin romper el cómputo | Los cambios "te cambio el sábado por el martes" son constantes |
| Export | No | PDF/CSV para cotejar nómina | Se lo pasa al jefe / lo cruza con la nómina |

> El listón del cuadrante **no es SPPLB**: son las apps dedicadas (Turnos Policía, CuadraTurnos). Hay que alcanzar su paridad de cálculo, pero **dentro de la misma app que ya usan para consultar** — sinergia que nadie ofrece.

### 1.4 Segunda ola (foso técnico)

| Función | SPPLB | Agente | Por qué gana (lo nota) |
|---|---|---|---|
| Plantillas/atestados PDF | "Genera atestados" (débil) | **PDF rellenado** con norma/artículo/importe/texto + PK; **datos de terceros solo en local** | De 10 min a 2 en oficina; borrador sin errores; nada de matrículas sale del móvil |
| Mapa + punto kilométrico | **No existe** | PK offline GPS→vía con **indicador de fiabilidad** y edición manual: "A-7, PK 623+450, sentido Murcia" | La joya para ATGC: el dato que más se ataca en juicio, resuelto y volcado al atestado |
| Ordenanzas municipales | **No existe** | Modelo por capas + **"mi ordenanza personal" editable** por el agente | La única razón de peso para que un **Local** pague (lo estatal ya es gratis) |
| Personalización por cuerpo/territorio | No | Perfil reordena toda la app | Un GC de Tráfico no ve ordenanzas municipales urbanas |
| Lectura de derechos multilingüe | Sí (paridad) | Paridad + audio (fase 2), offline | Diario en frontera/rural; paridad, no diferencial |
| Actualización | A golpes; iOS congelado 2023 | **Pipeline BOE + novedades** "cambió el art. X" | "Siempre al día, y te lo demuestro" |

### 1.5 Plataforma, precio y confianza

| Función | SPPLB | Agente | Por qué gana (lo nota) |
|---|---|---|---|
| iOS | **Congelado desde nov-2023** (v2.5.5) | App mantenida, modo oscuro, UI 2025, botones para una mano/guantes | El agente de iPhone usa hoy una app sin tocar ~3 años |
| Privacidad del agente | Sindical, sin claridad | **Solo correo** (ADR-001: sin login incluso valorado); id anónimo; cero datos de terceros al servidor | El guardia receloso: "si sabe quién soy y qué consulto, no la instalo" |
| Contenido sindical | Formación/Nosotros/Tiempo libre | **Ninguno**: 100% herramienta operativa | Sin ruido; foco en el servicio |
| Precio | Gratis | 2,99 €/mes, 14 días prueba, freemium 5 consultas/día | "Pagas la herramienta, no la ley". El valor tangible justifica el café y medio |

---

## 2. Los 10x MOVES (priorizados por impacto percibido × facilidad)

Puntuación 1-5. **Score = Impacto × Facilidad**. Ordenados de mayor a menor palanca.

| # | Jugada 10x | Impacto | Facilidad | Score | Fase |
|---|---|---|---|---|---|
| **M1** | **Ficha "qué hago"**: la consecuencia operativa arriba (grúa/inmoviliza/detención) + importe + puntos + **texto de boletín copiable con variantes**, todo con fuente | 5 | 4 | **20** | 1 |
| **M2** | **Buscador de jerga de calle que se auto-mejora**: sinónimos + erratas + FTS5, alimentado por las **búsquedas sin resultado** de la beta | 5 | 4 | **20** | 1 |
| **M3** | **"Siempre al día" demostrable**: fecha + fuente BOE por ficha y feed "qué cambió", frente al iOS congelado de SPPLB | 5 | 4 | **20** | 1 |
| **M4** | **Cuadrante que no se borra**: guardado atómico + excepciones sagradas + backup cifrado + festivos locales + contador de nocturnas/festivas | 5 | 3 | **15** | 1-3 |
| **M5** | **Árbol de detención orientativo con fuente** (LECrim 490/492/493/495 + art. 33 CP), semáforo+texto, "orienta nunca ordena" | 5 | 3 | **15** | 2 |
| **M6** | **PK offline volcado al documento**: GPS→PK con fiabilidad y edición manual, un toque al portapapeles/plantilla | 5 | 2 | **10** | 4 |
| **M7** | **Plantilla PDF rellenada al correo** con datos comunes propagados y datos de terceros solo en local | 4 | 2 | **8** | 4 |
| **M7b** | **(Local) "Mi ordenanza personal"**: si su municipio no está, teclea importes/artículos una vez y los reutiliza offline | 4 | 3 | **12** | 2-4 |

**Lectura estratégica:** M1-M3 son la **tríada del enganche** (impacto máximo, baratas, todas en Fase 1). Son lo que hace que un agente diga "esto es otra liga" en la primera sesión. M4 es la **batalla de la retención** (donde SPPLB ya cayó). M5-M7 son el **foso** que convierte "útil" en "no salgo de servicio sin ella", pero son más caras y van después. M7b es la palanca específica del Local con facilidad media-alta: subirlo de prioridad si la beta incluye locales.

---

## 3. El MVP que ya gana

**Contexto:** la beta 1 va a la unidad del cofundador, **Guardia Civil de Tráfico** (según marketing). El MVP tiene que hacer que ese guardia diga "esto es otra liga" **antes de ver el mapa/PK o las plantillas**. Por eso el MVP se apoya en la **tríada M1-M2-M3** con contenido de tráfico impecable, más el cuadrante empezado en paralelo.

### 3.1 Qué ENTRA (imprescindible para "ganar")

1. **Onboarding local sin login** (cuerpo/territorio en el dispositivo, ADR-001). Fricción cero.
2. **Contenido de tráfico impecable y acotado**: LSV + RGC + RGV + codificado DGT. **Profundidad sobre amplitud**: mejor 150-200 infracciones de tráfico perfectas que 1.000 a medias.
3. **Buscador FTS5 + sinónimos de calle + erratas + voz** (M2), 100% offline, <300 ms.
4. **Ficha "qué hago" completa** (M1): importe + pronto pago + puntos + **consecuencia de tráfico con fuente** (inmovilización/grúa: SOA sin seguro, ITV desfavorable, alcoholemia) + **texto de boletín copiable con variantes**.
5. **Fecha + fuente visibles por ficha** y feed de novedades (M3).
6. **Favoritos, "más usadas", evento anónimo de "búsqueda sin resultado"** (combustible del diccionario).
7. **Cuadrante GC fiable en su núcleo** (M4 mínimo): patrón 6+saliente+3 con noche partida bien computada, edición de días, contador de nocturnas/festivas, **persistencia sin pérdida** y backup. Empezado en paralelo desde el principio porque es retención.

### 3.2 Qué NO entra en el MVP (se difiere sin culpa)

- Mapa/PK (M6) → Fase 4. Es la joya de ATGC pero es caro; el MVP gana sin él.
- Plantillas/PDF (M7) → Fase 4.
- Árbol de detención / capa penal / sustancias (M5) → Fase 2 (beta 2). El MVP es de tráfico.
- Extranjería, menores, armas, animales, transportes → Fase 2.
- Ordenanzas municipales (M7b) → cuando entren municipios en la beta.
- Pagos → Fase 5 (la beta es gratis a cambio de feedback).
- Lectura de derechos multilingüe con audio → Fase 2/6.

### 3.3 Criterio de "ya gana"

El MVP gana si, en la unidad del cofundador, se cumple: **(a)** un guardia busca en su jerga y encuentra a la primera; **(b)** copia el texto del boletín en 2 toques sin scroll; **(c)** ve la consecuencia (inmoviliza/grúa/sigue) con su artículo; **(d)** confía porque ve fecha y fuente; **(e)** mete su cuadrante y no lo pierde. Si esas cinco escenas funcionan con tráfico, el resto es expansión, no supervivencia.

---

## 4. Fosos defensivos (difíciles de copiar a 6-12 meses)

Ordenados por profundidad del foso:

1. **El pipeline de contenido "siempre al día" con fuente** *(el foso mayor y también nuestro mayor riesgo, ver §6).* Mantener estatal + autonómico + ordenanzas con importes, consecuencias y fuentes al día es trabajo continuo que un desarrollador voluntario/sindical no sostiene. SPPLB, con **bus factor 1** e iOS abandonado, no puede replicarlo rápido.
2. **Diccionario de sinónimos alimentado por las búsquedas sin resultado.** Cada beta lo mejora solo. A los 6 meses tenemos un corpus de jerga real por cuerpo que un recién llegado no tiene. Efecto de datos compuesto y barato.
3. **La capa de contenido enriquecido (consecuencia + texto de boletín + fuente por infracción).** No es la ley (pública): es **nuestro trabajo editorial**. Reconstruir "importe + consecuencia + boletín + fuente" para cada infracción es un esfuerzo enorme que hay que hacer infracción a infracción.
4. **Ordenanzas municipales por capas + "ordenanza personal" del agente.** Poblar 8.100 municipios es imposible de golpe, pero quien empieza y acumula municipios + plantilla base FEMP + contenido tecleado por los propios agentes construye una base que nadie alcanza en un año. "La app que resuelva la ordenanza no tiene competencia."
5. **PK offline (PostGIS + catálogos de carreteras del Estado y autonómicos).** Barrera técnica real: ingesta de geometrías, proyección GPS→PK, redes autonómicas donde todo falla. Frena a imitadores aficionados.
6. **Confianza/reputación por hacerlo bien y con fuente.** Un importe o una detención mal orientada expone y quema el boca a boca. El que acumula fiabilidad y avisos "orientativo" gana una barrera reputacional. Es lento de construir y fácil de destruir — por eso protege al que ya lo tiene.

---

## 5. Métricas de "lo estamos batiendo"

Todas anónimas (coherente con privacidad). Objetivos como hipótesis de la beta 1, a calibrar.

### 5.1 Enganche (el producto resuelve)

| Métrica | Qué mide | Objetivo beta |
|---|---|---|
| **Boletines copiados / turno activo** | Que la ficha "qué hago" se usa de verdad en calle | ≥ 3/turno |
| **Tasa de búsquedas con resultado** | Que el buscador entiende la jerga | ≥ 85% y subiendo semana a semana |
| **Búsquedas sin resultado (volumen y top términos)** | Combustible del diccionario; debe **bajar** al alimentarlo | −20% mes a mes tras cada carga de sinónimos |
| **Tiempo a resultado** | Rapidez real | p95 < 3 s, offline |
| **% consultas offline** | Que el offline es real, no cosmético | Registrar; esperar alto en GC Tráfico |

### 5.2 Retención (no perdemos al usuario ni sus datos)

| Métrica | Qué mide | Objetivo |
|---|---|---|
| **Retención del cuadrante** (usuarios con cuadrante activo a 30/60/90 días) | Que no se borra y lo mantienen | ≥ 70% a 30 días |
| **Incidencias de pérdida de datos de cuadrante** | El pecado de SPPLB | **0** (cualquier caso es crítico) |
| **WAU/MAU** | Uso recurrente | ≥ 0,5 |
| **Retención D30 de la app** | Que vuelven | ≥ 40% en beta |

### 5.3 Confianza y calidad (protege el foso reputacional)

| Métrica | Qué mide | Objetivo |
|---|---|---|
| **Errores de contenido reportados / 1.000 consultas** | Fiabilidad percibida | < 1 |
| **Antigüedad media del contenido consultado** | "Siempre al día" | < 90 días; mostrar en cada ficha |
| **Fichas con fuente+fecha completas** | Cumplimiento del mínimo de calidad | 100% (gate de publicación) |

### 5.4 Negocio (post-lanzamiento)

| Métrica | Objetivo |
|---|---|
| Conversión prueba→pago | ≥ 30% |
| Referidos por usuario activo | ≥ 0,3 |
| Camino a 2.500 subs (1%) | Hito intermedio: unidad del cofundador + 2 municipios beta |

---

## 6. Riesgos de ejecución y mitigación

| # | Riesgo | Probabilidad × Impacto | Mitigación |
|---|---|---|---|
| **R1** | **Lanzar con menos temario que SPPLB** → pierde "la más completa y gratis" | Alta × Alto | **Profundidad antes que amplitud**: beta con **tráfico impecable** (lo que engancha), no genérico a medias. **Paridad mínima de temario solo antes del lanzamiento público de pago**, no en beta. Comunicar "hacemos menos pero lo resolvemos" |
| **R2** | **Error de contenido** (importe o "procede detención" equivocado) → mata la confianza en el vestuario para siempre | Media × Crítico | Validadores de rango (`shared/validators`: LSV art. 80 / LO 4/2015 art. 39 — *a verificar*), **revisión a dos ojos** obligatoria para consecuencias/sustancias/detención, **fuente en cada línea**, botón "reportar error" en la ficha, gate de calidad §8.3 de la spec |
| **R3** | **Responsabilidad legal por orientar detención** | Media × Alto | **Lenguaje orientativo nunca imperativo** ("procede según art. X" vs. "detén"), pie fijo legal, semáforo con texto, artículo siempre visible. La calificación es del agente y del juez |
| **R4** | **El pipeline de contenido se retrasa** (es el foso pero también la mayor carga; bus factor del cofundador agente) | Media × Alto | Una épica por sesión; **marcar "requiere revisión" en vez de bloquear**; segundo revisor; plantilla base de ordenanza FEMP como acelerador; automatizar ingesta BOE cuanto antes |
| **R5** | **Expectativa de "gratis"** que fija SPPLB dificulta cobrar 2,99 € | Media × Medio | Discurso "**pagas la herramienta, no la ley**"; freemium 5 consultas/día + 14 días prueba como muro de conversión; el valor tangible (boletín, grúa, cuadrante, PDF) justifica el café y medio. Asumir que el segmento "todo gratis" no se capta |
| **R6** | **Cuadrante sale en beta perpetua** y vuelve a fallar (donde SPPLB ya cayó) | Media × Alto | Sale **robusto o no sale**: guardado atómico, tests del cálculo de horas, backup cifrado, 0 tolerancia a pérdida de datos. Es la métrica R2 del cuadrante |
| **R7** | **PK incompleto** en zonas (autonómicas/rurales) | Alta × Medio | **Nunca fingir precisión**: indicador de fiabilidad + fallback a dirección + edición manual; priorizar provincias beta (Murcia, Canarias) |
| **R8** | **Percepción de "app oficial" falsa** → lío disciplinario y rechazo de tienda | Baja × Alto | Prohibido por diseño: sin escudos ni denominaciones oficiales; encabezados neutros; "herramienta de apoyo" explícito |
| **R9** | **Reacción de SPPLB** (base instalada + canal sindical + gratis) | Baja × Medio | Improbable y lenta (1 persona, iOS parado, esfuerzo de contenido enorme). Nuestra velocidad y la ficha "qué hago" son inalcanzables a corto plazo. Vigilar, no temer |

---

## 7. Síntesis operativa

**Ganamos porque hacemos una cosa que nadie hace y la hacemos primero: convertir "consultar la ley" en "resolver la intervención"**, con la consecuencia y la fuente delante, sin cobertura, y sin perderle el cuadrante al agente. El orden es sagrado: **tríada del enganche (M1-M2-M3) en tráfico impecable → cuadrante que no se borra → foso técnico (detención, PK, plantillas, ordenanzas)**. El MVP gana en la unidad del cofundador con solo la tríada + cuadrante; todo lo demás es expansión del foso, no condición de supervivencia. El riesgo dominante no es que SPPLB reaccione: es que nuestro propio pipeline de contenido no aguante el ritmo o que un error de importe queme la confianza. Ahí es donde se pone la disciplina.

> *Recordatorio: todo dato legal citado va "a verificar" contra BOE consolidado + revisión a dos ojos antes de publicarse.*
