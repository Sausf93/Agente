---
title: "Agente — Especificación del producto v1"
subtitle: "Documento base para iniciar el desarrollo con Claude Code"
date: "3 de septiembre de 2026"
lang: es
---

# 0. Cómo usar este documento

Este documento es la fuente de verdad del proyecto. Está pensado para que Claude Code lo lea completo antes de escribir la primera línea de código, y para que vosotros dos lo uséis como contrato de lo que se construye.

- Las secciones 1 a 5 describen **qué** se construye y por qué.
- Las secciones 6 a 10 describen **cómo**: modelo de datos, arquitectura, contenido, pagos y privacidad.
- La sección 11 es el **plan de fases** con el orden de construcción.
- La sección 12 es el **backlog** inicial, listo para convertirse en issues.
- El apéndice A contiene un `CLAUDE.md` para copiar a la raíz del repositorio.

Cuando algo aquí choque con la realidad (una API que no existe, una ley que ha cambiado), gana la realidad, se corrige el documento y se sigue. Nombre provisional de la app: **"Agente"**. Cambiadlo cuando tengáis uno definitivo.

# 1. Visión y objetivo

## 1.1 En una frase

Una app móvil para miembros de las Fuerzas y Cuerpos de Seguridad en España (Guardia Civil, Policía Nacional, policías locales y policías autonómicas) que sustituye a las apps gratuitas de consulta que usan hoy, con **normativa siempre actualizada, buscador que entiende el lenguaje de la calle, texto de denuncia listo para copiar, plantillas de documentos en PDF, cuadrante con contador de horas y mapa con punto kilométrico**, todo adaptado al cuerpo y territorio de cada agente.

## 1.2 Por qué existe

La app de referencia hoy es **SPPLB Policías y Bomberos**, desarrollada por una sola persona para un sindicato de policías locales. Es gratuita y se usa a diario, pero:

- La versión iOS no se actualiza desde 2023; el contenido se actualiza desde servidor con retraso (usuarios se quejan de normas concretas sin actualizar).
- El cuadrante falla (varias versiones consecutivas dedicadas solo a "corregir el cuadrante"; no guarda configuración).
- Interfaz de 2017, cuadrícula de iconos, sin personalización por cuerpo.
- Da el artículo, pero no el importe, los puntos, la consecuencia (¿detención? ¿grúa?) ni el texto para el boletín.
- Penetración baja: ~10.000+ descargas en Android y ~120 valoraciones en iOS frente a ~250.000 agentes en España. La mayoría de agentes no usa ninguna app; el mercado está sin tocar.

## 1.3 Modelo de negocio

- **Fase beta**: gratis para el entorno del cofundador agente (decenas de usuarios), a cambio de feedback.
- **Lanzamiento**: suscripción de **2,99 €/mes** (y anual con descuento, p. ej. 24,99 €/año), cobrada **a través de las tiendas** (App Store y Google Play).
- **Captación**: boca a boca entre compañeros. El cofundador agente es el vendedor.
- **Objetivo económico**: 1 % de los agentes de España (2.500 suscriptores) ≈ 6.000-7.000 €/mes netos tras comisiones.

## 1.4 Principios de producto

1. **Rápido en la calle.** Cualquier consulta frecuente se resuelve en menos de 3 segundos y sin cobertura.
2. **Siempre al día.** La normativa se actualiza de forma continua y el usuario ve qué ha cambiado.
3. **Adaptado a mí.** Tras elegir cuerpo y territorio, el agente solo ve lo que le aplica.
4. **Con fuente.** Toda regla (importe, detención, grúa) lleva el artículo o resolución que la sustenta.
5. **Mínimos datos.** Solo correo y contraseña. Nada sobre terceros (matrículas, personas) sale del dispositivo.
6. **Fiable.** Un cuadrante que pierde datos o una infracción con importe equivocado destruye la confianza. Tests y validación de contenido no son opcionales.

# 2. Usuarios

## 2.1 Perfiles

| Cuerpo | Ámbito | Particularidades para la app |
|---|---|---|
| Guardia Civil | Estatal, rural, tráfico interurbano | Tráfico (RGC, RGV, LSV), PK en carreteras, transportes, armas, drogas |
| Policía Nacional | Estatal, urbano | Seguridad ciudadana, extranjería, Código Penal, detenciones |
| Policía Local | Municipal | Tráfico urbano, ordenanzas municipales, animales, ruido, VMP |
| Policía autonómica | Ertzaintza, Mossos, Policía Foral, Policía Canaria | Normativa autonómica propia |

## 2.2 Datos de perfil (elegidos al registrarse, editables)

- Cuerpo (obligatorio).
- Comunidad autónoma (obligatorio).
- Provincia (obligatorio).
- Municipio (obligatorio para Policía Local; opcional para el resto).
- Unidad o especialidad (opcional, texto libre: "Tráfico", "Seguridad Ciudadana", "Fiscal").

Estos datos sirven para filtrar contenido y ordenar la pantalla de inicio. **No se piden nombre, número de identificación profesional (TIP) ni teléfono.**

## 2.3 Casos de uso diarios (validados con el cofundador agente)

1. Ve un coche con un faro roto. Busca "faro roto", obtiene artículo, importe, puntos y texto para el boletín. Copia y pega.
2. Coche sin seguro. Además del importe, necesita saber la consecuencia: si el conductor contrata seguro en el acto puede continuar; si no, inmovilización y grúa. La app lo muestra debajo del artículo.
3. Robo con violencia vs. hurto. Necesita saber de un vistazo si procede detención, identificación y denuncia, o solo denuncia, según LECrim.
4. Persona con sustancias. Necesita el umbral consumo/tráfico por sustancia y las circunstancias que agravan (dosis repartidas, balanza, dinero fraccionado).
5. Tras la intervención, en oficina, redacta la denuncia. Hoy parte de una plantilla casi vacía. La app genera un PDF con todo el texto legal rellenado; el agente solo pone fecha, hora, lugar (con PK) y observaciones.
6. Consulta el cuadrante para saber si libra el sábado y cuántas nocturnas lleva este mes.
7. Necesita leer los derechos a un detenido extranjero en su idioma.

