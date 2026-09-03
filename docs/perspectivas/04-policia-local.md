# Perspectiva: Policía Local (simulada)

> **Aviso.** Este documento es una **simulación de perspectiva** de un agente de Policía Local español con ~12 años de servicio (municipios grandes y pequeños). No es una persona real ni una fuente jurídica. Sirve para estresar el diseño de "Agente" con conocimiento de dominio. **Todo dato legal concreto (artículos, importes, puntos) va marcado como "a verificar"** y debe validarse contra el BOE consolidado, el codificado DGT y la ordenanza municipal correspondiente antes de publicarse en la app.

---

## 0. Quién soy y cómo trabajo (contexto)

Soy Policía Local. Mi día es 80% **tráfico urbano y convivencia**, muy poco Código Penal (eso lo suelo derivar o coordinar con Nacional/Guardia Civil, aunque en pueblo pequeño me como de todo). Trabajo a pie, en coche patrulla y a veces en moto. Muchas intervenciones las resuelvo **de pie en la calle, con el móvil en la mano, a veces sin cobertura** (garajes, polígonos, zonas rurales del término municipal). La consulta tiene que ser de **3 segundos o me olvido de ella y tiro de memoria** (que es como se cometen los errores).

Lo que de verdad me quema del trabajo administrativo: **redactar el boletín/denuncia**. La intervención dura 2 minutos; escribir el hecho denunciado "bien redactado" para que no me lo tumbe el instructor por defecto de forma me lleva 10. Ahí es donde una app me ahorra vida.

Diferencia clave con Guardia Civil/Nacional: **yo vivo de la ordenanza municipal**. Y esa es la pesadilla de cualquier app: cada pueblo tiene la suya, con sus importes y sus artículos. Ver sección 3.

---

## 1. Qué consulto REALMENTE (top infracciones/situaciones por frecuencia)

Ordenado por frecuencia real de calle, no por gravedad. **Marco fuente** de cada bloque; los datos concretos van "a verificar".

### Tráfico urbano (el pan de cada día) — fuente: LSV / RGC / RGV / codificado DGT

1. **Estacionamiento indebido** (zona azul/verde sin ticket, doble fila, sobre acera, paso de peatones, vado, carga/descarga fuera de horario, plaza PMR sin tarjeta). Es EL 40% de mi jornada.
2. **Uso del móvil conduciendo** ("móvil en la mano"). Muy frecuente, y ahora con más puntos. (a verificar: 6 puntos)
3. **No usar cinturón / casco** (conductor, pasajero, menor sin SRI/sillita).
4. **Semáforo en rojo** / no respetar señal de stop o ceda.
5. **ITV caducada** ("sin ITV").
6. **Seguro obligatorio no vigente** ("sin seguro") — con la duda constante: ¿inmoviliza y grúa o no?
7. **Faro/luces** (fundido, roto, no encender de noche, antiniebla mal usado).
8. **Circular en sentido contrario / calle peatonal / zona restringida (APR/ZBE)**.
9. **Exceso de velocidad urbano** (radar municipal o control, límites 20/30/50).
10. **Alcoholemia** (control preventivo y tras accidente/síntomas): tasa administrativa vs. penal, negativa a la prueba.
11. **Drogas al volante** (test salival, negativa).
12. **Documentación**: sin permiso de conducir, permiso no vigente/retirado, sin permiso de circulación, sin poder acreditar identidad.
13. **Transporte de menores** sin sistema de retención adecuado.
14. **Ruido del vehículo / escape modificado / tubarro**.
15. **Carga mal estibada / vehículo que ensucia la vía**.

### VMP y bicicletas (creciente, mucha confusión) — fuente: RGC reforma VMP / ordenanza de movilidad municipal

16. **Patinete eléctrico (VMP) por acera** / por zona peatonal.
17. **VMP con dos personas**, sin luces de noche, con auriculares, uso del móvil.
18. **VMP menor de edad** (según ordenanza local).
19. **VMP alcohol/drogas** (¿aplica tasa? ¿sanción?).
20. **VMP sin seguro / sin certificado de circulación** (según entre en vigor, a verificar).
21. **Bici por acera / sin luces / dos en una plaza**.

### Ordenanzas municipales y convivencia (aquí no me sirve ninguna app actual) — fuente: ordenanza municipal de cada pueblo

