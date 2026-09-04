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
