# Perspectiva simulada · Agente del Cuerpo Nacional de Policía

> **Aviso de simulación.** Este documento adopta la perspectiva SIMULADA de un agente
> del Cuerpo Nacional de Policía (CNP) con experiencia en Seguridad Ciudadana urbana y
> Extranjería, con el único fin de estresar el diseño del producto "Agente" con
> conocimiento de dominio. No es una persona real ni asesoramiento jurídico. Todas las
> citas normativas están marcadas **(a verificar)** y deben ser validadas por un jurista
> o por la norma consolidada del BOE antes de publicarse en la app.

---

## 0. Resumen de la perspectiva

Trabajo a pie de calle: patrulla de Seguridad Ciudadana en zona urbana, con mucha carga
de Extranjería. Lo que necesito de una app no es un PDF de la ley: es que en 3 segundos,
de noche, con una mano y a veces sin cobertura, me diga **qué figura penal/administrativa
es**, **qué puedo hacer con la persona** (detener / identificar / solo denunciar) y **con
qué artículo lo sostengo** si mañana me lo preguntan en el atestado o en el juzgado.

La decisión más sensible y más diferencial es la **capa de detención**. Es donde SPPLB no
llega y donde una app útil me ahorra errores. Pero es también donde una app puede meterme
en un problema si me "ordena" detener. La regla de oro: **orienta, nunca ordena.**

---

## 1. Las 20-30 consultas/situaciones más frecuentes

Ordenadas por frecuencia real aproximada en Seguridad Ciudadana urbana + Extranjería.
Para cada una indico lo que necesito **al instante** y la **capa de detención**.

### Bloque A · Seguridad Ciudadana (LO 4/2015)

| # | Situación / consulta de calle | Qué necesito al instante | Capa detención (a verificar) |
|---|---|---|---|
| 1 | **Identificación que se niega / no colabora** | Art. 16 LO 4/2015: requisitos, traslado a dependencias máx. tiempo imprescindible (≤6 h), diligencia. Diferencia con detención. | No es detención. Si se resiste activamente → posible desobediencia/resistencia art. 556 CP → valorar detención. |
| 2 | **Desobediencia / resistencia a agente** | Art. 36.6 LO 4/2015 (infracción grave, faltar al respeto) vs. art. 556 CP (delito). Umbral. | Si delito 556 CP → identificación mínima; detención según riesgo (492 LECrim). |
| 3 | **Tenencia/consumo de drogas en vía pública** | Art. 36.16 LO 4/2015 (consumo/tenencia en lugar público) importe y decomiso. Distinguir de tráfico (368 CP). | Consumo = administrativo, **no detención**. Tráfico = valorar detención. |
| 4 | **Portar armas prohibidas / navaja** | Art. 36.10 / 37.1 LO 4/2015; armas prohibidas RD 137/1993. Decomiso. | Administrativo salvo tipo penal (art. 563/564 CP). |
| 5 | **Desórdenes públicos / pelea multitudinaria** | Art. 557 CP (desórdenes) vs. infracción 35/36 LO 4/2015. | Delito → valorar detención por flagrancia. |
| 6 | **Falta de respeto / insultos a agente** | Art. 37.4 o 36.6 LO 4/2015 (administrativo). No es atentado salvo violencia/intimidación (550 CP). | Normalmente denuncia administrativa, no detención. |
| 7 | **Ocupación de inmueble (okupación)** | Allanamiento 202 CP vs. usurpación 245 CP; flagrancia. | Flagrancia → detención posible; fuera de flagrancia, vía judicial. |
| 8 | **Consumo de alcohol en vía pública / botellón** | Ordenanza municipal + 37.17 LO 4/2015 según caso. | Administrativo. |
| 9 | **Tenencia de objetos para el robo / útiles** | Valorar 36 LO 4/2015 e indicios de delito. | Según indicios. |

### Bloque B · Código Penal + LECrim (delitos frecuentes → detención sí/no)