22. **Ruido/molestias vecinales**: fiestas, música alta, botellón, ladridos.
23. **Botellón / consumo de alcohol en vía pública**.
24. **Consumo/tenencia de drogas en vía pública** (LO 4/2015 art. 36.16, a verificar) — frontera con ordenanza.
25. **Animales**: perro suelto sin correa, sin bozal (PPP), no recoger excrementos, no censado/sin microchip, tenencia de PPP sin licencia.
26. **Venta ambulante ilegal / top manta**.
27. **Ocupación de vía pública**: terrazas sin licencia o excedidas, veladores, mercancía en la acera, contenedores de obra, andamios sin autorización.
28. **Suciedad y residuos**: tirar basura fuera de hora/contenedor, escombros, orinar en la vía, grafitis/pintadas.
29. **Miccionar / defecar en vía pública / actos contra el decoro**.
30. **Quema de rastrojos / hogueras no autorizadas / barbacoas** (según ordenanza y época).
31. **Publicidad / carteles no autorizados**.
32. **Uso indebido de mobiliario urbano, zonas verdes, fuentes, juegos infantiles por adultos**.

### Seguridad ciudadana y penal ligero — fuente: LO 4/2015 / Código Penal / LECrim

33. **Identificación de personas** (art. 16 LO 4/2015, a verificar) y negativa a identificarse.
34. **Tenencia de armas prohibidas** (navaja, defensa eléctrica, spray) — administrativo vs. penal.
35. **Riñas/desórdenes, faltas de respeto a la autoridad, resistencia/desobediencia**.
36. **Hurto en comercio** (¿denuncia o detención? umbral, reincidencia).
37. **Violencia de género/doméstica** (primer interviniente, medidas, coordinación).
38. **Daños, pintadas, mobiliario**.
39. **Menores**: consumo alcohol/tabaco, absentismo, actos vandálicos (LO 5/2000).
40. **Personas desorientadas, sanitario/psiquiátrico, personas sin hogar** (no es sanción, pero consulto protocolo).

---

## 2. Qué necesito ver AL INSTANTE en cada consulta

Para casi todas, el mismo patrón. Lo que quiero en pantalla, en este orden, sin scroll para lo esencial:

1. **Artículo y norma exactos** (ej. "RGC art. 18.1" / "Ordenanza Movilidad Murcia art. 25"). (a verificar)
2. **Importe** y **importe con pronto pago** (reducción 50% tráfico, art. 94 LSV, a verificar). En ordenanza, el importe según su cuadro.
3. **Puntos** (si detrae) — solo tráfico estatal.
4. **Gravedad** (leve/grave/muy grave) con color + texto.
5. **¿Grúa / inmovilización / depósito?** SÍ o NO, y **por qué artículo**. Esto es lo que más dudo en la calle y lo que peor cubren las apps. Ej.: sin seguro → inmoviliza (art. 104 LSV, a verificar); alcoholemia positiva → inmoviliza si supera tasa y no hay conductor sustituto.
6. **Texto para el boletín / hecho denunciado**, redactado y **copiable de un toque**, con **variantes** (delantero/trasero, izq/dcho, acera/calzada, diurno/nocturno). ESTO es el oro.
7. **¿Procede detención / traslado / solo denuncia?** (penal ligero).
8. **Competencia**: ¿puedo denunciar yo como Local o es de otro cuerpo/organismo? (Ej.: interurbana, transportes, algunas de tráfico las tramita el ayuntamiento y otras Jefatura de Tráfico.)

### Concretando por situaciones típicas de Local:

- **Zona azul sin ticket**: importe ordenanza + si se anula pagando en parquímetro (muchos pueblos: si paga el excedido en 1h se anula) + texto boletín + ¿procede grúa por reincidencia? (a verificar según ordenanza).
- **Doble fila / paso de peatones / vado / PMR**: importe, **si procede grúa** (obstaculización real es la clave), texto con la circunstancia exacta.
- **Sin seguro**: importe (a verificar, ~601-3000 muy grave), **inmovilización + depósito**, aviso "si contrata seguro en el acto y lo acredita puede continuar" (a verificar).
- **Móvil**: importe + puntos (a verificar) + texto "manipulando el teléfono móvil sujetándolo con la mano".
- **VMP en acera**: **qué norma aplica** (RGC vs ordenanza local — el gran lío), importe, y si el municipio no lo tiene en ordenanza, qué margen hay.
- **Alcoholemia**: **tabla de tasas** (general/noveles/profesionales, mg/l aire y g/l sangre), **frontera administrativa/penal (0,60 mg/l → art. 379 CP, a verificar)**, negativa (art. 383 CP), procedimiento (2ª prueba, derecho a análisis de sangre), inmovilización del vehículo.
- **Perro suelto / sin recoger excremento / PPP sin bozal**: importe ordenanza + Ley 7/2023 bienestar animal + Ley 50/1999 PPP, y **microchip/censo** (a verificar).
- **Botellón/ruido**: ¿ordenanza o LO 4/2015?, importe, si procede decomiso del alcohol, identificación.

---

## 3. El problema de las ORDENANZAS MUNICIPALES (lo más importante para que la app me sirva)

**Este es el punto que decide si la app vale para un Local o no.** Cada uno de los ~8.100 municipios tiene sus propias ordenanzas (movilidad/circulación, convivencia, animales, residuos, terrazas, ruido, VMP...). No hay dos iguales: cambian artículos, importes, si hay grúa, horarios de carga/descarga, límites de zona azul, edad mínima de VMP, etc. SPPLB y las demás apps **ignoran esto por completo** y solo te dan normativa estatal, que es exactamente lo que a un Local menos le hace falta el día a día.

### Modelo que propongo

**a) El territorio del usuario manda.** Al elegir municipio en el perfil, la app carga un **paquete de ordenanza de ese municipio** (si existe) además de la estatal. Todo lo municipal se etiqueta visualmente como "ORDENANZA [Municipio]" con color/badge distinto de lo estatal.

**b) Modelo de datos por capas** (encaja con el `Territorio` y `ambito` ya previstos en la spec, sección 6):
   - Capa estatal (LSV/RGC/RGV/DGT): igual para todos.
   - Capa autonómica.
   - **Capa municipal**: `Norma(tipo=ordenanza, ambito=municipal, territorio_id=municipio)` → `Articulo` → `Infraccion(territorio_id=municipio)`. Ya está soportado en el esquema; el reto es **poblarlo**.

**c) Priorización realista del contenido (no se puede con 8.100 de golpe):**
   1. Municipios de los usuarios beta primero (como dice la spec).
   2. Luego los grandes por población (más agentes = más ingresos).
   3. Peticiones: cada usuario puede **"solicitar mi ordenanza"** y ver una cola. Municipio con N solicitudes = se prioriza. Esto también es marketing (el agente se lo dice a sus compañeros para "subir votos").

**d) Plantilla de ordenanza tipo (acelerador).** Muchas ordenanzas municipales están calcadas de modelos de la FEMP o de la diputación provincial. Proponer una **"ordenanza base" por tipo** (movilidad, convivencia, animales, residuos, terrazas) y luego solo **parametrizar diferencias** por municipio (importes, artículos, horarios, si hay grúa). Reduce muchísimo el trabajo de carga.

**e) Si no está mi ordenanza:** que la app lo diga claro — "Tu municipio aún no tiene ordenanzas cargadas" — y ofrezca:
   - La normativa estatal aplicable de todos modos.
   - Un **campo de importe/artículo editable manual** que el agente rellena una vez y **guarda como plantilla personal local** (en dispositivo). Así, aunque no tengamos su ordenanza, la app le sirve porque él la teclea una vez y reutiliza el texto. Esto es un enganche brutal.
   - Botón "subir PDF de mi ordenanza" al panel para que la carguemos.

**f) Verificación y responsabilidad.** Las ordenanzas se modifican en pleno y no hay API. Marcar cada ordenanza con **fecha de aprobación/última modificación y enlace al BOP/web municipal** (a verificar por municipio). Aviso: "Verifica la vigencia; las ordenanzas cambian sin aviso centralizado."

**g) Colaboración de los propios agentes (fase posterior, con control).** Los Locales de un municipio conocen su ordenanza mejor que nadie. Un flujo "sugerir corrección" que va a la cola de revisión del panel. Nunca publicar sin revisión a dos ojos.

