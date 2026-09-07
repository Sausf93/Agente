# Contrato del paquete de contenido SQLite (`content.db`)

Este documento es el **contrato entre el pipeline** (`@agente/content-pipeline`, que CONSTRUYE
el paquete) y **la app** (`apps/mobile`, que lo CONSULTA). Si cambia el esquema, se actualiza
aquí y se sube `ESQUEMA_PAQUETE_VERSION` en `@agente/shared`.

- Fuente única de constantes compartidas: `@agente/shared` →
  `ESQUEMA_PAQUETE_VERSION`, `TABLAS`, `FTS_COLUMNAS`, `FTS_TOKENIZER`, `FTS_PESOS_BM25`,
  `FTS_PESOS_BM25_ORDENADOS`, `EstadoRevision`, `normalizarBusqueda()`.
- El paquete es **solo lectura** en el dispositivo. El FTS viene **precompilado** (la app no
  indexa; ADR-010, punto 5). Distribución firmada + **swap atómico** (ADR-010).

## Cómo se construye

```
corepack pnpm -F @agente/content-pipeline build:content            # RGC en vivo del BOE
corepack pnpm -F @agente/content-pipeline build:content --offline  # fixture local, sin red
```

Genera en `output/`:

- `contenido-<version>.sqlite` — el paquete.
- `contenido-<version>.manifest.json` — el `ContentVersion` (ver más abajo).

Flujo interno: `seed de infracciones` (+ artículos del RGC parseados del BOE) → **validación**
(`validarImporte` + `validarMinimosPublicacion` de shared, §8.3; lanza si algo incumple) →
`construirPaquete()` escribe SQLite + FTS5 → `construirManifiesto()` calcula el hash y deja el
hueco de firma.

### Marcos de importe (`MarcoImporte` de shared)

Cada infracción del seed declara con qué marco se valida su importe, porque no todas siguen los
tramos fijos de tráfico:

| marco                      | rango                                              | uso                                                    |
| -------------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| `trafico`                  | leve 0–100, grave 200, muy grave 500 (LSV art. 80) | infracciones de tráfico ordinarias                     |
| `seguridad_ciudadana`      | leve 100–600, grave 601–30.000, muy grave 30.001–600.000 (LO 4/2015 art. 39) | seguridad ciudadana (LO 4/2015) |
| `seguro_obligatorio`       | 601–3.005 € (LRCSCVM art. 3)                       | conducir sin seguro                                    |
| `velocidad`                | 100–600 € (cuadro graduado LSV)                    | exceso de velocidad (importe/puntos por tramo de km/h) |
| `alcohol_drogas`           | 500–1.000 € (cuadro DGT)                           | alcoholemia y drogas por vía administrativa            |
| `municipal` / `autonomico` | sin rango único                                    | ordenanzas/CCAA: solo coherencia, revisión a dos ojos  |

Los marcos `velocidad` y `alcohol_drogas` se añadieron para las infracciones "reina" cuyo importe
excede los topes fijos de `trafico` (una alcoholemia de 1.000 € o un exceso de 600 € son legales
pero no encajarían en `grave=200`/`muy_grave=500`). Se modelan como rango único graduable, igual
que `seguro_obligatorio`. Los delitos (`tipo = 'penal'`, p. ej. negativa a la prueba, art. 383 CP)
no llevan importe y `validarImporte` los ignora.

El marco `seguridad_ciudadana` (LO 4/2015) valida por gravedad, pero la horquilla legal es
amplísima (una grave va de 601 a 30.000 €). El seed fija como referencia el **extremo inferior**
de cada categoría (grave = 601 €, leve = 100 €) y lo advierte en `nota_revision`; el importe
efectivo lo gradúa la autoridad (art. 33). El pronto pago (procedimiento abreviado, **art. 54**
LO 4/2015, no art. 85) reduce el 50 % en infracciones graves y leves → `importe_reducido_eur`.

## Versión de esquema