# 3. Alcance funcional

## 3.1 Paridad con SPPLB (todo lo que tiene la app actual)

Inventario extraído de las fichas de App Store y Google Play y de las capturas de la app:

| Módulo SPPLB | Estado en Agente |
|---|---|
| Codificado de tráfico (LSV, RGC, RGV) | Sí, con buscador mejorado, importe, puntos y texto |
| Transportes (ROTT, tacógrafo, ADR) | Sí |
| Seguridad Ciudadana (LO 4/2015) | Sí, con importes y graduación |
| Extranjería (LO 4/2000, RD 557/2011) | Sí |
| Menores (LO 5/2000) | Sí |
| Armas (RD 137/1993) | Sí |
| Animales peligrosos (Ley 50/1999, RD 287/2002) y Ley 7/2023 de bienestar animal | Sí |
| Código Penal (LO 10/1995) | Sí, con capa de detención (LECrim) |
| Lectura de derechos art. 520 LECrim en varios idiomas | Sí, ampliable; con audio en fase 2 |
| Búsqueda por voz | Sí (dictado nativo del sistema sobre el buscador) |
| VMP (patinetes): normativa y seguro obligatorio | Sí |
| Vehículos extranjeros robados / falsedad documental (enlaces) | Sí, como sección "Vehículos" con enlaces curados |
| Control de vehículos | Sí, integrado en "Vehículos" |
| Cuadrante con servicios, cambios, notas y alarmas | Sí, reescrito y con contador de horas |
| "Más usadas" / favoritos | Sí, por cuerpo y personal |
| Genera atestados | Sí, evolucionado a "Plantillas y documentos" |
| Formación, Nosotros, Contacto, Tiempo libre (sindical) | No aplica (contenido sindical). Contacto y soporte, sí |

## 3.2 Mejoras diferenciales (lo que SPPLB no tiene)

1. **Perfil por cuerpo y territorio** que reordena toda la app.
2. **Buscador semántico policial**: sinónimos de calle ("faro roto" → "alumbrado deficiente"), errores ortográficos, búsqueda por artículo, por importe, por palabra clave.
3. **Ficha de infracción completa**: artículo, norma, gravedad, importe (con reducción por pronto pago), puntos, texto para el boletín, consecuencias (inmovilización, grúa, retirada de permiso), y "ver artículo completo".
4. **Capa de consecuencias con fuente**: detención sí/no según LECrim, inmovilización/depósito, decomiso, etc.
5. **Tabla de sustancias**: umbrales de consumo vs. tráfico con fuente jurisprudencial.
6. **Plantillas y documentos en PDF** generados con el contenido de la consulta, enviados por correo o guardados.
7. **Mapa con PK**: posición sobre la vía, PK y sentido, copiable al portapapeles y a la plantilla.
8. **Cuadrante con contador**: horas totales, nocturnas, festivas, exceso de jornada; patrones por cuerpo (6-saliente-3, 7x7, etc.).
9. **Estimación de complementos** (fase posterior): a partir del cuadrante, cálculo orientativo de nocturnidad, festividad y exceso.
10. **Avisos de cambios normativos**: "Ha cambiado el art. X del RGC" con resumen.
11. **Modo offline completo**: contenido en el dispositivo; el servidor solo sirve actualizaciones.
12. **Diseño actual**: pantalla de inicio con buscador, accesos rápidos y estado del turno; modo oscuro; tipografía legible en el coche.

## 3.3 Fuera de alcance en v1

- Chat o foro entre agentes.
- Gestión de expedientes o datos de personas/vehículos en servidor.
- Integración con sistemas oficiales (SIGO, DGT, PDA de cada cuerpo).
- Contenido de bomberos.
- Versión web de escritorio (solo landing y gestión de cuenta).

# 4. Especificación por módulo

## 4.1 Onboarding y cuenta

- Pantallas: bienvenida → registro (correo + contraseña, o "Iniciar sesión con Apple" / Google si simplifica) → elegir cuerpo → comunidad, provincia, municipio → listo.
- Sesión persistente: el usuario no vuelve a iniciar sesión salvo cierre explícito o cambio de dispositivo. Token de refresco de larga duración.
- Recuperación de contraseña por correo.
- Verificación de correo obligatoria (evita cuentas basura y es la vía de envío de PDFs).
- Ajustes: cambiar cuerpo/territorio, tema claro/oscuro, tamaño de texto, gestionar suscripción (enlace a la tienda), borrar cuenta (obligatorio por las tiendas y RGPD).

## 4.2 Inicio

- Cabecera: "Hola, agente" + cuerpo · territorio.
- Buscador grande con placeholder rotatorio de ejemplos reales ("faro roto, sin seguro, móvil…") y botón de micrófono.
- Accesos rápidos (4-6) según cuerpo. Configurable por el usuario.
- Tarjeta de turno: "Hoy: noche 22:00-06:00 · Este mes: 148 h".
- Lista "Más usadas en tu cuerpo" (agregado anónimo de consultas) y "Tus favoritas".
- Aviso de novedades normativas si las hay desde la última apertura.

> **Estado v1 (ADR-018).** Implementado en `apps/mobile` (bajo la pestaña Buscar, que es el
> Inicio): accesos rápidos (lista por defecto de términos de calle; configurable, pendiente),
> **tarjeta de turno** (del cuadrante si está configurado; si no, CTA para configurarlo), **Tus
> favoritas** (+ lista completa en `/favoritos`), **Tus más usadas** (top LOCAL del dispositivo;
> el agregado "en tu cuerpo" entre usuarios es de servidor y queda para después) y **aviso de
> novedades** (badge). Todo local, offline y anónimo (ADR-001).

## 4.3 Buscador

