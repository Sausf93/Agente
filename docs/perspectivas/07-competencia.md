---
title: "07 · Análisis competitivo — SPPLB y el mercado de apps para FCSE en España"
proyecto: "Agente"
fecha: "2026-09-03"
autor: "Análisis competitivo (Claude)"
estado: "v1 — investigación de escritorio"
---

# 07 · Análisis competitivo

> **Nota de método y fiabilidad.** Esta investigación se ha hecho por búsqueda web y lectura de fichas de tienda y mirrors (App Store, Google Play, apkpure, soft112, softonic, appstor.io, appbrain, allbestapps). Google Play devuelve la ficha truncada a los rastreadores, por lo que **el nº exacto de descargas y la valoración media de Android de SPPLB no se han podido verificar directamente** y se marcan como *no verificado*. Donde la ESPECIFICACION.md aporta una cifra (p. ej. ~10.000 descargas Android, ~120 valoraciones iOS) se cita como "según especificación / no verificado en tienda". No se ha inventado ninguna cifra.

---

## 1. Ficha técnica de SPPLB (lo verificado)

**SPPLB Policías y Bomberos** — app de consulta del Sindicato Profesional de Policías Locales y Bomberos (SPPLB).

### iOS (App Store, id 1179685555) — *verificado*
| Campo | Valor |
|---|---|
| Desarrollador | **Antonio Puche Bañón** (persona física; el sindicato es el promotor) |
| Versión actual | **2.5.5** |
| Última actualización | **2 de noviembre de 2023** (≈ 3 años sin tocar iOS) |
| Tamaño | 34,3 MB |
| Categoría | Referencia · Gratis · 4+ · ES/EN |
| Valoraciones iOS | No mostradas en ficha (según especificación ≈120; *no verificado en tienda*) |

**Historial de versiones iOS revelador** (verificado): 1.5.2 (dic-2016) → salida de golpe de versiones a principios de 2017 (2.0, 2.1, 2.2, 2.3) → **2.4 en dic-2017** → **hueco de casi 5 años** → 2.5 (may-2022) y parches 2.5.1–2.5.4 en 2022 → **2.5.5 en nov-2023 y parado**. Patrón de mantenimiento a golpes, con abandono efectivo de iOS.

### Android (Google Play, `org.tojo.spplbdroidpolicial`)
| Campo | Valor |
|---|---|
| Versión | **3.1.1** ("New Time Christmas") |
| Última actualización | **6 de marzo de 2026** (mirror apkpure; *no verificado en la propia ficha de Play*) |
| Requiere | Android 6.0+ |
| Tamaño | ~9–34 MB según fuente |
| Seguridad de datos (Play) | "No recopila ni comparte datos del usuario" (*verificado*) |
| Descargas | Según especificación ≈10.000+; *no verificado en tienda* |
| Valoración media / nº reseñas | *No verificado* (Play truncó la ficha) |

**Hallazgo clave:** Android e iOS van a ritmos muy distintos. **iOS está congelado desde 2023**; **Android sí recibe actualizaciones (2026)**. El "no se actualiza desde 2023" de la especificación es cierto **solo para iOS**. Conviene matizarlo en el discurso comercial: iOS abandonado, Android mantenido pero con la misma UI y los mismos fallos de fondo.

### Contenido/módulos declarados en la ficha
Tráfico, transporte, LO 4/2015 Seguridad Ciudadana, extranjería, menores, armas, animales peligrosos, VMP, art. 520 LECrim en varios idiomas, Código Penal, detección de vehículos robados, +400 enlaces sobre falsedad documental de vehículos, consulta por voz, y **calendario/cuadrante** con servicios, cambios, notas y alarmas. Compatible de móvil a tablet 10".

---

## 2. Reseñas: quejas y elogios (evidencia recogida)

La extracción de reseñas literales de Play/App Store está limitada por el truncado de las fichas. Lo que **sí se ha podido verificar** de fuentes secundarias:

**Queja verificada — el cuadrante:**
> "La parte del cuadrante no funciona correctamente: al modificar un servicio solo te deja cambiar el nombre o la abreviatura, pero **no guarda el color del texto ni el color de fondo**, por lo que se ve siempre con texto negro y fondo blanco."

Esto confirma el diagnóstico de la especificación (§1.2): el cuadrante es el punto flaco reconocido, con versiones dedicadas solo a "corregir el cuadrante" y pérdida/no-persistencia de configuración.

**Elogio verificado:**
> "La app funciona perfectamente y está completísima, además de que es gratuita."

