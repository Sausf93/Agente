/**
 * CLI: construye el paquete de contenido SQLite firmado (stub de Fase 0).
 *
 * En Fase 1 este comando encadenará: descarga BOE/DGT → parseo → validación
 * (`@agente/shared`) → build SQLite+FTS5 → firma → ContentVersion. Por ahora solo
 * verifica que el workspace y los tipos compartidos resuelven correctamente.
 */
import { validarImporte } from '@agente/shared';

function main(): void {
  // Prueba de humo: el paquete compartido está enlazado y es usable.
  const problemas = validarImporte(
    {
      gravedad: 'leve',
      tipo: 'administrativa',
      importeEur: 80,
      importeReducidoEur: 40,
    },
    'trafico',
  );

  if (problemas.length === 0) {
    // eslint-disable-next-line no-console
    console.log('[content-pipeline] OK — @agente/shared enlazado. Pipeline pendiente (Fase 1).');
  } else {
    // eslint-disable-next-line no-console
    console.error('[content-pipeline] Validación inesperada:', problemas);
    process.exitCode = 1;
  }
}

main();
