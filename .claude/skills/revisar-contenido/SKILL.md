---
name: revisar-contenido
description: >-
  Puerta de calidad del contenido antes de publicar una versión (ContentVersion). Úsala antes de
  generar/publicar un paquete de contenido o cuando el usuario pida "revisar el contenido" o
  "comprobar antes de publicar". Ejecuta los validadores, la revisión jurídica y comprueba los
  mínimos de la especificación.
---

# Revisión de contenido antes de publicar

Un importe erróneo o una consecuencia mal citada destruye la confianza. Esta puerta es
obligatoria antes de cualquier `ContentVersion`.

## Pasos

1. **Validación automática** (con `@agente/shared`):
   - `validarImporte` en cada infracción administrativa, con su marco (tráfico / seguridad
     ciudadana). Reporta las que estén fuera de rango.
   - `validarMinimosPublicacion` en todas: artículo, importe, gravedad, texto de boletín,
     ≥2 sinónimos, fuente.
   - Ejecuta la suite: `corepack pnpm -F @agente/shared test` (y la del content-pipeline si aplica).

2. **Revisión jurídica**: lanza el agente `revisor-juridico` sobre las infracciones nuevas o
   modificadas y sobre toda regla de detención/sustancias (revisión a dos ojos).

3. **Fuente y fecha**: confirma que cada elemento publicado enlaza a su artículo (BOE consolidado
   preferente) y tiene fecha de actualización visible.

4. **Lenguaje**: consecuencias y detención en tono **orientativo**, nunca imperativo; pie fijo de
   responsabilidad presente.

5. **Novedades**: genera las entradas `Novedad` (qué norma, qué artículos, resumen de 2 líneas,
   fecha) para la versión.

6. **Veredicto**: resume APTO / APTO CON CORRECCIONES / NO APTO y la lista de correcciones
   pendientes. No publiques nada con problemas sin resolver.
