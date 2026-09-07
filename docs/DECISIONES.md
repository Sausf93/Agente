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
- **Ampliación (2026-09-07) · aportaciones REGISTRADAS con estado y respuesta:** a petición del
  socio, cada aportación **queda registrada en la app con un ESTADO** en vez de perderse en el
  correo. Se añaden al modelo `Feedback` el enum `EstadoFeedback`
  (`enviada → en_estudio → aplicada → descartada`) y el campo `respuesta` (texto del equipo).
  Migración **aditiva** `user_version = 9` (`ALTER TABLE feedback ADD COLUMN estado/respuesta`).
  Nueva pantalla **"Mis sugerencias"** (lista con chip de estado + fecha) y su **detalle** (texto
  completo + estado + respuesta o aviso de que aún no la hay). El flujo es **registro primero,
  envío después** (el envío nunca bloquea el registro). `FOUNDERS_EMAIL` pasa a ser el correo real
  del fundador (`saulodlsf@gmail.com`, autorizado para la beta). **Hoy sin backend:** el estado se
  gestiona **solo en local** y `respuesta` llega vacía; **el cambio de estado remoto y la respuesta
  bidireccional llegan con Supabase (Fase 5)**.
- **Consecuencias:** el socio puede reportar sin fricción y sin red, y **sigue su aportación** en
  "Mis sugerencias"; los fundadores reciben el feedback por correo durante la beta. **Pendiente
  cuando exista Supabase:** sync en segundo plano, cambio de estado/respuesta desde `apps/admin` y
  vista de triaje. La lógica no-trivial (mapeo SQLite, texto del correo, id, reducers del estado en
  memoria) es pura y está testeada; el esquema y la migración tienen tests en `shared` y en la
  integración de `user.db`.

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

## ADR-014 · Cuadrante: dos capas, horas puras y festivos sembrados

- **Estado:** aceptada (implementada en `packages/shared/src/cuadrante.ts` y
  `apps/mobile/src/features/cuadrante`).
- **Fecha:** 2026-09-07.
- **Contexto:** el cuadrante es el mayor punto de dolor del competidor (SPPLB pierde datos y
  mezcla patrón con ediciones) y nuestro pilar de retención (perspectivas §8). Necesita ser
  sólido, offline y sobrevivir a actualizaciones.

### Decisiones

1. **Modelo de dos capas, con excepciones SAGRADAS.** El calendario se PROYECTA al vuelo
   desde `PatronTurno` + `inicioCiclo` (funciones puras `proyectarDia/Mes/Rango`). Solo se
   guardan las EXCEPCIONES manuales (`DiaCuadrante`), que SIEMPRE ganan sobre el patrón y a las
   que la regeneración (cambiar patrón, inicio o jornada) NUNCA pisa. Probado al 100 %.
2. **Cálculo de horas puro y testeado** (`resumenHoras`): total, nocturnas (solape real con
   una franja nocturna CONFIGURABLE que puede envolver la medianoche), festivas y fin de semana
   (repartidas por la medianoche entre las dos fechas del turno), y **exceso sobre una jornada
   de referencia configurable** (prorrateo `jornadaSemana × díasNaturales / 7`). No se fija
   37,5 h como verdad: la GC y otros cuerpos usan otra jornada.
3. **Definiciones de servicio por defecto** en bloques limpios de 8 h (mañana 06–14, tarde
   14–22, noche 22–06) cuando el patrón no las especifica; el patrón o la excepción siempre
   pueden sobrescribirlas. La disponibilidad/retén y las ausencias NO computan presencia.
4. **Patrones predefinidos EDITABLES** como punto de partida (`PATRONES_PREDEFINIDOS`): GC
   "6+saliente+3", PN "semana sí/semana no (7+7)", Local "rueda M/T/N semanal" y "oficina L-V".
   Los turnos reales varían por unidad/municipio (Local no tiene patrón único): el usuario elige
   el más cercano y ajusta días sueltos.
5. **Festivos sembrados** (`FESTIVOS_NACIONALES_2026`): los nacionales van de serie; el agente
   marca a mano los autonómicos y **locales** (las fiestas del pueblo, "dinero real" para el
   Local). No hace falta una BD completa de festivos en v1.
6. **Persistencia local atómica en dos tablas** (`user.db`, migración `user_version = 3`):
   `cuadrante_config` (una fila) y `cuadrante_excepcion` (una fila por fecha). Editar un día
   toca SOLO su fila (upsert) y cambiar el patrón NO borra excepciones → no se pierde nada.
   Las filas corruptas se descartan una a una sin tumbar el cuadrante. La copia cifrada en
   servidor (spec §4.9) queda para cuando exista backend (ADR-001/002).
