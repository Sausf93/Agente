---
title: "Agente — Plan de Marketing y Go-To-Market"
subtitle: "Perspectiva 03 · Captación, precios y lanzamiento"
date: "2026-09-03"
lang: es
---

# 0. Resumen ejecutivo (léelo si no lees nada más)

- **Mercado**: ~233.000-250.000 agentes en España (≈75.000 Policía Nacional, ≈74.000 Guardia Civil, ≈65.000 Policía Local, resto autonómicas). Objetivo de negocio: **2.500 suscriptores = ~1 % del colectivo**.
- **Competencia real**: SPPLB "Policías y Bomberos", gratis, ~10.000+ descargas Android, ~3.600 descargas/mes, iOS sin actualizar desde 2023, cuadrante roto. **No hay competidor de pago serio**. El mercado está sin tocar: la mayoría no usa ninguna app.
- **Posicionamiento**: no vendemos "más contenido que SPPLB"; vendemos **tiempo y seguridad jurídica en la calle**. "Gratis" no compite con "resuelto en 3 segundos y siempre al día".
- **Precio recomendado**: **anual 24,99 € como opción por defecto y destacada** + mensual 2,99 € + **prueba gratis de 14 días** + **freemium permanente de 5 consultas/día** como red de retención. El freemium NO es el gancho de venta; es el muro que devuelve al usuario.
- **Captación priorizada** (por coste de adquisición y velocidad de boca a boca): **1) el cofundador agente y su cuartel/comisaría → 2) grupos de WhatsApp/Telegram de compañeros → 3) referidos → 4) academias de oposiciones → 5) sindicatos/asociaciones**. Los sindicatos son el mayor altavoz pero también el mayor riesgo político: se trabajan al final y con cuidado.
- **North-star metric**: **suscriptores activos de pago (MRR)**. Métrica de producto que la predice: **nº de consultas copiadas/semana por usuario activo** (uso real en la calle).

---

# 1. Posicionamiento y propuesta de valor

## 1.1 La frase (propuesta de valor)

> **"El boletín correcto, con su artículo e importe, en 3 segundos y sin cobertura. Siempre al día."**

Alternativa de campaña, más emocional:

> **"Deja de dudar en el arcén. Agente te da el artículo, el importe y el texto listo para copiar."**

## 1.2 ¿Por qué pagar 2,99 € si SPPLB es gratis?

El error sería competir en "cantidad de contenido". Se compite en **coste del error y coste del tiempo**, que para un agente son altísimos:

| Lo que da SPPLB (gratis) | Lo que da Agente (2,99 €) | Valor para el agente |
|---|---|---|
| El artículo | Artículo **+ importe + puntos + consecuencia (grúa/detención) + texto del boletín** | Menos tiempo en el arcén, menos errores rebatibles |
| Contenido desactualizado (iOS 2023) | **Normativa siempre al día con fecha y fuente visibles** | No sancionar con una norma derogada |
| Cuadrante que pierde datos | **Cuadrante fiable con contador de horas y nocturnas** | Control de sus complementos y su tiempo |
| Cuadrícula de iconos de 2017 | **Buscador que entiende "faro roto" o "sin ITV"** | Encuentra a la primera bajo presión |
| Nada personalizado | **Adaptado a su cuerpo y territorio** | Solo ve lo que le aplica |

**Anclaje de precio**: 2,99 €/mes = **menos que un café a la semana**, o **~36 €/año frente a una sola denuncia mal puesta** que le cuesta una alegación, una reclamación o una amonestación. El argumento no es "es barato"; es "es ridículamente barato para lo que te juegas".

**Regla de oro de mensajería**: nunca decir "mejor que SPPLB" en público (SPPLB es de un sindicato; atacarlo genera enemigos). Decir: "la herramienta de trabajo que te faltaba".

---

# 2. Segmentación: a quién atacar primero

Prioridad = **densidad de compañeros que se hablan a diario × dolor × facilidad de boca a boca**. No es el cuerpo más grande, es el más **conectado y homogéneo**.

## 2.1 Orden de ataque recomendado

**1º — El cuerpo y territorio del cofundador agente (beachhead).**
Da igual cuál sea sobre el papel; es donde hay confianza, feedback y el primer boca a boca gratis. Todo empieza aquí. Objetivo: dominar una comisaría/cuartel/plantilla completa antes de escalar.

