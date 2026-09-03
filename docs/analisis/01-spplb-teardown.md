---
title: "01 · Teardown exhaustivo de SPPLB Policías y Bomberos"
proyecto: "Agente"
fecha: "2026-09-03"
autor: "Análisis competitivo (Claude)"
estado: "v1 — teardown de escritorio con verificación en fuentes primarias"
---

# 01 · Teardown exhaustivo — SPPLB Policías y Bomberos

> **Nota de método y fiabilidad.** Este teardown se apoya en tres tipos de fuente, con distinto grado de confianza:
> 1. **Fuentes primarias verificadas:** la **iTunes Lookup API** de Apple (`itunes.apple.com/lookup`) devuelve JSON estructurado con valoración, nº de reseñas, versión, fechas y tamaño de la ficha de iOS. Estos datos se marcan **[VERIFICADO iOS]**.
> 2. **Ficha de App Store (HTML):** historial de versiones y texto de reseñas.
> 3. **Mirrors/agregadores de Android** (apkpure, apkcombo, appbrain, softonic, appstor.io, vindu): **Google Play trunca la ficha a los rastreadores**, por lo que el nº de descargas, la valoración y las reseñas de **Android NO se han podido verificar en la propia tienda**. Se citan de mirrors y se marcan **[NO VERIFICADO EN PLAY]**, señalando además las **contradicciones entre mirrors**.
> El intento de abrir Google Play con navegador automatizado falló (extensión Chrome no conectada en esta sesión). **No se ha inventado ninguna cifra.** Donde no hay dato fiable, se dice "NO VERIFICADO".

---

## 1. Ficha completa en ambas tiendas

### 1.1 iOS — App Store (`id 1179685555`) — [VERIFICADO iOS vía iTunes Lookup API]

| Campo | Valor | Fuente |
|---|---|---|
| Nombre | SPPLB Policías y Bomberos | iTunes API |
| Desarrollador (seller y artist) | **Antonio Puche Bañón** (persona física) | iTunes API |
| Versión actual | **2.5.5** | iTunes API |
| Fecha última actualización | **2 de noviembre de 2023** | iTunes API (`currentVersionReleaseDate`) |
| Fecha de lanzamiento inicial | **1 de diciembre de 2016** | iTunes API (`releaseDate`) |
| **Valoración media** | **3,29 / 5** | iTunes API (`averageUserRating`) |
| **Nº de valoraciones** | **121** | iTunes API (`userRatingCount`) |
| Valoración/nº de la versión actual | 3,29 / 121 (idénticos al total → las valoraciones se cuentan sobre la versión vigente) | iTunes API |
| Tamaño | **34,27 MB** (34.267.136 bytes) | iTunes API |
| Precio | **0,00 €** (gratis) | iTunes API |
| Compras integradas (IAP) | **No** aparecen | iTunes API |
| Categoría | **Referencia** (secundaria: Productividad) | iTunes API |
| Clasificación por edad | **4+** | iTunes API |
| Idiomas | **Español, Inglés** (ES, EN) | iTunes API |
| Requisitos | **iOS 11.0 o superior**; iPhone, iPad, iPod touch | iTunes API |
| Privacidad | "El desarrollador no recopila ningún dato" | ficha App Store |
| Notas de la versión 2.5.5 | *"Corrección en el cuadrante."* | iTunes API (`releaseNotes`) |

> **Estimación de descargas iOS:** appstor.io estima *"3.63k downloads last month"* para la ficha de App Store. Es una **estimación de un tercero, NO VERIFICADA** y probablemente inflada/algorítmica; no debe usarse como dato duro. El nº real de descargas de iOS **no es público**.

### 1.2 iOS — Historial de versiones completo [VERIFICADO — ficha App Store]

