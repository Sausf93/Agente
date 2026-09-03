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