Es decir: el gran activo de SPPLB es **amplitud de contenido + gratis**. Ese es el listón. Los usuarios satisfechos valoran la cobertura temática y el precio cero.

**Quejas descritas en la especificación (coherentes con lo hallado, pendientes de cita literal):** normativa concreta sin actualizar, UI antigua tipo cuadrícula de iconos de 2017, sin personalización por cuerpo, da el artículo pero no el importe/puntos/consecuencia ni el texto de boletín. Marcadas como *plausibles pero sin cita textual verificada*.

---

## 3. Panorama competitivo

El mercado está **fragmentado en tres nichos que casi nadie une**: (A) consulta de normativa, (B) cuadrante/turnos, (C) oposiciones/test. SPPLB es de los pocos que mezcla A+B, pero flojo en B. **Agente puede ser el primero que hace A+B bien y con capa de "qué hago" (importe, consecuencia, texto).**

### A) Consulta de normativa / codificado (competencia directa)
| App | Desarrollador | Qué hace / fortaleza | Debilidad |
|---|---|---|---|
| **SPPLB** | Antonio Puche Bañón / sindicato | Amplia, gratis, incluye cuadrante y voz | UI 2017, iOS congelado, cuadrante roto, solo da el artículo |
| **Codificado Policial – Appol** (`es.appol.codpolicial`) | Appol | Busca en todas las normas a la vez o por ámbito (estatal/autonómico/local), resultados según escribes, favoritos, por materia. En Play, App Store y **Amazon Appstore** | Solo texto del artículo; sin importe/consecuencia/boletín; UI de listado; *métricas no verificadas* |
| **CODIPOL – IESPA** (App Store id 6479991440) | IESPA (academia) | Codificado ligado a academia | Nicho academia; *poca info verificada* |
| **iPol – Intervenciones Policiales** (App Store id 1511139832) | Tecnología Actual | **Protocolos de actuación** por tipo de intervención + legislación + herramientas | Orientado a protocolo, no a sanción rápida; *métricas no verificadas* |
| **IDL-Pol: Herramienta Policial** (`com.goodbarber.idlpol`) | — | Diccionario policial, códigos, "calculadora policial" | App tipo GoodBarber (contenedor), poco especializada |

### B) Cuadrante / turnos (nicho maduro, punto flaco de SPPLB)
| App | Desarrollador | Fortaleza | Modelo |
|---|---|---|---|
| **CuadraTurnos PMM** (Lite id 1054136029 / **PRO** id 1053419776) | SY TechCom | **3,6★ · 88 valoraciones** (Lite). Patrones, compañeros, vehículo, estadísticas, cambios, notas, import/export, control de horas extra | **Freemium**: Lite gratis + **PRO de pago** |
| **Turnos Policía** (VultureSoft, id 6756631570) | VultureSoft | Vista mes/semana/año, patrones predefinidos (americano, africano, 6x5, 5º turno…) o propios, **cálculo automático de saldo anual, nocturnidad y festivos por perfil**, exportación **PDF** | Gratis/freemium (*no verificado*) |
| **Turnos CNP** (id 945516070) | VultureSoft | Específico Policía Nacional | — |
| **Cuadra Turnos (Free)** | policiacoin | Calendario intuitivo, tipos de servicio, compañeros, estadísticas | Gratis |
| **APP 11 Turnos** | — | Calcula automáticamente los cuadrantes más comunes del CNP y FCSE | — |
| **DRAGDroid** | — | Se conecta **directamente a la base de datos de la comisaría** (turnos oficiales) | Depende de integración; nicho |

> El cuadrante como categoría **ya tiene apps buenas y dedicadas** (cálculo de horas, nocturnidad, festivos, export PDF). El cuadrante de SPPLB compite mal contra ellas. **Agente debe alcanzar la paridad con Turnos Policía / CuadraTurnos, no con el cuadrante de SPPLB.**

### C) Oposiciones / test (adyacente, capta al futuro agente antes de serlo)
| App/plataforma | Fortaleza | Modelo |
|---|---|---|
| **OpositaTest** | Líder generalista de test de oposición en España | Suscripción |
| **TESTPN** | +40.000 preguntas 2026, simulacros, estadísticas (CNP) | Suscripción |
| **OPN Test** | Simulacros, inglés, psicotécnicos, comparación con otros opositores, análisis de fallos | Suscripción |
| **TestOpos Guardia Civil** | +600 test, +12.000 preguntas, exámenes oficiales | Freemium/pago |
| **iPoL – Opos Policía Local** (moybu) | Módulos descargables (agenda, psicotécnicos, cultura, inglés) | Freemium |