**Resumen: la app que resuelva la ordenanza municipal de forma decente no tiene competencia. Es la única razón de peso por la que un Local pagaría, porque lo estatal ya lo tiene gratis en cualquier sitio.**

---

## 4. El cuadrante en la Policía Local

### Cómo son nuestros turnos (realidad, variada)

- No hay un patrón único como en Guardia Civil. **Cada plantilla/municipio tiene el suyo**, negociado en el convenio/acuerdo local.
- Patrones típicos que veo:
  - **Mañana / Tarde / Noche** rotativos (M-T-N) con ciclos tipo "varios días de cada y luego libranzas".
  - **Quintos turnos** / "ruedas" de 5, 6 o 7 grupos.
  - **7x7** o **6-3** en algunos sitios.
  - Turnos partidos en pueblos pequeños (mañana y tarde el mismo agente).
  - **Refuerzos de fin de semana y fiestas** (fiestas patronales = semana infernal, todo el mundo trabaja).
- **Nocturnidad, festividad y "domingos y festivos"** se pagan como complementos y hay que contarlos bien: es dinero real.
- **Festivos LOCALES**: cada municipio tiene 2 festivos locales propios además de nacionales y autonómicos. **Esto casi ninguna app lo mete bien**, y para un Local es justo lo que más trabaja (las fiestas del pueblo).
- **Cambios de turno entre compañeros** ("te cambio el sábado por el martes"): constantes. El cuadrante tiene que dejar registrar el cambio sin romper el cómputo.
- **Servicios extraordinarios / horas extra / servicios de gala** (procesiones, fútbol, mercadillo, elecciones): se apuntan aparte y muchas veces se pagan o se compensan.

### Qué falla en las apps actuales (SPPLB y otras)

1. **No guardan la configuración** — el fallo estrella de SPPLB. Metes tu ciclo y a la siguiente actualización o cambio de móvil lo pierdes. Inaceptable, es lo que más quema.
2. **Patrones rígidos** pensados para Guardia Civil/Nacional, no dejan definir el ciclo raro de tu plantilla.
3. **No meten los festivos locales**, solo nacionales/autonómicos → el cómputo de festivos sale mal → el dinero sale mal.
4. **No distinguen tipos de hora** (nocturna real 22:00-06:00, festiva, exceso) para el cálculo de complementos.
5. **Cambios de turno** no contemplados o rompen el conteo.
6. **No exportan** para pasárselo al jefe o cotejarlo con la nómina.

### Qué necesito del cuadrante

- Definir **mi ciclo raro** (editor flexible, no solo presets) y proyectarlo.
- **Festivos locales editables** (elijo mi municipio y añado sus 2 fiestas; que las precargue si las tenemos).
- Contador por tipo: totales, **nocturnas**, **festivas/domingos**, fines de semana, **exceso sobre jornada de convenio**.
- Registrar **cambios de turno** y **servicios extra** sin romper nada.
- **Que NO se pierda jamás** (copia cifrada en servidor, como dice la spec — esto es diferencial si SPPLB lo pierde).
- Exportar mes a PDF/CSV para cuadrar con la nómina. **Cotejar horas con nómina es una necesidad real y sentida.**
- Alarma antes del servicio.

---

## 5. ¿Pagaría 2,99 €/mes dejando SPPLB (gratis)?

### Qué me haría PAGAR (por orden de peso)

1. **Mi ordenanza municipal dentro** (o la posibilidad de teclearla yo y reutilizarla). Nadie lo ofrece. Esto solo ya vale 2,99 €.
2. **Texto de boletín redactado y copiable con variantes.** Me ahorra 10 min por denuncia. Si redacto 5 al día, es media hora diaria. Baratísimo.
3. **Que el contenido esté REALMENTE actualizado** y me avise de cambios. La confianza de "esto está al día" vale dinero; SPPLB me ha fallado con normas sin actualizar.
4. **Cuadrante que no se pierde y calcula bien las horas/complementos** (y coteja con nómina).
5. **"Grúa sí/no" y "inmovilización sí/no" con el artículo** — me quita la duda en la calle delante del ciudadano.
6. **Buscador que entiende como hablo** ("tubarro", "sin papeles del coche", "borracho al volante") y me lleva a la ficha.
7. **Tabla de alcoholemia y de sustancias** clara con la frontera administrativa/penal.
8. **PDF de plantilla listo** (acta de inmovilización, denuncia) rellenado con el texto legal.