| # | Situación | Qué necesito al instante | Capa detención (a verificar) |
|---|---|---|---|
| 10 | **Hurto vs. robo** | Umbral 400 € (delito leve vs. menos grave); hurto 234 CP, robo fuerza 237/238, robo violencia/intimidación 242 CP. Ver §5. | Hurto leve (<400 €, sin agravante) → **495 LECrim: no detención** salvo sin domicilio. Robo → delito, detención por flagrancia. |
| 11 | **Robo con violencia o intimidación (tirón, atraco)** | Art. 242 CP, agravantes (arma). Pena grave. | Delito grave → detención por flagrancia (490 LECrim). |
| 12 | **Lesiones** | Delito leve 147.2 CP vs. delito 147.1; agravadas 148 (arma, ensañamiento). Parte de lesiones. | Leves → normalmente denuncia; delito → valorar detención. |
| 13 | **Violencia de género / doméstica** | Art. 153 CP (maltrato ocasional), 173.2 (habitual), lesiones 148.4. Medidas art. 544 bis/ter LECrim, valoración VPR/VioGén. | **Detención habitual por flagrancia**; protección de la víctima prioritaria. Ver §1.C. |
| 14 | **Quebrantamiento de condena/medida** | Art. 468 CP (orden de alejamiento). | Flagrancia → detención. |
| 15 | **Amenazas / coacciones** | 169-172 CP; leves 171.7 / 172.3. | Según gravedad; leves normalmente denuncia. |
| 16 | **Daños** | 263 CP; leves <400 €. | Leves → denuncia. |
| 17 | **Atentado a agente de la autoridad** | Art. 550-551 CP (violencia/intimidación grave). | Delito → detención por flagrancia. |
| 18 | **Tráfico de drogas** | Art. 368 CP; agravado 369. Umbrales consumo/tráfico (ver §... tabla sustancias). | Delito → detención; cadena de custodia del decomiso. |
| 19 | **Falsedad documental** | 390-399 CP; documento identidad falso extranjero. | Valorar detención + intervención documento. |
| 20 | **Estafa / uso fraudulento de tarjeta** | 248/249 CP. | Según indicios y cuantía. |

### Bloque C · Extranjería (LO 4/2000, RD 557/2011)

| # | Situación | Qué necesito al instante | Capa detención (a verificar) |
|---|---|---|---|
| 21 | **Extranjero sin documentación / estancia irregular** | Art. 53.1.a LO 4/2000 (infracción grave). Diferencia clave: **estancia irregular NO es delito**; sanción de multa o expulsión (55/57). | **La irregularidad por sí sola no justifica detención penal.** Se puede realizar detención cautelar a efectos de expediente de expulsión (art. 61) con límite y control judicial. Ver §3. |
| 22 | **Identificación de extranjero** | Documentos válidos: pasaporte, TIE, tarjeta comunitaria, NIE, resguardo. Consulta de situación. | Identificación; no detención sin causa. |
| 23 | **Expulsión / prohibición de entrada activa** | Consultar si hay orden de expulsión, devolución o prohibición vigente. | Si hay orden ejecutable → actuación conforme a la orden. |
| 24 | **Internamiento CIE** | Art. 62 LO 4/2000: plazo máx. 60 días (a verificar), autorización judicial. | Requiere auto judicial. |
| 25 | **Solicitante de protección internacional / asilo** | Documentación (resguardo, tarjeta roja); no expulsable mientras se tramita. | No procede expulsión durante la tramitación. |
| 26 | **Menor extranjero no acompañado (MENA)** | Protocolo: no detención, puesta a disposición de Fiscalía/entidad de protección; determinación de edad. | **No detención**; sistema de protección de menores. Ver §1.D y LO 5/2000. |

### Bloque D · Menores (LO 5/2000)

| # | Situación | Qué necesito al instante | Capa detención (a verificar) |
|---|---|---|---|
| 27 | **Menor de 14 años autor de hecho delictivo** | **Inimputable** penalmente (art. 3 LO 5/2000). No responsabilidad penal. | **No detención penal**; entrega a padres/guardadores o entidad de protección. |
| 28 | **Menor 14-18 autor** | Responsabilidad penal del menor (LO 5/2000). Detención con garantías reforzadas: información a padres y Fiscalía de Menores, plazo, no ingreso en calabozo común. | Detención posible pero con régimen especial (art. 17 LO 5/2000). |
| 29 | **Menor víctima / desprotección** | Protocolo de protección, Fiscalía. | No detención; protección. |

### Bloque E · Registros e identificaciones (transversal)