- Búsqueda local (índice en el dispositivo). Resultados en <300 ms.
- Entrada: texto libre, número de artículo ("11.1 RGV"), código de infracción DGT, palabra clave.
- Normalización: minúsculas, tildes, plurales, errores comunes (distancia de edición 1-2).
- **Diccionario de sinónimos policiales** mantenido por el cofundador agente en el panel de administración: `faro roto → alumbrado deficiente`, `sin ITV → inspección técnica caducada`, `móvil → uso de dispositivo de telefonía`.
- Ranking: coincidencia exacta de sinónimo > coincidencia en título > coincidencia en texto > popularidad en el cuerpo del usuario.
- Filtros: norma, gravedad, cuerpo, ámbito (estatal/autonómico/municipal).
- Voz: dictado nativo (iOS Speech / Android SpeechRecognizer) que rellena el campo de búsqueda.

## 4.4 Ficha de infracción / artículo

Campos mostrados en este orden:

1. Título corto (el que buscó el agente).
2. Norma y artículo (p. ej. "RGV art. 11.1 · Anexo I").
3. Gravedad (leve / grave / muy grave) y tipo (administrativa / penal).
4. Importe, importe con reducción por pronto pago (50 % en tráfico, art. 94 LSV), puntos.
5. **Texto para el boletín**: párrafo redactado, copiable con un toque. Variantes si aplica (delantero/trasero, izquierdo/derecho).
6. **Consecuencias**: chips con fuente. Ejemplos: "Inmovilización (art. 104 LSV)", "Depósito/grúa (art. 105 LSV)", "Detención: no procede salvo art. 495 LECrim".
7. Competencia: qué cuerpo puede denunciar y en qué vía (urbana/interurbana).
8. Artículo completo (desplegable) y enlace a la norma consolidada en BOE.
9. Acciones: Copiar texto · Favorito · Generar documento · Compartir.
10. Pie: "Actualizado el dd/mm/aaaa · Fuente".

## 4.5 Normativa

- Navegación por norma → título → capítulo → artículo, con el texto consolidado.
- Buscador dentro de la norma.
- Marcadores y notas personales (solo en dispositivo).
- Indicador de "cambió el dd/mm/aaaa" en artículos modificados recientemente, con diff resumido.

> **Estado v1 (ADR-016).** Implementado en `apps/mobile`: navegación **norma → artículo** (el
> paquete no modela "capítulo"; el apartado queda localizable dentro del texto, coherente con la
> granularidad de `Articulo` en §6.1), buscador dentro de la norma, **marcadores** locales e
> indicador "cambió el dd/mm" a partir de `valid_from`. El texto se renderiza con un render de
> Markdown propio y ligero (compatible con Expo Go). Las **notas personales** por artículo y el
> **diff resumido** quedan para una iteración posterior (el diff depende de que el pipeline emita
> `Novedad` con artículos concretos).

Normas de la v1 (todas de fuentes públicas oficiales):

| Norma | Fuente |
|---|---|
| RDL 6/2015 Ley de Tráfico (LSV) | BOE consolidado |
| RD 1428/2003 Reglamento General de Circulación (RGC) | BOE |
| RD 2822/1998 Reglamento General de Vehículos (RGV) | BOE |
| RD 818/2009 Reglamento General de Conductores | BOE |
| Codificado de infracciones de tráfico | DGT (documento público) |
| LO 4/2015 Seguridad Ciudadana | BOE |
| LO 10/1995 Código Penal | BOE |
| LECrim (arts. 490-527 como mínimo) | BOE |
| LO 4/2000 y RD 557/2011 Extranjería | BOE |
| LO 5/2000 Responsabilidad penal del menor | BOE |
| RD 137/1993 Reglamento de Armas | BOE |
| Ley 50/1999 y RD 287/2002 Animales potencialmente peligrosos; Ley 7/2023 Bienestar animal | BOE |
| Ley 16/1987 LOTT y RD 1211/1990 ROTT (transportes) | BOE |
| Normativa autonómica relevante por comunidad (empezar por Murcia y Canarias) | BORM, BOC |
| Ordenanzas municipales (empezar por los municipios de los usuarios beta) | Web municipal |

## 4.6 Capa de consecuencias (detención, inmovilización, decomiso)

Se modela como **reglas con fuente**, no como texto libre. Para delitos:

- Gravedad del delito derivada de la pena (art. 33 CP): leve / menos grave / grave.
- Reglas LECrim:
  - Art. 490: flagrancia, tentativa, fuga, rebeldía → procede detención.
  - Art. 492.4: indicios racionales de delito + participación + riesgo de incomparecencia (492.3) → puede proceder.
  - Art. 493: si no se detiene, identificar y comunicar al juzgado.
  - Art. 495: delito leve → no cabe detención salvo que **no tenga domicilio conocido *ni* preste fianza bastante** (requisitos acumulativos; redacción vigente tras la LO 5/2024, "delitos leves").
- La ficha muestra el resultado del árbol y **siempre** los artículos. Texto fijo al pie: "Orientación basada en LECrim; la valoración de los indicios y del riesgo corresponde al agente."

Para tráfico: inmovilización (art. 104 LSV), depósito (art. 105), retirada de permiso, pérdida de puntos, con la causa concreta.

## 4.7 Tabla de sustancias

- Por sustancia: umbral orientativo de consumo diario y de acopio para consumo (Instituto Nacional de Toxicología, acuerdo de la Sala 2ª del TS de 19/10/2001 y jurisprudencia posterior), pureza, indicadores de tráfico (dosis fraccionadas, útiles de pesaje, dinero fraccionado).
- Resultado: "Probable consumo (sanción LO 4/2015 art. 36.16)" o "Indicios de tráfico (art. 368 CP)", siempre con fuente y aviso de que la calificación final es judicial.
- Contenido curado por el cofundador agente y revisado con un segundo agente o jurista antes de publicarse.
- **Orientador (implementado):** el agente introduce la cantidad aprehendida y, en las sustancias
  cuyo umbral está en peso **puro** (cocaína, heroína, MDMA, anfetamina, metanfetamina), un campo
  opcional de **pureza (%)**; la app reduce a la riqueza real antes de comparar y avisa de forma
  destacada de que hay que reducir a pureza para no sobre-marcar "tráfico" con droga de baja riqueza
  (peso bruto para cannabis y hachís). Requisito de la revisión jurídica. Todo orientativo, con pie
  fijo de que la calificación es judicial.

## 4.8 Plantillas y documentos (PDF)

