# Decisiones de arquitectura (ADR)

Registro de decisiones que se apartan o concretan la especificación. Cada una lleva estado:
**propuesta** (a confirmar por los fundadores), **aceptada** o **revertida**.

---

## ADR-001 · v1 sin login: app local-first

- **Estado:** propuesta (recomendada) — a confirmar por el fundador.
- **Fecha:** 2026-09-03.
- **Contexto:** la especificación original (secciones 4.1 y 6.2) asume cuentas con correo +
  contraseña. La app competidora (SPPLB) no tiene login y guarda todo en local. El fundador
  cuestiona si el login aporta valor suficiente.

- **Decisión propuesta:** en la v1, la app es **local-first y sin cuenta**. Perfil,
  favoritos, cuadrante y ajustes viven en el dispositivo. Los pagos van por la tienda con
  **RevenueCat usando un id anónimo** ligado a la cuenta de Apple/Google.

- **Consecuencias positivas:**
  - **Onboarding sin fricción** → más adopción por boca a boca (el canal principal, ver
    `perspectivas/03-marketing.md`). Convergen aquí las recomendaciones de UX (cuenta
    diferida) y marketing.
  - **RGPD casi a cero**: sin correos ni contraseñas en servidor, la superficie legal se
    reduce drásticamente. Encaja con el principio de "mínimos datos".
  - **Menos alcance**: desaparece casi toda la épica E-02 (auth, verificación, recuperación).
  - **Backend mínimo**: entrega de contenido (CDN del paquete SQLite firmado) + panel admin +
    analítica anónima + webhooks de RevenueCat. Sin Supabase Auth en v1.

- **Cómo se cubren las funciones que "pedían" cuenta:**
  | Necesidad | Solución sin login |
  |---|---|
  | Enviar PDF al correo | Compositor de correo nativo del dispositivo (sin servidor) |
  | Restaurar compra en móvil nuevo | "Restaurar compras" por la cuenta de la tienda (RevenueCat) |
  | No perder el cuadrante al cambiar de móvil | Backup **opcional** vía iCloud/Google Drive nativo; sync entre dispositivos como extra opt-in posterior |
  | Beta gratis | **Códigos promocionales** de las tiendas (más limpio para revisión de Apple) |

- **Riesgos / cuándo reconsiderar:** si el sync fiable del cuadrante entre dispositivos se
  vuelve prioritario, se añade una **identidad opcional** (p. ej. Sign in with Apple) solo
  para backup, sin convertirla en muro de entrada.

---

## ADR-002 · Backend mínimo en v1

- **Estado:** propuesta (deriva de ADR-001).
- **Decisión:** el backend de v1 se limita a: (1) **CDN** con los paquetes de contenido SQLite
  firmados y su `ContentVersion`; (2) **panel de administración** (Next.js) para los dos
  fundadores; (3) endpoint de **analítica anónima**; (4) **webhooks de RevenueCat** (opcional,
  solo si se necesita reconciliar estado). Se evalúa Supabase (Postgres + Storage + Edge
  Functions) por Storage/CDN y PostGIS para carreteras, pero **sin usar Auth** en v1.

---

## ADR-003 · Navegación: el buscador es el producto

- **Estado:** propuesta (de `perspectivas/01-ux.md`).
- **Contexto:** la spec propone 5 pestañas: Inicio · Normativa · Plantillas · Cuadrante · Mapa.
- **Decisión propuesta:** reordenar a **Buscar · Normas · Documentos · Cuadrante · Más**, y
  **bajar "Mapa" de nivel 1** a apoyo contextual dentro de la ficha/documento (el PK se usa al
  generar un documento, no como destino independiente). La home se llama "Buscar" porque el
  buscador es el núcleo del producto.
- **Pendiente:** validar con el cofundador agente antes de fijarlo.

---

## ADR-004 · Ficha de infracción: consecuencia y "copiar" sobre el pliegue

