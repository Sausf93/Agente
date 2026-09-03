# 11 · Mapa de competencias y normativa por cuerpo y territorio

> **Naturaleza de este documento.** Orientación de **producto**, no asesoramiento jurídico. Sirve para que la app "Agente" sepa qué contenido priorizar y qué avisos mostrar según **quién la usa** (cuerpo + territorio, ver ESPECIFICACION.md §2 y §4.5). Todo **dato legal concreto** (importe, artículo exacto, si una competencia está o no delegada en un territorio) va marcado **[a verificar]** y debe pasar por el `revisor-juridico` antes de publicarse. La base legal general se cita cuando es estable; los detalles de reparto varían por convenio, delegación y territorio.
>
> **Base legal marco (estable):** Constitución art. 104 y 149.1.29ª · **LO 2/1986, de 13 de marzo, de Fuerzas y Cuerpos de Seguridad (LOFCS)** — art. 11 (funciones FCSE), art. 12 (reparto Guardia Civil / Policía Nacional), arts. 37-40 (policías de las CCAA), art. 53 (policías locales), Disposiciones Finales 2ª y 3ª (Ertzaintza y Mossos como cuerpos de carácter especial) · Estatutos de Autonomía respectivos · **Ley 7/1985 Reguladora de las Bases del Régimen Local (LBRL)** art. 25 y 84 · **RDL 6/2015 Ley de Tráfico (LSV)** arts. 5-7 (competencias Estado/municipios).

---

## 1. Tabla por cuerpo

Leyenda de ámbito: **E** = estatal · **A** = autonómico · **M** = municipal.

| Cuerpo | Ámbito territorial | Competencias principales | Normativa que más consulta |
|---|---|---|---|
| **Guardia Civil (GC)** | Estatal, con reparto del art. 12 LOFCS: territorio **no urbano / interurbano**, mar territorial, fronteras, puertos, aeropuertos. Predominio **rural y de carretera**. | **Tráfico interurbano** (Agrupación de Tráfico), **armas y explosivos**, **fiscal / contrabando**, **resguardo fiscal y aduanero**, **protección de la naturaleza (SEPRONA)**, costas y fronteras, transporte de mercancías (ADR), seguridad ciudadana en su demarcación, **policía judicial**. | Estatal: LSV, RGC (RD 1428/2003), RGV (RD 2822/1998), Reglamento de Armas (RD 137/1993), LOTT/ROTT, ADR, Ley 7/2023 bienestar animal, LO 4/2015 seguridad ciudadana, CP + LECrim. |
| **Policía Nacional (CNP)** | Estatal, predominio **urbano**: capitales de provincia y municipios que determine el Gobierno (art. 12 LOFCS). | **Seguridad ciudadana urbana**, **extranjería y documentación** (DNI, pasaporte, expulsiones), **policía judicial** e investigación, juego, droga (UDYCO), seguridad privada, control de entrada/salida del territorio. | Estatal: LO 4/2000 y RD 557/2011 (extranjería), LO 4/2015, CP + LECrim, LO 5/2000 menores, RD 137/1993 armas, normativa de documentación y seguridad privada. |
| **Mossos d'Esquadra** | Autonómico — **Cataluña**. Policía **integral** (sustituye a GC/CNP en las competencias asumidas). | Policía **integral**: seguridad ciudadana, orden público, **tráfico** (interurbano y coordinación urbana), **policía judicial**, investigación criminal, juego, espectáculos. El Estado retiene extranjería, armas/explosivos, fronteras, fiscal, terrorismo (coordinación). | **A + E**: normativa catalana (DOGC) + toda la estatal aplicable (LSV, CP, LECrim, LO 4/2015). Consulta autonómica alta. |
| **Ertzaintza** | Autonómico — **País Vasco**. Policía **integral**. | Igual perfil integral que Mossos: seguridad ciudadana, orden público, **tráfico**, **policía judicial**, investigación. Estado retiene extranjería, armas, fronteras, fiscal, terrorismo (coordinación). | **A + E**: normativa vasca (BOPV) + estatal aplicable. Consulta autonómica alta. |
| **Policía Foral de Navarra** | Autonómico — **Navarra**. Competencias **más acotadas** que integrales. | **Tráfico interurbano** en Navarra (competencia asumida y muy visible), protección de patrimonio, medio ambiente, juego y espectáculos, funciones de policía administrativa foral y **policía judicial** (con matices, ver §3). Seguridad ciudadana general y extranjería siguen muy presentes GC/CNP. | **A + E**: normativa foral (BON) + estatal de tráfico (LSV, RGC, RGV) y penal. Fuerte peso de tráfico. |
| **Policía Canaria (Cuerpo General de la Policía Canaria)** | Autonómico — **Canarias**. Competencias **acotadas** y en despliegue progresivo. | Vigilancia de bienes/instalaciones autonómicas, protección de personas y autoridades, **policía administrativa** autonómica (medio ambiente, turismo, transporte, juego, espectáculos, pesca), colaboración y policía judicial en lo asumido. No es integral. | **A + E**: normativa canaria (BOC) + estatal. Peso alto de policía administrativa sectorial. |
| **Policía Local** | Municipal — término del municipio. | **Tráfico urbano** (ordenación, señalización, denuncia en vía urbana, atestados de accidentes urbanos), **ordenanzas municipales** (ruido, animales, convivencia, venta ambulante, terrazas), **policía administrativa** local, VMP/patinetes, protección de autoridades locales, colaboración con FCSE y **policía judicial** en su ámbito. | **M + E**: **ordenanzas municipales propias** (web del ayuntamiento) + estatal de tráfico (LSV, RGC, RGV) + LO 4/2015 (colaboración). Y, en CCAA con policía autonómica, la normativa autonómica de coordinación de policías locales. |