- Tipos v1: boletín de denuncia administrativa, acta de inmovilización, acta de intervención de sustancias, diligencia de identificación, acta de lectura de derechos, acta de información de derechos a la víctima.
- Generación: a partir de una consulta ("Generar documento") o desde la sección Plantillas. La app rellena norma, artículo, texto legal, importe; el agente rellena fecha, hora, lugar (con PK autocompletado desde el mapa), vehículo/persona (**solo en el dispositivo, nunca se envía**) y observaciones.
- Salida: PDF generado en el dispositivo. Opciones: guardar, compartir (AirDrop, WhatsApp), enviar a mi correo (se envía desde el dispositivo por el cliente de correo o desde el servidor **sin** almacenar el PDF).
- Encabezado: por defecto neutro (cuerpo y unidad en texto). El escudo oficial solo si el agente lo sube desde su galería; la app no distribuye escudos.
- Las plantillas se editan en el panel de administración (Markdown con variables `{{fecha}}`, `{{lugar}}`, `{{articulo}}`).

## 4.9 Cuadrante y horas

- Patrones de turno predefinidos por cuerpo y editables: p. ej. Guardia Civil "6 servicios + saliente + 3 libres", Policía Nacional "7x7", locales según municipio. El usuario elige fecha de inicio del ciclo y la app proyecta el calendario.
- Tipos de servicio: mañana, tarde, noche, saliente, libre, vacaciones, asuntos propios, baja, curso, otros. Horas por tipo configurables.
- Edición: cambiar un día, añadir cambios de servicio, notas, alarma (notificación local antes del servicio).
- Resumen mensual y anual: horas totales, nocturnas, festivas (calendario de festivos nacional + autonómico + local), fines de semana, exceso sobre jornada de referencia (configurable, p. ej. 37,5 h/semana).
- Exportar mes a PDF/CSV.
- Almacenamiento local con copia en servidor cifrada por usuario (para no perderlo al cambiar de móvil). El cuadrante no contiene datos de terceros.

## 4.10 Mapa y punto kilométrico

- Mapa (MapLibre + teselas OpenStreetMap o Mapbox) con posición GPS.
- Cálculo de PK: base de datos de la Red de Carreteras del Estado y redes autonómicas (fuentes: Ministerio de Transportes, catálogos autonómicos) con geometría y PK de referencia; se proyecta la posición sobre el tramo más cercano y se interpola el PK. Sentido según orientación del movimiento.
- Salida: "A-7, PK 623+450, sentido Murcia". Botón copiar y botón "usar en documento".
- Fallback: si no hay red de PK en la zona, muestra calle y número (geocodificación inversa).
- Funciona offline con el mapa descargado de la provincia del usuario.

## 4.11 Lectura de derechos y textos multilingües

- Art. 520 LECrim (detenido) y art. 771 (víctima) en: español, inglés, francés, alemán, árabe, rumano, chino, ruso, portugués, italiano. Traducciones revisadas (usar las oficiales del Ministerio del Interior cuando existan).
- Fase 2: audio pregrabado por idioma.

> **Estado v1 (ADR-019).** Implementada la **lectura de derechos del detenido (art. 520.2
> LECrim)** en `apps/mobile/src/features/derechos`: selector de idioma por chips (háptico), texto
> grande legible pensado para leer en voz alta (RTL en árabe), botón "Copiar derechos" y aviso
> fijo orientativo. Se enlaza desde el árbol de detención de la ficha (§4.6, cuando procede/puede
> proceder) y desde el hub "Más". Idiomas de esta entrega: **español, inglés, francés, alemán,
> árabe y rumano**; el español va `revisado: true` (literal del art. 520.2) y el resto
> `revisado: false` pendientes de cotejo con la versión oficial del Ministerio del Interior
> (chino, ruso, portugués e italiano quedan como TODO). El texto es un **recurso bundlado** (no
> viaja en el paquete SQLite) para estar SIEMPRE disponible offline. El art. **771** (víctima) y
> el audio por idioma quedan para una iteración posterior.

## 4.12 Vehículos

- Sección con enlaces curados: verificación de documentación, vehículos extranjeros, bases de datos de robados, guías de falsedad documental. Contenido heredado y depurado de SPPLB (son enlaces públicos), reorganizado por país y tipo de documento.

## 4.13 Novedades normativas

- Cada actualización de contenido genera una entrada: qué norma, qué artículos, resumen en dos líneas, fecha. Notificación push opcional.

> **Estado v1 (ADR-018).** La pantalla "Novedades" (`/novedades`) lista las entradas `Novedad`
> del paquete (resumen + fecha + versión) y, al abrirla, las marca como vistas (marca local en
> `user.db`). El Inicio muestra un aviso (badge) si hay novedades posteriores a esa marca. La
> notificación push y el `Novedad` con norma/artículos concretos + enlace quedan para cuando el
> pipeline los emita (depende del diff por artículo, §8.2).

## 4.14 Panel de administración (web, solo para los dos fundadores)

- Editar infracciones, sinónimos, consecuencias, plantillas, sustancias.
- Ejecutar y revisar el pipeline de ingesta del BOE (ver sección 8).
- Publicar una versión de contenido (`content_version`) que las apps descargan.
- Ver métricas agregadas anónimas: consultas más frecuentes por cuerpo, búsquedas sin resultado (oro para el diccionario de sinónimos).
- Cuando exista backend: **triar el feedback** (sugerencias y reportes) que llegue de la app por correo/sync, por tipo y cuerpo (ver 4.15).

## 4.15 Sugerencias y reportes (feedback del socio)

- Acceso desde **Más → "Sugerencias / reportar problema"**. Pensado sobre todo para la beta.
- Formulario: selector de **tipo** (sugerencia · error de contenido · error técnico) + campo de texto.
- Lista **"Mis aportaciones"** con su estado (Pendiente / Enviado). Se pueden borrar del dispositivo.
- Botón **"Enviar a los fundadores"**: compone un correo (o la hoja de compartir) **desde el propio dispositivo** con el texto pendiente y lo marca como enviado. No hay servidor de por medio (ADR-011).
- **Local-first, offline y anónimo** (ADR-011): el feedback se guarda solo en el dispositivo (`expo-sqlite`, base local del usuario). Nunca se envía a un servidor de forma automática. Aviso **fijo** de privacidad: *"No incluyas matrículas, nombres, DNI ni datos de intervenciones."* Sin capturas automáticas.
- **Gancho "reportar error"** desde una ficha (cuando exista): la pantalla admite contexto opcional (`tipo`, `articuloId`, `infraccionId`, `pantalla`) que prerrellena el formulario.
- Pendiente cuando exista Supabase: sincronización en segundo plano y vista de triaje en el panel admin.

