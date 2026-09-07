import type { CuerpoCompetente } from './enums.js';
import type { Infraccion } from './content.js';
import type { PerfilUsuario } from './user.js';

/**
 * Resolución de contenido MULTI-TERRITORIO (ADR-006/007).
 *
 * El contenido vive en capas por territorio (estatal → CCAA → provincia → municipio). El perfil
 * ve su "cadena territorial"; sobre los candidatos visibles se aplica el desplazamiento de capas
 * (una autonómica/municipal puede ocultar a la estatal). El CUERPO no filtra visibilidad: solo
 * genera un aviso de competencia orientativo (nunca oculta contenido).
 */

/**
 * Cadena territorial del perfil: los ids de sus territorios (CCAA, provincia, municipio).
 * Lo estatal NO está en la cadena: se reconoce por `territorioId === null` en el contenido.
 */
export function cadenaTerritorial(
  perfil: Pick<PerfilUsuario, 'ccaaId' | 'provinciaId' | 'municipioId'>,
): string[] {
  return [perfil.ccaaId, perfil.provinciaId, perfil.municipioId].filter(
    (id): id is string => id !== null && id !== undefined,
  );
}

/** ¿Es visible este contenido para una cadena territorial? Estatal (null) siempre lo es. */
export function esVisible(territorioId: string | null, cadena: readonly string[]): boolean {
  return territorioId === null || cadena.includes(territorioId);
}

/**
 * Filtra los items visibles para el perfil y aplica el desplazamiento de capas: retira los que
 * han sido explícitamente ocultados por otro visible mediante `desplazaId`.
 * El caller pasa items ya vigentes (validTo === null); aquí solo se resuelve la visibilidad.
 */
export function resolverVisibles<
  T extends { id: string; territorioId: string | null; desplazaId?: string | null },
>(items: readonly T[], cadena: readonly string[]): T[] {
  const candidatos = items.filter((it) => esVisible(it.territorioId, cadena));
  const desplazadas = new Set<string>();
  for (const c of candidatos) {
    if (c.desplazaId) desplazadas.add(c.desplazaId);
  }
  return candidatos.filter((c) => !desplazadas.has(c.id));
}

// ---------------------------------------------------------------------------
// Aviso de competencia (orientativo, nunca bloqueante — ADR-007)
// ---------------------------------------------------------------------------

export interface AvisoCompetencia {
  motivo: 'cuerpo' | 'via';
  texto: string;
}

const ETIQUETA_CUERPO: Record<CuerpoCompetente, string> = {
  guardia_civil: 'Guardia Civil',
  policia_nacional: 'Policía Nacional',
  policia_local: 'Policía Local',
  policia_autonomica: 'Policía autonómica',
  trafico: 'Guardia Civil de Tráfico',
};

/**
 * Devuelve un aviso ORIENTATIVO si la infracción no suele ser de la competencia del perfil,
 * o `null` si lo es. Nunca oculta la ficha: solo informa. La valoración final es del agente.
 */
export function avisoCompetencia(
  inf: Pick<Infraccion, 'competencia'>,
  perfil: Pick<PerfilUsuario, 'cuerpo'>,
): AvisoCompetencia | null {
  const { cuerpos, via } = inf.competencia;

  // Aviso por cuerpo: si se declara competencia y el cuerpo del perfil no está en ella.
  if (cuerpos.length > 0 && !cuerpos.includes(perfil.cuerpo as CuerpoCompetente)) {
    const habitual = cuerpos.map((c) => ETIQUETA_CUERPO[c]).join(', ');
    return { motivo: 'cuerpo', texto: `Suele denunciarlo: ${habitual}. Comprueba tu competencia.` };
  }

  // Aviso por vía (el matiz de tráfico urbano/interurbano).
  if (via === 'urbana' && perfil.cuerpo === 'guardia_civil') {
    return { motivo: 'via', texto: 'Vía urbana: suele corresponder a Policía Local.' };
  }
  if (via === 'interurbana' && perfil.cuerpo === 'policia_local') {
    return { motivo: 'via', texto: 'Vía interurbana: suele corresponder a Guardia Civil.' };
  }

  return null;
}