7. **UI compatible con Expo Go:** rejilla mensual propia (sin calendarios nativos), edición de
   día en un `Modal` de React Native, resumen de horas SIEMPRE arriba. Todo con las primitivas
   de `src/ui/components` y `useAppTheme` (cero colores sueltos); el turno nunca se comunica
   solo con color (color + abreviatura de letra, regla 02-ui.md §5.7).

- **Pendiente para la siguiente iteración:** alarmas (notificación local antes del servicio),
  exportar mes a PDF/CSV, resumen anual y cómputo anual de referencia, edición por rango de días,
  onboarding de patrón con previsualización, y la copia cifrada/sincronización entre dispositivos.

## ADR-015 · Rediseño visual v2: acento por cuerpo, onboarding y tema elegible

- **Estado:** aceptada (implementada en `apps/mobile`; diseño en `docs/diseno/sistema-visual.md`).
- **Fecha:** 2026-09-07.
- **Contexto:** la app funcionaba pero se percibía "sosa". El sistema visual v2 (aprobado por el
  fundador) pide personalización sutil por cuerpo, onboarding y un selector de tema, sin
  parecer oficial de ningún cuerpo.

### Decisiones

1. **Acento por cuerpo que SUSTITUYE a `brand`.** `theme.ts` añade `accentByCuerpo` +
   `accentDefault` y una función pura `resolveTheme(mode, cuerpo)` que sobrescribe
   `brand/brandPressed/textOnBrand/focusRing` (y expone `accent/accentWeak/accentOn`) con el
   acento del cuerpo. Así todo componente que ya leía `color.brand` hereda el acento sin
   cambios. `accentWeak` se calcula por mezcla (`mixHex`, 14 % claro / 22 % oscuro). La
   **gravedad y los neutros NO cambian nunca** con el cuerpo (test que lo fija).
2. **Tema elegible Sistema/Claro/Oscuro**, persistido en el perfil; `mode` sale de esa
   preferencia (Sistema sigue `useColorScheme`). El perfil (cuerpo, autonómica, CCAA/provincia/
   municipio, tema, `onboarded`) vive en una fila SQLite (`user.db`, migración `user_version =
   4`), solo en el dispositivo (ADR-001).
3. **Onboarding de 2 pasos** (`app/onboarding.tsx`), gate en el layout raíz por el flag
   `onboarded`. Paso 1: cuerpo (con sub-lista para Autonómica: Ertzaintza/Mossos/Foral/Canaria,
   que fija su CCAA vía `CCAA_DE_AUTONOMICA`); tiñe en caliente. Paso 2: territorio con el nuevo
   catálogo `packages/shared/src/geografia.ts` (19 CCAA + 52 provincias). Aviso "no oficial"
   fijo. Ajustes (`app/ajustes.tsx`) permite cambiarlo todo y re-tiñe en caliente.
4. **Municipio como TEXTO libre (con id derivado `slugMunicipio`)**, no lista: no hay dataset
   offline de los >8000 municipios. Obligatorio solo para Policía Local. Encaja con "mi
   ordenanza personal" (ADR-009) como puente. *Desviación consciente del boceto, que dibujaba un
   selector de municipio.*
5. **Autodetección por GPS DIFERIDA.** El boceto la ofrecía "si es fácil". Para no meter
   `expo-location` ni pedir permisos en seco en v1, el territorio se elige a mano; la
   autodetección confirmable queda para una iteración posterior.
6. **Barra inferior con iconos Lucide** (`lucide-react-native` sobre `react-native-svg`, ambos
   compatibles con Expo Go). Pestaña activa con tres señales redundantes: pastilla `accentWeak`
   + color de acento + trazo más grueso (2.4). Metáforas de objeto/acción, cero símbolos
   oficiales.

## ADR-016 · Normas: navegación del articulado, Markdown propio y marcadores locales

- **Estado:** aceptada (implementada en `apps/mobile/src/features/normas` y `src/ui/markdown`).
- **Fecha:** 2026-09-07.
- **Contexto:** la pestaña Normas (§4.5) navega el articulado consolidado que ya viaja en el
  paquete (`norma`, `articulo`). Debe funcionar offline, en Expo Go y con el sistema visual v2.

### Decisiones

1. **Navegación en stack anidado bajo la pestaña Normas** (Expo Router): lista de normas →
   articulado de una norma → artículo, más "mis marcadores". La cabecera propia del stack aporta
   el "atrás"; sus colores salen del tema (acento por cuerpo). Reusa el mismo patrón de consulta
   que el buscador/ficha: núcleo agnóstico del motor sobre `SqlRunner` (`normas.ts`), testeado con
   `node:sqlite` contra el `.db` real.