# 5. Diseño y experiencia

- Navegación inferior con 5 pestañas: **Inicio · Normativa · Plantillas · Cuadrante · Mapa**. Ajustes en la cabecera.
- Inicio centrado en el buscador. Un solo toque para copiar el texto del boletín.
- Modo oscuro por defecto de noche (sigue el sistema). Contraste alto, tipografía mínima 16 pt, botones grandes (uso con una mano, en el coche, con guantes).
- Colores por gravedad: leve (amarillo), grave (naranja), muy grave / delito (rojo). Nunca solo color: siempre texto.
- Sin publicidad, sin banners, sin pop-ups de valoración en la calle (pedir valoración solo desde Ajustes tras 30 días de uso).
- Accesibilidad: soporte de tamaño de fuente del sistema, VoiceOver/TalkBack en las fichas.
- Los tres bocetos de la propuesta previa (inicio, ficha de resultado, cuadrante) son la referencia visual inicial.

# 6. Modelo de datos

Notación simplificada. Claves foráneas implícitas por nombre (`*_id`). Todo el contenido normativo es **versionado**: nunca se borra, se marca `valid_to`.

## 6.1 Contenido normativo (servidor → dispositivo, solo lectura)

```
Norma          id, codigo (ej. "RGC"), titulo, tipo (ley|reglamento|ordenanza|codificado),
               ambito (estatal|autonomico|municipal), territorio_id?, url_boe, fecha_consolidacion

Articulo       id, norma_id, numero ("5", "5 bis", "único"), titulo?, texto (markdown), orden,
               valid_from, valid_to?, hash
               (granularidad = ARTÍCULO completo, no apartado: el BOE entrega bloques por
                artículo y trocear por apartado desde texto libre no es fiable; el apartado
                queda localizable dentro de `texto`. Decidido en Fase 1 al construir el pipeline.)

Infraccion     id, articulo_id, codigo_dgt?, titulo_corto, gravedad (leve|grave|muy_grave|delito),
               tipo (administrativa|penal), importe_eur?, importe_reducido_eur?, puntos?,
               texto_boletin (con variantes), competencia (json: cuerpos, via),
               ambito, territorio_id?, valid_from, valid_to?

Sinonimo       id, infraccion_id|articulo_id, termino, peso

Consecuencia   id, infraccion_id|articulo_id, tipo (detencion|inmovilizacion|deposito|decomiso|
               retirada_permiso|identificacion), regla (json: condiciones), texto_corto, fuente (artículo)

ReglaDetencion delito_articulo_id, gravedad_cp (leve|menos_grave|grave), flagrancia_aplica,
               texto_resultado, fuentes[] (LECrim 490/492/493/495)

Sustancia      id, nombre, aliases[], umbral_consumo_diario_mg, umbral_acopio_g, notas_pureza,
               indicadores_trafico[], fuentes[]

Plantilla      id, tipo, titulo, cuerpo_aplicable[], markdown_con_variables, version

TextoDerechos  id, articulo ("520"|"771"), idioma, texto, audio_url?

Territorio     id, tipo (ccaa|provincia|municipio), nombre, padre_id, codigo_ine

Festivo        id, fecha, ambito (nacional|ccaa|municipio), territorio_id?, nombre

TramoCarretera id, via ("A-7"), territorio_id, geometria (LineString), pk_inicio, pk_fin, sentido_ref

ContentVersion id, version (semver), fecha, changelog (json), url_paquete, hash
Novedad        id, content_version_id, norma_id, articulos[], resumen, fecha
```

## 6.2 Datos de usuario

```
Usuario        id, email, password_hash, email_verificado, created_at,
               cuerpo, ccaa_id, provincia_id, municipio_id?, unidad?, preferencias (json)

Suscripcion    usuario_id, plataforma (ios|android), estado, producto_id, renueva_el,
               original_transaction_id  (sincronizado desde RevenueCat/webhooks)

Favorito       usuario_id, infraccion_id|articulo_id, created_at
Cuadrante      usuario_id, patron (json), inicio_ciclo, jornada_ref_h, blob_cifrado (días, notas, alarmas)
EventoUso      anonimo: cuerpo, ccaa, tipo (busqueda|consulta|copia|pdf), termino_normalizado, fecha
               (sin usuario_id; sirve para "más usadas" y para detectar búsquedas sin resultado)
               ESTADO v1 (ADR-018): en el dispositivo se materializa como contadores LOCALES y
               anónimos: `busqueda_sin_resultado` (por término) y `uso_infraccion` (consultas +
               copias por infracción, base de "TUS más usadas"). Sin usuario_id ni id de
               dispositivo; nada sale del teléfono. El agregado "más usadas EN TU CUERPO" (entre
               usuarios) llegará con el backend.

Feedback       id, created_at, tipo (sugerencia|error_contenido|error_tecnico), texto,
               contexto (pantalla?, articulo_id?, infraccion_id?), app_version, platform (ios|android),
               cuerpo?, territorio? (contexto de segmento NO identificativo), enviado (bool)
               LOCAL-FIRST y ANÓNIMO (ADR-011): vive solo en el dispositivo (expo-sqlite, base
               local del usuario). No se envía a servidor de forma automática; "enviar a los
               fundadores" usa el compositor de correo/Share del propio dispositivo y marca
               `enviado`. Sync futura con Supabase deja el terreno preparado (campo `enviado`).
```

**Nunca en servidor**: matrículas, nombres, DNI, contenido de los PDF generados, notas personales sobre intervenciones. El `texto` de `Feedback` lo escribe el socio y NO debe contener datos de terceros: la UI lo avisa de forma fija y no captura nada automáticamente.