| Versión | Fecha | Nota de versión (changelog) |
|---|---|---|
| **2.5.5** | 02/11/2023 | "Corrección en el cuadrante." |
| 2.5.4 | 29/07/2022 | "Corrección de errores." |
| 2.5.3 | 07/07/2022 | "Corregidos colores en el cuadrante." |
| 2.5.2 | 30/05/2022 | Actualización sección info, codificado de tráfico permisivo, cambios de color de texto. |
| 2.5.1 | 23/05/2022 | Corregido error de visualización de imágenes del menú. |
| 2.5 | 20/05/2022 | Tráfico actualizado a 7 de marzo de 2022; añadida categoría **VMP** (patinetes); mejoras gráficas. |
| 2.4 | 08/12/2017 | "Actualizadas infracciones de tráfico, última normativa Octubre 2017." |
| 2.3 | 15/03/2017 | Corrección de error de base de datos; artículos que faltaban restaurados. |
| 2.2 | 09/03/2017 | Corrección de errores; añadidas secciones bienvenida y "nosotros". |
| 2.1 | 13/02/2017 | Corrección de errores. |
| 2.0 | 31/01/2017 | Gran mejora: acceso a datos, buscador, gráficos, calendario, sistema de lectura de derechos. |
| 1.5.2 | 01/12/2016 | Versión inicial. |

**Lectura del patrón iOS:** ráfaga de versiones en 2017 (2.0→2.4) → **hueco de casi 5 años** (dic-2017 a may-2022) → tanda de parches en 2022, **la mayoría dedicados literalmente a "corregir el cuadrante" y sus colores** → 2.5.5 en nov-2023 y **parada total: casi 2 años sin tocar iOS** (a fecha de sept-2026). **iOS está de facto abandonado** y 3 de las últimas 4 notas de versión hablan del cuadrante. El punto flaco está escrito en el propio changelog.

### 1.3 Android — Google Play (`org.tojo.spplbdroidpolicial`) [NO VERIFICADO EN PLAY — mirrors]

| Campo | Valor | Fuente / confianza |
|---|---|---|
| Nombre | SPPLB | Play/mirrors |
| Versión | **3.1.1 "New Time Christmas"** | apkpure, apkcombo |
| Última actualización | **06/03/2026** (apkpure) **/ 19/12/2025** (apkcombo) → **CONTRADICCIÓN entre mirrors** | apkpure vs apkcombo |
| Tamaño | **9,3 MB** (apkpure) / **17 MB** (apkcombo) → **CONTRADICCIÓN** | apkpure vs apkcombo |
| Requiere | **Android 6.0+** | apkpure, apkcombo |
| Desarrollador (cuenta Play) | **"vitamina d*"** (NO "Antonio Puche" como en iOS) | apkpure, apkcombo |
| **Valoración media** | **4,1** (apkcombo) / **4,2** (vindu) | NO VERIFICADO EN PLAY |
| **Nº de valoraciones** | **195** (apkcombo) | NO VERIFICADO EN PLAY |
| **Descargas** | **10.000+** (apkcombo); coincide con la especificación | NO VERIFICADO EN PLAY |
| Categoría | Herramientas / Tools | mirrors |
| Clasificación | Everyone / Para todos | mirrors |
| Seguridad de datos (Play) | "No recopila ni comparte datos del usuario" | ficha Play (verificado en análisis previo) |
| Precio / IAP | Gratis; sin IAP declarados | mirrors |

> **Hallazgos Android relevantes:**
> - **La cuenta de desarrollador de Android ("vitamina d*") NO coincide con la de iOS (Antonio Puche Bañón).** Puede ser un alias del mismo desarrollador o un colaborador distinto; en cualquier caso confirma un **desarrollo artesanal, no corporativo**, y una **posible desalineación entre plataformas**.
> - **Android SÍ se mantiene (2025-2026); iOS NO (2023).** El "no se actualiza desde 2023" de la especificación es **cierto solo para iOS**. En el discurso comercial hay que matizar: **iOS abandonado; Android mantenido pero con la misma UI y los mismos fallos de fondo (cuadrante, falta de importes)**.
> - Las **contradicciones de fecha y tamaño entre mirrors** son típicas de fichas cacheadas en distintos momentos; se dejan ambas y se marcan.

