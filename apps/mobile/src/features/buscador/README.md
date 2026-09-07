# Buscador y ficha de infracción (corazón de la app)

Buscador FTS5 + ficha de infracción, **offline** y compatibles con **Expo Go**, consumiendo el
paquete de contenido SQLite que genera `@agente/content-pipeline`.

## Qué hay aquí

- `search.ts` — núcleo del buscador (SQL + ranking), **agnóstico del motor** (solo depende de
  `SqlRunner`). Buscador en **dos niveles** (ADR-020): `buscarTodo` devuelve primero las
  INFRACCIONES (sinónimo exacto > FTS `busqueda` bm25) y, debajo, los ARTÍCULOS de la ley
  (`buscarArticulos` sobre el índice `busqueda_articulo`), para cubrir términos legales sin
  infracción curada ("temeraria", "alejamiento"). Normaliza la consulta con `normalizarBusqueda`
  (misma función que usó el pipeline al indexar).
- `store.ts` / `BuscadorScreen.tsx` — estado (Zustand) y pantalla de la pestaña **Buscar** con
  `SearchBar`, debounce (~180 ms), lista de `ListRow` (título, gravedad color+texto, importe) y
  estados vacíos. Las búsquedas **sin resultado** se anotan en `userDb` (base para el diccionario
  de sinónimos); **nunca** salen del dispositivo.
- `../ficha/ficha.ts` — carga de la ficha (agnóstica del motor). `../ficha/format.ts` —
  formateadores puros (euros, fecha, competencia). `../ficha/FichaScreen.tsx` — ficha con el
  **orden del §4.4** y el botón **Copiar boletín** sobre el pliegue (ADR-004).
- Componentes nuevos en `src/ui/components/`: `SeverityChip`, `CopyBulletinButton`, `SearchBar`,
  `ListRow`.

## Cómo carga el paquete de contenido (Fase 1, sin CDN)

El paquete viaja **empaquetado como asset** de la app en `apps/mobile/assets/content/`. En
arranque, `db/contentDb.ts`:

1. `expo-asset` resuelve el asset `contenido-<v>.db` y lo deja en caché local.
2. Se copia (`expo-file-system`) al directorio de bases de datos de `expo-sqlite` como
   `content.db`, junto a un marcador de versión (solo se recopia si cambia la versión).
3. Se abre en lectura y se fija `PRAGMA query_only = ON` (el paquete es de solo lectura).

> Se usa extensión **`.db`** (no `.sqlite`) porque Metro ya trata `db` como asset por defecto;
> además `metro.config.js` añade `sqlite` por robustez.

La descarga desde CDN + verificación de firma Ed25519 + swap atómico llegan en una fase
posterior; el **contrato de consulta ya es el definitivo**.

## Regenerar el paquete empaquetado

```bash
# 1. Construir el paquete EN VIVO (BOE): trae el articulado completo, necesario para el segundo
#    nivel del buscador (artículos). El modo --offline solo trae el RGC (fixture) y no sirve
#    para probar "temeraria"/"alejamiento".
corepack pnpm -F @agente/content-pipeline build:content

# 2. Copiar el .sqlite a los assets de la app, con extensión .db
cp packages/content-pipeline/output/contenido-0.1.0.sqlite \
   apps/mobile/assets/content/contenido-0.1.0.db
cp packages/content-pipeline/output/contenido-0.1.0.manifest.json \
   apps/mobile/assets/content/contenido-0.1.0.manifest.json
```

Si cambia la versión de contenido, actualiza `BUNDLED_CONTENT_VERSION` y el `import` del asset en
`src/db/contentDb.ts`.

## Probar el buscador

- **Tests (sin dispositivo):** `corepack pnpm -F @agente/mobile test`.
  - `search.test.ts` / `format.test.ts` — lógica pura (ranking, normalización, formateo).
  - `search.integration.test.ts` — abre el `.db` **real** con `node:sqlite` (mismo motor FTS5
    del pipeline) por la MISMA interfaz `SqlRunner` que usa la app, y comprueba:
    - `"faro roto"` → `inf-alumbrado-deficiente` (sinónimo exacto, primero).
    - `"sin seguro"` → `inf-sin-seguro`, cuya ficha lleva **inmovilización** (orientativa + fuente).
    - `"móvil"` (tildes plegadas) → `inf-movil-conduciendo`.
    - `"rgc 18"` (por artículo) → `inf-movil-conduciendo`.
    - **Segundo nivel (artículos):** `"temeraria"` → art. 380 CP (sin infracción curada),
      `"alejamiento"` → `del-quebrantamiento` + art. 468 CP, `"agresion"` → `del-lesiones`.
- **En dispositivo (Expo Go):** `corepack pnpm -F @agente/mobile start` y abrir en iOS/Android.

## Limitaciones conocidas

- **Web:** en Fase 1 el paquete no se instala en web (`Platform.OS === 'web'` → el buscador
  muestra un aviso). `expo-sqlite` sí soporta web vía wasm, pero la instalación del asset se
  resolverá más adelante. Usa iOS/Android para probar.
- **Bundling en este monorepo (pnpm):** `corepack pnpm -F @agente/mobile start` levanta Metro,
  pero `expo export`/el primer bundle fallan al resolver dependencias transitivas de la runtime de
  Expo (`@expo/metro-runtime`, `whatwg-fetch`) que pnpm no hoistea al `node_modules` raíz. Es un
  tema de **configuración de resolución Metro↔pnpm del monorepo** (ajeno a esta feature): lo
  suyo es decidir con el arquitecto `node-linker=hoisted` en un `.npmrc` (solución estándar de
  Expo + pnpm) o un `resolveRequest` en `metro.config.js`.
