# @agente/content-pipeline

Ingesta de fuentes oficiales → paquete de contenido SQLite firmado que descargan las apps.
Es **el corazón del producto** (sección 8 de la especificación): si el contenido se
desactualiza o trae un importe erróneo, la app es "una más".

## Flujo objetivo

```
BOE (XML consolidado) ─┐
DGT (codificado)      ─┤
Boletines autonómicos ─┼─▶ parsers ─▶ normalización ─▶ validación (calidad) ─▶
Ordenanzas municipales ┤                                    packages/shared::validators
Carreteras/PK (PostGIS)┘
                          ─▶ build SQLite + FTS5 ─▶ firma + ContentVersion + Novedad ─▶ CDN
```

## Etapas (a implementar en fases)

1. **`sources/boe`** — cliente de la API del BOE y descarga de texto consolidado por norma
   (`https://www.boe.es/datosabiertos/`). Detección de cambios por hash del texto.
2. **`parsers/boe-xml`** — XML consolidado → `Articulo[]` en Markdown, con `orden` y `hash`.
3. **`parsers/dgt`** — codificado de infracciones (PDF/Excel) → `Infraccion[]` enlazadas a
   artículos del RGC/RGV/LSV.
4. **`validate`** — aplica `validarImporte` y `validarMinimosPublicacion` de `@agente/shared`.
   Ninguna infracción inválida se publica.
5. **`build`** — genera SQLite con FTS5 (buscador offline) + tabla de sinónimos.
6. **`sign`** — firma el paquete, crea `ContentVersion` (semver) y las `Novedad`.

## Estado

Fase 0: solo tipos y CLI stub. La ingesta real empieza en la Fase 1 (tráfico: LSV, RGC, RGV).