### 1.4 Permisos
No se ha obtenido el listado técnico de permisos del manifiesto Android en esta pasada (requeriría descompilar el APK o leer la sección "Permisos" de Play, truncada). **NO VERIFICADO.** Lo declarado en "Seguridad de datos" es que **no recopila datos**, coherente con una app de consulta local + cuadrante en dispositivo.

---

## 2. Inventario exhaustivo de funcionalidades y árbol de navegación

Reconstruido a partir de la descripción oficial (App Store, Google Play, spplb.org) y del análisis previo. La app es una **cuadrícula de iconos** (UI estilo 2017); cada icono abre un módulo de consulta. Árbol aproximado:

```
SPPLB (Inicio: rejilla de iconos)
│
├── CONSULTA NORMATIVA (el núcleo)
│   ├── Tráfico
│   │   ├── Codificado de tráfico (LSV / RGC / RGV) — texto del artículo
│   │   └── VMP / patinetes (añadido en v2.5, 2022)
│   ├── Transportes (ROTT / tacógrafo / ADR)
│   ├── Seguridad Ciudadana (LO 4/2015)
│   ├── Extranjería (LO 4/2000)
│   ├── Menores (LO 5/2000)
│   ├── Armas (RD 137/1993)
│   ├── Animales peligrosos (Ley 50/1999)
│   └── Código Penal (LO 10/1995, "actualizado LO 1/2015")
│
├── BUSCADOR
│   ├── Búsqueda por texto ("la consulta más rápida de todas las apps policiales")
│   └── **Consulta por voz** (dictado)
│
├── LECTURA DE DERECHOS
│   └── Art. 520 LECrim en varios idiomas (detenido)
│
├── VEHÍCULOS
│   ├── Detección/control de vehículos robados (extranjeros)
│   └── **+200 / +400 enlaces** sobre falsedad documental y control de vehículos
│
├── CUADRANTE / CALENDARIO  (el módulo problemático)
│   ├── Introducción de servicios
│   ├── Creación/edición de servicios (nombre + abreviatura; color NO persiste → bug)
│   ├── Cambios de servicio
│   ├── Notas
│   └── Alarmas / avisos
│
├── SECCIÓN SINDICAL / INFORMATIVA
│   ├── Bienvenida
│   ├── "Nosotros" (info del sindicato)
│   └── Novedades / noticias del sindicato
│
└── (Adyacentes fuera de esta app, mismo emisor)
    ├── SPPLB OPOSMART / T-Forma  → formación y oposiciones (app aparte)
    ├── La Jungla radio            → radio (app aparte)
    └── Policía de Barrio          → policía de proximidad (app aparte, 2023)
```

**Lo que la app da y lo que NO da (clave competitiva):**
- **DA:** el **texto del artículo**, buscador rápido, voz, lectura de derechos multiidioma, enlaces de vehículos, y un cuadrante básico.
- **NO da:** importe, importe con reducción por pronto pago, puntos, **texto de boletín listo para copiar**, capa de consecuencias (grúa/inmovilización/detención con fuente), tabla de sustancias (umbral consumo/tráfico), personalización por cuerpo/territorio, generación real de documentos rellenados (PDF), mapa/PK, fecha de actualización por norma. Es una **biblioteca de textos legales con buscador**, no un asistente de intervención.

---

## 3. Minería de reseñas (citas con fuente)

> Limitación: Play trunca las reseñas a rastreadores y el navegador no estaba disponible. Las citas iOS son **[VERIFICADAS en ficha App Store]**; las tendencias Android provienen de mirrors y del análisis previo, marcadas como tales. Con **121 valoraciones iOS** y **~195 Android (NO VERIF.)**, la muestra pública citable es pequeña; **no se pueden dar recuentos fiables por tema** ("X reseñas dicen…"), así que se agrupan cualitativamente.

### 3.1 CUADRANTE — la queja estrella (tema dominante)
> **Alex.T.S. (App Store, 31/05/2022, 1★):** *"La parte del cuadrante no funciona correctamente: al modificar un servicio solo te deja cambiar el nombre o la abreviatura, pero no guarda el color del texto ni el color de fondo, por lo que se ve siempre con texto negro y fondo blanco."*