*Detalle de qué está exactamente asumido en cada territorio, y los importes/artículos concretos: **[a verificar]** con el `revisor-juridico`.*

---

## 2. Solapes y repartos típicos (las dudas de "¿esto es mío o de…?")

Estos son los cruces que generan más consultas del tipo "¿esto lo puedo denunciar yo?". La app **no debe afirmar categóricamente** la competencia salvo en los casos nítidos; debe **orientar con la fuente** y marcar la duda.

| Duda típica | Reparto orientativo | Base legal general | Cómo debe orientar la app |
|---|---|---|---|
| **Tráfico urbano vs. interurbano** | Vía **urbana** → Policía Local. Vía **interurbana** (travesías, carreteras) → Guardia Civil (o Foral en Navarra, Mossos/Ertzaintza en su CCAA). | LSV arts. 5-7; LOFCS art. 53.1.b; LBRL art. 25.2.g | En la ficha de infracción de tráfico, mostrar chip de **competencia por vía**: "Vía urbana: Policía Local · Vía interurbana: Guardia Civil/autonómica". Nunca "esto es tuyo" a secas. |
| **Seguridad ciudadana en CCAA con policía integral** | En País Vasco y Cataluña la seguridad ciudadana ordinaria es de **Ertzaintza/Mossos**; CNP/GC quedan para competencias exclusivas del Estado (extranjería, armas, fronteras, terrorismo, fiscal). | LOFCS arts. 38-40 y DF 2ª/3ª; Estatutos | Si el usuario es CNP/GC destinado en esas CCAA, **avisar** de que muchas funciones de seguridad ciudadana las lleva la autonómica; si es Mossos/Ertzaintza, ampliar contenido autonómico. |
| **Extranjería** | Competencia **estatal (CNP)** en todo el territorio, también en CCAA con policía integral. | LOFCS art. 12.1.A; LO 4/2000 | Marcar extranjería como **contenido estatal transversal**: relevante para CNP; para autonómicas/locales, mostrar como "competencia del Estado / colaboración". |
| **Armas y explosivos** | Competencia **estatal (Guardia Civil)** en todo el territorio. | LOFCS art. 12.1.B; RD 137/1993 | Contenido de armas siempre bajo perfil GC; para el resto, "intervención de armas: Guardia Civil". |
| **Ordenanzas municipales** | Solo el **municipio** las dicta y la **Policía Local** las aplica; varían por municipio. | LBRL arts. 25, 84, 139-141 | Las ordenanzas son **contenido municipal**: solo se muestran al usuario de Policía Local del municipio configurado. Nunca presentar la ordenanza de un municipio como aplicable en otro. |
| **Policía judicial** | Todos los cuerpos colaboran; hay unidades orgánicas (CNP/GC) y adscritas (autonómicas). Alcance de las autonómicas varía (ver §3). | LOFCS arts. 29-36; LECrim | Contenido penal/LECrim es **transversal** pero el grado de actuación depende del cuerpo; mantener neutro y con fuente. |
| **VMP / patinetes, animales, ruido** | Predominantemente **municipal** (ordenanzas) + marco estatal (LSV para VMP, Ley 7/2023 animales). | LSV; ordenanzas; Ley 7/2023 | Mostrar la capa estatal + advertir "revisa la ordenanza de tu municipio", que puede endurecer o concretar. |