2. **Render de Markdown PROPIO y mínimo** (`ui/markdown/parse.ts` + `Markdown.tsx`), sin añadir
   dependencias. Motivo: evitar cualquier módulo que pueda romper Expo Go y mantener el control del
   estilo (tokens del tema, cuerpo ≥16 pt, texto seleccionable). Cubre encabezados, listas, tablas
   de tubería, citas, párrafos y énfasis en línea. El parser es **puro y testeado**; si en el
   futuro aparece Markdown más rico del BOE, se amplía el parser o se reevalúa una librería
   Expo Go-safe.
3. **Ordenación de artículos por `articulo.orden`** (documental, lo fija el pipeline) y, a igualdad,
   por número ascendente **numérico** (para que "18" vaya antes que "118"); las disposiciones sin
   número van al final. Lógica pura `ordenarArticulos`/`numeroSortKey`.
4. **Buscador dentro de la norma en memoria** (sin más consultas ni red): al cargar el articulado se
   precalcula una cadena normalizada (número + título + texto) por artículo. Si la consulta empieza
   por dígito, se filtra por **prefijo de número** (preciso: "18" no trae "118"); en otro caso, por
   inclusión en el texto normalizado (tildes/ñ plegadas con `normalizarBusqueda`).
5. **Indicador "cambió el dd/mm" a partir de `articulo.valid_from`**, comparado con la fecha del
   paquete (`meta.fecha`) mediante `estadoCambio` (puro): `reciente` si entró en vigor dentro de una
   ventana (~18 meses), `futuro` si aún no está en vigor, y **`null` cuando `valid_from` coincide con
   la fecha del paquete** (artefacto del seed) para no marcar como "cambiado" todo el seed. Cuando el
   pipeline genere `Novedad` con artículos concretos, se podrá afinar con esa señal + el diff.
6. **Marcadores locales** (`user.db`, migración `user_version = 5`, tabla `marcador_articulo`),
   local-first (ADR-001) y separados del paquete (ADR-010). Se **desnormalizan** código de norma,
   número y título para pintar "mis marcadores" sin abrir el paquete y para sobrevivir a un cambio de
   versión de contenido. La copia/sync entre dispositivos queda para cuando exista backend.

- **Desviación consciente de §4.5:** en v1 se implementan **marcadores** pero NO las **notas
  personales** por artículo (se pueden añadir sobre la misma tabla más adelante); tampoco el nivel
  intermedio "capítulo" (el paquete no modela capítulos: la navegación es norma → artículo, con el
  apartado localizable dentro del texto, coherente con la granularidad de `Articulo` de §6.1).

## ADR-017 · Documentos: motor de plantillas puro, seed en la app y PDF en el dispositivo

- **Estado:** aceptada (implementada en `apps/mobile/src/features/documentos` y
  `packages/shared/src/plantillas.ts`).
- **Fecha:** 2026-09-07.
- **Contexto:** la pestaña Documentos (§4.8) rellena plantillas y genera un PDF. Debe funcionar
  offline, en Expo Go y sin enviar datos de terceros ni el PDF a ningún servidor (no hay servidor
  en v1; ADR-001/002). Es el pilar "ahorra trabajo de oficina".

### Decisiones

1. **Motor de plantillas PURO en `@agente/shared`** (`renderPlantilla`, `extraerVariables`):
   sustituye `{{campo}}` en **una sola pasada** (el valor inyectado no se reescanea → sin
   reentrada), tolera espacios en las llaves, y devuelve los `camposFaltantes` (que se imprimen
   como línea a rellenar). Fuente única del tipo `Plantilla`. Testeado al 100 %.
2. **Seed de plantillas ESTÁTICO en la app** (`plantillasSeed.ts`), NO en el paquete SQLite
   firmado, en v1: permite iterarlas durante la beta sin regenerar/re-firmar el paquete y mantiene
   todo offline. Tres plantillas clave: **boletín de denuncia administrativa**, **acta de
   inmovilización** y **diligencia de identificación**. Un test valida cada seed contra el esquema
   `Plantilla` y comprueba 1:1 que cada `{{variable}}` tiene su descriptor de campo. Cuando el
   panel de administración las edite, se moverán al paquete **sin cambiar el contrato** de la app.
3. **Encabezado NEUTRO**: cuerpo y unidad son **texto** que rellena el agente (campos del agente,
   no de terceros); la app no imprime escudos ni denominaciones oficiales por defecto (§10).