### Qué me haría NO pagar (o cancelar)

1. **Que sea "lo mismo que SPPLB pero de pago".** Si solo me das el artículo estatal sin importe, sin grúa, sin texto y sin mi ordenanza, no pago nada.
2. **Un error en un importe o en "procede detención".** Un fallo y pierdo la confianza para siempre y lo cuento en el vestuario (el boca a boca funciona en las dos direcciones).
3. **Que el cuadrante siga perdiendo datos** (el pecado original de SPPLB).
4. **Que necesite cobertura para consultar.** En la calle muchas veces no tengo. Si no es offline de verdad, fuera.
5. **Suscripción con fricción**: que me pida mil datos, que la beta caduque de golpe, que no restaure la compra al cambiar de móvil.
6. **Publicidad, pop-ups pidiendo valoración en mitad de un servicio.**
7. **Sensación de "app oficial" falsa** o cosas que me metan en un lío disciplinario (usar escudos, textos que parezcan doctrina oficial). Prefiero que sea claramente "herramienta de apoyo".
8. **Precio percibido**: 2,99/mes está bien; si sube a 5-6 me lo pienso. Muchos preferimos **pago anual** o incluso pago único. Ojo: hay agentes muy de "todo gratis" — a esos no los captas, no pierdas el tiempo.

---

## 6. Situaciones de calle: dónde me salva y dónde estorba

### Me SALVA

- **Parado junto a un vehículo, ciudadano delante, discutiendo si hay o no infracción**: saco importe + artículo + texto y zanjo la discusión con fundamento. Autoridad reforzada.
- **Duda de grúa/inmovilización**: decidir bien en 5 segundos evita tanto pasarme como quedarme corto.
- **Alcoholemia en el arcén de madrugada**: tabla de tasas y procedimiento a un toque; no me juego el atestado por un olvido.
- **Redacción del boletín en oficina**: copio el hecho denunciado y solo pongo fecha/hora/lugar/matrícula. De 10 min a 2.
- **VMP/patinetes**: el marco cambia y la gente lo desconoce; tener claro qué aplica me evita broncas.
- **Consulta rápida antes de bajar del coche** ("¿esto cómo era?") sin que el ciudadano me vea dudar.
- **Saber mi cuadrante/nocturnas** sin llamar a nadie.

### Me ESTORBA

- **En intervención tensa** (riña, violencia, detención): no voy a mirar el móvil. La seguridad primero. La app es para el "antes" (preparar) o el "después" (redactar), no para el momento caliente.
- **Si me obliga a teclear mucho** en la calle: con guantes, de noche, lloviendo, con una mano. Todo tiene que ser toque grande y copiar.
- **Si tarda o pide login/cobertura** justo cuando la necesito.
- **Notificaciones/pop-ups** en mitad de un servicio.
- **Si me hace mirar la pantalla en vez de a la persona** (riesgo de seguridad). Por eso la **búsqueda por voz** y los **favoritos/accesos rápidos** son clave: menos pantalla, más calle.

---

## 7. Diccionario semántico: "lo que digo" → término técnico

Esto es **oro para el buscador** (spec 3.2/4.3). Así hablamos de verdad. Marco entre paréntesis la norma probable (a verificar).