Refuerzo desde el **propio changelog** (evidencia objetiva, no opinión): v2.5.3 *"Corregidos colores en el cuadrante"*, v2.5.5 *"Corrección en el cuadrante"* → el fabricante **reconoce el fallo** y lo persigue versión tras versión. Es el punto de dolor #1.

### 3.2 ACTUALIZACIÓN / CONTENIDO DESFASADO (segundo tema)
> **Alejandro_99 (App Store, 18/11/2020, 5★):** *"La app funciona perfectamente y está completísima, además de que es gratuita. ¿Cuándo habrá una actualización? Estamos en 2020 y la normativa ha cambiado; la última actualización fue de 2017."* (elogio + queja de desfase en la misma reseña).

> **Fran Vilar (App Store, abr.):** *"El tráfico está actualizado a marzo de 2026, pero la normativa del seguro obligatorio (SOA) de los patinetes no está actualizada."* → confirma **actualización parcial e incoherente**: unas materias al día y otras no, **sin que el usuario sepa cuál**.

### 3.3 ELOGIOS (lo que valoran — el listón a igualar)
> **Alejandro_99:** *"…está completísima, además de que es gratuita."* → **amplitud de contenido + precio cero** es el activo.
> **Elogio recogido en análisis previo:** *"La app funciona perfectamente y está completísima, además de que es gratuita."*
> **Unodeaquí (App Store, 26/05/2017):** valora que, sin ser aún policía local, la app "parece desarrollada profesionalmente".
> Agregadores de terceros puntúan la app **4,1-4,2/5** y la resumen como *"rápida, fácil de usar, aporta información policial importante"* (vindu), con contras *"puede ser imprecisa y depende de la base de datos"*.

### 3.4 INTERFAZ / CONTENIDO / PUBLICIDAD (temas del análisis previo, plausibles, sin cita literal verificada)
- **Interfaz:** UI de 2017, cuadrícula de iconos, sin modo oscuro moderno ni personalización. *(plausible; sin cita textual)*
- **Contenido "solo el artículo":** falta importe/puntos/consecuencia. *(coherente con la descripción de la app; sin reseña literal)*
- **Publicidad:** la ficha de Play declara **"no recopila datos"** y no hay indicios de anuncios; **no consta publicidad**. Es un punto **fuerte** (sin ads), no una queja.
- **Buscador literal:** sin sinónimos de calle. *(plausible; no citado textualmente)*

**Síntesis de la minería:** dos ejes de queja claros y verificables (**cuadrante roto** y **contenido desfasado/incoherente**), sobre una base de usuarios que **valora la amplitud y la gratuidad**. No hay evidencia de queja por publicidad (no la tiene).

---

## 4. Modelo: financiación, quién está detrás y dependencia

- **Emisor:** **SPPLB — Sindicato Profesional de Policías Locales y Bomberos** (`spplb.org`). La app se presenta como *"la primera aplicación de consulta policial del Sindicato de Policías Locales y Bomberos"*.
- **Desarrollo:** **una persona técnica**. En iOS la cuenta es **Antonio Puche Bañón** (persona física); en Android la cuenta Play figura como **"vitamina d*"**. Portfolio del mismo entorno (iTunes + spplb.org): **SPPLB (consulta)**, **SPPLB OPOSMART / T-Forma** (formación/oposiciones, `com.sindicato.training` / App Store `id6759240053`), **La Jungla radio**, y **Policía de Barrio** (presentada el **25/04/2023**, Valencia, con un policía local de proximidad). appstor.io atribuye "4 apps" al desarrollador; iTunes devuelve 3 → discrepancia menor, **NO VERIFICADO**.
- **Financiación:** **gratuita, de patrocinio sindical**. No hay IAP ni suscripción en la app de consulta, ni publicidad. El sindicato la usa como **servicio a afiliados y herramienta de captación/imagen**; la monetización real del ecosistema parece estar en **la formación/oposiciones** (OPOSMART/T-Forma), no en la app de consulta.
- **Dependencia (bus factor):**
  - **Bus factor ≈ 1** en lo técnico: una sola persona mantiene varias apps a la vez (consulta, formación, radio, proximidad), lo que explica el **mantenimiento a golpes** y el **abandono de iOS**.
  - **Sesgo de origen:** sindicato de **policía local** → incentivo natural hacia el mundo local y **poco hacia Guardia Civil / Policía Nacional / autonómicas**, aunque la app las mencione.
  - **Contenido sindical acoplado** (bienvenida, "nosotros", novedades): ata la herramienta a **un sindicato concreto** (fricción para no afiliados o afiliados de otro sindicato).

