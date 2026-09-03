# Agente — app para Fuerzas y Cuerpos de Seguridad (España)

Lee `docs/ESPECIFICACION.md` antes de cualquier tarea. Es la fuente de verdad.

## Stack
- Monorepo pnpm: apps/mobile (Expo + React Native + TypeScript), apps/admin (Next.js),
  packages/shared (tipos y esquemas Zod), packages/content-pipeline (ingesta BOE/DGT).
- Backend: Supabase (Postgres + Auth + Storage + Edge Functions). PostGIS para carreteras.
- Búsqueda offline: expo-sqlite con FTS5. Contenido distribuido como paquete SQLite firmado.
- Pagos: RevenueCat (StoreKit 2 / Play Billing). Entitlement `pro`.
- PDF en dispositivo: expo-print. Mapas: MapLibre con teselas offline.

## Reglas no negociables
- Nunca enviar al servidor datos de terceros (matrículas, nombres, DNI, PDFs generados).
- Toda infracción/consecuencia lleva artículo fuente y fecha de actualización.
- La app funciona sin red para consulta, cuadrante y plantillas.
- No usar escudos ni denominaciones oficiales de los cuerpos en UI, icono o plantillas por defecto.
- TypeScript estricto. Tests para el buscador, el motor de reglas y el cálculo de horas.
- Español en la UI y en los comentarios de dominio; inglés en identificadores de código.

## Flujo de trabajo
- Sigue el orden de fases de la sección 11 de la especificación.
- Cada tarea: rama, tests, PR con descripción en español.
- Si la especificación no cubre algo, propón la decisión en el PR y actualiza docs/ESPECIFICACION.md.

## Comandos
- `pnpm install` · `pnpm -F mobile start` · `pnpm -F admin dev` · `pnpm test` · `pnpm content:build`
