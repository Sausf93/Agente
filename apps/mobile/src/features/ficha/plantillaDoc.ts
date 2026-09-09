import type { TipoConsecuencia, TipoInfraccion } from '@agente/shared';
import type { FichaKind } from './ficha';

/**
 * Elección de la PLANTILLA de documento que prerrellena "Generar documento" desde la ficha (§4.8).
 *
 * PROBLEMA que resuelve (validación de calle, GC de Tráfico): antes se fijaba UNA sola plantilla por
 * vía (todo lo penal → diligencia de identificación), de modo que una ALCOHOLEMIA penal generaba una
 * diligencia de identificación en vez del ACTA DE LA PRUEBA DE ALCOHOLEMIA —el atestado más repetido
 * en Tráfico—. Aquí se elige la plantilla PRINCIPAL a partir de SEÑALES ROBUSTAS de la infracción
 * (id, marco/`fichaKind`, código de norma y nº de artículo), NUNCA adivinando por el texto libre del
 * boletín. Es lógica PURA (sin React ni SQLite) para poder testearla.
 *
 * Mapeo (en orden de prioridad):
 *  1. Alcoholemia/drogas (penal o administrativa de tasa/consumo, y la negativa a la prueba) →
 *     `seed-acta-prueba-alcoholemia` (recoge las garantías: 1ª/2ª prueba, derecho a contraste,
 *     apercibimiento del art. 383 CP).
 *  2. Conducción sin permiso (delito del art. 384 CP): no hay acta específica → diligencia/atestado
 *     (`seed-diligencia-identificacion`).
 *  3. Resto de la vía PENAL → `seed-diligencia-identificacion` (como hasta ahora).
 *  4. Resto de la vía ADMINISTRATIVA → `seed-boletin-denuncia` (como hasta ahora).
 */

/** Ids de plantilla del seed (fuente única en `plantillasSeed.ts`). */
export const PLANTILLA_ACTA_ALCOHOLEMIA = 'seed-acta-prueba-alcoholemia';
export const PLANTILLA_DILIGENCIA_IDENTIFICACION = 'seed-diligencia-identificacion';
export const PLANTILLA_BOLETIN_DENUNCIA = 'seed-boletin-denuncia';
export const PLANTILLA_ACTA_INMOVILIZACION = 'seed-acta-inmovilizacion';
export const PLANTILLA_ACTA_DEPOSITO_GRUA = 'seed-acta-deposito-grua';

/** Señales de la ficha que bastan para decidir la plantilla (subconjunto de `FichaInfraccion`). */
export interface FichaParaPlantilla {
  infraccionId: string;
  fichaKind: FichaKind;
  tipo: TipoInfraccion;
  normaCodigo: string;
  articuloNumero: string;
  consecuencias: { tipo: TipoConsecuencia }[];
}

/**
 * Ids de infracción de ALCOHOLEMIA/DROGAS del catálogo actual (señal PRIMARIA y estable): la tasa y
 * el consumo administrativos, el delito del art. 379.2 CP y la negativa del art. 383 CP. La negativa
 * entra aquí a propósito: el acta de la prueba documenta precisamente el requerimiento y su
 * apercibimiento. La detección se completa con señales de artículo (abajo) para tolerar altas nuevas.
 */
const IDS_ALCOHOL_DROGAS: ReadonlySet<string> = new Set([
  'inf-alcoholemia',
  'inf-drogas-volante',
  'del-alcoholemia-penal',
  'inf-negativa-prueba',
]);

/** Normaliza un nº de artículo para comparar ("art. 379.2" / "379.2" → "379.2"). */
function normalizarArticulo(numero: string): string {
  return numero
    .toLowerCase()
    .replace(/art[íi]?culo|art\.?/g, '')
    .trim();
}

/**
 * `true` si la infracción es de alcohol/drogas. Señal PRIMARIA por id (estable, controlado por el
 * contenido) y señal de ARTÍCULO como red de seguridad para altas futuras, evitando falsos
 * positivos:
 *  - Vía penal: art. 379.2 CP (alcohol/drogas; NO el 379.1, que es velocidad temeraria) o art. 383
 *    CP (negativa a la prueba).
 *  - Vía administrativa: art. 14 LSV (bebidas alcohólicas y drogas), específico de la materia.
 * Pura y determinista; nunca mira el texto libre del boletín.
 */