| Lo que dice el agente (calle) | Término / concepto técnico |
|---|---|
| "faro roto" / "luz fundida" / "sin luces" | Alumbrado deficiente / defecto de alumbrado (RGV/RGC) |
| "sin ITV" / "ITV pasada" / "ITV caducada" | Inspección Técnica de Vehículos no vigente/desfavorable (RGV) |
| "sin seguro" / "no tiene seguro" / "sin papeles del seguro" | Seguro obligatorio de vehículos no concertado/no vigente (LRCSCVM / LSV) |
| "el móvil" / "con el móvil en la mano" / "mirando el WhatsApp" | Uso manual de dispositivo de telefonía / móvil conduciendo (RGC) |
| "sin cinturón" | No uso de cinturón de seguridad (RGC) |
| "sin sillita" / "el niño suelto" | Sistema de retención infantil no utilizado/inadecuado (RGC) |
| "sin casco" | No uso de casco de protección (RGC) |
| "se saltó el rojo" / "se comió el semáforo" | No respetar la luz roja del semáforo (RGC) |
| "se saltó el stop" | No respetar la señal de stop / detención obligatoria (RGC) |
| "doble fila" | Estacionamiento en doble fila / obstaculización (RGC / ordenanza) |
| "en el paso de cebra" | Estacionamiento sobre paso de peatones (RGC / ordenanza) |
| "encima de la acera" / "montado en la acera" | Estacionamiento sobre acera/zona peatonal (ordenanza) |
| "en el vado" | Estacionamiento en vado / reserva de entrada de vehículos (ordenanza) |
| "en el de minusválidos" / "plaza de discapacitados" | Estacionamiento en plaza reservada PMR sin tarjeta (ordenanza / LSV) |
| "sin ticket" / "la zona azul" / "el parquímetro" | Estacionamiento regulado (ORA/zona azul) sin título habilitante (ordenanza) |
| "en carga y descarga" | Estacionamiento en zona de carga y descarga fuera de condiciones (ordenanza) |
| "borracho al volante" / "dio positivo" / "control de alcohol" | Conducción con tasa de alcohol superior a la permitida (LSV art. 77 / CP art. 379) |
| "sopló y dio negativo pero olía" | Prueba de alcoholemia / síntomas evidentes |
| "no quiso soplar" / "se negó" | Negativa a las pruebas de alcohol/drogas (CP art. 383 / LSV) |
| "dio positivo en drogas" / "test de saliva" | Presencia de drogas en organismo conduciendo (LSV / CP art. 379) |
| "iba sin carné" / "sin puntos" / "carné retirado" | Conducir sin permiso / sin vigencia / con pérdida de vigencia (CP art. 384 / LSV) |
| "el coche no es suyo y no tiene papeles" | Carencia de permiso de circulación / documentación del vehículo |
| "el patinete" / "el patín" | Vehículo de Movilidad Personal (VMP) (RGC) |
| "patinete por la acera" | Circulación de VMP por acera/zona peatonal (RGC / ordenanza) |
| "dos en el patinete" | VMP con más ocupantes de los permitidos (RGC / ordenanza) |
| "el patinete iba a saco" / "corriendo" | VMP excediendo velocidad permitida (RGC / ordenanza) |
| "el tubarro" / "escape ruidoso" / "hace mucho ruido el coche" | Emisión de ruido superior / escape no homologado (RGV / ordenanza ruido) |
| "botellón" | Consumo de bebidas alcohólicas en vía pública (ordenanza / LO 4/2015) |
| "meando en la calle" | Micción en vía pública / actos contra la salubridad-decoro (ordenanza) |
| "el perro suelto" | Animal sin correa/control en vía pública (ordenanza / Ley 7/2023) |
| "no recoge la caca" | No retirada de deyecciones caninas (ordenanza) |
| "perro peligroso sin bozal" | PPP sin bozal/licencia (Ley 50/1999 / RD 287/2002) |
| "el perro sin chip" | Animal no identificado/censado (Ley 7/2023 / ordenanza) |
| "top manta" / "vendiendo en el suelo" | Venta ambulante no autorizada (ordenanza) |
| "la terraza se ha comido la acera" | Ocupación de vía pública / veladores excedidos sin licencia (ordenanza) |
| "el contenedor de obra" / "el andamio" | Ocupación de vía pública por obras sin autorización (ordenanza) |
| "tirando basura fuera de hora" | Depósito de residuos fuera de horario/lugar (ordenanza residuos) |
| "una navaja" / "la defensa" / "el spray" | Tenencia de arma prohibida (LO 4/2015 art. 36 / CP) |
| "no se quiere identificar" | Negativa a identificarse ante agente (LO 4/2015 art. 16/36) |
| "le faltó al respeto" / "me insultó" | Falta de respeto/consideración a la autoridad (LO 4/2015 art. 37) / desobediencia |
| "un hurto en el super" / "mangó" | Hurto (CP art. 234) — valorar cuantía/reincidencia |
| "un tirón" / "con violencia" | Robo con violencia/intimidación (CP art. 242) |
| "una pelea" / "riña" | Alteración del orden / desórdenes públicos (LO 4/2015 / CP) |
| "malos tratos en casa" / "violencia de género" | Violencia de género/doméstica (LO 1/2004 / CP) |
| "quemando rastrojos" / "una hoguera" | Quema no autorizada (ordenanza / normativa incendios) |
| "pintadas" / "grafiti" | Deslucimiento/daños en bienes (ordenanza / CP art. 263) |
| "el camión gordo" / "sin tacógrafo" | Transporte: ROTT / tacógrafo (LOTT) — a menudo NO es competencia Local |