4. **Datos de terceros solo en el dispositivo (regla innegociable):** los campos de vehículo/
   persona van marcados `esDatoTercero`, se piden en una sección aparte con **aviso fijo** y
   **NUNCA se persisten como borrador ni se prerrellenan** (ni desde la ficha ni desde lo
   recordado). Solo se "recuerdan" campos del agente marcados `recordar` (p. ej. su unidad), en una
   tabla local nueva `documento_campo_recordado` (`user.db`, migración `user_version = 6`). El PDF
   tampoco se guarda ni se sube.
5. **PDF EN EL DISPOSITIVO con `expo-print`** (HTML → PDF; va en Expo Go). El Markdown relleno se
   convierte a HTML de imprenta con un conversor **propio, puro y testeado** que **escapa** todo el
   texto (un valor con `<`/`&`/comillas no rompe ni inyecta marcado). Página A4 sobria y neutra con
   pie fijo: "generado en el dispositivo… no se ha enviado a ningún servidor… sin carácter oficial".
6. **Compartir/enviar desde el propio teléfono:** `expo-sharing` (hoja de compartir con el PDF
   adjunto → Mail, WhatsApp, Archivos/Guardar) como vía principal para "enviar a mi correo"; y
   `mailto` (`expo-linking`/`Linking`) con una copia **en texto** del documento como atajo. Ninguna
   sube el PDF a un backend. Cero dependencias que rompan Expo Go.
7. **Entrada desde la ficha** ("Generar documento", §4.4 acción 9): abre el boletín con norma,
   artículo, importe, puntos, gravedad y hecho ya rellenos vía parámetros de ruta; el prefill se
   aplica SOLO a campos del agente (los de terceros nunca llegan por la ruta).
8. **Lenguaje orientativo** en lo sensible (§4.6): las actas dicen "procede según el precepto
   citado", nunca imperativo, y remiten la valoración final al agente/autoridad judicial.

### Consecuencias

- `lint`, `typecheck` y `test` en verde (shared 87, mobile 109) y `expo export --platform ios`
  compila (3175 módulos, con `expo-print`/`expo-sharing`).
- **Pendiente / siguiente iteración:** autocompletar el PK del lugar desde el mapa (§4.10, Fase 4);
  las otras tres plantillas de §4.8 (intervención de sustancias, lectura de derechos, información a
  la víctima); escudo opcional subido por el agente desde su galería; edición de plantillas desde el
  panel y su viaje en el paquete de contenido; y un botón "Copiar texto" del documento.

## ADR-018 · Inicio: favoritos, "tus más usadas" y novedades, todo local

- **Estado:** aceptada (implementada en `apps/mobile/src/features/inicio`).
- **Fecha:** 2026-09-07.
- **Contexto:** el Inicio (§4.2) era solo el buscador. Faltaban las secciones que fidelizan y dan
  sensación de "app viva": accesos rápidos, tarjeta de turno, **Tus favoritas**, **Tus más
  usadas** y **aviso de novedades**. Debe funcionar offline, en Expo Go y con el sistema visual v2.

### Decisiones

1. **El Inicio es la propia pestaña Buscar.** Bajo el buscador, cuando NO hay consulta, se pinta
   `HomeInicio` con las secciones EN EL ORDEN de §4.2 (accesos rápidos → tarjeta de turno → Tus
   favoritas → Tus más usadas → aviso de novedades); al escribir, la pantalla pasa a resultados.
   Se conserva el nombre de pestaña "Buscar" (ADR-003) para no crear una sexta pestaña.
2. **Favoritos LOCALES y DESNORMALIZADOS** (`user.db`, migración `user_version = 7`, tabla
   `favorito`). La acción vive en la ficha (§4.4, estrella: color + relleno, dos señales). Se
   guardan título/gravedad/norma/importe **desnormalizados** (como los marcadores, ADR-016) para
   pintar la lista sin abrir el paquete y para **sobrevivir a un cambio de versión de contenido**.
   Store propio (`favoritosStore`) compartido entre ficha, sección de Inicio y lista completa
   (`/favoritos`).
3. **"Tus más usadas" = contador LOCAL y ANÓNIMO** (`uso_infraccion`, misma migración). Se cuenta
   por infracción cuántas veces se **consulta** la ficha y cuántas se **copia** el boletín, sin
   `usuario_id` ni identificador de dispositivo (§6.2). El **ranking es una función PURA y
   testeada** (`masUsadas.ts`): la copia pesa 3 consultas (señal más fuerte de uso real en la
   calle); desempata la fecha y luego el id (estable). El agregado "más usadas EN TU CUERPO"
   (entre usuarios) es de SERVIDOR y queda para cuando exista backend; en v1 es "tus más usadas".
