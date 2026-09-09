# Agente — app para Fuerzas y Cuerpos de Seguridad (España)

> **AL EMPEZAR UNA SESIÓN NUEVA, LEE PRIMERO (retoma el trabajo sin perder el hilo):**
> 1. `docs/CONVERSACION-RESUMEN.md` — resumen de todo lo hecho con Claude y el porqué.
> 2. `docs/ESTADO-HANDOFF.md` — estado actual, cómo arrancar y el SIGUIENTE PASO.
> 3. `docs/paridad-spplb.md` — plan de contenido frente a SPPLB (olas).
>
> Pendiente inmediato: pasar la **Ola 2 de Transporte** (commit 59321bd, en `main`) por el
> `revisor-juridico` y, tras corregir, publicar en Expo (aún no publicada).

Lee `docs/ESPECIFICACION.md` antes de cualquier tarea. Es la fuente de verdad del producto.
Lee `docs/PLANIFICACION.md` para el plan maestro y el estado actual de construcción.

## Qué es
App móvil de suscripción para miembros de las FCSE en España (Guardia Civil, Policía
Nacional, policías locales y autonómicas). Sustituye a la app SPPLB con: normativa siempre
actualizada, buscador que entiende el lenguaje de la calle, texto de denuncia listo para
copiar, plantillas PDF, cuadrante con contador de horas y mapa con punto kilométrico.
Todo adaptado al cuerpo y territorio de cada agente y funcionando sin cobertura.

## Stack
- Monorepo pnpm: `apps/mobile` (Expo + React Native + TypeScript), `apps/admin` (Next.js),
  `packages/shared` (tipos y esquemas Zod del modelo de datos), `packages/content-pipeline`
  (ingesta BOE/DGT y generación del paquete de contenido).
- Backend: Supabase (Postgres + Auth + Storage + Edge Functions). PostGIS para carreteras/PK.
- Búsqueda offline: expo-sqlite con FTS5. Contenido distribuido como paquete SQLite firmado
  por `ContentVersion`, sustituido atómicamente en el dispositivo.
- Pagos: RevenueCat (StoreKit 2 / Play Billing). Entitlement único `pro`.
- PDF en dispositivo: expo-print. Mapas: MapLibre con teselas offline por provincia.

## Reglas no negociables
- **Nunca** enviar al servidor datos de terceros (matrículas, nombres, DNI, PDFs generados,
  notas de intervención). Esos campos viven solo en el dispositivo y se avisa en la UI.
- Toda `Infraccion`/`Consecuencia` lleva **artículo fuente y fecha de actualización** visibles.
- La app funciona **sin red** para consulta, cuadrante y plantillas.
- **No** usar escudos ni denominaciones oficiales de los cuerpos en UI, icono o plantillas por
  defecto (restricción legal y de las tiendas).
- Lenguaje **orientativo**, nunca imperativo, en consecuencias sensibles (detención): "procede
  según art. X", no "detén". Aviso fijo de que la valoración final es del agente/juez.
- TypeScript **estricto**. Tests obligatorios para el buscador, el motor de reglas
  (consecuencias/detención) y el cálculo de horas del cuadrante.
- **Español** en la UI y en los comentarios de dominio; **inglés** en identificadores de código.

## Flujo de trabajo
- Sigue el orden de fases de la sección 11 de la especificación.
- Cada tarea: rama, tests, PR con descripción en español y `Co-Authored-By` de Claude.
- Si la especificación no cubre algo, propón la decisión en el PR y actualiza
  `docs/ESPECIFICACION.md`. Cuando la realidad choque con el documento, gana la realidad:
  corrige el documento y sigue.

## Comandos
- `pnpm install`
- `pnpm -F @agente/mobile start` — arranca Expo
- `pnpm -F @agente/admin dev` — arranca el panel Next.js
- `pnpm -F @agente/shared build` — compila los tipos compartidos
- `pnpm test` — tests de todo el workspace
- `pnpm content:build` — genera el paquete de contenido SQLite

## Memoria del proyecto (engram MCP)

El proyecto usa **engram** como memoria persistente entre sesiones, vía MCP (`.mcp.json`,
proyecto fijado a `Agente`). Requiere reiniciar Claude Code para que carguen sus herramientas.
- **Al empezar una sesión**: recupera el contexto previo (herramienta de contexto/recall de engram)
  antes de ponerte a trabajar.
- **Guarda de forma proactiva** tras cada decisión o avance relevante (ADR nuevo, fase cerrada,
  cambio de rumbo, dato de dominio no obvio). Frase corta y con el porqué.
- **Nunca guardes en la memoria** datos de terceros (matrículas, nombres, DNI), secretos/claves ni
  el contenido de PDFs generados — misma regla que el resto del producto.
- La memoria **complementa** a `docs/`; la **fuente de verdad sigue siendo** `docs/ESPECIFICACION.md`.
  Si algo vive mejor en el repo (una decisión, el estado), escríbelo también en los docs.

## Equipo permanente (agentes y skills del proyecto)

Este proyecto trae agentes y skills propios en `.claude/` para usar durante todo el desarrollo.

**Agentes** (`.claude/agents/`) — invócalos con la herramienta Agent por su nombre:
- `arquitecto-software` — define y revisa la arquitectura (estructura, offline/sync, datos,
  seguridad, rendimiento, tests, CI). Úsalo AL EMPEZAR cualquier parte grande del desarrollo.
- `revisor-juridico` — control de calidad del contenido legal (fuente, rangos de importe,
  lenguaje orientativo de detención). Úsalo antes de publicar contenido.
- `ingesta-normativa` — ingeniero del pipeline BOE/DGT → paquete SQLite (`content-pipeline`).
- `mobile-dev` — desarrollo de la app Expo/React Native (`apps/mobile`).
- `diseno-producto` — UX/UI, sistema visual, bocetos y materiales. "Simple pero bonito".
- `validador-calle` — estresa diseños/fichas desde la perspectiva simulada de los tres cuerpos.
- `marketing-growth` — captación, ASO, precios, referidos, beta→lanzamiento.
- `qa-testing` — estrategia y ejecución de pruebas (unit/integración/e2e), QA de contenido legal,
  CI de calidad y QA de publicación en tiendas. Úsalo antes de cada fase, beta y release.

**Skills** (`.claude/skills/`) — invócalas con la herramienta Skill:
- `nueva-infraccion` — alta de una infracción con todos sus campos y validación.
- `revisar-contenido` — puerta de calidad obligatoria antes de publicar una `ContentVersion`.
- `generar-presentacion` — regenera el PDF de presentación desde su HTML (Chrome headless).

## Estructura
```
apps/
  mobile/            Expo + React Native (app de los agentes)
  admin/             Next.js (panel de los dos fundadores)
packages/
  shared/            Tipos + esquemas Zod del modelo de datos (fuente única)
  content-pipeline/  Ingesta BOE/DGT → paquete SQLite firmado
docs/                ESPECIFICACION.md (verdad), PLANIFICACION.md, perspectivas/
.claude/
  agents/            Agentes permanentes del proyecto
  skills/            Skills permanentes del proyecto
```
