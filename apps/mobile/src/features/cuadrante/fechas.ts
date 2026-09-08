/**
 * Utilidades de fecha civil de la UI del cuadrante. LÓGICA PURA y testeable (Vitest):
 * no tocan React Native ni SQLite. La proyección y el cálculo de horas viven en
 * `@agente/shared`; aquí solo lo mínimo para saber "qué día es hoy" en la rejilla.
 */

/**
 * Fecha civil de HOY en la ZONA LOCAL del dispositivo, formato YYYY-MM-DD.
 *
 * Se usa la fecha local (no UTC) a propósito: el agente piensa en "hoy" según el reloj
 * de su móvil, no en UTC. La comparación con las fechas del cuadrante (que son civiles)
 * se hace siempre a nivel de día, así que no hay desfase de zona.
 */
export function hoyISO(): string {
  const d = new Date();
  const y = d.getFullYear().toString().padStart(4, '0');
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const da = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${da}`;
}

/**
 * ¿La fecha civil `fechaISO` es el MISMO DÍA que `hoy`? Compara solo la parte de fecha
 * (YYYY-MM-DD), ignorando cualquier hora o zona que pudiera venir detrás. Es pura: `hoy`
 * se inyecta (normalmente desde `hoyISO()`), de modo que el resultado no depende del reloj
 * dentro de la función y se puede probar de forma determinista.
 */
export function esHoy(fechaISO: string, hoy: string): boolean {
  return fechaISO.slice(0, 10) === hoy.slice(0, 10);
}