# 7. Arquitectura y stack

Elección orientada a un equipo de una persona técnica, publicación en App Store y Google Play, y funcionamiento offline.

## 7.1 App móvil

- **React Native con Expo (SDK actual) + TypeScript**. Un solo código para iOS y Android; Expo EAS para compilar y publicar.
- Navegación: Expo Router.
- Estado: Zustand (o React Query para lo remoto + Zustand para lo local).
- Base de datos local: **expo-sqlite** con FTS5 para el buscador. El contenido normativo se descarga como un paquete SQLite firmado por `ContentVersion` y se sustituye atómicamente.
- Búsqueda: FTS5 + tabla de sinónimos + normalización (unidecode) + ranking propio. Sin dependencia de red.
- PDF: `expo-print` (HTML → PDF) o `react-native-pdf-lib`. Generación en dispositivo.
- Mapas: MapLibre GL (react-native-maplibre) con teselas descargables por provincia.
- Voz: `expo-speech-recognition` o módulo nativo equivalente.
- Notificaciones locales: `expo-notifications` (alarmas del cuadrante).
- Suscripciones: **RevenueCat** sobre StoreKit 2 y Google Play Billing. Entitlement único `pro`.
- Autenticación: JWT + refresh token de larga duración; opción Sign in with Apple / Google.
- Cifrado del cuadrante en servidor: clave derivada de la contraseña del usuario (o clave aleatoria guardada en Keychain/Keystore y respaldada en el servidor cifrada). Objetivo: que vosotros no podáis leer el cuadrante de nadie.

## 7.2 Backend

- **Node.js + TypeScript** (NestJS o Fastify) o **Supabase** (Postgres + Auth + Storage + Edge Functions) si se quiere ir más rápido. Recomendación: Supabase para auth, base de datos y storage; funciones para webhooks de RevenueCat y envío de correo.
- Base de datos: PostgreSQL. Extensión `postgis` para los tramos de carretera.
- Almacenamiento: paquetes de contenido (SQLite) en un bucket con CDN.
- Correo transaccional: Resend o Postmark (verificación, recuperación, envío de PDF).
- Panel de administración: Next.js (o Refine/AdminJS sobre Postgres).
- Pipeline de contenido: scripts en Python o TypeScript ejecutados por GitHub Actions o cron.

## 7.3 Infraestructura

- Repositorio único (monorepo con pnpm workspaces): `apps/mobile`, `apps/admin`, `packages/content-pipeline`, `packages/shared` (tipos, esquemas Zod).
- Entornos: `dev`, `beta` (TestFlight / Play internal testing), `prod`.
- CI: lint, tests, build de contenido, EAS build en tags.
- Observabilidad: Sentry en app y backend. Sin analítica de terceros que identifique usuarios.

## 7.4 Seguridad

- Contraseñas con Argon2id. Rate limit en login y registro.
- Verificación de firma del paquete de contenido antes de instalarlo.
- Datos en reposo cifrados en el dispositivo (SQLite con SQLCipher si se guardan notas).
- Borrado de cuenta completo en <30 días y accesible desde la app (requisito de Apple y Google).

# 8. Contenido y pipeline de actualización

Este es el corazón del producto. Si falla, la app es una más.

## 8.1 Fuentes

- **BOE**: API de datos abiertos (`https://www.boe.es/datosabiertos/`) y legislación consolidada (`https://www.boe.es/buscar/act.php?id=BOE-A-...`). Permite descargar el texto consolidado en XML por norma y detectar modificaciones.
- **DGT**: codificado de infracciones (documento público, formato PDF/Excel). Se parsea y se cruza con los artículos del RGC/RGV/LSV.
- **Boletines autonómicos** (BORM, BOC, DOGC, BOJA, etc.): sin API uniforme; empezar con descarga y parseo por comunidad, priorizando las de los usuarios beta.
- **Ordenanzas municipales**: descarga manual/semiautomática desde la web del ayuntamiento; carga por el panel.
- **Carreteras y PK**: catálogo de la Red de Carreteras del Estado (Ministerio de Transportes) y catálogos autonómicos/insulares (en Canarias, cabildos). Procesar a `TramoCarretera` con PostGIS.
- **Festivos**: calendario laboral estatal (BOE), autonómico y local (boletines).
- **Umbrales de sustancias**: tabla del Instituto Nacional de Toxicología y acuerdos del Tribunal Supremo. Carga manual con fuente.

## 8.2 Flujo

1. Job semanal (o diario) consulta BOE por cada norma del catálogo y compara hash del texto consolidado.
2. Si cambia: descarga XML, lo convierte a artículos (Markdown), genera diff por artículo, crea entradas `Articulo` nuevas con `valid_from` y cierra las antiguas con `valid_to`.
3. Marca infracciones afectadas como "requiere revisión" en el panel.
4. El cofundador agente revisa en el panel (texto de boletín, importe, sinónimos) y aprueba.
5. Se genera un nuevo `ContentVersion`: paquete SQLite + changelog + `Novedad`. Se firma y se publica.
6. Las apps comprueban versión al abrir (y en segundo plano); descargan el delta o el paquete completo.

## 8.3 Calidad del contenido

- Toda `Infraccion` publicada requiere: artículo enlazado, importe, gravedad, texto de boletín, al menos dos sinónimos, fuente y fecha.
- Test automático: importes dentro de los rangos legales por gravedad (LSV art. 80: leve hasta 100 €, grave 200 €, muy grave 500 €; LO 4/2015 art. 39: leves 100-600, graves 601-30.000, muy graves 30.001-600.000).
- Revisión a dos ojos para consecuencias y sustancias.
- Registro público en la app de la fecha de actualización de cada norma.

# 9. Pagos y tiendas

