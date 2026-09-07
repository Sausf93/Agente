/**
 * @agente/shared — fuente única de verdad de tipos y validación del dominio.
 *
 * Consumido por apps/mobile, apps/admin y packages/content-pipeline. Todo esquema
 * de datos vive aquí como esquema Zod (validación en runtime) + tipo inferido.
 */

export * from './enums.js';
export * from './content.js';
export * from './contentPackage.js';
export * from './user.js';
export * from './cuadrante.js';
export * from './feedback.js';
export * from './plantillas.js';
export * from './territorio.js';
export * from './geografia.js';
export * from './validators.js';