| # | Situación | Qué necesito al instante |
|---|---|---|
| 30 | **Cacheo / registro superficial** | Base legal (16.2 LO 4/2015 registro corporal externo); proporcionalidad; registro con desnudo integral solo con garantías. |
| 31 | **Registro de vehículo** | Distinción registro de vehículo (menos garantías) vs. domicilio (auto judicial 18.2 CE / 545 ss. LECrim). |
| 32 | **Entrada y registro en domicilio** | Consentimiento titular / flagrancia / auto judicial. Requisitos y acta. |

---

## 2. Lo que necesito de un vistazo en CADA ficha (la capa de detención)

Cuando pulso una figura penal, el orden mental es siempre el mismo. La ficha debería
reflejarlo:

1. **¿Qué es?** — Figura + artículo (p. ej. "Robo con violencia · art. 242 CP").
2. **Gravedad penal** — derivada de la pena (art. 33 CP): leve / menos grave / grave.
   Esto condiciona toda la decisión de detención.
3. **Semáforo de detención** — Orientación (no orden): *procede / valorar / no procede
   salvo excepción*, **siempre con el artículo LECrim**.
4. **Qué hago si NO detengo** — identificar + diligencia + comunicar al juzgado (493 LECrim).
5. **Consecuencias asociadas** — decomiso, cadena de custodia, parte de lesiones, medidas
   de protección de víctima (VG), lectura de derechos.
6. **Texto para la minuta/atestado** — párrafo redactado copiable.
7. **Fuente + fecha** — artículo y "actualizado el dd/mm/aaaa".

---

## 3. Árbol de decisión de DETENCIÓN — diseño propuesto (diferencial y sensible)

> **Principio rector de UX:** el árbol **orienta**, no manda. Lenguaje: "procede /
> puede proceder / no procede salvo…", nunca "detén". Pie fijo obligatorio en toda
> pantalla del árbol:
>
> *"Orientación basada en la LECrim y en el art. 33 CP. La valoración de los indicios
> racionales, de la flagrancia y del riesgo de incomparecencia corresponde al agente.
> Esto no es una orden ni asesoramiento jurídico. (a verificar)"*

### 3.1 Fuentes del árbol (todas a verificar contra BOE consolidado)

- **Art. 490 LECrim** — supuestos en que *cualquiera* puede detener: quien va a cometer
  o está cometiendo delito (flagrancia), el que se fuga estando detenido/preso, el
  procesado/condenado en rebeldía, etc.
- **Art. 492 LECrim** — la autoridad/agente **está obligado** a detener: (1) al que va a
  cometer/está cometiendo delito; (2) al procesado por delito con pena ≥ prisión; (3) al
  procesado por delito con pena inferior si hay motivo racional para creer que no
  comparecerá salvo fianza (riesgo de incomparecencia); (4) al que hubiere indicios
  racionales de haber participado + circunstancias del 492.3.
- **Art. 493 LECrim** — la autoridad/agente **no puede** detener por simples faltas/delitos
  leves, salvo domicilio desconocido/sin garantía; si no detiene, **identifica**.
- **Art. 495 LECrim** — **no se detendrá por delitos leves** salvo que el presunto reo no
  tuviere domicilio conocido ni diere fianza bastante.
- **Art. 33 CP** — clasificación de penas (graves / menos graves / leves) que fija la
  gravedad del delito y alimenta la decisión.
- **Art. 17 LO 5/2000** — régimen especial de detención de menores.
- **Art. 61 y 62 LO 4/2000** — detención cautelar y medidas en extranjería (control judicial).

### 3.2 Lógica del árbol (pseudo-decisión)