`ESQUEMA_PAQUETE_VERSION = 1`. La app declara el rango que soporta; si un paquete exige un
esquema mayor, la app **conserva el contenido actual** y sugiere actualizar (no rompe).
Disponible en la tabla `meta` (`schema_version`) y en el manifiesto (`schemaVersion`).

## Tablas

Todos los IDs son `TEXT`. Los campos JSON se guardan como `TEXT` con JSON serializado; la app
los parsea con los esquemas Zod de shared (`Competencia`, `VarianteBoletin`…).

### `meta` (clave/valor)

| clave             | ejemplo     | uso                                       |
| ----------------- | ----------- | ----------------------------------------- |
| `schema_version`  | `"1"`       | acoplamiento app↔contenido                |
| `content_version` | `"0.1.0"`   | semver del contenido                      |
| `fecha`           | ISO 8601    | "Actualizado el…" de la ficha (§4.4, pie) |
| `generado_en`     | ISO 8601    | trazabilidad de la build                  |
| `firma_algoritmo` | `"ed25519"` | algoritmo de firma previsto               |

### `norma`

`id`, `codigo` (`"RGC"`), `titulo`, `tipo` (`ley|reglamento|ordenanza|codificado`),
`ambito` (`estatal|autonomico|municipal`), `territorio_id?`, `origen` (`oficial|personal`),
`url_boe?`, `fecha_consolidacion?` (`YYYY-MM-DD`, fuente BOE).

### `articulo`

`id`, `norma_id→norma`, `numero` (`"18"`, `"5 bis"`, `"único"`), `titulo?`, `texto` (markdown),
`idioma` (`"es"`), `orden`, `hash` (sha256 del texto), `valid_from` (ISO), `valid_to?`
(`NULL` = vigente). Índice: `(norma_id, orden)`.

### `infraccion` — la unidad de consulta del agente

`id`, `articulo_id→articulo`, `codigo_dgt?`, `titulo_corto`,
`gravedad` (`leve|grave|muy_grave|delito`), `tipo` (`administrativa|penal`),
`importe_eur?`, `importe_reducido_eur?` (pronto pago), `puntos?`, `texto_boletin`,
`variantes_boletin` (JSON `VarianteBoletin[]`), `competencia` (JSON `Competencia`),
`ambito`, `territorio_id?`, `desplaza_id?` (capas, ADR-006), `origen`,
`valid_from`, `valid_to?`, **`estado_revision`** (`verificado|pendiente_revision`),
**`nota_revision?`** (qué confirmar; "a verificar"). Índice: `(articulo_id)`.

> **Revisión editorial (§8.2/8.3).** El pipeline NO publica nada como `verificado`: por defecto
> `pendiente_revision`. La app **debe** mostrar un distintivo "pendiente de revisión / a
> verificar" cuando `estado_revision = 'pendiente_revision'` (y puede exponer `nota_revision`).

### `sinonimo`

`id`, `termino` (tal cual, `"faro roto"`), `termino_normalizado`
(`normalizarBusqueda(termino)`), `peso`, `infraccion_id?`, `articulo_id?` (exactamente uno).
Índices: `(termino_normalizado)`, `(infraccion_id)`.

### `consecuencia` — capa de consecuencias (§4.6), lenguaje orientativo

`id`, `tipo` (`detencion|inmovilizacion|deposito|decomiso|retirada_permiso|identificacion`),
`regla` (JSON), `texto_corto` (orientativo: "procede/puede…", **nunca imperativo**),
`fuente` (artículo), `infraccion_id?`, `articulo_id?`. Índice: `(infraccion_id)`.

### `novedad`

`id`, `content_version`, `norma_id?`, `articulos` (JSON `string[]`), `resumen`, `fecha`.

### `busqueda` (FTS5, virtual)

Columnas EN ORDEN (`FTS_COLUMNAS`): `titulo_corto`, `texto_boletin`, `sinonimos`,
`articulo_numero`, + `infraccion_id UNINDEXED`. `tokenize = '${FTS_TOKENIZER}'`
(`unicode61 remove_diacritics 2`: pliega mayúsculas, tildes y ñ→n). Contenido insertado ya
**normalizado** con `normalizarBusqueda`. Una fila por infracción.