> Este nicho **valida que el colectivo paga por software** (suscripción de test), pero es preparación de examen, no herramienta de calle. Oportunidad de puente: quien aprueba y entra en servicio necesita justo lo de Agente.

### D) Software de gestión de comisaría (B2B, contexto)
**VinfoPOL / VinfoVAL** (Suitable Software): gestión policial integral para ayuntamientos, incluye cuadrante de servicios. Es **venta a la administración**, no al agente. No compite por el bolsillo del agente, pero marca que existe presupuesto institucional en el sector.

---

## 4. Tabla comparativa: Agente vs SPPLB vs otros

| Capacidad | **Agente (objetivo)** | SPPLB | Appol (consulta) | Turnos Policía / CuadraTurnos |
|---|---|---|---|---|
| Consulta de normativa amplia | ✅ | ✅ (amplia) | ✅ | ❌ |
| Buscador que entiende jerga de calle ("faro roto") | ✅ (semántico + sinónimos) | ⚠️ básico | ⚠️ por palabras | — |
| **Importe + reducción pronto pago** | ✅ | ❌ (solo artículo) | ❌ | — |
| **Puntos** | ✅ | ❌ | ❌ | — |
| **Texto de boletín listo para copiar** | ✅ | ❌ | ❌ | — |
| **Capa de consecuencias** (detención/grúa/inmoviliz. con fuente LECrim/LSV) | ✅ | ❌ | ❌ | — |
| Tabla de sustancias (consumo vs tráfico) | ✅ | ❌ | ❌ | — |
| Personalización por cuerpo y territorio | ✅ | ❌ | ⚠️ filtro ámbito | ⚠️ perfil |
| Plantillas/atestados en PDF | ✅ | ⚠️ "genera atestados" | ❌ | — |
| **Cuadrante fiable + contador horas/nocturnas/festivos** | ✅ | ⚠️ roto | ❌ | ✅ (referencia del mercado) |
| Mapa + punto kilométrico | ✅ | ❌ | ❌ | ❌ |
| Lectura de derechos multilingüe | ✅ | ✅ | ❌ | ❌ |
| Actualización continua con fecha/fuente visible | ✅ (pipeline BOE) | ❌ (a golpes; iOS 2023) | ⚠️ manual | — |
| Offline completo | ✅ | ⚠️ parcial (contenido de servidor) | ⚠️ | ✅ (datos locales) |
| Modo oscuro / UI 2025 | ✅ | ❌ (2017) | ⚠️ | ✅ |
| Precio | 2,99 €/mes (14 días prueba) | Gratis | Pago único (*no verif.*) | Freemium |

---

## 5. Los 10 puntos débiles explotables de SPPLB

1. **iOS abandonado desde nov-2023** (v2.5.5). *Verificado en App Store.* Los agentes de iPhone usan una app sin mantenimiento hace ~3 años.
2. **Cuadrante roto y no persistente.** *Verificado*: no guarda colores de servicio; versiones enteras dedicadas a "corregir el cuadrante". Es su función más frágil y la que más frustra.
3. **Solo da el artículo, no la decisión.** No hay importe, puntos, ni consecuencia (grúa, inmovilización, detención) ni texto de boletín. El agente aún tiene que saberse el importe de memoria.
4. **UI de 2017** (cuadrícula de iconos), sin modo oscuro moderno ni diseño pensado para uso con una mano en el coche.
5. **Sin personalización por cuerpo/territorio.** La Guardia Civil de tráfico y la Policía Local de un municipio ven exactamente lo mismo.
6. **Actualización de contenido a golpes y opaca.** No hay fecha de actualización por norma ni "qué ha cambiado"; el usuario no sabe si un importe está vigente.
7. **Dependencia de una sola persona** (Antonio Puche Bañón) ligada a un sindicato de policía **local**: sesgo local, bus factor 1, sin incentivo para cubrir bien Guardia Civil / CNP / autonómicas.
8. **Contenido sindical mezclado** (Formación, Nosotros, Tiempo libre) que resta foco de herramienta operativa y ata la app a un sindicato concreto (fricción para no afiliados o afiliados de otro sindicato).
9. **Sin generación real de documentos rellenados** ni mapa/PK: el trabajo de oficina (redactar la denuncia con PK) sigue siendo manual.
10. **Buscador literal**, sin sinónimos de calle ni tolerancia a errores; quien no sabe el término legal exacto no encuentra la infracción. (Marcado *plausible, no citado textualmente*.)

---

## 6. "Must-have": paridad mínima que Agente NO puede fallar