```
[ Entrada: figura seleccionada por el agente ]
        │
        ├─ ¿El autor es MENOR de 14 años? ──── SÍ → INIMPUTABLE (art. 3 LO 5/2000)
        │                                            → No detención penal. Entrega a
        │                                              guardadores / entidad de protección.
        │
        ├─ ¿El autor tiene 14-17 años? ──────── SÍ → Régimen especial (art. 17 LO 5/2000):
        │                                            detención con garantías reforzadas,
        │                                            Fiscalía de Menores, aviso a padres.
        │
        ├─ ¿Caso de EXTRANJERÍA sin ilícito penal (solo estancia irregular)? ──
        │        SÍ → Vía administrativa (art. 53.1.a LO 4/2000). NO detención penal.
        │             Posible detención cautelar a efectos de expulsión (art. 61),
        │             con límites y control judicial. (a verificar)
        │
        └─ Es un DELITO. Clasifica por pena (art. 33 CP):
                 │
                 ├─ ¿DELITO LEVE? (pena leve)
                 │      → Regla art. 495 LECrim: **NO procede detención**,
                 │        SALVO sin domicilio conocido ni fianza bastante.
                 │      → Si no detienes: identifica + diligencia + comunica al juzgado (493).
                 │
                 └─ ¿DELITO MENOS GRAVE o GRAVE?
                        │
                        ├─ ¿Flagrancia? (art. 490/492.1) ── SÍ → **Procede detención.**
                        │
                        ├─ ¿Indicios racionales de participación (492.4)
                        │    + riesgo de incomparecencia (492.3)? ── SÍ → **Puede proceder.**
                        │
                        └─ ¿Sin flagrancia y sin riesgo claro?
                               → Orienta: identificar + diligencia + dar cuenta al juzgado;
                                 la detención puede no ser necesaria. Valora indicios.
```

### 3.3 Cómo mostrarlo en pantalla (sin dar órdenes)

- **Semáforo con texto, nunca solo color:**
  - Verde/"No procede salvo excepción" — delito leve (495 LECrim).
  - Ámbar/"Valora: puede proceder" — menos grave sin flagrancia (492.3/492.4).
  - Rojo/"Procede detención" — flagrancia o delito grave (490/492).
- **Cada nodo con su artículo visible** y botón "ver artículo completo (BOE)".
- **Dos preguntas máximo** por pantalla (flagrancia sí/no; domicilio conocido sí/no),
  porque en la calle no hay tiempo para un cuestionario largo.
- **Chips de acción alternativa** siempre presentes: "Identificar (16 LO 4/2015)",
  "Diligencia + juzgado (493)", "Lectura de derechos (520)".
- **Registro de por qué**: opción de guardar en la minuta el motivo (flagrancia,
  riesgo de fuga) — ayuda a redactar el atestado y a defender la decisión.
- **Aviso legal fijo** al pie (texto de §3).

Este árbol es **el rasgo por el que yo pagaría**. SPPLB me da el artículo del CP pero me
deja solo ante la pregunta que de verdad importa a las 3 de la mañana: *¿me lo llevo o no?*

---

## 4. Extranjería — casos típicos, documentación y consulta rápida

**Idea clave que la app debe dejar cristalina:** la **estancia irregular es infracción
administrativa, no delito** (art. 53.1.a LO 4/2000, a verificar). El error más frecuente
y más peligroso es tratarla como detención penal. La app debe cortar eso de raíz.

**Documentación que compruebo:**
- Pasaporte + visado.
- TIE (Tarjeta de Identidad de Extranjero) / NIE.
- Tarjeta de residencia de familiar de ciudadano UE / certificado de registro UE.
- Resguardo de solicitud en trámite; tarjeta roja (protección internacional).
- Documento de solicitante de asilo → **no expulsable durante la tramitación**.

**Consultas rápidas que necesito (contenido de la app, no acceso a bases oficiales):**
- Checklist "¿qué documento es válido y qué acredita?" por nacionalidad/tipo.
- Diferencia **expulsión (57) vs. devolución (58) vs. retorno**; plazos y órgano.
- Procedimiento ante estancia irregular: incoación de expediente, no automatismo de
  detención; supuestos de detención cautelar (art. 61) y sus límites.
- Régimen especial de **MENA**: nunca calabozo; Fiscalía y protección; determinación de edad.
- CIE: solo con **auto judicial** (art. 62); plazo máximo (a verificar).

La app **no** debe conectarse a bases policiales ni tratar datos de la persona (coherente
con el principio de "mínimos datos" de la especificación). Solo me da el mapa de decisión
y la documentación de referencia.

---

## 5. Diferenciar figuras penales bajo presión (sin sustituir mi criterio)

La app me ayuda a **encuadrar** rápido; la calificación final es mía y del juez. Ejemplos
donde una tarjeta comparativa vale oro:

- **Hurto vs. robo con fuerza vs. robo con violencia/intimidación:**
  - Hurto (234 CP): apoderamiento sin fuerza en las cosas ni violencia. Umbral 400 €
    marca delito leve / menos grave.
  - Robo con fuerza en las cosas (237/238 CP): escalamiento, rotura, llaves falsas.
  - Robo con violencia o intimidación en las personas (242 CP): el "tirón" con
    violencia, el atraco. **Salta directamente a delito grave** → cambia la detención.
  - *UX útil:* un selector "¿hubo fuerza en las cosas? ¿violencia/intimidación en
    personas?" que reencuadra la figura y recalcula la capa de detención.
- **Tentativa vs. consumación (16 CP):** el hurto/robo intentado sigue siendo delito;
  la pena baja uno o dos grados. La app debe recordar que la tentativa no "despenaliza".
- **Agravantes que cambian todo:** uso de arma (242.3), reincidencia, alevosía,
  violencia de género (parentesco/relación afectiva). Mostrarlas como chips que, al
  marcarlas, suben la gravedad y actualizan el semáforo de detención.
- **Lesiones:** 147.2 (leve) vs. 147.1 (delito) vs. 148 (agravadas por arma/ensañamiento).
  Vincular con el parte de lesiones.

**Límite explícito de la app (que yo quiero ver escrito):** "Herramienta de apoyo. No
califica hechos ni sustituye el criterio del agente ni la valoración judicial."

---

## 6. Lectura de derechos multilingüe (art. 520 LECrim)

En Seguridad Ciudadana urbana con carga de Extranjería, esto es **uso diario**. Idiomas
que de verdad necesito en la calle (priorizados por lo que me encuentro):

1. **Árabe** (magrebí; muy frecuente).
2. **Rumano.**
3. **Inglés** (comodín internacional).
4. **Francés** (África subsahariana francófona, Magreb).
5. **Español** (base).
6. **Chino** (mandarín).
7. **Wolof / lenguas subsaharianas** (difícil pero real; al menos francés como puente).
8. **Portugués** (Brasil, África lusófona).
9. **Ruso / ucraniano.**
10. **Italiano, alemán** (menos frecuentes en detención, más en turismo).

**Cómo lo usaría:**
- Pantalla grande, texto legible en el coche, botón por idioma, **modo offline
  obligatorio** (muchas veces sin cobertura).
- Art. 520 (detenido) y art. 771/109 LECrim (información de derechos a la víctima).
- **Audio pregrabado** (fase 2 en la spec): imprescindible para idiomas que no leo. Poder
  reproducirlo alto y claro.
- Que el texto marque **qué derecho es cada párrafo** (abogado, no declarar, intérprete,
  asistencia médica, comunicación) para poder confirmar que el detenido lo entiende.
- Registro de "leído en idioma X a las HH:MM" para la diligencia.
- Traducciones **oficiales del Ministerio del Interior** cuando existan (la spec ya lo dice).

---

## 7. Cuadrante de Policía Nacional — patrones y particularidades

El cuadrante del CNP tiene particularidades que SPPLB (pensado para locales) no clava:

- **Patrón habitual "7x7"** (siete días de trabajo / siete de libranza) en muchas
  unidades, pero **no es único**: hay ciclos de mañanas/tardes/noches rotativos, "quintos
  turnos", y variaciones por unidad (Seguridad Ciudadana, UPR, Extranjería/CIE, puestos
  fronterizos).
- **Turnos**: mañana (p. ej. 06-14/07-15), tarde (14-22/15-23), noche (22-06). Noche
  cuenta para **nocturnidad**.
- **Correturnos / retenes / servicios extraordinarios** (manifestaciones, refuerzos,
  dispositivos) que se añaden fuera de ciclo — el cuadrante debe permitir **insertar días
  sueltos** sin romper el patrón.
- **Festivos**: nacional + autonómico + local; el CNP trabaja festivos y eso cuenta para
  el complemento de festividad.
- **Cómputo de horas** que me importa: totales mes/año, **nocturnas**, **festivas**,
  fines de semana, exceso sobre jornada de referencia.
- **Cambios de servicio entre compañeros**: apuntar quién cubre, para no perder el
  cómputo.

**Lo que exijo:** que **no pierda la configuración** (el fallo mortal de SPPLB) y que el
7x7 con fecha de inicio de ciclo proyecte bien meses adelante. Un contador de nocturnas
fiable es, para muchos compañeros, razón suficiente para pagar.

