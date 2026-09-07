/**
 * FILTRO TERRITORIAL compartido (capa por territorio, ADR-006/008).
 *
 * La CADENA territorial del perfil es `[ccaaId, provinciaId, municipioId]` (sin nulos). Lo
 * estatal (`territorio_id IS NULL`) es SIEMPRE visible; lo autonómico/municipal solo si su
 * territorio está en la cadena. Vive aquí (no dentro de una feature) para que lo reutilicen SIN
 * DUPLICAR tanto Normas (§4.5) como el Buscador (§4.3): una sola fuente de verdad para el SQL
 * y para construir la cadena a partir del perfil. Puro y determinista → cubierto por tests.
 */

/** Datos territoriales del perfil que definen la cadena (subconjunto de `PerfilLocal`). */
export interface PerfilTerritorial {
  ccaaId: string | null;
  provinciaId: string | null;
  municipioId: string | null;
}

/**
 * Construye la CADENA territorial del perfil (`[ccaaId, provinciaId, municipioId]`) descartando
 * los nulos. Sirve para pasar el mismo filtro a Normas y al Buscador desde el perfil de ajustes.
 */
export function cadenaTerritorialDe(perfil: PerfilTerritorial): string[] {
  return [perfil.ccaaId, perfil.provinciaId, perfil.municipioId].filter(
    (id): id is string => !!id && id.length > 0,
  );
}

/**
 * Construye la cláusula SQL que filtra el contenido por la CADENA TERRITORIAL del perfil
 * (`[ccaaId, provinciaId, municipioId]`, sin nulos). Lo estatal (`territorio_id IS NULL`) es
 * SIEMPRE visible; lo autonómico/municipal solo si su territorio está en la cadena. Con cadena
 * vacía (perfil sin territorio), solo lo estatal. Pura y determinista → cubierta por tests.
 *
 * Devuelve el fragmento sin `WHERE` y sus parámetros, para poder componerlo en distintas consultas
 * (la de normas, la de infracciones y la del articulado). El caller antepone `WHERE`/`AND`.
 */
export function filtroTerritorialSql(
  cadena: readonly string[],
  columna: string,
): { sql: string; params: string[] } {
  const ids = cadena.filter((id) => id.length > 0);
  if (ids.length === 0) return { sql: `${columna} IS NULL`, params: [] };
  const placeholders = ids.map(() => '?').join(', ');
  return { sql: `(${columna} IS NULL OR ${columna} IN (${placeholders}))`, params: [...ids] };
}