**2º — Guardia Civil de Tráfico (interurbano).**
Por qué primero entre los grandes:
- **Dolor máximo con el producto**: tráfico es donde el "artículo + importe + puntos + grúa + PK + boletín" ahorra más tiempo real en cada intervención. El PK y el mapa son diferenciales que nadie más tiene.
- **Colectivo muy homogéneo y jerarquizado**: destacamentos y subsectores con grupos de WhatsApp internos densos. Un guardia convencido arrastra a su patrulla.
- **Rural/carretera = mala cobertura**: el "funciona offline" pesa más aquí que en ciudad.

**3º — Policía Local (por municipios, no en masa).**
Ventaja: es el colectivo de origen de SPPLB, ya educado en usar una app. Estrategia **municipio a municipio**: conquistar plantillas enteras (30-150 agentes) donde todos comparten las mismas ordenanzas. Un municipio "caído" es una referencia vendible al siguiente.

**4º — Policía Nacional (Seguridad Ciudadana).**
Colectivo enorme (~75.000) pero más urbano (offline pesa menos) y con casuística más penal que de importes. Entra cuando la capa penal (LECrim, sustancias, extranjería) esté pulida en beta 2.

**5º — Policías autonómicas (Ertzaintza, Mossos, Foral, Canaria).**
Requieren normativa autonómica propia. Nicho valioso y muy endogámico (excelente boca a boca) pero caro de contenido. Se abren de una en una cuando haya tracción y recursos.

## 2.2 Territorio inicial

Coincidir con lo que ya prioriza la especificación para contenido autonómico/ordenanzas: **Murcia y Canarias primero**. La beta debe concentrarse geográficamente para que el boca a boca sea físico (misma plantilla, mismo bar de después del turno), no disperso.

---

# 3. Estrategia de precios

## 3.1 Configuración recomendada (concreta)

| Producto | Precio | Neto tras comisión (~15 %) | Notas |
|---|---|---|---|
| **Anual `pro_anual`** (destacado por defecto) | **24,99 €/año** | ~21,24 €/año (≈1,77 €/mes) | Ahorro del 30 % vs mensual. Es el plan que se empuja. |
| Mensual `pro_mensual` | 2,99 €/mes | ~2,54 €/mes | Para el indeciso; puerta de entrada. |
| **Prueba gratis** | 14 días | — | Igual en ambos planes. Sin cobro hasta el día 15. |
| **Freemium permanente** | 0 € | — | **5 consultas/día** + cuadrante propio siempre accesible. |

**Por qué esta config:**

- **Anual por defecto**: en un nicho profesional de alta retención y bajo churn, el anual (a) sube el LTV, (b) mata el churn mensual del "lo pruebo un mes y lo quito", (c) da caja por adelantado. Con descuento del 30 % el usuario percibe ganga y nosotros aseguramos 12 meses. **Objetivo: 60-70 % de las altas en anual.**
- **Mensual como ancla psicológica**: mostrar 2,99 €/mes al lado de "24,99 €/año" hace que el anual parezca obvio (2,08 €/mes efectivos). El mensual existe para que el anual brille y para captar al desconfiado.
- **14 días de prueba, no 7**: el uso es episódico (se usa cuando hay intervención). 7 días pueden no cubrir dos o tres turnos con casos reales. 14 días garantizan varios "momentos ajá" copiando un boletín en la calle.
- **Freemium de 5 consultas/día = retención, no adquisición**: no lo anunciamos como "versión gratis buena". Es el **colchón que impide desinstalar** cuando cae la suscripción (conserva su cuadrante y sigue enganchado) y el **muro que convierte**: quien de verdad lo usa en un turno intenso choca con el límite el mismo día. 5/día es suficiente para el usuario casual e insuficiente para el profesional en activo (el que paga).

## 3.2 Justificación numérica (objetivo 2.500 subs)

Ingreso neto por suscriptor y mes según mezcla:

- Escenario **solo mensual**: 2.500 × 2,54 € = **6.350 €/mes**.
- Escenario **65 % anual / 35 % mensual** (recomendado):
  - Anual: 1.625 subs × 21,24 €/año ÷ 12 = **~2.876 €/mes** equivalentes.
  - Mensual: 875 subs × 2,54 € = **~2.223 €/mes**.
  - **Total ≈ 5.099 €/mes** de MRR reconocido... pero con **~34.500 € de caja anual adelantada** de los anuales y churn drásticamente menor. A 12 meses el escenario con anuales rinde más por menor pérdida de usuarios.

> El objetivo de la especificación (6.000-7.000 €/mes) se alcanza con **~2.500-2.750 suscriptores** según mezcla. Con predominio anual, apuntar a **2.600 subs** para cubrir el objetivo con colchón.

## 3.3 Embudo necesario para llegar a 2.500 (12 meses)

Supuestos realistas para nicho profesional de alta intención:

| Etapa | Tasa | Volumen necesario |
|---|---|---|
| Descargas | — | **~35.000-45.000** descargas acumuladas |
| Descarga → registro/onboarding completo | 55 % | ~22.000 |
| Registro → inicia prueba | 45 % | ~9.900 |
| Prueba → pago (conversión trial-to-paid) | **35 %** | ~3.460 |
| Retención a 12 meses | ~72 % | **~2.500 activos** |

La palanca más barata para mover esto no es más descargas (caras), sino subir **trial→paid** (contenido que resuelve de verdad + onboarding que lleva a copiar un boletín en el primer turno) y **retención** (fiabilidad del cuadrante, novedades normativas que recuerdan el valor).

---

# 4. Canales de captación (priorizados)

Criterio: **coste de adquisición (CAC) × velocidad de boca a boca × fit con el colectivo**. Este colectivo NO se capta con Meta Ads: se capta por **confianza entre compañeros**.

### Prioridad 1 — El cofundador agente como vendedor cero (CAC ≈ 0)
Es el activo más valioso. Plan: que "caiga" su unidad entera y las adyacentes. Demo en persona en el vestuario/cafetería, con su móvil, resolviendo un caso real de ese día. Objetivo: **primeros 200-400 usuarios sin gastar un euro**. De aquí salen los evangelistas.

### Prioridad 2 — Grupos de WhatsApp/Telegram de compañeros (CAC ≈ 0, viralidad alta)
Cada destacamento, comisaría y promoción tiene grupos privados. **No spamear**: el mensaje lo lanza un compañero de dentro (el cofundador o un evangelista), no una cuenta oficial. Formato que funciona: **captura de una ficha resolviendo un caso** + enlace de descarga + código de referido. Un buen grupo de 100 agentes puede convertir 20-40. Es el canal con mejor relación esfuerzo/resultado.

### Prioridad 3 — Programa de referidos (ver sección 7)
Convierte el boca a boca espontáneo en crecimiento medible. Cada usuario satisfecho trae 1-2 compañeros. Es el motor que multiplica las prioridades 1 y 2.

### Prioridad 4 — Academias de oposiciones y opositores (CAC bajo, siembra futura)
Miles de opositores a Policía Nacional, Guardia Civil y locales estudian la misma normativa. Acuerdos con **academias** (Campus Training, MasterD, academias locales, preparadores en YouTube/Instagram): la app como **herramienta de estudio de la normativa actualizada**. Se captan usuarios antes de ser agentes (menor sensibilidad al "hacer negocio"), y entran en el cuerpo ya siendo clientes. Modelo: descuento para alumnos o comisión al preparador por alta.

### Prioridad 5 — Sindicatos y asociaciones (mayor alcance, mayor riesgo)
JUPOL (~25.000 afiliados), SUP, CEP, UFP, EYA en Policía Nacional; JUCIL en Guardia Civil; asociaciones de policía local. Alcance gigante vía sus canales, boletines y grupos. **Pero**: SPPLB es de un sindicato, y aparecer aliado con uno enfrenta a los demás. **Estrategia: neutralidad**. No firmar exclusividad con ninguno; ofrecer a varios una **ventaja para afiliados** (código de descuento) de forma simétrica. Se trabajan **después** de tener tracción propia, para negociar desde la fuerza y sin depender de ellos. Nunca convertirlos en el canal principal.