export function esAlcoholemiaODrogas(ficha: FichaParaPlantilla): boolean {
  if (IDS_ALCOHOL_DROGAS.has(ficha.infraccionId)) return true;
  const art = normalizarArticulo(ficha.articuloNumero);
  const codigo = ficha.normaCodigo.toUpperCase();
  if (/\bCP\b/.test(codigo) && (art.startsWith('379.2') || art.startsWith('383'))) return true;
  if (/\bLSV\b/.test(codigo) && art.startsWith('14')) return true;
  return false;
}

/**
 * `true` si es el delito de CONDUCCIÓN SIN PERMISO (art. 384 CP). Se reconoce por id o por artículo
 * (art. 384 CP en la vía penal) para documentar la intención; hoy no existe acta específica, así que
 * `plantillaParaFicha` la resuelve con la diligencia/atestado.
 */
export function esConduccionSinPermisoPenal(ficha: FichaParaPlantilla): boolean {
  if (ficha.infraccionId === 'del-conduccion-sin-permiso') return true;
  const esPenal = ficha.tipo === 'penal' || ficha.fichaKind === 'penal';
  if (!esPenal) return false;
  const art = normalizarArticulo(ficha.articuloNumero);
  return /\bCP\b/.test(ficha.normaCodigo.toUpperCase()) && art.startsWith('384');
}

/**
 * Elige la plantilla PRINCIPAL de "Generar documento" para una ficha. Pura y testeada.
 */
export function plantillaParaFicha(ficha: FichaParaPlantilla): string {
  // 1. Alcoholemia/drogas (penal o administrativa) → acta de la prueba (garantías del procedimiento).
  if (esAlcoholemiaODrogas(ficha)) return PLANTILLA_ACTA_ALCOHOLEMIA;

  const esPenal = ficha.tipo === 'penal' || ficha.fichaKind === 'penal';
  if (esPenal) {
    // 2/3. Conducción sin permiso (384 CP) y resto penal: no hay acta específica → diligencia.
    return PLANTILLA_DILIGENCIA_IDENTIFICACION;
  }
  // 4. Resto administrativo → boletín de denuncia.
  return PLANTILLA_BOLETIN_DENUNCIA;
}

/** Una acta secundaria ofrecida junto al documento principal (según las consecuencias operativas). */
export interface PlantillaSecundaria {
  plantillaId: string;
  /** Etiqueta del botón secundario en la ficha. */
  label: string;
}

/**
 * Actas SECUNDARIAS que la ficha ofrece ADEMÁS del documento principal, según las consecuencias
 * operativas presentes (validación de calle: si inmovilizo o me llevo el coche de grúa, quiero el
 * acta correspondiente prerrellenada con el precepto, no solo el boletín):
 *  - `inmovilizacion` → acta de inmovilización (`seed-acta-inmovilizacion`).
 *  - `deposito` (grúa) → acta de retirada y depósito (`seed-acta-deposito-grua`).
 * Orden: inmovilización y después depósito (la retirada es el paso siguiente a la inmovilización).
 * Pura y testeada; la ficha las cablea a `/documento/[plantillaId]` con el mismo prefill.
 */
export function plantillasSecundariasParaFicha(ficha: FichaParaPlantilla): PlantillaSecundaria[] {
  const tipos = new Set(ficha.consecuencias.map((c) => c.tipo));
  const out: PlantillaSecundaria[] = [];
  if (tipos.has('inmovilizacion')) {
    out.push({ plantillaId: PLANTILLA_ACTA_INMOVILIZACION, label: 'Acta de inmovilización' });
  }
  if (tipos.has('deposito')) {
    out.push({ plantillaId: PLANTILLA_ACTA_DEPOSITO_GRUA, label: 'Acta de grúa/depósito' });
  }
  return out;
}