**Principio de diseño para no equivocarse:** la app **describe** el reparto con su fuente y **nunca decide** por el agente. El lenguaje es orientativo ("En vía urbana suele corresponder a Policía Local, art. …"), coherente con el aviso fijo de la ESPECIFICACION §4.6 ("la valoración corresponde al agente").

---

## 3. Autonómicas a fondo: qué asumió cada una y qué implica para el contenido

| Cuerpo | Grado de asunción | Implicación para el contenido de la app |
|---|---|---|
| **Mossos d'Esquadra** (Cataluña) | **Policía integral.** Ha desplegado seguridad ciudadana, orden público, tráfico y policía judicial, sustituyendo a GC/CNP en lo asumido. Base: LOFCS DF 3ª + Estatuto de Cataluña (LO 6/2006). | Necesita **la capa estatal completa + capa catalana**: normativa autonómica (DOGC), instrucciones propias, y tráfico como competencia plena. Alto volumen de contenido autonómico. **[a verificar]** el detalle de instrucciones internas (no son fuente pública uniforme). |
| **Ertzaintza** (País Vasco) | **Policía integral.** Igual naturaleza que Mossos. Base: LOFCS DF 2ª + Estatuto País Vasco (LO 3/1979). | Igual que Mossos: **estatal + vasca (BOPV)**. Tráfico, seguridad ciudadana y policía judicial en primer plano. |
| **Policía Foral de Navarra** | **Acotada, no integral.** Fuerte en **tráfico interurbano** en Navarra y policía administrativa foral; seguridad ciudadana general y extranjería siguen con GC/CNP. Base: LORAFNA (LO 13/1982) + normativa foral. Policía judicial con **matices** (unidades adscritas, no orgánicas). **[a verificar]** el alcance exacto vigente. | El contenido nuclear es **tráfico (estatal LSV/RGC/RGV) + normativa foral (BON)**. Menos peso de la capa penal operativa que en integrales, pero se mantiene disponible. |
| **Cuerpo General de la Policía Canaria** | **Acotada y en despliegue.** Enfoque en **policía administrativa autonómica** (medio ambiente, turismo, transporte, juego, espectáculos, pesca), protección de bienes y autoridades. No integral. Base: Estatuto de Canarias + ley canaria del cuerpo. **[a verificar]** referencias exactas y estado de despliegue. | Contenido dominado por **normativa administrativa sectorial canaria (BOC)** + capa estatal de apoyo. La ESPECIFICACION ya prioriza Canarias en la fase de contenido autonómico (§4.5, §8.1). |

**Conclusión de contenido:** dos niveles de "profundidad autonómica":
- **Integral (Mossos, Ertzaintza):** requieren la capa estatal íntegra **y** una capa autonómica extensa (tráfico + seguridad ciudadana + administrativa).
- **Acotada (Foral, Canaria):** capa estatal + capa autonómica **temática** (tráfico en Navarra; administrativa sectorial en Canarias).

---

## 4. Local: relación con lo autonómico y lo estatal

- **Encaje normativo.** La Policía Local se rige por LOFCS art. 53, LBRL (arts. 25, 84) y, en cada CCAA, por una **ley autonómica de coordinación de policías locales** que fija formación, uniformidad, escalas y marcos de colaboración. **[a verificar]** la ley de coordinación concreta de cada CCAA.
- **Ordenanzas municipales.** Son la fuente **más específica** del agente local: tráfico urbano, ruido, animales, convivencia, terrazas, venta ambulante, VMP. Solo aplican en su municipio y varían mucho entre ayuntamientos. Se cargan por el panel de administración (ESPECIFICACION §4.5, §8.1) y se muestran **solo** al usuario cuyo municipio coincide.
- **Policía administrativa.** Vela por el cumplimiento de ordenanzas y decretos municipales; instruye expedientes sancionadores municipales. Contenido propio: cuadro de infracciones de cada ordenanza con importe **[a verificar]** por ordenanza.
- **Tráfico urbano.** Ordena, señaliza y denuncia en vía urbana; levanta atestados de accidentes urbanos. Aplica la **LSV/RGC/RGV estatales** (que son la base) **más** la ordenanza municipal de circulación cuando concreta o añade. La app debe combinar la capa estatal con la municipal y avisar cuando la ordenanza puede modular el importe o el supuesto.
- **Colaboración.** Coopera con GC/CNP y con la autonómica (donde exista) en seguridad ciudadana y policía judicial; en CCAA con policía integral, la interlocución de coordinación es sobre todo con la autonómica.

