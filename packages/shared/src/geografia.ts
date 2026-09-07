import type { PoliciaAutonomica } from './enums.js';

/**
 * Catálogo geográfico de España para el ONBOARDING y AJUSTES (elección de territorio).
 *
 * Cubre las 17 comunidades autónomas + Ceuta y Melilla, con sus 50 provincias (+ las dos
 * ciudades autónomas). Es DATO PURO offline (sin red): la app lo empaqueta y el selector de
 * CCAA → provincia se rellena de aquí. Los `id` usan el código INE con prefijo estable
 * (`es-ccaa-XX`, `es-prov-XX`) para no colisionar en el espacio de ids del perfil.
 *
 * El MUNICIPIO no se lista aquí (son >8000 y cambian): en v1 se captura como texto y se guarda
 * con un id derivado por `slugMunicipio`. Solo es obligatorio para Policía Local (activa la capa
 * de ordenanza; "mi ordenanza personal" se conecta después). Español en el dominio.
 */

export interface Provincia {
  id: string;
  nombre: string;
  ccaaId: string;
}

export interface ComunidadAutonoma {
  id: string;
  nombre: string;
  provincias: Provincia[];
}

/** Construye las provincias de una CCAA a partir de pares [códigoINE, nombre]. */
function prov(ccaaId: string, pares: [string, string][]): Provincia[] {
  return pares.map(([codigo, nombre]) => ({ id: `es-prov-${codigo}`, nombre, ccaaId }));
}

/** Las comunidades autónomas y ciudades autónomas, en orden alfabético, con sus provincias. */
export const COMUNIDADES: ComunidadAutonoma[] = (() => {
  const defs: [string, string, [string, string][]][] = [
    ['01', 'Andalucía', [
      ['04', 'Almería'], ['11', 'Cádiz'], ['14', 'Córdoba'], ['18', 'Granada'],
      ['21', 'Huelva'], ['23', 'Jaén'], ['29', 'Málaga'], ['41', 'Sevilla'],
    ]],
    ['02', 'Aragón', [['22', 'Huesca'], ['44', 'Teruel'], ['50', 'Zaragoza']]],
    ['03', 'Principado de Asturias', [['33', 'Asturias']]],
    ['04', 'Illes Balears', [['07', 'Illes Balears']]],
    ['05', 'Canarias', [['35', 'Las Palmas'], ['38', 'Santa Cruz de Tenerife']]],
    ['06', 'Cantabria', [['39', 'Cantabria']]],
    ['07', 'Castilla y León', [
      ['05', 'Ávila'], ['09', 'Burgos'], ['24', 'León'], ['34', 'Palencia'],
      ['37', 'Salamanca'], ['40', 'Segovia'], ['42', 'Soria'], ['47', 'Valladolid'],
      ['49', 'Zamora'],
    ]],
    ['08', 'Castilla-La Mancha', [
      ['02', 'Albacete'], ['13', 'Ciudad Real'], ['16', 'Cuenca'], ['19', 'Guadalajara'],
      ['45', 'Toledo'],
    ]],
    ['09', 'Cataluña', [
      ['08', 'Barcelona'], ['17', 'Girona'], ['25', 'Lleida'], ['43', 'Tarragona'],
    ]],
    ['10', 'Comunitat Valenciana', [
      ['03', 'Alicante/Alacant'], ['12', 'Castellón/Castelló'], ['46', 'Valencia/València'],
    ]],
    ['11', 'Extremadura', [['06', 'Badajoz'], ['10', 'Cáceres']]],
    ['12', 'Galicia', [
      ['15', 'A Coruña'], ['27', 'Lugo'], ['32', 'Ourense'], ['36', 'Pontevedra'],
    ]],
    ['13', 'Comunidad de Madrid', [['28', 'Madrid']]],
    ['14', 'Región de Murcia', [['30', 'Murcia']]],
    ['15', 'Comunidad Foral de Navarra', [['31', 'Navarra']]],
    ['16', 'País Vasco', [['01', 'Araba/Álava'], ['20', 'Gipuzkoa'], ['48', 'Bizkaia']]],
    ['17', 'La Rioja', [['26', 'La Rioja']]],
    ['18', 'Ceuta', [['51', 'Ceuta']]],
    ['19', 'Melilla', [['52', 'Melilla']]],
  ];
  return defs.map(([codigo, nombre, provincias]) => ({
    id: `es-ccaa-${codigo}`,
    nombre,
    provincias: prov(`es-ccaa-${codigo}`, provincias),
  }));
})();

/** CCAA por id, o `undefined` si no existe. */
export function ccaaPorId(ccaaId: string): ComunidadAutonoma | undefined {
  return COMUNIDADES.find((c) => c.id === ccaaId);
}

/** Provincias de una CCAA (vacío si el id no existe). */
export function provinciasDeCcaa(ccaaId: string): Provincia[] {
  return ccaaPorId(ccaaId)?.provincias ?? [];
}

/** Provincia por id, buscando en todas las comunidades. */
export function provinciaPorId(provinciaId: string): Provincia | undefined {
  for (const c of COMUNIDADES) {
    const p = c.provincias.find((pr) => pr.id === provinciaId);
    if (p) return p;
  }
  return undefined;
}

/**
 * CCAA fijada por cada policía autonómica: la elección del cuerpo concreto en el onboarding
 * predetermina la comunidad (Ertzaintza → País Vasco, Mossos → Cataluña, Foral → Navarra,
 * Canaria → Canarias). El agente aún elige provincia (y municipio si procede).
 */
export const CCAA_DE_AUTONOMICA: Record<PoliciaAutonomica, string> = {
  ertzaintza: 'es-ccaa-16', // País Vasco
  mossos: 'es-ccaa-09', // Cataluña
  policia_foral: 'es-ccaa-15', // Navarra
  policia_canaria: 'es-ccaa-05', // Canarias
};

/**
 * Deriva un id estable para un municipio escrito a mano (no listamos los >8000). Normaliza
 * acentos, espacios y mayúsculas: "Alcalá de Henares" → `mun-alcala-de-henares`. Determinista.
 */
export function slugMunicipio(nombre: string): string {
  const base = nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita diacríticos combinantes
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base ? `mun-${base}` : '';
}
