# Nota legal: plagio, propiedad intelectual y responsabilidad

> **Aviso:** esto no es asesoramiento jurídico. Es una guía práctica para construir sin
> problemas. Antes de cobrar (fase de lanzamiento), conviene una revisión rápida de un
> abogado de propiedad intelectual/TIC. Complementa la sección 10 de `ESPECIFICACION.md`.

## 1. ¿Nos pueden acusar de plagio por hacer una app mejor que SPPLB?

Competir con un producto existente **no es plagio**. Copiar su expresión concreta, sí. La
línea es clara:

### Lo que SÍ podemos usar libremente
- **Los textos legales** (leyes, reglamentos, BOE): son de **dominio público** (art. 13 de la
  Ley de Propiedad Intelectual excluye de protección las disposiciones legales y sus textos
  oficiales). Nadie es dueño de la ley.
- **El codificado de infracciones de la DGT**: documento público.
- **Datos de carreteras, festivos, catálogo INE de territorios**: fuentes públicas oficiales.

→ Ingerimos **desde la fuente primaria** (BOE, DGT, ministerios), no desde la app competidora.

### Lo que NO podemos copiar (aunque el tema sea el mismo)
- **Su código, su base de datos, sus pantallas, sus iconos, sus capturas.**
- **Sus textos redactados por ellos** (si tienen párrafos de boletín propios, resúmenes,
  explicaciones): eso es obra suya. Nosotros **redactamos los nuestros** desde cero.
- **Su selección/estructura concreta si refleja originalidad**, y desde luego **volcar su base
  de datos**: en la UE existe el *derecho sui generis* sobre bases de datos (protege la
  inversión en obtener/verificar/presentar los datos, aunque los datos sean públicos). Por eso
  **no se hace scraping de su app**: se construye la nuestra desde las fuentes oficiales.
- **Su nombre y su logo** (marca). Nuestro nombre e icono son propios y neutros.

### Regla de oro para no tener problemas
> Mismo **objetivo** (ayudar al agente), mismas **fuentes públicas** (BOE/DGT), pero **todo el
> producto es nuestro**: nuestros textos de boletín, nuestros sinónimos, nuestro diseño,
> nuestro código, nuestra base de datos construida desde el origen. Eso es **competencia
> legítima**, que es legal y sana.

## 2. Escudos, nombres y apariencia oficial
- **Prohibido** usar escudos, emblemas o denominaciones oficiales de los cuerpos (Guardia
  Civil, Policía Nacional, etc.) en el nombre, icono, capturas o plantillas por defecto. Puede
  vulnerar normas de uso de símbolos oficiales y confundir sobre un respaldo institucional que
  no existe. La marca es neutra ("Agente" provisional).
- Si un agente sube su propio escudo a una plantilla desde su galería, es cosa suya; la app no
  distribuye escudos.

## 3. Responsabilidad por el contenido (el punto sensible: detener / multar)

Este es el verdadero riesgo a gestionar, más que el plagio. La app **orienta con fuente, no
decide por el agente**:

- Todo importe, gravedad y consecuencia lleva **artículo fuente y fecha** visibles.
- En la capa de detención: lenguaje **orientativo, nunca imperativo** ("procede según art. X",
  "valora el art. Y"), con **pie fijo**: *"Orientación basada en la normativa citada; la
  valoración de los indicios y la calificación final corresponden al agente y, en su caso, a
  la autoridad judicial."*
- **Validadores automáticos** de rango de importes (ya implementados en `@agente/shared`) y
  **revisión a dos ojos** para consecuencias y sustancias antes de publicar.
- Canal de **"reportar error"** en cada ficha.
- Un error de importe o un "procede detención" equivocado destruye la confianza y expone a
  responsabilidad: por eso los tests y la revisión de contenido **no son opcionales**.

## 4. Por qué esto además es nuestra ventaja
El valor no es "tener la ley" (la ley es pública y gratis). El valor es **dejarla masticada**:
que el agente, ante una situación, sepa en 3 segundos con qué ley actuar, si puede
multar/detener y con qué consecuencia — sin tener que recordar de memoria tráfico + seguridad
ciudadana + penal + administrativo. **Esa curación, redacción y organización es obra nuestra y
protegible.** Cuanto más propio y trabajado sea el contenido, más lejos estamos del plagio y
más difícil es copiarnos.

## 5. Checklist antes de cobrar
- [ ] Nombre e icono propios, sin símbolos oficiales, marca comprobada (no colisiona).
- [ ] Todos los textos de boletín/sinónimos redactados por nosotros (no copiados).
- [ ] Contenido ingerido desde fuentes oficiales, no desde la app competidora.
- [ ] Política de privacidad y aviso de responsabilidad publicados.
- [ ] Revisión jurídica ligera de PI y de los textos de orientación de detención.
- [ ] Forma jurídica y acuerdo de socios cerrados.