### Canales de apoyo (no prioritarios)
- **Contenido en redes** (Instagram/TikTok/YouTube "casos de la calle resueltos con la app"): útil para ASO indirecto y para opositores. Bajo coste, resultado lento.
- **ASA (Apple Search Ads) sobre keywords propias y "SPPLB"**: barato y de alta intención; capta a quien ya busca una app policial. Único gasto en paid recomendado al principio.
- **Meta/Google Ads en frío**: **descartado** al inicio. CAC alto, mala segmentación de un colectivo que no se autoidentifica públicamente.

---

# 5. ASO (App Store Optimization)

**Restricción legal/tiendas (sección 9 y 10 de la especificación): prohibido usar escudos ni denominaciones oficiales** (no "Guardia Civil", no "Policía Nacional", no "Policía Local" como marca, ni escudos en icono/capturas).

## 5.1 Nombre de la app

- **Nombre de marca**: **"Agente"** funciona pero es genérico y difícil de posicionar/buscar. Recomendación: un nombre **corto + descriptor buscable** sin denominación oficial:
  - Opciones de marca: **"Agente"**, **"Patrulla"**, **"Boletín"**, **"Kilómetro Cero / KM0"**, **"Placa"** (evitar si roza lo oficial), **"Código"**.
  - **Nombre en tienda** (marca + subtítulo buscable): p. ej. **"Agente — Normativa y boletines para seguridad"** o **"Agente: consulta policial y cuadrante"**.
- El descriptor lleva las keywords que no podemos poner como marca ("seguridad", "normativa", "tráfico", "cuadrante") sin usar nombres de cuerpos.

## 5.2 Título y subtítulo (iOS) / título corto (Android)

- **Título (30 car.)**: `Agente: normativa y cuadrante`
- **Subtítulo (30 car., iOS)**: `Infracciones, boletín y turnos`
- **Descripción corta (80 car., Android)**: `Artículo, importe, puntos y texto del boletín. Buscador, cuadrante y PK.`

## 5.3 Keywords (campo de 100 car. iOS + reparto en descripción Android)

Priorizar términos que un agente/opositor busca, sin denominaciones oficiales:

`normativa,trafico,codigo circulacion,infraccion,denuncia,boletin,cuadrante,turnos,seguridad ciudadana,codigo penal,LECrim,extranjeria,armas,sustancias,oposicion,ITV,puntos,DGT,sanciones`

Notas ASO:
- Incluir **"SPPLB"** solo en descripción/ASA (no como marca) para capturar búsquedas de la competencia — verificar que no infringe marca registrada antes.
- **"oposición" y "opositor"** como keywords abren el segmento academias.
- Localización solo **es-ES** al inicio.

## 5.4 Capturas que convierten (orden en la ficha)

El 80 % decide en las **3 primeras capturas**. Cada una: un beneficio + texto grande arriba, mock del móvil abajo.