## Normalización

`normalizarBusqueda(texto)` de shared: minúsculas, sin tildes (ni ñ), espacios colapsados. La
app **debe** pasar la consulta del agente por esta MISMA función antes de `MATCH` y antes del
lookup exacto de sinónimo. Coincide con el plegado del tokenizador.

## Modelo de ranking (§4.3)

Orden: **sinónimo exacto > título > texto > popularidad**. Se resuelve en dos pasos:

1. **Sinónimo exacto** (nivel superior): lookup directo en `sinonimo` por `termino_normalizado`
   = consulta normalizada. Estos resultados van SIEMPRE arriba.
2. **FTS bm25 ponderado**: `bm25(busqueda, …pesos…)` con `FTS_PESOS_BM25_ORDENADOS`
   (`titulo_corto=10, texto_boletin=1, sinonimos=6, articulo_numero=4`). En SQLite un bm25
   **más negativo es mejor** → `ORDER BY score` ascendente.
3. **Popularidad** (desempate final): la app la aporta desde su tabla local de eventos de uso
   por cuerpo (`EventoUso`, §6.2). **No viaja en el paquete.**

### Ejemplo — buscar (sinónimo exacto + FTS)

```sql
-- Paso 1: sinónimo exacto (parametrizar con normalizarBusqueda(consulta))
SELECT DISTINCT infraccion_id
FROM sinonimo
WHERE termino_normalizado = :consultaNorm;

-- Paso 2: FTS ponderado (pesos = FTS_PESOS_BM25_ORDENADOS)
SELECT b.infraccion_id,
       bm25(busqueda, 10, 1, 6, 4) AS score
FROM busqueda b
WHERE busqueda MATCH :consultaNorm
ORDER BY score;               -- ascendente: más negativo = más relevante
```

Comprobado en tests: `"faro roto"`→`inf-alumbrado-deficiente`, `"sin seguro"`→`inf-sin-seguro`,
`"móvil"`→`inf-movil-conduciendo` (tildes plegadas), `"rgc 18"`→`inf-movil-conduciendo`.

### Ejemplo — cargar una ficha (§4.4)

```sql
-- Cabecera + fuente (join a artículo y norma)
SELECT i.*, a.numero AS articulo_numero, n.codigo AS norma_codigo, n.url_boe
FROM infraccion i
JOIN articulo a ON a.id = i.articulo_id
JOIN norma    n ON n.id = a.norma_id
WHERE i.id = :infraccionId;

-- Consecuencias (chips con fuente, orientativas)
SELECT tipo, texto_corto, fuente
FROM consecuencia
WHERE infraccion_id = :infraccionId;

-- Sinónimos (para depurar el diccionario / "también conocido como")
SELECT termino FROM sinonimo WHERE infraccion_id = :infraccionId;
```

La **fuente visible** de la ficha (§4.4, punto 10) se compone de `norma_codigo` + `articulo_numero`

- `url_boe`; la **fecha** ("Actualizado el…") sale de `meta.fecha`. Si `estado_revision` =
  `pendiente_revision`, mostrar el distintivo y, si procede, `nota_revision`.

## Manifiesto y firma (`ContentVersion`)

`contenido-<version>.manifest.json`:

```json
{
  "version": "0.1.0",
  "fecha": "2026-09-04T00:00:00.000Z",
  "schemaVersion": 1,
  "hash": "<sha256 hex de los bytes del .sqlite>",
  "tamanoBytes": 126976,
  "algoritmoFirma": "ed25519",
  "firma": null,
  "changelog": { "resumen": "…" }
}
```

La app: descarga a `.tmp` → **verifica la firma sobre los bytes** → renombrado atómico a
`content.db` + actualiza el puntero de versión; conserva el anterior hasta confirmar que abre
(rollback). **Fase 1:** `firma` es `null` (stub `firmarPaquete()` documentado); cuando exista
la clave Ed25519 del publicador se rellenará y la app rechazará paquetes sin firma válida.