---

## 5. Implicaciones para el producto

### (a) Onboarding
- El perfil ya captura **cuerpo + CCAA + provincia + municipio** (ESPECIFICACION §2.2). Usar esas cuatro claves para **determinar las capas de contenido** que se activan (estatal siempre; autonómica según CCAA + cuerpo; municipal solo si es Policía Local con municipio).
- Para **CNP/GC destinados en País Vasco/Cataluña/Navarra/Canarias**, mostrar en el onboarding un aviso breve: "En tu territorio, parte de la seguridad ciudadana/tráfico la lleva la policía autonómica; verás su reparto en las fichas". **[a verificar]** el texto con el cofundador agente.
- Municipio **obligatorio** para Local (ya previsto) porque sin él no se pueden cargar ordenanzas.

### (b) Filtrado de contenido por capas
Modelar el contenido en **tres capas** alineadas con `Norma.ambito` (estatal / autonómico / municipal) y `territorio_id` del modelo de datos (ESPECIFICACION §6.1):
1. **Estatal** — siempre visible para todos (LSV, RGC, RGV, CP, LECrim, LO 4/2015, extranjería, armas…).
2. **Autonómica** — visible si `CCAA del usuario` coincide con `territorio_id`. Profundidad según cuerpo (integral vs. acotada).
3. **Municipal** — visible solo si `municipio del usuario` coincide (ordenanzas).

Priorización en inicio/buscador: reordenar por relevancia según cuerpo (p. ej., Foral y GC ven tráfico arriba; CNP ve extranjería/seguridad ciudadana; Local ve ordenanzas y tráfico urbano). Encaja con el ranking por "popularidad en el cuerpo" ya descrito (§4.3).

### (c) Aviso "fuera de tu competencia" en la ficha
- Usar el campo `Infraccion.competencia` (json: cuerpos, vía) del modelo de datos (§6.1) y el chip de **Competencia** de la ficha (§4.4, punto 7).
- Cuando el usuario consulta algo que **típicamente no es de su cuerpo/vía**, mostrar un aviso **no bloqueante y orientativo** con fuente. Ejemplos:
  - Local consultando infracción interurbana → "Vía interurbana: suele corresponder a Guardia Civil/autonómica (art. … LOFCS/LSV). **[a verificar]**".
  - GC/CNP consultando materia asumida por la autonómica en su territorio → "En tu CCAA esta función la ejerce la policía autonómica".
  - Cualquiera consultando extranjería/armas → recordatorio de competencia estatal (CNP/GC).
- **Tono:** informar, nunca prohibir. Siempre con artículo fuente y marca **[a verificar]** en los datos concretos, coherente con los avisos legales del producto (§4.6, §10).

---

## Fuentes generales consultadas
- LO 2/1986, de 13 de marzo, de Fuerzas y Cuerpos de Seguridad — [noticias.juridicas.com (Título V, policías locales)](https://noticias.juridicas.com/base_datos/Admin/lo2-1986.t5.html)
- Ley 7/1985 Reguladora de las Bases del Régimen Local (art. 25) y competencias municipales en tráfico — referencias FAMP y análisis de competencias locales.
- Naturaleza de las policías autonómicas y funciones de policía judicial — [Noticias Jurídicas: policía judicial en las policías autonómicas](https://noticias.juridicas.com/conocimiento/articulos-doctrinales/4786-las-funciones-de-policia-judicial-en-las-policias-autonomicas-/); [Wikipedia: Policía autonómica](https://es.wikipedia.org/wiki/Polic%C3%ADa_auton%C3%B3mica); [reparto Navarra (eldiario.es)](https://www.eldiario.es/navarra/policia-foral-guardia-civil-policia-nacional-gobierno-de-navarra_1_1096012.html).

> Recordatorio final: **todo dato legal concreto de este documento está sujeto a verificación** por el `revisor-juridico` antes de convertirse en contenido publicable. Este documento es orientación de producto.