---

## 8. ¿Qué me haría pagar 2,99 €/mes frente a gratis? ¿Qué NO?

**SÍ pagaría por:**
1. **Árbol de detención con fuente LECrim** actualizado y fiable. Es único y me quita
   incertidumbre en la decisión más delicada.
2. **Normativa siempre al día** con aviso de qué cambió (LO 4/2015, CP, extranjería
   cambian y SPPLB se queda atrás).
3. **Buscador que entiende lenguaje de calle** (ver §9): que yo escriba "le he pillado
   con la navaja" y me lleve a la figura correcta.
4. **Cuadrante fiable con contador de nocturnas/festivas** que no se borre.
5. **Lectura de derechos multilingüe offline con audio.**
6. **Textos para minuta/atestado** copiables (me ahorra tiempo real en oficina).
7. **Tabla de sustancias** con umbrales y fuente jurisprudencial.

**NO pagaría (o me haría desconfiar):**
- Que la app **me diga "detén"** en imperativo (riesgo jurídico; lo rechazo).
- Contenido **desactualizado** cobrando (es exactamente lo que odio de la app actual).
- Que trate o suba a servidor **datos de personas** que identifico (matrículas, DNI). Si
  sospecho que "chiva" datos, la desinstalo.
- Funciones sindicales o de foro (no las necesito en la calle).
- Publicidad o pop-ups pidiendo valoración en mitad de una consulta.
- Un precio que suba sin más contenido.

**Umbral de valor:** 2,99 €/mes es asumible **si** la fiabilidad es total. Un solo importe
mal o una consecuencia de detención equivocada y pierdo la confianza para siempre.

---

## 9. Terminología de calle → término técnico (30-40 ejemplos)

Esto alimenta el **diccionario de sinónimos** del buscador. "Lo que digo" → "lo que busca
el sistema".

| Lo que digo en la calle | Término técnico / figura |
|---|---|
| "Le he pillado mangando" | Hurto (art. 234 CP) |
| "Un tirón" / "le dieron el tirón" | Robo con violencia o intimidación (242 CP) |
| "Un butrón" / "reventaron la puerta" | Robo con fuerza en las cosas (237/238 CP) |
| "Un descuidero" | Hurto (234 CP) |
| "Trapicheo" / "está trapicheando" | Tráfico de drogas (368 CP) / indicios |
| "Lleva papelinas" | Tenencia para tráfico / consumo (368 CP / 36.16 LO 4/2015) |
| "Iba puesto" / "consumiendo en la calle" | Consumo en vía pública (36.16 LO 4/2015) |
| "Le encontré una navaja" | Tenencia de arma prohibida (36.10 LO 4/2015 / RD 137/1993) |
| "Me ha faltado" / "me insultó" | Falta de respeto a agente (37.4 / 36.6 LO 4/2015) |
| "Se me puso chulo y no obedecía" | Desobediencia (556 CP / 36.6 LO 4/2015) |
| "Se resistió al cachearlo" | Resistencia (556 CP) |
| "Me agredió" (a mí, agente) | Atentado a agente de la autoridad (550 CP) |
| "Movida / follón en el bar" | Desórdenes públicos (557 CP) |
| "Malos tratos en casa" | Violencia de género/doméstica (153 / 173.2 CP) |
| "Se saltó la orden de alejamiento" | Quebrantamiento (468 CP) |
| "Le partió la cara" | Lesiones (147 / 148 CP) |
| "Un arañazo / cardenal" | Lesiones leves (147.2 CP) |
| "Amenazó con matarlo" | Amenazas (169-171 CP) |
| "Le rayó el coche" | Daños (263 CP) |
| "Okupas en el piso" | Usurpación (245 CP) / allanamiento (202 CP) |
| "Entró a robar en la casa" | Robo con fuerza en casa habitada (241 CP) |
| "Papeles falsos" / "el pasaporte es trucado" | Falsedad documental (390-399 CP) |
| "Sin papeles" | Estancia irregular (53.1.a LO 4/2000) — administrativo |
| "Tiene orden de expulsión" | Expulsión (57 LO 4/2000) |
| "Es un ilegal" (término incorrecto) | Estancia irregular (53.1.a LO 4/2000) |
| "Menor sin familia" / "un MENA" | Menor extranjero no acompañado (protección + LO 5/2000) |
| "El crío no tiene 14" | Menor inimputable (art. 3 LO 5/2000) |
| "Lo cacheo" | Registro corporal externo (16.2 LO 4/2015) |
| "Le pido la documentación" | Requerimiento de identificación (16 LO 4/2015) |
| "Se lo lleva la lechera / a comisaría" | Traslado para identificación / detención |
| "Le leo los derechos" | Lectura de derechos (520 LECrim) |
| "Le pillé con la balanza y billetes sueltos" | Indicios de tráfico (368 CP) |
| "Iba dando voces borracho" | Alteración del orden / embriaguez en vía pública |
| "Se llevó el móvil de un tirón" | Robo con violencia (242 CP) |
| "Coló mercancía sin pagar" | Hurto en establecimiento (234 CP) |
| "Le trinqué in fraganti" | Flagrancia (490 LECrim) |
| "Se dio a la fuga" | Fuga → detención (490 LECrim) |
| "No tiene domicilio conocido" | Excepción del 495 LECrim (sí cabe detención) |
| "Le pongo una denuncia de ciudadana" | Infracción LO 4/2015 (administrativa) |
| "Un quebranto" | Quebrantamiento (468 CP) |