---

## 5. Puntos débiles explotables (priorizados, con evidencia)

1. **iOS abandonado desde nov-2023 (v2.5.5).** *[VERIFICADO iTunes API: currentVersionReleaseDate 2023-11-02].* Casi 2 años sin tocar la app de iPhone. **Evidencia + argumento de venta directo.**
2. **Cuadrante roto y no persistente.** *[VERIFICADO: reseña 1★ Alex.T.S. + changelog 2.5.3/2.5.5 dedicados a "corregir el cuadrante"].* Su función más frágil y la que más frustra; el propio fabricante no lo cierra.
3. **Solo da el artículo, no la decisión.** Sin importe, puntos, consecuencia (grúa/inmovilización/detención) ni **texto de boletín**. *[Evidencia: descripción oficial de la app + comparación con especificación §3].* El agente aún tiene que saberse el importe de memoria.
4. **Contenido desfasado e incoherente entre materias.** *[VERIFICADO: reseña Fran Vilar "tráfico a marzo 2026 pero SOA patinetes sin actualizar" + reseña Alejandro_99 "normativa cambió, última 2017"].* No hay **fecha de actualización por norma** ni "qué ha cambiado": el usuario no sabe si un dato está vigente.
5. **UI de 2017 (rejilla de iconos), sin personalización por cuerpo/territorio.** *[Evidencia: capturas/descripción; el mismo contenido para GC de tráfico y policía local de un municipio].* Sin diseño para uso con una mano en el coche ni modo oscuro moderno.
6. **Desalineación iOS/Android y desarrollo artesanal.** *[VERIFICADO: cuenta iOS "Antonio Puche Bañón" ≠ cuenta Android "vitamina d*"; versiones y ritmos distintos].* Dos plataformas a dos velocidades = experiencia inconsistente y frágil.
7. **Dependencia de una sola persona con varias apps a la vez** (consulta, oposiciones, radio, proximidad). *[Evidencia: portfolio del desarrollador].* Bus factor 1; capacidad de reacción limitada.
8. **Acoplamiento sindical (local).** *[Evidencia: secciones "nosotros"/novedades + emisor sindicato de policía local].* Sesgo local, fricción para otros cuerpos y sindicatos; sin incentivo para cubrir bien GC/CNP/autonómicas.
9. **Sin generación real de documentos ni mapa/PK.** El trabajo de oficina (redactar la denuncia con PK) sigue siendo manual. *[Evidencia: ausente en descripción; "genera atestados" es, en la práctica, plantillas casi vacías].*
10. **Buscador literal, sin jerga de calle.** *[Plausible, no citado textualmente].* Quien no sabe el término legal exacto no encuentra la infracción.

---

## 6. Puntos fuertes que NO podemos ignorar (paridad mínima obligatoria)

Para que un usuario de SPPLB se cambie, **Agente debe igualar esto el día del lanzamiento**:

