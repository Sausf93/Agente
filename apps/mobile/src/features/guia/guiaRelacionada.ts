/**
 * Mapa FICHA → GUÍA rápida relacionada. Cierra el bucle de uso EN DIRECTO: el agente busca en el
 * lenguaje de la calle ("cachear", "papeles", "alcoholemia"), cae en la FICHA y desde ahí salta con
 * un toque a la GUÍA escaneable que resume los puntos clave. El mapa se DERIVA de las propias guías
 * (cada guía declara qué fichas amplía), así que no se desincroniza al añadir secciones.
 */

import { GUIA_IDENTIFICACION } from './guiaIdentificacion';
import { FICHAS_ALCOHOL } from './guiaAlcoholemia';
import { GUIA_MENORES } from './guiaMenores';
import { GUIA_EXTRANJERIA } from './guiaExtranjeria';
import { GUIA_VIOLENCIA_GENERO } from './guiaViolenciaGenero';

export interface GuiaRelacionada {
  /** Ruta de la guía (pantalla de la app). */
  ruta: string;
  titulo: string;
  descripcion: string;
}

const GUIA_IDENTIFICACION_REL: GuiaRelacionada = {
  ruta: '/guia-identificacion',
  titulo: 'Guía de identificación y cacheo',
  descripcion: 'Hasta dónde puedo llegar: cacheo, vehículo, domicilio y qué hago si se niega.',
};

const GUIA_ALCOHOLEMIA_REL: GuiaRelacionada = {
  ruta: '/guia-alcoholemia',
  titulo: 'Guía rápida de alcoholemia',
  descripcion: 'Cuándo pasa a delito y cómo dejar la prueba bien hecha.',
};

const GUIA_MENORES_REL: GuiaRelacionada = {
  ruta: '/guia-menores',
  titulo: 'Guía rápida de menores',
  descripcion: 'Inimputable < 14, régimen del menor 14-17 con garantías y MENA.',
};

const GUIA_EXTRANJERIA_REL: GuiaRelacionada = {
  ruta: '/guia-extranjeria',
  titulo: 'Guía de extranjería en la calle',
  descripcion: 'Irregular ≠ delito: vía administrativa, detención cautelar y cuándo es penal.',
};

const GUIA_VIOLENCIA_GENERO_REL: GuiaRelacionada = {
  ruta: '/guia-violencia-genero',
  titulo: 'Guía de violencia de género',
  descripcion: 'Proteger a la víctima, valorar el riesgo, orden de protección y detención.',
};

/**
 * Ficha → guía relacionada, construido a partir de las fichas que declara cada guía. Si dos secciones
 * de una guía apuntan a la misma ficha (p. ej. cacheo y vehículo → `sc-cacheo-registro`), la clave se
 * deduplica sin problema.
 */
export const GUIA_POR_FICHA: Readonly<Record<string, GuiaRelacionada>> = {
  ...Object.fromEntries(GUIA_IDENTIFICACION.map((s) => [s.fichaId, GUIA_IDENTIFICACION_REL])),
  ...Object.fromEntries(FICHAS_ALCOHOL.map((f) => [f.id, GUIA_ALCOHOLEMIA_REL])),
  // Extranjería primero (fichas ext-*); la guía de menores se aplica DESPUÉS para que la ficha MENA
  // (sc-mena-consulta, que ambas guías declaran) resuelva a la guía de menores, más específica.
  ...Object.fromEntries(
    GUIA_EXTRANJERIA.filter((s) => s.fichaId).map((s) => [s.fichaId as string, GUIA_EXTRANJERIA_REL]),
  ),
  ...Object.fromEntries(
    GUIA_MENORES.filter((s) => s.fichaId).map((s) => [s.fichaId as string, GUIA_MENORES_REL]),
  ),
  ...Object.fromEntries(
    GUIA_VIOLENCIA_GENERO.filter((s) => s.fichaId).map((s) => [
      s.fichaId as string,
      GUIA_VIOLENCIA_GENERO_REL,
    ]),
  ),
};

/** Devuelve la guía escaneable que amplía una ficha, o `null` si no hay ninguna. */
export function guiaRelacionadaDe(infraccionId: string): GuiaRelacionada | null {
  return GUIA_POR_FICHA[infraccionId] ?? null;
}