(Ampliar con las **búsquedas sin resultado** que el panel recoja: son el mejor combustible para el diccionario, como dice la spec.)

---

## 8. Errores y carencias de SPPLB que más me molestan

1. **El cuadrante que se pierde / no guarda configuración.** El más grave. Versiones enteras "para arreglar el cuadrante" y sigue fallando.
2. **iOS sin actualizar desde 2023** → normas desactualizadas. Riesgo de denunciar mal.
3. **Te da el artículo pero NO el importe, ni puntos, ni grúa, ni texto de boletín.** Me deja a medias justo en lo que necesito.
4. **Cero ordenanzas municipales.** Para un Local es la mitad del trabajo y no está.
5. **Interfaz de 2017**, cuadrícula de iconos, nada personalizado por cuerpo. Un Local ve un montón de cosas de Guardia Civil que no usa.
6. **Buscador tonto**: si no escribes el término exacto, no encuentra. No entiende sinónimos ni erratas.
7. **No hay "búsqueda por voz" útil** para la calle.
8. **Sin avisos de cambios normativos** ("esto cambió el X").
9. **No distingue mi territorio**: mezcla estatal, autonómico y municipal sin filtrar por mi municipio.
10. **Sin exportar el cuadrante** para cotejar con nómina.

---

## 9. Funciones que NADIE ofrece y que pagaría por tener

1. **Ordenanza de MI municipio integrada** (o editable/reutilizable por mí). El diferencial absoluto.
2. **Generador de "hecho denunciado" con variantes** que copio y pego, adaptado a mi ordenanza. Ahorro de tiempo brutal.
3. **Decisor "grúa/inmovilización sí-no" con el artículo** y la causa concreta.
4. **Cuadrante que calcula complementos** (nocturnidad, festividad, exceso) y **coteja con la nómina** — que me diga "este mes te deberían pagar X nocturnas y Y festivas". Nadie lo hace bien y es dinero.
5. **Festivos locales precargados por municipio** en el cuadrante.
6. **"Mi ordenanza personal"**: si no tenemos su pueblo, que teclee sus importes/artículos una vez y los reutilice offline. Enganche.
7. **Modo voz manos-libres** real para consultar sin mirar la pantalla (seguridad).
8. **Checklist/protocolo por intervención** (alcoholemia paso a paso, accidente, violencia de género como primer interviniente, hallazgo de menor) — no para sustituir criterio, sino para no saltarme un paso que tumbe el atestado.
9. **Botón "reportar error/actualización de mi ordenanza"** que llega a revisión — el agente se siente copropietario del contenido.
10. **Comparador rápido administrativo vs penal** (alcoholemia, hurto, drogas, armas): la frontera exacta con su umbral.

---

## Resumen de necesidades TOP (para el equipo de producto)

- **Prioridad 1 absoluta: resolver la ORDENANZA MUNICIPAL** (por capas + editable por el agente si su pueblo no está). Es la única razón de peso para que un Local pague, porque lo estatal ya lo tiene gratis.
- **Prioridad 2: texto de boletín/hecho denunciado copiable con variantes** — ahorra ~10 min por denuncia.
- **Prioridad 3: en la ficha, siempre "grúa/inmovilización SÍ/NO + artículo"**, importe con pronto pago y puntos.
- **Prioridad 4: cuadrante que NO se pierda, con festivos LOCALES y cálculo de nocturnas/festivas + export para cotejar nómina.** Es el talón de Aquiles de SPPLB.
- **Offline real y búsqueda por voz**: en la calle no siempre hay cobertura ni una mano libre.
- **Cero tolerancia a errores de importe/consecuencia y a "app oficial" falsa** (escudos): un fallo mata la confianza en el vestuario.

---

*Documento simulado para diseño de producto. Validar toda referencia legal marcada "a verificar" antes de publicar contenido en la app.*
