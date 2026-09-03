# Agente

App móvil para las Fuerzas y Cuerpos de Seguridad de España (Guardia Civil, Policía
Nacional, policías locales y autonómicas). Sustituye a las apps gratuitas de consulta con
**normativa siempre actualizada, buscador que entiende el lenguaje de la calle, texto de
denuncia listo para copiar, plantillas PDF, cuadrante con contador de horas y mapa con punto
kilométrico** — todo adaptado al cuerpo y territorio de cada agente y funcionando sin cobertura.

> Nombre provisional. Documentación completa en [`docs/`](docs/).

## El bucle central

Un agente ve un coche con un faro/luna roto. Busca "luna rota" → obtiene **artículo, importe,
puntos** y —lo decisivo— **si se lo lleva la grúa o puede seguir circulando** (capa de
consecuencias). Anota **en qué carretera / PK** ocurrió. Genera una **plantilla** que se envía
a su correo para registrarla en oficina. Y consulta su **cuadrante**. Todo en menos de 3
segundos y sin conexión.

## Documentación

- [`docs/ESTADO-DEL-PROYECTO.md`](docs/ESTADO-DEL-PROYECTO.md) — **estado actual y cómo retomar** (empieza aquí).
- [`docs/ESPECIFICACION.md`](docs/ESPECIFICACION.md) — **fuente de verdad** del producto.
- [`docs/PLANIFICACION.md`](docs/PLANIFICACION.md) — plan maestro, síntesis y estado.
- [`docs/DECISIONES.md`](docs/DECISIONES.md) — decisiones de arquitectura (ADR).
- [`docs/LEGAL-PLAGIO-Y-RESPONSABILIDAD.md`](docs/LEGAL-PLAGIO-Y-RESPONSABILIDAD.md) — plagio, PI y responsabilidad.
- [`docs/perspectivas/`](docs/perspectivas/) — análisis de UX, UI, marketing, competencia y
  las tres perspectivas de cuerpo (Local, Guardia Civil, Nacional).
- [`docs/analisis/`](docs/analisis/) — análisis profundo "batir a SPPLB": teardown del
  competidor, estrategia de superioridad, UX/UI/marca v2, marketing v2, motor de contenido y
  cuadrante. Empieza por [`00-SINTESIS.md`](docs/analisis/00-SINTESIS.md).

## Estructura

```
apps/
  mobile/            Expo + React Native + TypeScript (la app de los agentes)
  admin/             Next.js (panel de los dos fundadores)
packages/
  shared/            Tipos + esquemas Zod del modelo de datos (fuente única)
  content-pipeline/  Ingesta BOE/DGT → paquete SQLite firmado
docs/                Especificación, planificación y análisis
```

## Puesta en marcha

Requiere Node 20+ y pnpm 9+.

```bash
pnpm install
pnpm -F @agente/shared test
```

## Estado

Fase 0 — cimientos. Ver [`docs/PLANIFICACION.md`](docs/PLANIFICACION.md).
