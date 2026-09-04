# @agente/mobile

App móvil de **Agente** (Expo + React Native + TypeScript estricto). Cimientos de
Fase 0: navegación y tema montados, sin features. Arquitectura en
[`docs/DECISIONES.md` · ADR-010](../../docs/DECISIONES.md).

## Comandos

Desde la raíz del monorepo (pnpm vía corepack):

```bash
corepack pnpm install
corepack pnpm -F @agente/mobile start        # arranca Expo (QR / simulador)
corepack pnpm -F @agente/mobile typecheck    # TypeScript estricto, sin emitir
corepack pnpm -F @agente/mobile test         # Vitest (lógica pura)
```

## Estructura

```
app/                      Rutas (Expo Router). Solo componen; nada de negocio.
  _layout.tsx             Layout raíz (safe-area, status bar).
  (tabs)/
    _layout.tsx           Barra de 5 pestañas (ADR-003).
    index.tsx             Buscar (home; el buscador ES el producto).
    normas.tsx            Normas (articulado, favoritos, novedades).
    documentos.tsx        Documentos (plantillas → PDF).
    cuadrante.tsx         Cuadrante (turnos + horas).
    mas.tsx               Más (mapa/PK, derechos, sustancias, ajustes…).
src/
  ui/                     Tema (theme.ts), hook useAppTheme, componentes base.
  features/               Lógica y UI por dominio funcional (la llena mobile-dev).
  db/                     Acceso a expo-sqlite (paquete de contenido + datos locales).
  store/                  Estado con Zustand (ajustes, perfil, favoritos…).
```

## Reglas (ver `CLAUDE.md`)

- Offline-first: consulta, cuadrante y plantillas funcionan sin red.
- Los tipos vienen de `@agente/shared` (fuente única).
- La gravedad nunca se comunica solo con color (color + etiqueta + icono).
- Lenguaje orientativo, nunca imperativo, en consecuencias sensibles.
- Sin escudos ni denominaciones oficiales en UI, icono ni plantillas.
