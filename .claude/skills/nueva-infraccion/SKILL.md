---
name: nueva-infraccion
description: >-
  Añade una nueva infracción al contenido de la app con todos los campos obligatorios y su
  validación. Úsala cuando el usuario quiera dar de alta o completar una infracción (importe,
  puntos, gravedad, texto de boletín, consecuencias, sinónimos, fuente). Garantiza que cumple los
  mínimos de publicación de la especificación (sección 8.3) antes de darla por buena.
---

# Alta de una infracción

Objetivo: crear una `Infraccion` completa y válida según `@agente/shared`, lista para revisión.

## Pasos

1. **Recoge los datos** (pregunta lo que falte):
   - Título corto (el que buscaría el agente, en lenguaje natural).
   - Norma y artículo fuente (p. ej. "RGV art. 11") + URL del BOE consolidado.
   - Gravedad (leve/grave/muy_grave/delito) y tipo (administrativa/penal).
   - Importe y, si aplica, importe con pronto pago; puntos.
   - Texto para el boletín (redactado, propio; con variantes si aplica: delantero/trasero…).
   - Consecuencias con su artículo (grúa/inmovilización/detención/decomiso…).
   - Al menos **2 sinónimos** de calle.
   - Ámbito y territorio (si es autonómica/municipal).
   - Fecha de actualización.

2. **Construye el objeto** con los esquemas Zod de `@agente/shared` (`Infraccion`, `Sinonimo`,
   `Consecuencia`). Valida en runtime con `Infraccion.parse(...)`.

3. **Pasa los validadores de calidad**:
   - `validarImporte(infraccion, marco)` con el marco correcto ('trafico' o
     'seguridad_ciudadana'). Corrige cualquier importe fuera de rango.
   - `validarMinimosPublicacion(infraccion, numSinonimos)`. Resuelve todos los problemas.

4. **Revisión jurídica**: lanza el agente `revisor-juridico` para verificar fuente, rangos,
   lenguaje orientativo en consecuencias y marcar lo no verificado como "a verificar".

5. **Marca como "requiere revisión"** para el panel de administración; no publiques directamente.
   Toda infracción publicada necesita: artículo enlazado, importe (si administrativa), gravedad,
   texto de boletín, ≥2 sinónimos, fuente y fecha.

## Recuerda
- Los textos de boletín y sinónimos son NUESTROS, redactados de cero (nunca copiados de otra app).
- Lenguaje orientativo, nunca imperativo. Fuente y fecha siempre visibles.