1. **"El boletín, listo para copiar"** — ficha de infracción completa (artículo + importe + puntos + botón Copiar). Es el "momento ajá".
2. **"Busca como hablas en la calle"** — buscador con "faro roto" → resultado. Muestra el diferencial semántico.
3. **"¿Grúa? ¿Detención? Te lo dice, con su artículo"** — chips de consecuencias con fuente.
4. **"Tu cuadrante, con horas y nocturnas"** — vista de cuadrante con contador (ataca el dolor #1 de SPPLB).
5. **"Siempre al día, con fecha y fuente"** — ficha con "Actualizado el dd/mm/aaaa".
6. **"Funciona sin cobertura"** — icono offline. Clave para tráfico/rural.
7. (Opcional) PK/mapa: **"A-7, PK 623+450, sentido Murcia. Copiado."**

Vídeo de preview (iOS): 15-20 s mostrando una búsqueda → ficha → copiar boletín. Un solo flujo, sin música épica.

---

# 6. De beta a lanzamiento: fabricar evangelistas

La beta gratuita no es una fase de pruebas técnicas; es la **fábrica de los primeros vendedores**.

**Principios:**
1. **Beta cerrada, geográficamente concentrada** (unidad del cofundador + 1-2 plantillas de Murcia/Canarias). 10-20 en beta 1, 50-100 en beta 2. Que se conozcan entre ellos: el boca a boca necesita proximidad física.
2. **Contrato explícito de la beta**: "acceso gratis a cambio de feedback y de traer a 2 compañeros cuando lo tengas dominado". Se deja claro **desde el día 1 que será de pago** (2,99 €) para no crear la expectativa de "gratis para siempre" — el mayor riesgo de una beta gratuita.
3. **Explotar las "búsquedas sin resultado"** (la especificación ya las registra): cada hueco que el agente busca y no encuentra se convierte en contenido en 48 h. El beta ve que **su** feedback cambia la app. Eso crea propiedad psicológica → evangelismo.
4. **Canal directo con los beta** (grupo de Telegram/WhatsApp con los fundadores). Trato de "estás construyendo esto con nosotros".
5. **Reconocimiento**: lista de "agentes fundadores" dentro de la app (Ajustes → Créditos) o insignia. Cuesta cero, fideliza.
6. **Conversión al lanzar**: a los beta se les da **suscripción anual gratis 3-6 meses** o precio de fundador de por vida (p. ej. 19,99 €/año congelado) **a cambio de su alta real en la tienda + 2 referidos**. Convierten de gratis a "cliente que además recluta".
7. **Prueba de fuego antes de abrir precios**: no se activa el cobro hasta que ≥40 % de los beta activos usen la app **en su turno cada semana** (no solo la abren). Si no la usan gratis, no la pagarán.

Transición beta→público: usar **códigos promocionales de las tiendas** para los beta (más limpio para la revisión de Apple que una allowlist opaca, como marca la especificación).

---

# 7. Programa de referidos (diseñado para el nicho)

El colectivo funciona por confianza entre pares: el referido es el canal natural, solo hay que instrumentarlo.

## 7.1 Mecánica recomendada — "Trae a un compañero"

- **Doble recompensa (both-sided)**: el que refiere y el que entra **ganan 1 mes gratis cada uno** cuando el referido completa su primer mes de pago (o su prueba + primer cobro).
- **Formato del enlace**: código personal + enlace profundo (deep link) que precarga la descarga. Compartible en 1 toque a WhatsApp/Telegram ("Te paso la app que uso en el turno: [enlace]").
- **Tope y anti-fraude**: máximo p. ej. 12 meses gratis acumulables por referidos (un año); validación por alta de pago real (no por descarga) para evitar cuentas falsas.

## 7.2 Palanca de nicho: "reto de plantilla / cuartel"

Gamificación colectiva que encaja con la cultura de cuerpo:
- Marcador (anónimo, por unidad/municipio, sin datos personales): cuando una plantilla supera X altas, **toda la plantilla desbloquea** un contenido premium (p. ej. pack de ordenanzas de su municipio, o 3 meses extra). Convierte el reclutamiento en orgullo de unidad.

## 7.3 Referido por academias/sindicatos
Código de descuento rastreable por academia/sindicato (p. ej. `JUCIL15`, `ACADEMIAX`) → descuento para el usuario + informe de altas para el socio. Sin exclusividad.

---

# 8. Riesgos de marketing y mitigación

| Riesgo | Descripción | Mitigación |
|---|---|---|
| **"Hacer negocio con lo público"** | Cobrar a servidores públicos por consultar leyes públicas puede leerse como aprovechamiento. | Mensaje: *pagas la herramienta, no la ley*. Las leyes son gratis en el BOE; lo que cobramos es el trabajo de tenerlas al día, con importe, consecuencia y boletín. Precio simbólico (café/semana). Transparencia total de fuentes y fechas. Cero publicidad. |
| **Guerra sindical (SPPLB y otros)** | SPPLB es de un sindicato; parecer "enemigo" de un sindicato enemista a su base. | **Neutralidad estricta**. No atacar a SPPLB nunca en público. No aliarse en exclusiva con ningún sindicato; ofrecer ventajas simétricas a todos. Marca sin color político. |
| **Percepción de app "oficial"** | Usar apariencia oficial infringe tiendas y genera rechazo institucional. | Cumplir la restricción: sin escudos ni nombres oficiales (sección 9/10). Encabezados neutros. Aviso claro de "herramienta privada de apoyo, no oficial". |
| **Responsabilidad por un error de contenido** | Un importe o "procede detención" equivocado daña la reputación en foros cerrados (donde una mala reseña corre volando). | Fuente y fecha en cada ficha, lenguaje no imperativo, botón "reportar error", revisión a dos ojos. En marketing, no prometer infalibilidad: prometer *actualización y fuente*. |
| **Rechazo del colectivo a "una app más"** | Escepticismo tras la decepción con SPPLB (cuadrante roto, iOS abandonado). | Demostrar, no prometer: capturas de casos reales, beta con gente de dentro, respuesta rápida al feedback. El cofundador agente como cara visible y creíble. |
| **Dependencia de un solo evangelista** | Todo el boca a boca inicial pende del cofundador. | Programa de referidos + insignias de "fundador" para distribuir el evangelismo entre 20-30 personas cuanto antes. |
| **Filtración/mala prensa** | Un medio podría titular "app cobra a policías por hacer su trabajo". | Nota de posicionamiento preparada, foco en privacidad (cero datos de terceros) y en que sustituye a herramientas peores. Precio bajo desactiva el ángulo "abuso". |

---

# 9. Métricas: north-star y funnel

## 9.1 North-star metric
**Suscriptores activos de pago (≈ MRR).** Es el objetivo de negocio (2.500) y no engaña.

**Métrica de producto que la predice** (leading indicator): **% de usuarios activos que copian ≥1 boletín/consulta por turno cada semana**. Si suben las copias en la calle, sube la retención y sube el pago. Es el "uso real", no la vanidad de descargas.

## 9.2 Funnel a vigilar (con objetivos)

| Métrica | Objetivo |
|---|---|
| Descargas/mes | ↑ sostenido; ~3.000-4.000/mes en cruise |
| Onboarding completado (elige cuerpo+territorio) | ≥ 55 % |
| Activación (1ª consulta copiada) en las primeras 24 h | ≥ 60 % |
| Inicio de prueba / registrados | ≥ 45 % |
| **Trial → paid** | **≥ 35 %** (palanca clave) |
| **Retención de pago a 12 meses** | **≥ 72 %** |
| Churn mensual (mensuales) | < 5 %/mes |
| % altas en plan anual | 60-70 % |
| **Coeficiente viral (k)** referidos | > 0,4 (cada usuario trae ~0,4 nuevos) |
| Búsquedas sin resultado / búsquedas | ↓ semana a semana (calidad de contenido) |
| NPS en beta y a 30 días | > 50 |

## 9.3 Contra-métricas (que no nos engañen)
- Descargas sin activación = humo. Vigilar activación, no descargas.
- Usuarios freemium que nunca chocan el límite = no son clientes; medir % que llega al muro de 5 consultas.

---

# 10. Calendario de lanzamiento a 90 días

Asume que el producto llega a la ventana de lanzamiento (Fases 1-2 de contenido listas, pagos integrados). El foco de estos 90 días es **GTM**, no desarrollo.

### Días 1-30 · Beta que fabrica evangelistas
- **Sem 1**: cerrar nombre, icono neutro y ficha de tienda borrador. Crear enlaces de referido y códigos promocionales. Montar grupo de Telegram de beta.
- **Sem 1-2**: onboarding presencial de la unidad del cofundador + 1 plantilla (Murcia o Canarias). Meta: **30-60 beta activos**.
- **Sem 2-4**: ciclo semanal de "búsquedas sin resultado → contenido nuevo en 48 h". Publicar cada mejora en el grupo ("esto lo pediste tú"). Definir con datos el corte de activación.
- **Fin de mes**: primeras 3 capturas ASO validadas con beta ("¿cuál te haría descargarla?"). Nota de privacidad y borrado de cuenta listos para revisión de tiendas.
- **KPI puerta**: ≥ 40 % de beta usan la app en su turno cada semana. Si no, no se abre precio: se itera contenido.

### Días 31-60 · Lanzamiento suave (soft launch)
- **Sem 5**: publicar en App Store y Google Play (es-ES). Activar prueba de 14 días + freemium 5/día. Convertir a los beta con oferta de fundador (a cambio de alta real + 2 referidos).
- **Sem 5-6**: activar **Apple Search Ads** sobre keywords propias y "app policial/SPPLB" (presupuesto de prueba bajo, p. ej. 300-500 €/mes). Medir CAC.
- **Sem 6-8**: ola de referidos y grupos de WhatsApp/Telegram de Guardia Civil de Tráfico (vía evangelistas, no cuentas oficiales). Lanzar "reto de plantilla/cuartel".
- **Sem 7-8**: primeros contactos **académicos** (2-3 academias/preparadores) con código rastreable.
- **KPI puerta**: trial→paid ≥ 30 % en cohortes reales; k > 0,3. Objetivo acumulado: **300-500 suscriptores de pago**.

### Días 61-90 · Escalado y sindicatos
- **Sem 9-10**: abrir **Policía Local municipio a municipio** con los municipios de los beta como caso de éxito. Sumar 2-3 municipios.
- **Sem 10-11**: iniciar conversaciones con **sindicatos/asociaciones** (JUCIL, SUP, CEP, UFP, EYA y locales) desde la tracción ya lograda; ofrecer ventaja simétrica para afiliados con código propio. Sin exclusividad.
- **Sem 11-12**: contenido en redes (casos reales resueltos) para alimentar ASO y opositores. Optimizar ASA por las keywords que mejor convierten.
- **Sem 12**: revisión de embudo completo, ajustar precio/mezcla anual, planificar apertura de la 3ª comunidad autónoma.
- **KPI puerta a 90 días**: **800-1.200 suscriptores de pago**, retención de la primera cohorte > 80 % mensual, canal de referidos aportando ≥ 30 % de altas. Trayectoria creíble hacia 2.500 en 8-12 meses.

---

# 11. Recomendaciones accionables (una página)

1. **Precio**: anual 24,99 € destacado + mensual 2,99 € + prueba 14 días + freemium 5/día. Empujar anual (meta 65 %).
2. **Beachhead**: unidad del cofundador → Guardia Civil de Tráfico → Policía Local por municipios. Territorio: Murcia y Canarias primero.
3. **Canal #1**: boca a boca instrumentado (cofundador + grupos de WhatsApp/Telegram + referidos). Nada de Meta Ads en frío. Único paid: Apple Search Ads.
4. **Mensaje**: "El boletín correcto en 3 segundos, siempre al día". Nunca atacar a SPPLB. "Pagas la herramienta, no la ley".
5. **Referidos**: 1 mes gratis para ambos por alta de pago + reto de plantilla.
6. **ASO**: nombre neutro sin escudos; capturas centradas en "copiar boletín", "buscar como en la calle", "cuadrante fiable".
7. **North-star**: suscriptores de pago; leading indicator: boletines copiados/turno/semana.
8. **Sindicatos**: al final, en neutralidad, nunca como canal principal.

---

## Fuentes
- Tamaño del colectivo: [La Moncloa — máximo histórico 156.463 agentes PN+GC](https://www.lamoncloa.gob.es/serviciosdeprensa/notasprensa/interior/paginas/2023/290623-espana-maximo-historico-agentes-policia.aspx); [Newtral — reparto de policías por CCAA](https://www.newtral.es/numero-policias-espana-total-policia-nacional-guardia-civil/20211220/); [Asesoría RC — número de policías en España](https://asesoriarc.es/numero-de-policias-en-espana/).
- Competencia SPPLB: [Ficha App Store SPPLB](https://apps.apple.com/es/app/spplb-polic%C3%ADas-y-bomberos/id1179685555); [Ficha Google Play SPPLB](https://play.google.com/store/apps/details?id=org.tojo.spplbdroidpolicial); [Estimación de descargas (appstor.io)](https://appstor.io/app/spplb-policias-y-bomberos); [SPPLB — web del sindicato](https://spplb.org/).
- Sindicatos: [SUP](https://sup.es/); [JUPOL](https://jupol.es/); [UFP](https://www.ufpol.org/); [eldiario.es — resultados electorales sindicales en Policía](https://www.eldiario.es/politica/jupol-reduce-mitad-apoyos-elecciones-policia-no-sindicato-mayoritario_1_10335638.html); [Público — radiografía de los sindicatos policiales y de la Guardia Civil](https://www.publico.es/politica/radiografia-sindicatos-policiales-guardia-civil-defensa-derechos-laborales-altavoz-ultra.html).
- Academias / opositores: [Campus Training — cuántos policías hay en España](https://www.campustraining.es/noticias/cuantos-policias-hay-en-espana/).
