# Sustancias (§4.7)

Pantalla dedicada para orientar entre **probable consumo propio** (posible infracción
administrativa, LO 4/2015 art. 36.16) e **indicios de tráfico** (posible delito, art. 368 CP),
a partir de la tabla `sustancia` que ya viaja en el paquete de contenido SQLite.

## Piezas

- `sustancias.ts` — motor sobre `SqlRunner` (mismo patrón que `normas/normas.ts`): lee la tabla
  `sustancia` del paquete y expone funciones **puras** (parseo defensivo, base del peso, filtrado,
  orientación). Delega el veredicto orientativo en `orientarSustancia` de `@agente/shared` (fuente
  única del motor). No redefine tipos: usa el modelo `Sustancia` compartido.
- `SustanciasListScreen.tsx` — lista buscable (nombre + jerga de calle). Ruta `/sustancias`.
- `SustanciaDetalleScreen.tsx` — ficha + **orientador**. Ruta `/sustancias/[sustanciaId]`.
- Tests: `sustancias.test.ts` (funciones puras) y `sustancias.integration.test.ts` (contra el
  `.sqlite` REAL empaquetado, vía `node:sqlite`).

## Orientador y aviso de pureza

El orientador NO es una calculadora tajante: a partir de la cantidad aprehendida (g) muestra una
orientación con lenguaje orientativo y **siempre** el pie de responsabilidad (`PIE_SUSTANCIAS`): la
calificación final es judicial.

Aviso destacado de **pureza** (lo pidió el revisor jurídico): para cocaína, heroína, MDMA,
anfetamina y metanfetamina el umbral está en **peso puro**, así que el orientador ofrece un campo
de pureza (%) y **reduce** la cantidad a la riqueza del laboratorio antes de comparar, para no
sobre-marcar "tráfico" con droga callejera de baja riqueza. Para cannabis y hachís el umbral es
**peso bruto** (no se reduce a principio activo). La base se detecta a partir de las notas de
pureza del paquete (`basePesoUmbral`), no de una lista fija.

## Privacidad

Nada de lo que introduce el agente (cantidad, pureza) se persiste ni se envía: vive solo en el
estado local de la pantalla. Todo funciona sin red (offline-first).