- Suscripción única `pro_mensual` (2,99 €) y `pro_anual` (24,99 €), con 14 días de prueba gratuita (configurable en las tiendas).
- **Cobro a través de la tienda** (StoreKit 2 / Play Billing) vía RevenueCat. Webhooks de RevenueCat actualizan `Suscripcion`.
- Comisiones actuales en la UE (términos de Apple vigentes desde el 1/10/2026): 15 % para pequeñas empresas y para suscripciones tras el primer año usando el pago de Apple; opciones con pago alternativo o enlace externo al 10-20 %. Google Play: 15 % en suscripciones. Con 2,99 € quedan ≈ 2,54 € por usuario y mes. Revisar términos antes de lanzar.
- Beta: usuarios invitados reciben acceso `pro` sin pasar por la tienda mediante una lista de correos autorizados (`beta_allowlist`) o códigos promocionales de las propias tiendas (más limpio para revisión de Apple).
- Cuenta obligatoria para restaurar compras entre dispositivos. Botón "Restaurar compras".
- Sin suscripción activa: la app sigue mostrando el cuadrante propio y el buscador en modo limitado (p. ej. 5 consultas/día) para que no pierdan sus datos y para que vuelvan.
- Requisitos de tienda: política de privacidad pública, borrado de cuenta en la app, sin contenido que pueda interpretarse como oficial de un cuerpo (no usar escudos ni nombres oficiales en el nombre o icono de la app).

# 10. Privacidad y legal

- **RGPD**: responsable del tratamiento = vosotros (persona física o sociedad). Registro de actividades, política de privacidad, base jurídica (ejecución de contrato). Datos tratados: correo, contraseña, cuerpo/territorio, estado de suscripción, cuadrante cifrado. Encargados: proveedor de hosting, RevenueCat, proveedor de correo, Sentry.
- No se tratan datos de terceros. Los campos de personas/vehículos de las plantillas existen solo en memoria/dispositivo y se avisa de ello en la interfaz.
- Eventos de uso anónimos, sin identificador de usuario ni de dispositivo persistente.
- **Avisos en la app**: la información es de apoyo y no sustituye la valoración del agente ni la calificación judicial; se indican fuentes y fecha de actualización en cada ficha.
- **Propiedad intelectual**: los textos legales son de dominio público (art. 13 LPI). El codificado de la DGT es documento público. Los textos de boletín, sinónimos y plantillas son vuestros.
- **Marcas y escudos**: no usar escudos ni denominaciones oficiales de los cuerpos en nombre, icono, capturas ni plantillas por defecto.
- Forma jurídica: valorar constituir sociedad limitada antes de cobrar; acuerdo de socios entre los dos cofundadores (reparto, dedicación, propiedad del código y del contenido).

# 11. Plan por fases

El objetivo del cofundador técnico es hacerlo todo; el orden importa para que los usuarios beta tengan algo útil pronto y el feedback llegue mientras se construye lo demás.

## Fase 0 · Cimientos (semanas 1-2)
- Monorepo, Expo app vacía con navegación, backend/Supabase, auth con sesión persistente, onboarding con perfil, CI, Sentry.
- Modelo de datos y esquemas compartidos.
- Panel de administración mínimo (CRUD de infracciones y sinónimos).

## Fase 1 · Consulta de tráfico (semanas 3-6)
- Pipeline BOE para LSV, RGC, RGV. Parseo del codificado DGT.
- Paquete de contenido SQLite, descarga y verificación en app.
- Buscador FTS5 + sinónimos + ranking. Ficha completa con texto de boletín y consecuencias de tráfico.
- Favoritos, "más usadas", novedades.
- **Entrega beta 1** a 10-20 compañeros. Recoger búsquedas sin resultado.

## Fase 2 · Resto de normativa y capa penal (semanas 7-10)
- LO 4/2015, Código Penal + LECrim con reglas de detención, extranjería, menores, armas, animales, transportes, VMP.
- Tabla de sustancias. Lectura de derechos multilingüe. Sección Vehículos.
- **Entrega beta 2**.

## Fase 3 · Cuadrante y horas (semanas 9-12, en paralelo)
- Patrones por cuerpo, calendario, edición, alarmas, festivos, resumen mensual, exportación, copia cifrada.

## Fase 4 · Plantillas y PDF, mapa y PK (semanas 12-16)
- Motor de plantillas, generación de PDF, envío por correo.
- Mapa offline, proyección de PK, integración con plantillas.

## Fase 5 · Lanzamiento (semanas 16-20)
- RevenueCat, suscripciones, pantalla de pago, allowlist beta → prueba gratuita.
- Landing, política de privacidad, borrado de cuenta, fichas de tienda, revisión de Apple/Google.
- Normativa autonómica y ordenanzas de los municipios de los primeros usuarios.

## Fase 6 · Después del lanzamiento
- Estimación de complementos salariales por cuerpo (empezar por Guardia Civil).
- Audio de lectura de derechos. Más comunidades y municipios. Widgets de turno. Apple Watch/Wear (opcional).

# 12. Backlog inicial (épicas y tareas)

Formato: `[E-xx] Épica` → tareas. Pensado para convertirse en issues.

**[E-01] Infraestructura**
- Crear monorepo pnpm con `apps/mobile`, `apps/admin`, `packages/shared`, `packages/content-pipeline`.
- Configurar Expo + TypeScript estricto + ESLint + Prettier + Jest.
- Configurar Supabase (o Postgres + NestJS): esquema inicial con migraciones.
- CI en GitHub Actions: lint, test, build de contenido.
- Sentry en app y backend.

**[E-02] Cuenta y onboarding**
- Registro/login por correo, verificación, recuperación.
- Sign in with Apple y Google.
- Perfil: cuerpo, CCAA, provincia, municipio, unidad. Catálogo `Territorio` desde INE.
- Sesión persistente con refresh token; logout; borrado de cuenta.

**[E-03] Contenido: pipeline BOE**
- Cliente de la API del BOE; descarga de XML consolidado por norma.
- Parser XML → artículos Markdown, con detección de cambios por hash y diff.
- Parser del codificado DGT (PDF/Excel) → `Infraccion` enlazadas a artículos.
- Generador de paquete SQLite firmado + `ContentVersion` + `Novedad`.
- Tests de rangos de importes y de integridad.

**[E-04] Buscador y fichas**
- SQLite + FTS5 en app; instalación atómica del paquete.
- Normalización y sinónimos; ranking; filtros; búsqueda por artículo y código.
- Ficha de infracción con copiar texto, favoritos, generar documento, compartir.
- Dictado por voz.
- Evento anónimo de uso y "búsquedas sin resultado".