4. **Novedades desde el paquete** (`novedad`, que ya viaja en `content.db`). La pantalla
   `/novedades` lista fecha + resumen; al abrirla marca todo como VISTO guardando la fecha máxima
   en `app_flag` (`novedades_vistas_hasta`, misma migración). El **aviso (badge)** de Inicio sale
   de comparar las fechas con esa marca; la **detección de nuevas es pura y testeada**
   (`novedades.ts`). Si el seed no trae novedades, estado vacío con gracia.
5. **Nada de red ni datos de terceros.** Contadores y favoritos son anónimos y locales (ADR-001);
   compatible con Expo Go (cero dependencias nuevas). La consulta de `novedad` reutiliza el patrón
   `SqlRunner` (probado con `node:sqlite` contra el `.db` real, como buscador/normas).

### Consecuencias

- `lint`, `typecheck` y `test` en verde (mobile 132 tests; +23 nuevos) y `expo export --platform
  ios` compila (3185 módulos). Nueva migración `user_version = 7` (favorito, uso_infraccion,
  app_flag): los datos del usuario sobreviven a la actualización (ADR-010).
- **Pendiente / siguiente iteración:** accesos rápidos **configurables** por el usuario (hoy es una
  lista por defecto de términos de calle); "más usadas EN TU CUERPO" agregado (servidor);
  favorito de ARTÍCULO además de infracción (§4.4 permite ambos); `Novedad` con norma/artículos
  concretos y enlace directo cuando el pipeline los emita; notificación push de novedades (§4.13).

## ADR-019 · Lectura de derechos (art. 520): contenido bundlado, fuera del paquete SQLite

- **Estado:** aceptada (implementada en `apps/mobile/src/features/derechos`).
- **Fecha:** 2026-09-07.
- **Contexto:** §4.11 pide el texto de los derechos del detenido (art. 520 LECrim) en varios
  idiomas para leérselos a un detenido extranjero en el suyo. Debe funcionar OFFLINE y de forma
  fiable desde el primer momento. El modelo de datos ya tiene un `TextoDerechos` en
  `@agente/shared` pensado como fila de base de datos (id, idioma, texto, audioUrl) del paquete
  servidor→dispositivo.

### Decisiones

1. **El texto va EMBEBIDO como recurso bundlado** (constante tipada en la app,
   `features/derechos/derechos.ts`), NO en el paquete SQLite de contenido ni en
   `@agente/shared`. Motivo: son textos legales estables y multilingües que deben estar SIEMPRE
   disponibles sin depender de que haya un paquete descargado, y así no se toca el `.db` (que
   evoluciona en paralelo). El tipo local `TextoDerechos` (apartados + estado de revisión) tiene
   otra forma que el `TextoDerechos` de shared (fila de BD): por eso vive en la feature y no se
   duplica el nombre en el modelo compartido.
2. **Idiomas de esta entrega:** español, inglés, francés, alemán, árabe y rumano (los más
   frecuentes en intervención). Estructura lista para ampliar con chino, ruso, portugués e
   italiano (TODO en el código, §4.11).
3. **Filosofía `pendiente_revision`:** el español es literal de la redacción vigente del
   art. 520.2 LECrim (`revisado: true`); el resto son traducciones fieles marcadas
   `revisado: false` con nota de que deben cotejarse con la versión oficial del Ministerio del
   Interior antes de publicar. La UI muestra ese aviso.
4. **Pantalla y enganche al flujo de detención:** selector de idioma por chips (háptico), texto
   grande legible (RTL en árabe), botón "Copiar derechos" y aviso fijo orientativo (la valoración
   final es del agente/juez). Se enlaza desde el árbol de detención de la ficha (§4.6) cuando la
   orientación es que procede o puede proceder ("Leer derechos al detenido (art. 520)") y desde el
   hub "Más", sin crear una sexta pestaña (ADR-003).

### Consecuencias

- `lint`, `-r typecheck` (3 "Done") y `-r test` en verde (mobile 175 tests, +15 nuevos de
  `derechos.test.ts`) y `expo export --platform ios` compila (3645 módulos).
- **Pendiente / siguiente iteración:** cotejar y marcar `revisado: true` las traducciones con la
  fuente oficial; ampliar a chino/ruso/portugués/italiano; el art. 771 (información de derechos a
  la víctima) del mismo §4.11; audio pregrabado por idioma (Fase 2/6).

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