*(Todos los artículos, a verificar.)*

---

## 10. Carencias de SPPLB que más me molestan

1. **Se desactualiza** (versión iOS congelada desde 2023). En normativa penal y de
   extranjería eso es inaceptable.
2. **El cuadrante falla y pierde la configuración.** Mata la confianza.
3. **Me da el artículo pero no la consecuencia**: nunca me dice si procede detención. Justo
   lo que más necesito en la calle.
4. **No entiende cómo hablo**: si no escribo el término técnico exacto, no encuentro nada.
5. **Interfaz de 2017**, cuadrícula de iconos, ilegible de noche en el coche, no
   personalizada para CNP (está pensada para policías locales y tráfico).
6. **Nada de lectura de derechos multilingüe usable** con audio.
7. **Sin textos listos para minuta/atestado.**
8. **Contenido sindical** que a mí no me aporta.

---

## 11. Funciones únicas por las que pagaría (prioridad para el producto)

1. **Árbol de detención LECrim + art. 33 CP**, orientativo, con fuente y aviso — *el
   diferencial nº1*.
2. **Buscador en lenguaje de calle** con el diccionario de §9.
3. **Cuadrante 7x7 fiable con contador de nocturnas/festivas** que no se borre.
4. **Lectura de derechos multilingüe offline + audio** (árabe, rumano, inglés, francés
   los primeros).
5. **Fichas con "qué hago si no detengo"** (identificar + diligencia + juzgado, 493).
6. **Tarjetas comparativas** hurto/robo/lesiones con recálculo de gravedad al marcar
   agravantes.
7. **Tabla de sustancias** consumo vs. tráfico con jurisprudencia.
8. **Textos de minuta/atestado** copiables + plantillas (diligencia de identificación,
   acta de lectura de derechos, acta de intervención de sustancias).
9. **Avisos de cambios normativos** con resumen ("cambió el art. X de la LO 4/2015").

---

## 12. Notas de diseño transversales (desde la calle)

- **Offline siempre**: mucha intervención sin cobertura. Todo lo crítico en el dispositivo.
- **Una mano, de noche, en el coche**: botones grandes, alto contraste, tipografía ≥16 pt,
  modo oscuro por defecto de noche.
- **Nunca imperativo** en detención: "procede/valora/no procede", jamás "detén".
- **Fuente y fecha en cada ficha**: si me lo preguntan en el juzgado, quiero saber de dónde
  salió y de cuándo.
- **Cero datos de terceros al servidor**: si la app trata matrículas/DNI de personas, no la
  uso. Coherente con la spec.
- **Reportar error en la ficha**: un botón para avisar si un importe/consecuencia está mal.
- **Distinguir claramente administrativo (LO 4/2015) vs. penal (CP)**: es la confusión más
  frecuente y la app puede evitar errores serios (sobre todo en extranjería y drogas).

---

*Fin de la perspectiva simulada. Recordatorio: todas las referencias normativas están
marcadas **(a verificar)** y deben validarse contra el BOE consolidado y con revisión
jurídica antes de su publicación en la app.*
