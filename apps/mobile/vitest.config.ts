import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Tests de LÓGICA PURA de la app (sin runtime de React Native).
 *
 * Aquí se prueban las piezas deterministas que viven fuera de la UI: ranking del
 * buscador, orquestación de consultas a SQLite (con dobles), y utilidades. El
 * cálculo de horas del cuadrante y el motor de reglas de consecuencias/detención
 * viven en `@agente/shared` y se prueban allí (funciones puras, 100 %).
 *
 * Los componentes (`.tsx`) y los flujos e2e NO se prueban con Vitest: se dejan
 * para una fase posterior (React Native Testing Library / Maestro). Ver ADR-010.
 */
export default defineConfig({
  // El alias `@` → `src` (mismo que tsconfig `paths` y el module-resolver de Babel) permite que los
  // módulos bajo prueba usen imports de VALOR `@/...` (p. ej. `@/db/territorio`), no solo de tipo.
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