Para que un usuario de SPPLB se cambie, Agente debe igualar lo que ya funciona en SPPLB **y** en las apps dedicadas de cuadrante:

1. **Cobertura de contenido comparable el día del lanzamiento**: tráfico (LSV/RGC/RGV + codificado DGT), Seg. Ciudadana, CP, extranjería, menores, armas, animales, transporte, VMP, art. 520 multilingüe, vehículos/falsedad documental. Si Agente tiene menos temas, "SPPLB es más completa y gratis" gana.
2. **Gratis o de muy bajo umbral para probar**: SPPLB es gratis. El plan de 2,99 € con **14 días de prueba** y un **modo limitado** (5 consultas/día) es imprescindible; sin prueba real, el boca a boca no arranca.
3. **Cuadrante a la altura de Turnos Policía / CuadraTurnos**, no de SPPLB: patrones por cuerpo, cálculo automático de horas/nocturnas/festivos, cambios, alarmas, export PDF y **persistencia sin pérdida de datos**. Es el must-have donde SPPLB pierde, pero el listón lo ponen las apps dedicadas.
4. **Velocidad y offline**: consulta en <3 s sin cobertura. SPPLB presume de ser "la consulta más rápida"; Agente debe serlo de verdad con FTS5 local.
5. **Consulta por voz** (SPPLB ya la tiene; es paridad, no diferenciación).
6. **Fiabilidad de importes**: un importe equivocado destruye la confianza más que en SPPLB, porque Agente cobra. Tests de rangos y revisión a dos ojos son innegociables.

---

## 7. Oportunidades de diferenciación por ROI

**ROI alto (barato de construir, dolor evidente, nadie lo resuelve):**
1. **Ficha "qué hago" completa** = artículo + importe + reducción + puntos + **texto de boletín copiable** + **consecuencia con fuente** (grúa/inmovilización/detención). Es *el* diferenciador: convierte "consultar la ley" en "resolver la intervención". Alto valor percibido, contenido reutilizable, cero competidores lo hacen.
2. **Buscador de jerga de calle** (sinónimos "faro roto → alumbrado deficiente", tolerancia a erratas). Barato (diccionario mantenido por el cofundador agente + FTS5), altísimo efecto "esto me entiende". Las búsquedas sin resultado alimentan el diccionario: mejora sola.
3. **Cuadrante fiable con contador de horas** que además **no pierde datos**: capturar a los frustrados de SPPLB y competir de tú a tú con las apps de turnos, pero dentro de la misma app que ya usan para consultar. Sinergia que nadie ofrece.
4. **Actualización visible con fecha y fuente por norma** + "qué ha cambiado". Convierte la debilidad nº6 de SPPLB en argumento de venta directo: "siempre al día, y te lo demuestro".

**ROI medio (más caro, fuerte foso una vez hecho):**
5. **Plantillas/atestados en PDF rellenados** con la consulta (norma, artículo, importe) + PK. Ahorra el trabajo de oficina; difícil de copiar rápido.
6. **Mapa con punto kilométrico** offline. Muy diferencial para Guardia Civil de tráfico; barrera técnica (PostGIS + catálogos de carreteras) que frena a imitadores.
7. **Personalización por cuerpo/territorio** que reordena la app: la Guardia Civil no debería ver ordenanzas municipales. Barato y multiplica la percepción de "hecha para mí".

**ROI a vigilar (no en v1):** estimación de complementos salariales desde el cuadrante (gancho enorme, pero contenido delicado por cuerpo).

---

## 8. Riesgos y barreras de entrada

**¿Puede reaccionar SPPLB?**
- **Ventaja de SPPLB**: base instalada (~10.000+ Android *según especificación*), gratis, respaldo sindical (canal de distribución entre afiliados), amplitud de contenido ya hecha.
- **Limitaciones para reaccionar**: desarrollo por **una persona** con **iOS abandonado desde 2023** y cuadrante que llevan años sin arreglar. Añadir importes+consecuencias+boletín a cada infracción es un **esfuerzo de contenido enorme** que su modelo (voluntario/sindical, sin ingresos) difícilmente sostiene. Reacción probable **lenta**; improbable que igualen la ficha "qué hago" o el pipeline BOE a corto plazo.
- **Riesgo real**: que SPPLB, al ser **gratis y sindical**, fije la expectativa de "esto debería ser gratis" y dificulte cobrar 2,99 €. Mitigación: el valor tangible (importe, boletín, PDF, cuadrante fiable) justifica el precio; y el sindicato podría incluso recomendar/regalar Agente a sus afiliados como acuerdo.

