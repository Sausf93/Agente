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

Fase 1 en curso. **Hecho**: cliente del BOE + parser del XML consolidado → `Articulo`
de `@agente/shared`, con detección de cambios por hash. Primera norma validada de extremo
a extremo: **RGC (RD 1428/2003, BOE-A-2003-23514)**.

### Fuente y endpoints del BOE (datos abiertos, verificados en septiembre de 2026)

- Texto consolidado: `GET https://www.boe.es/datosabiertos/api/legislacion-consolidada/id/{ID}/texto`
- Metadatos: `GET https://www.boe.es/datosabiertos/api/legislacion-consolidada/id/{ID}/metadatos`

Ambos devuelven XML `<response><status/><data>…`. El texto se organiza en `<bloque>` con
`tipo` = `preambulo` | `encabezado` (títulos/capítulos/secciones) | `precepto` (artículos y
disposiciones) | `firma` | `nota_inicial`. Cada `<bloque tipo="precepto">` contiene una o
varias `<version>` (historial de redacciones) con `fecha_vigencia`; los párrafos van en
`<p class="articulo|parrafo|parrafo_2|imagen|…">`, con tablas HTML (`<table>`) e imágenes
(`<img>`) en anexos.

### Cómo se ejecuta

```
# Extracción del RGC desde el BOE en vivo, con resumen legible (nº de artículos + muestra):
corepack pnpm -F @agente/content-pipeline extract:rgc

# Igual pero SIN red, usando el fixture recortado (para revisar sin descargar):
corepack pnpm -F @agente/content-pipeline extract:rgc:offline

# Tests deterministas (parser, diff y cliente; no tocan la red) y typecheck estricto:
corepack pnpm -F @agente/content-pipeline test
corepack pnpm -F @agente/content-pipeline typecheck
```

### Decisiones de mapeo (spec §6.1 ↔ realidad del BOE)

- **Granularidad = un `Articulo` por `precepto`.** El `numero` guarda `"5"`, `"único"`,
  `"5 bis"` o la etiqueta de la disposición. El ejemplo `"11.1"` de la spec (apartado) queda
  DENTRO del texto en Markdown; partir por apartado desde texto libre no es fiable y se deja
  como refinamiento posterior. → anotar en la spec si se confirma.
- **Versión vigente**: de cada precepto con historial se elige la `<version>` de mayor
  `fecha_vigencia` no futura respecto a la fecha de consolidación; su `fecha_vigencia` es el
  `validFrom` del artículo.
- **Notas editoriales** del BOE (`<p class="nota_pie">` "Se modifica el apartado X por…") se
  descartan del texto legal: ensuciarían el hash y el diff. La procedencia queda a nivel de
  versión.
- **`id` determinista** = `"{ID_BOE}:{id_bloque}"` (p. ej. `BOE-A-2003-23514:a5`), estable
  entre reejecuciones para poder diferenciar por artículo.
- **Fuente y fecha** viajan siempre: `Norma.urlBoe`, `Norma.fechaConsolidacion` y
  `Articulo.validFrom` por versión.

## Qué falta (siguientes iteraciones)

- [ ] **LSV** (RDL 6/2015, BOE-A-2015-11722) y **RGV** (RD 2822/1998) — declaradas en
      `src/catalogo.ts` (`implementada: false`); verificar el ID BOE del RGV antes de activarlo.
- [ ] **Codificado DGT** (`parsers/dgt`): PDF/Excel → `Infraccion` enlazadas a artículos.
- [ ] **Empaquetado SQLite + FTS5** + tabla de sinónimos, firma Ed25519 y `ContentVersion`.
- [ ] **`Novedad`** a partir del `diff` y marca "requiere revisión" en el panel (el contenido
      legal NO se publica directo: pasa por revisión a dos ojos, §8.3 y nota legal).
- [ ] Persistencia de la consolidación anterior para el diff incremental (hoy el diff es una
      función pura entre dos parseos; falta el almacén de la versión previa).
- [ ] Render fino de tablas/imágenes de anexos (señales) si el buscador/ficha lo requieren.