- **Estado:** propuesta (de `perspectivas/01-ux.md` y las tres perspectivas de cuerpo).
- **Decisión propuesta:** en la ficha, mostrar **sobre el pliegue** (sin scroll): título,
  gravedad, importe/puntos como tiles escaneables, la **consecuencia operativa** (grúa /
  inmovilización / detención sí-no, con artículo) y el **botón Copiar boletín**. El texto
  largo del boletín y el artículo completo van debajo. Las tres perspectivas coinciden: la
  consecuencia operativa a menudo importa más que el importe.

---

## ADR-005 · Precio: mensual 2,99 € como protagonista (volumen sobre ARPU)

- **Estado:** aceptada (decisión del fundador).
- **Fecha:** 2026-09-03.
- **Contexto:** el análisis de marketing recomendaba destacar el anual (24,99 €) para reducir
  churn y adelantar caja. El fundador prioriza **maximizar el número de agentes que adoptan la
  app** sobre el ingreso por usuario.
- **Decisión:** el **mensual 2,99 €** es el precio protagonista y el mensaje comercial ("3
  cafés al mes", se paga sin darse cuenta). El anual existe como opción secundaria y discreta,
  no destacada. Se mantiene prueba de 14 días y freemium de 5 consultas/día.
- **Razonamiento:** en un mercado de ~250k agentes con boca a boca como canal, la penetración
  crea el foso (más usuarios → más búsquedas sin resultado → mejor buscador; más evangelistas).
  La barrera de entrada baja pesa más que el ARPU. A 2,99 €, 2.500 subs siguen dando el objetivo
  de 6–7k €/mes.
- **Reconsiderar si:** el churn mensual se dispara (>8–10 %/mes); entonces se puede empujar el
  anual con un descuento visible sin dejar de ofrecer el mensual como puerta de entrada.

## ADR-006 · Modelo de contenido por capas de territorio con puntero de desplazamiento

- **Estado:** aceptada (implementada en `packages/shared`).
- **Fecha:** 2026-09-03. Detalle en `analisis/08-contenido-multiterritorio.md`.
- **Decisión:** cada contenido pertenece a una capa (`ambito`) + `territorioId`; el perfil ve su
  **cadena territorial** `[ccaa, provincia, municipio]` (lo estatal es `territorioId = null`,
  visible siempre). El solapamiento se modela con **un único puntero `Infraccion.desplazaId`**
  (null = añade; relleno = sustituye/oculta a la capa inferior). Resolución determinista y
  testeada en `shared` (`territorio.ts`: `cadenaTerritorial`, `esVisible`, `resolverVisibles`).
- **Consecuencia:** el **cuerpo** no filtra visibilidad (eso es territorio); solo genera aviso de
  competencia (ADR-007). Reconsiderar si aparecen desplazamientos 1→N (`desplazaId` → `desplazaIds[]`).

## ADR-007 · Competencia como aviso orientativo, no como filtro

- **Estado:** aceptada (implementada: `avisoCompetencia` en `territorio.ts`).
- **Decisión:** `Competencia.cuerpos` con vocabulario cerrado (`CuerpoCompetente`). La ficha
  muestra un banner **orientativo** (motivo cuerpo o vía urbana/interurbana) si algo no suele ser
  de tu competencia, pero **nunca oculta** contenido. Lenguaje no imperativo (regla `CLAUDE.md`).

## ADR-008 · Un solo paquete SQLite con filtrado en cliente

- **Estado:** aceptada.
- **Decisión:** un único paquete de contenido con todas las capas oficiales; el cliente filtra por
  cadena territorial (`WHERE territorio_id IN (...)`). Reutiliza el swap atómico y el delta ya
  diseñados; mínima complejidad para un equipo de una persona. El esquema queda listo para partir
  a packs por territorio **sin migración** si se cruza un umbral (~40-50 MB o municipal desbordado).

## ADR-009 · "Mi ordenanza personal" en tabla local, con promoción a oficial

- **Estado:** aceptada (concreta una decisión abierta previa).
- **Decisión:** el contenido `origen='personal'` (ordenanza que el Local carga cuando su municipio
  aún no está publicado) vive en **tablas SQLite locales separadas** del paquete firmado; nunca
  sube al servidor salvo donación opt-in. Al curarse, se publica como `origen='oficial'` para ese
  territorio y beneficia a todo el municipio. Encaja con local-first (ADR-001/002), sin backend nuevo.

## ADR-010 · Arquitectura de la app móvil (`apps/mobile`)

- **Estado:** aceptada (implementada como scaffold de Fase 0).
- **Fecha:** 2026-09-04.
- **Contexto:** hay que fijar los cimientos de la app Expo sin caer en
  sobre-ingeniería y de forma sostenible por una persona. La spec §7.1 deja abiertas
  varias opciones (estado, versión de SDK); este ADR las concreta.

### Decisiones

1. **Expo SDK 57 (estable)** + React Native 0.86.3 + React 19.2 + TypeScript estricto.
   Se elige la **última estable madura** (57.0.x, ~20 parches publicados) porque un
   proyecto que nace hoy debe partir de la base con más vida por delante y menos
   deuda de actualización; New Architecture activada (por defecto en SDK 57).
   Versiones de librerías fijadas a las que empareja el SDK (`bundledNativeModules`).
2. **Expo Router** (rutas por ficheros en `app/`). Grupo `(tabs)` con las 5 pestañas
   de ADR-003: **Buscar · Normas · Documentos · Cuadrante · Más**. El Mapa/PK no es
   pestaña: es apoyo contextual. Arranque instantáneo, sin splash bloqueante (UX F1).
3. **Estado: Zustand, y NADA de React Query en v1.** La app es offline-first
   (ADR-001/002): en el camino crítico no hay estado de servidor que cachear/refetch.
   Lo remoto se limita a descarga de contenido en segundo plano y a RevenueCat, que
   no encajan en el modelo de React Query. Añadir React Query ahora sería coste sin
   beneficio. **Reconsiderar** si aparece una capa de datos remota real (p. ej. sync
   del cuadrante entre dispositivos). Zustand guarda ajustes, perfil, favoritos y el
   borrador del cuadrante, todo en el dispositivo.
4. **Capa de datos sobre expo-sqlite = dos bases separadas:**
   - **Contenido (solo lectura):** el paquete SQLite firmado. Módulo `src/db` que lo
     abre y expone consultas tipadas que devuelven tipos de `@agente/shared`.
   - **Datos locales del usuario (lectura/escritura):** cuadrante, favoritos, "mi
     ordenanza personal" (ADR-009). Separada del paquete para poder sustituir el
     contenido sin tocar los datos del usuario.
5. **Estrategia offline (paquete de contenido):**
   - Distribución como fichero SQLite **firmado Ed25519** por `ContentVersion`.
   - **Verificación de firma sobre los bytes ANTES de instalar**; si falla, se descarta.
   - **Sustitución atómica:** descarga a `.tmp` → verifica → renombrado atómico a
     `content.db` + actualización del puntero de versión. Se conserva el fichero
     anterior hasta confirmar que el nuevo abre y consulta (rollback).
   - Las **tablas FTS5 vienen precompiladas** dentro del paquete (las crea el
     pipeline): la app **no indexa en el dispositivo** → arranque en frío rápido. El
     buscador consulta con `MATCH` y el **ranking es una función pura** (jerga de
     calle), testeada aparte del runtime RN.
6. **Migraciones / versionado de esquema:**
   - **Contenido:** el paquete declara un `schema_version`; la app declara el rango
     que soporta. Si el paquete exige un esquema mayor que el de la app, se conserva
     el contenido actual y se sugiere actualizar la app (contenido y app quedan
     desacoplados).
   - **Datos locales:** migraciones secuenciales versionadas que corren al arrancar,
     con tabla `meta(user_data_version)`. **Tests obligatorios** de migración: el
     cuadrante debe sobrevivir a cualquier actualización (es el fallo de SPPLB).
7. **Theming:** `src/ui/theme.ts` con los tokens de `perspectivas/02-ui.md`
   (neutros, marca azul pizarra, gravedad leve/grave/muy grave/delito en claro y
   oscuro). Sigue el esquema del sistema (`useColorScheme`), con override desde
   Ajustes vía Zustand (`useAppTheme`). Regla codificada: la gravedad **nunca es solo
   color** (color + etiqueta + icono). Un único punto de conversión enum de dominio
   `Gravedad` → clave visual `Severity` (`severityFromGravedad`, pura y testeada).
8. **Estructura de carpetas:** `app/` (solo rutas y composición) + `src/` con
   `ui/` (tema y componentes transversales), `features/` (por dominio funcional),
   `db/` (acceso a SQLite), `store/` (Zustand). Frontera clara: `app/` compone, no
   contiene lógica de negocio; los tipos vienen siempre de `@agente/shared`.
9. **Tests:** runner **Vitest** (coherente con `shared` y `content-pipeline`), scoped
   a **lógica pura** (`src/**/*.test.ts`, entorno node). Se prueban ranking del
   buscador y orquestación de consultas; el cálculo de horas del cuadrante y el motor
   de reglas de consecuencias/detención se prueban en `@agente/shared`. Los
   componentes (`.tsx`) y los flujos e2e se dejan para más adelante (React Native
   Testing Library / Maestro): en Fase 0 solo se deja el terreno montado.

### Consecuencias

- App que compila y typechequea en estricto, con navegación y tema listos, sin
  dependencias nativas pesadas todavía (Lucide/SVG, MapLibre, reanimated, expo-print,
  RevenueCat llegan con su feature). `metro.config.js` preparado para el monorepo pnpm.
- Riesgo controlado: menos superficie que mantener; cada dependencia entra cuando gana
  su coste. **Reconsiderar** el SDK en cada release mayor de Expo (política: seguir la
  estable N o N-1, nunca canary).

## ADR-011 · Feedback local-first, envío desde el dispositivo, sync futura

- **Estado:** aceptada (implementada en `apps/mobile` y `packages/shared`).
- **Fecha:** 2026-09-04.
- **Contexto:** durante la beta en Expo Go (sin backend todavía) el socio necesita poder dejar
  sugerencias y reportes. No hay Supabase ni login (ADR-001/002), y no se pueden añadir
  dependencias que rompan Expo Go (ni RevenueCat ni MapLibre).
- **Decisión:**
  1. El feedback (`sugerencia | error_contenido | error_tecnico` + texto + contexto no
     identificativo) se guarda **solo en el dispositivo** (`expo-sqlite`, base local del usuario,
     separada del paquete de contenido — ADR-010 punto 4). **Nunca** se envía a un servidor de
     forma automática.
  2. **"Enviar a los fundadores"** lo hace el propio dispositivo: `mailto:` con `expo-linking` y,
     si no hay correo configurado, la hoja de compartir nativa (`Share`). Cero dependencias nuevas;
     todo compatible con Expo Go. Al enviar, el feedback se marca `enviado`.
  3. **Anónimo y con aviso fijo de privacidad** (regla CLAUDE.md): no incluir matrículas, nombres,
     DNI ni datos de intervención; sin capturas automáticas. Solo se adjunta contexto de segmento
     no identificativo (`cuerpo`, `territorio`).
  4. El modelo `Feedback` vive en `@agente/shared` (fuente única). El campo `enviado` deja el
     terreno preparado para una **sincronización futura** con Supabase, sin implementarla ahora.
- **Consecuencias:** el socio puede reportar sin fricción y sin red; los fundadores reciben el
  feedback por correo durante la beta. **Pendiente cuando exista Supabase:** sync en segundo plano
  y vista de triaje en `apps/admin`. La lógica no-trivial (mapeo SQLite, texto del correo, id) es
  pura y está testeada; el esquema tiene tests de validación/rechazo en `shared`.

## ADR-012 · Calidad automatizada: ESLint 9 (flat), Prettier y CI mínima

- **Estado:** aceptada (implementada; cierra el hueco de CI/lint de Fase 0).
- **Fecha:** 2026-09-04.
- **Contexto:** Fase 0 dejó `packages/shared`, `packages/content-pipeline` y `apps/mobile`
  con typecheck y tests en verde, pero **sin ESLint instalado** (los scripts `lint`
  apuntaban a un binario ausente; `apps/mobile` usaba `expo lint`, que tampoco resolvía) y
  **sin CI**. Un equipo de una persona necesita una red de seguridad automática y barata.

### Decisiones

1. **Una sola configuración ESLint** en la raíz (`eslint.config.mjs`, flat config de
   ESLint 9), no una por paquete. Menos superficie que mantener. Se ejecuta con
   `pnpm lint` (`eslint .`, una pasada sobre todo el monorepo).
2. **Reparto de responsabilidades claro:** TypeScript estricto cubre los tipos
   (`typecheck`); ESLint cubre **corrección** (`typescript-eslint` recomendado, sin
   type-checking para que sea rápido); **Prettier** cubre el **formato**
   (`eslint-config-prettier` desactiva toda regla de estilo para que no se peleen).
3. **Bloques acotados por `files`:** reglas de hooks de React
   (`eslint-plugin-react-hooks`) solo en `apps/mobile`; `no-console` permitido en
   CLIs/scripts. Sin `eslint-plugin-react` ni `eslint-config-expo`: evitan duplicar el
   plugin de TS en flat config y aportan poco frente a su coste para una sola persona.
4. **CI en GitHub Actions** (`.github/workflows/ci.yml`): un único job
   `lint → typecheck → test` en cada push y PR a `main`, con `pnpm/action-setup` +
   caché de pnpm e `install --frozen-lockfile`. El **build de contenido** (SQLite
   firmado) y **EAS** se añadirán como flujos propios cuando existan (Fase 1 y
   lanzamiento), no antes (evitar oro-plating).
5. **Prettier con `endOfLine: "auto"`** (el desarrollo es en Windows, ficheros CRLF) y
   **CI no lo bloquea todavía**: el repo aún no está formateado al 100 % y un
   `prettier --write` masivo ahora generaría un diff ruidoso y chocaría con ramas en
   curso. Queda disponible como `pnpm format` y se normalizará en una pasada dedicada.

### Consecuencias

- `pnpm lint`, `pnpm typecheck` y `pnpm test` en verde localmente y en CI (75 tests).
- **Reconsiderar:** activar `typescript-eslint` con type-checking (reglas más potentes)
  cuando el proyecto crezca; añadir `format:check` como gate tras una normalización única;
  incorporar Sentry y el build de contenido a CI en Fase 1.

## ADR-013 · Instalación pnpm "hoisted" para que Metro/Expo empaquete

**Contexto.** Por defecto pnpm crea un árbol de `node_modules` aislado (symlinks). Metro (el
bundler de Expo) no resuelve bien las dependencias transitivas de la runtime de Expo
(`@expo/metro-runtime`, `whatwg-fetch`…) en ese árbol, y `expo export` fallaba en el entry de
expo-router, antes del código de features. Es un problema de todo el monorepo, no de la app.

**Decisión.** `.npmrc` con `node-linker=hoisted` (node_modules plano en la raíz del workspace),
que es la recomendación oficial de Expo/React Native para monorepos con pnpm. Además, un
`resolveRequest` acotado en `apps/mobile/metro.config.js` para resolver los imports ESM con
extensión `.js` de `@agente/shared` (que se consume como fuente TypeScript): se reintenta la
resolución sin extensión, que Metro sí mapea al `.ts`.

**Consecuencias.** `expo export` compila (1210 módulos, incluido el asset del paquete de
contenido `.db`), así que la app ya se puede correr en Expo Go / exportar. `lint`, `typecheck`
y los 116 tests siguen en verde con el nuevo layout. Reconsiderar si en el futuro se prefiere
publicar `@agente/shared` compilado (`dist`) en vez de como fuente.

## Decisiones aún abiertas (de la spec §13 y de las perspectivas)

- Nombre e icono definitivos. Candidatos finalistas del análisis de marca: **Baliza**
  (recomendado), **Hito**, **Cotejo** (ver `analisis/04-ui-brand-v2.md`).
- Supabase vs. backend propio (condicionado por ADR-002).
- MapLibre + OSM vs. Mapbox para el mapa y las teselas offline.
- Constitución de sociedad y acuerdo de socios antes de cobrar.
- Qué comunidades y municipios entran en la beta (marketing propone Murcia y Canarias,
  empezando por la unidad del cofundador agente).
- Modelo de ordenanzas municipales: "mi ordenanza personal" editable por el usuario como
  atajo mientras no esté la del municipio (de `perspectivas/04-policia-local.md`).