**[E-05] Normativa y consecuencias**
- Navegador de normas y artículos; marcadores; indicador de cambios.
- Motor de reglas de consecuencias (tráfico) y de detención (LECrim + art. 33 CP).
- Tabla de sustancias.
- Lectura de derechos multilingüe.
- Sección Vehículos.

**[E-06] Cuadrante**
- Modelo de patrón y proyección de calendario.
- Vista mensual, edición de días, cambios, notas, alarmas.
- Festivos por territorio.
- Resumen de horas; exportación; copia cifrada en servidor.

**[E-07] Plantillas y PDF**
- Motor de plantillas Markdown + variables.
- Formulario de campos del agente; generación de PDF en dispositivo.
- Compartir / guardar / enviar a mi correo.
- Gestión de escudo opcional subido por el usuario.

**[E-08] Mapa y PK**
- Ingesta de tramos de carretera a PostGIS; exportación por provincia a la app.
- Mapa offline; proyección de posición a tramo; cálculo de PK y sentido.
- Geocodificación inversa como fallback. Botón copiar / usar en documento.

**[E-09] Pagos**
- RevenueCat, productos, entitlement, pantalla de pago, restaurar compras.
- Webhooks → `Suscripcion`. Allowlist beta. Modo limitado sin suscripción.

**[E-10] Panel de administración**
- CRUD de infracciones, sinónimos, consecuencias, plantillas, sustancias, textos de derechos.
- Cola de revisión de cambios normativos; publicación de `ContentVersion`.
- Métricas agregadas.

**[E-11] Lanzamiento**
- Landing + política de privacidad + condiciones.
- Fichas de tienda (sin escudos oficiales), capturas, textos.
- Pruebas en dispositivos reales, modo oscuro, accesibilidad.
- Revisión de Apple/Google; plan de respuesta a rechazos.

# 13. Riesgos y decisiones abiertas

| Riesgo | Mitigación |
|---|---|
| El contenido se desactualiza (el fallo de SPPLB) | Pipeline automático + cola de revisión + fecha visible en cada ficha |
| Error en importe o consecuencia | Tests de rangos, revisión a dos ojos, fuente en cada línea, canal de "reportar error" en la ficha |
| Responsabilidad por orientación sobre detención | Reglas con artículo, aviso fijo, sin lenguaje imperativo ("procede" vs. "detén") |
| Uso de escudos o apariencia oficial | Prohibido por diseño; encabezados neutros |
| Rechazo en revisión de Apple | Borrado de cuenta, política de privacidad, restaurar compras, sin allowlist opaca (usar códigos promocionales) |
| Datos de PK incompletos en algunas zonas | Fallback a dirección; priorizar provincias de los usuarios beta |
| Sobrecarga del cofundador técnico | Orden de fases; cada fase entrega algo usable; no empezar Fase 4 sin cerrar Fase 1 |
| Dependencia del cofundador agente para contenido | Panel sencillo; marcar "requiere revisión" en vez de bloquear; segundo revisor |

Decisiones pendientes: nombre e icono; Supabase vs. backend propio; MapLibre/OSM vs. Mapbox; sociedad y acuerdo de socios; qué comunidades y municipios entran en la beta.

# Apéndice A · CLAUDE.md para la raíz del repositorio

```markdown
# Agente — app para Fuerzas y Cuerpos de Seguridad (España)

Lee `docs/ESPECIFICACION.md` antes de cualquier tarea. Es la fuente de verdad.

## Stack
- Monorepo pnpm: apps/mobile (Expo + React Native + TypeScript), apps/admin (Next.js),
  packages/shared (tipos y esquemas Zod), packages/content-pipeline (ingesta BOE/DGT).
- Backend: Supabase (Postgres + Auth + Storage + Edge Functions). PostGIS para carreteras.
- Búsqueda offline: expo-sqlite con FTS5. Contenido distribuido como paquete SQLite firmado.
- Pagos: RevenueCat (StoreKit 2 / Play Billing). Entitlement `pro`.
- PDF en dispositivo: expo-print. Mapas: MapLibre con teselas offline.

## Reglas no negociables
- Nunca enviar al servidor datos de terceros (matrículas, nombres, DNI, PDFs generados).
- Toda infracción/consecuencia lleva artículo fuente y fecha de actualización.
- La app funciona sin red para consulta, cuadrante y plantillas.
- No usar escudos ni denominaciones oficiales de los cuerpos en UI, icono o plantillas por defecto.
- TypeScript estricto. Tests para el buscador, el motor de reglas y el cálculo de horas.
- Español en la UI y en los comentarios de dominio; inglés en identificadores de código.

## Flujo de trabajo
- Sigue el orden de fases de la sección 11 de la especificación.
- Cada tarea: rama, tests, PR con descripción en español.
- Si la especificación no cubre algo, propón la decisión en el PR y actualiza docs/ESPECIFICACION.md.

## Comandos
- `pnpm install` · `pnpm -F mobile start` · `pnpm -F admin dev` · `pnpm test` · `pnpm content:build`
```

# Apéndice B · Guion de la primera sesión con Claude Code

1. Copiar este documento a `docs/ESPECIFICACION.md` y el Apéndice A a `CLAUDE.md`.
2. Prompt inicial: "Lee docs/ESPECIFICACION.md y CLAUDE.md. Crea el monorepo descrito en [E-01] con la app Expo vacía, el paquete shared con los tipos del modelo de datos (sección 6) como esquemas Zod, y las migraciones iniciales de Postgres. No implementes funcionalidades todavía. Al terminar, resume las decisiones tomadas y lo que falta."
3. Siguiente: "[E-02] Cuenta y onboarding completo según sección 4.1."
4. Siguiente: "[E-03] Pipeline BOE para LSV, RGC y RGV. Empieza por el cliente del BOE y el parser XML → artículos; muéstrame el resultado con el RGC antes de seguir."
5. A partir de ahí, una épica por sesión, siempre pidiendo tests y actualización de la especificación cuando cambie algo.