1. **Amplitud de contenido comparable.** SPPLB cubre tráfico (LSV/RGC/RGV + codificado), transportes, Seg. Ciudadana (LO 4/2015), extranjería, menores, armas, animales, VMP, Código Penal y **art. 520 LECrim multiidioma**. Si Agente tiene menos temas, gana el *"SPPLB es más completa y gratis"* (elogio real de usuarios). **Es el listón #1.**
2. **Gratis / muy bajo umbral para probar.** SPPLB es gratis; su gratuidad es el elogio más repetido. La **prueba de 14 días + modo limitado (5 consultas/día)** de la especificación es imprescindible para que arranque el boca a boca.
3. **Consulta por voz.** SPPLB ya la tiene → es **paridad, no diferenciación**.
4. **Velocidad y offline.** SPPLB presume de ser *"la consulta más rápida de todas las apps policiales"*. Agente debe serlo de verdad (FTS5 local, <3 s sin cobertura).
5. **Lectura de derechos multiidioma (art. 520).** Ya la ofrece SPPLB.
6. **Sección de vehículos con enlaces útiles** (control de vehículos, falsedad documental). Heredable y depurable.
7. **Cero publicidad / no recopila datos.** SPPLB no tiene ads y declara no recopilar datos: la privacidad es terreno donde **no podemos quedar por debajo** (y Agente ya lo cumple por diseño).
8. **Existencia de cuadrante integrado.** Aunque roto, los usuarios esperan **consulta + cuadrante en la misma app**. Agente debe llevarlo, pero con el listón de las apps dedicadas (ver §7), no el de SPPLB.

---

## 7. Otras apps del espacio (contexto breve)

- **Consulta / codificado:** **Codificado Policial – Appol** (`es.appol.codpolicial`, también en Amazon Appstore) busca en todas las normas por ámbito; **CODIPOL – IESPA** (ligada a academia); **iPol – Intervenciones Policiales** (protocolos de actuación); **IDL-Pol** (diccionario/códigos, tipo GoodBarber). Todas **dan el texto, no la decisión** (ni importe ni consecuencia ni boletín).
- **Cuadrante / turnos (nicho maduro; aquí está el verdadero listón del cuadrante):** **CuadraTurnos PMM** (Lite/PRO, freemium, ~3,6★/88 valoraciones en Lite), **Turnos Policía** (VultureSoft: patrones, saldo anual, nocturnidad y festivos, **export PDF**), **Turnos CNP**, **Cuadra Turnos Free** (policiacoin), **APP 11 Turnos**, **DRAGDroid** (se conecta a la BD de la comisaría). **Agente debe alcanzar la paridad con estas, no con el cuadrante de SPPLB.**
- **Oposiciones / test (adyacente, valida que el colectivo paga software):** OpositaTest, TESTPN, OPN Test, TestOpos Guardia Civil, iPoL Opos. **El propio SPPLB juega aquí con OPOSMART/T-Forma** (de pago) → señal de que **su monetización está en formación, no en la consulta**.
- **B2B / gestión de comisaría:** VinfoPOL/VinfoVAL (venta a ayuntamientos; incluye cuadrante). No compite por el bolsillo del agente.

**Conclusión del panorama:** el mercado está **fragmentado** (consulta que no calcula nada · cuadrante bueno pero aislado · test para opositores). **Nadie une "consulta que resuelve la intervención" (importe+consecuencia+boletín) + cuadrante fiable + actualización demostrable.** Ese es el hueco de Agente.

---

## Fuentes

- iTunes Lookup API (iOS, JSON): `https://itunes.apple.com/lookup?id=1179685555&country=es` — **datos iOS verificados**.
- App Store (ES): `https://apps.apple.com/es/app/spplb-polic%C3%ADas-y-bomberos/id1179685555` — historial de versiones y reseñas.
- Desarrollador (iTunes): `https://itunes.apple.com/lookup?id=1179685554&country=es&entity=software` — portfolio de apps.
- Google Play: `https://play.google.com/store/apps/details?id=org.tojo.spplbdroidpolicial` (truncado a rastreadores).
- Mirrors Android: `https://apkpure.com/spplb/org.tojo.spplbdroidpolicial` · `https://apkcombo.com/spplb/org.tojo.spplbdroidpolicial/` · `https://spplb.softonic.com/android` · `https://appstor.io/app/spplb-policias-y-bomberos`.
- Web del sindicato: `https://spplb.org/` · `https://www.spplb.org/destacado/2` (ficha de la app) · `https://spplb.org/noticia/presentacion-app-policia-de-barrio`.
- Contexto competitivo: `https://vinduapp.com/post/las-mejores-apps-policial-en-movil.html`.
- Análisis previo del proyecto: `docs/perspectivas/07-competencia.md`.