**Barreras de entrada del propio sector (a favor de Agente una vez dentro):**
- **El contenido es el foso**: mantener normativa estatal + autonómica + ordenanzas con importes, consecuencias y fuentes al día es trabajo continuo. El pipeline BOE + panel de revisión es difícil de replicar por un aficionado; es también **la mayor carga de Agente** (riesgo de ejecución nº1).
- **Confianza y responsabilidad**: un importe o una orientación de detención errónea daña la marca y expone legalmente. Barrera reputacional que premia al que lo hace bien y con avisos/fuentes.
- **Distribución**: SPPLB tiene el canal sindical; Agente depende del boca a boca del cofundador agente. Barrera de captación, no de producto.

**Riesgos para Agente:**
1. **Ejecución de contenido**: si el pipeline se retrasa, Agente lanza con menos temas que SPPLB y pierde el "más completa". *Priorizar tráfico impecable en beta 1.*
2. **Percepción de precio** frente a alternativas gratis (SPPLB, Cuadra Turnos, Appol).
3. **Cuadrante**: es donde más fácil se pierde la confianza (SPPLB ya cayó ahí). Debe salir robusto, no en beta perpetua.
4. **Fragmentación por cuerpo/territorio**: cubrir bien Guardia Civil + CNP + locales + autonómicas multiplica el contenido; empezar por 1-2 territorios (Murcia, Canarias, según especificación) es lo correcto.

---

## 9. Conclusión operativa

SPPLB es un **producto de una persona, gratis y amplio, pero congelado en iOS, con cuadrante roto y que solo da el artículo**. El mercado está **fragmentado**: apps de consulta que no calculan nada, apps de cuadrante buenas pero aisladas, y apps de test para opositores. **Nadie une "consulta que resuelve la intervención" + "cuadrante fiable" + "actualización demostrable"**. Ese hueco es exactamente el de Agente. El ROI está, por este orden, en la **ficha completa (importe+consecuencia+boletín)**, el **buscador de jerga**, el **cuadrante fiable** y la **actualización visible**; el mapa/PK y las plantillas PDF son el foso técnico de segunda ola.

---

## Fuentes

- [SPPLB — App Store (ES)](https://apps.apple.com/es/app/spplb-polic%C3%ADas-y-bomberos/id1179685555) · [App Store (US)](https://apps.apple.com/us/app/spplb-polic%C3%ADas-y-bomberos/id1179685555)
- [SPPLB — Google Play](https://play.google.com/store/apps/details?id=org.tojo.spplbdroidpolicial) · [Seguridad de datos](https://play.google.com/store/apps/datasafety?id=org.tojo.spplbdroidpolicial)
- [SPPLB — apkpure](https://apkpure.com/spplb/org.tojo.spplbdroidpolicial) · [soft112](https://spplb.soft112.com/) · [appstor.io](https://appstor.io/app/spplb-policias-y-bomberos) · [softonic](https://spplb.softonic.com/android)
- [Sindicato SPPLB — web oficial](https://spplb.org/) · [Página de la app](https://www.spplb.org/destacado/2)
- [Codificado Policial – Appol (Google Play)](https://play.google.com/store/apps/details?id=es.appol.codpolicial) · [Amazon Appstore](https://www.amazon.es/Appol-es-Codificado-Polical-Appol/dp/B06XVPJ583)
- [CODIPOL IESPA — App Store](https://apps.apple.com/es/app/codipol-iespa/id6479991440) · [iPol Intervenciones — App Store](https://apps.apple.com/es/app/ipol/id1511139832) · [IDL-Pol — Google Play](https://play.google.com/store/apps/details?id=com.goodbarber.idlpol)
- [CuadraTurnos PMM Lite — App Store](https://apps.apple.com/es/app/cuadraturnos-pmm-lite-polic%C3%ADa/id1054136029) · [PMM PRO](https://apps.apple.com/es/app/cuadraturnos-pmm-pro-polic%C3%ADa/id1053419776)
- [Turnos Policía (VultureSoft) — App Store](https://apps.apple.com/es/app/turnos-polic%C3%ADa/id6756631570) · [Turnos CNP](https://apps.apple.com/es/app/turnos-cnp/id945516070) · [Cuadra Turnos Free](http://salva.policiacoin.es/x/cuadra-turnos-free)
- [TESTPN](https://www.testpn.com/) · [OPN Test](https://oposicionespolicianacional.com/app/) · [iPoL Opos Policía Local (Google Play)](https://play.google.com/store/apps/details?id=com.moybu.apps.iopos.ipol)
- [VinfoPOL — software de gestión policial](https://vinfopol.com/)
