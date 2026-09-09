import { describe, expect, it } from 'vitest';
import {
  agruparPorAmbito,
  contarPorMateria,
  esResumenOrientativo,
  estadoCambio,
  filtroTerritorialSql,
  filtrarArticulos,
  materiaAdmiteTerritorio,
  materiaDeNorma,
  normaRelevantePara,
  numeroSortKey,
  ordenarArticulos,
  parseCuerpos,
  MATERIA_ORDEN,
  type ArticuloResumen,
  type Materia,
  type NormaResumen,
} from './normas';

/** Construye un `ArticuloResumen` de prueba con lo mínimo (haystack se calcula si no se pasa). */
function art(p: Partial<ArticuloResumen> & { numero: string }): ArticuloResumen {
  return {
    id: p.id ?? `art-${p.numero}`,
    numero: p.numero,
    titulo: p.titulo ?? null,
    esResumen: p.esResumen ?? false,
    orden: p.orden ?? 0,
    textoBusqueda: p.textoBusqueda ?? `${p.numero} ${p.titulo ?? ''}`.toLowerCase(),
  };
}

describe('numeroSortKey', () => {
  it('extrae la parte numérica inicial para ordenar como número, no como texto', () => {
    expect(numeroSortKey('18')[0]).toBe(18);
    expect(numeroSortKey('118')[0]).toBe(118);
    expect(numeroSortKey('5 bis')[0]).toBe(5);
    expect(numeroSortKey('11.1')[0]).toBe(11);
  });

  it('los números sin parte numérica caen al final (Infinity)', () => {
    expect(numeroSortKey('único')[0]).toBe(Number.POSITIVE_INFINITY);
    expect(numeroSortKey('Disposición final primera')[0]).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('ordenarArticulos', () => {
  it('ordena por orden documental y, a igualdad, por número ascendente numérico', () => {
    const entrada = [art({ numero: '118', orden: 0 }), art({ numero: '18', orden: 0 }), art({ numero: '5', orden: 0 })];
    const salida = ordenarArticulos(entrada).map((a) => a.numero);
    expect(salida).toEqual(['5', '18', '118']);
  });

  it('respeta el orden documental por encima del número', () => {
    const entrada = [art({ numero: '2', orden: 1 }), art({ numero: '100', orden: 0 })];
    const salida = ordenarArticulos(entrada).map((a) => a.numero);
    expect(salida).toEqual(['100', '2']);
  });

  it('coloca las disposiciones (sin número) al final del mismo orden', () => {
    const entrada = [
      art({ numero: 'Disposición final primera', orden: 0 }),
      art({ numero: '3', orden: 0 }),
    ];
    const salida = ordenarArticulos(entrada).map((a) => a.numero);
    expect(salida).toEqual(['3', 'Disposición final primera']);
  });

  it('no muta el array de entrada', () => {
    const entrada = [art({ numero: '2' }), art({ numero: '1' })];
    const copia = [...entrada];
    ordenarArticulos(entrada);
    expect(entrada).toEqual(copia);
  });
});

describe('filtrarArticulos', () => {
  const articulos = [
    art({ numero: '18', titulo: 'Uso de dispositivos', textoBusqueda: '18 uso de dispositivos moviles' }),
    art({ numero: '99', titulo: 'Alumbrado', textoBusqueda: '99 alumbrado utilizacion del alumbrado' }),
    art({ numero: '118', titulo: 'Cinturón', textoBusqueda: '118 cinturon de seguridad' }),
  ];

  it('consulta vacía devuelve todos', () => {
    expect(filtrarArticulos(articulos, '')).toHaveLength(3);
    expect(filtrarArticulos(articulos, '   ')).toHaveLength(3);
  });

  it('por número usa prefijo exacto: "18" no trae el 118', () => {
    const res = filtrarArticulos(articulos, '18').map((a) => a.numero);
    expect(res).toEqual(['18']);
  });

  it('por número con prefijo trae los que empiezan igual', () => {
    const res = filtrarArticulos(articulos, '1').map((a) => a.numero);
    expect(res).toEqual(['18', '118']);
  });

  it('por texto plega tildes y busca en el cuerpo normalizado', () => {
    const res = filtrarArticulos(articulos, 'alúmbrado').map((a) => a.numero);
    expect(res).toEqual(['99']);
  });

  it('por texto encuentra por palabra del título/cuerpo', () => {
    const res = filtrarArticulos(articulos, 'cinturon').map((a) => a.numero);
    expect(res).toEqual(['118']);
  });
});

describe('esResumenOrientativo', () => {
  it('detecta la marca del seed (insensible a mayúsculas)', () => {
    expect(esResumenOrientativo('Regula el alumbrado. Resumen orientativo.')).toBe(true);
    expect(esResumenOrientativo('RESUMEN ORIENTATIVO; consúltese el BOE.')).toBe(true);
  });

  it('devuelve false para texto consolidado sin la marca', () => {
    expect(esResumenOrientativo('1. El conductor debe...')).toBe(false);
  });
});

describe('estadoCambio', () => {
  const ref = '2026-09-07T00:00:00.000Z';

  it('marca "reciente" si entró en vigor dentro de la ventana', () => {
    expect(estadoCambio('2026-06-06T00:00:00.000Z', ref)).toBe('reciente');
  });

  it('marca "futuro" si aún no está en vigor', () => {
    expect(estadoCambio('2026-10-01T00:00:00.000Z', ref)).toBe('futuro');
  });

  it('NO marca el artefacto del seed (validFrom == fecha del paquete)', () => {
    expect(estadoCambio(ref, ref)).toBeNull();
  });

  it('NO marca cambios antiguos fuera de la ventana', () => {
    expect(estadoCambio('2004-01-23T00:00:00.000Z', ref)).toBeNull();
  });

  it('tolera fechas nulas o inválidas', () => {
    expect(estadoCambio(null, ref)).toBeNull();
    expect(estadoCambio('2026-06-06T00:00:00.000Z', null)).toBeNull();
    expect(estadoCambio('no-fecha', ref)).toBeNull();
  });
});

describe('filtrado por cuerpo y bloques', () => {
  it('parseCuerpos: JSON válido → array de cuerpos válidos; descarta desconocidos', () => {
    expect(parseCuerpos('["guardia_civil","policia_local"]')).toEqual([
      'guardia_civil',
      'policia_local',
    ]);
    expect(parseCuerpos('["guardia_civil","marcianos"]')).toEqual(['guardia_civil']);
  });

  it('parseCuerpos: nulo, vacío o JSON roto → [] (nunca lanza)', () => {
    expect(parseCuerpos(null)).toEqual([]);
    expect(parseCuerpos('')).toEqual([]);
    expect(parseCuerpos('{no es array}')).toEqual([]);
    expect(parseCuerpos('"texto"')).toEqual([]);
  });

  it('normaRelevantePara: sin cuerpo en perfil o norma sin etiquetar → siempre relevante', () => {
    expect(normaRelevantePara(['guardia_civil'], null)).toBe(true);
    expect(normaRelevantePara([], 'policia_nacional')).toBe(true);
  });

  it('normaRelevantePara: con etiqueta, relevante solo si incluye al cuerpo del agente', () => {
    expect(normaRelevantePara(['guardia_civil', 'policia_local'], 'guardia_civil')).toBe(true);
    expect(normaRelevantePara(['guardia_civil', 'policia_local'], 'policia_nacional')).toBe(false);
  });

});

// ---------------------------------------------------------------------------
// Taxonomía POR MATERIA (navegación estilo SPPLB)
// ---------------------------------------------------------------------------

/** Construye una `NormaResumen` de prueba a partir del código (+ ámbito/territorio/cuerpos). */
function norma(
  codigo: string,
  extra: Partial<NormaResumen> = {},
): NormaResumen {
  return {
    id: `n-${codigo}`,
    codigo,
    titulo: codigo,
    tipo: 'ley',
    ambito: 'estatal',
    territorioId: null,
    urlBoe: null,
    numArticulos: 1,
    cuerpos: [],
    ...extra,
  };
}

describe('materiaDeNorma', () => {
  // Los 23 códigos REALES del catálogo/seeds actual → su materia esperada (mapa interino en la app).
  const casos: Array<[string, Materia]> = [
    // Estatales (14).
    ['RGC', 'trafico'],
    ['LSV', 'trafico'],
    ['RGV', 'trafico'],
    ['LRCSCVM', 'trafico'],
    ['LOTT', 'trafico'],
    ['LOSC', 'seguridad'],
    ['CP', 'penal'],
    ['LECrim', 'penal'],
    ['LORPM', 'penal'],
    ['LOEX', 'extranjeria'],
    ['RA', 'armas'],
    ['LPPP', 'animales'],
    ['EVD', 'victimaMenores'],
    ['LOPJM', 'victimaMenores'],
    // Autonómicas (Canarias, 4): se clasifica por el <TEMA> de CAN-<TEMA>.
    ['CAN-ESP', 'ocio'],
    ['CAN-ANIM', 'animales'],
    ['CAN-CPL', 'organizacion'],
    ['CAN-PCAN', 'organizacion'],
    // Municipales (SCTF, 5): se clasifica por el <TEMA> de OM-<TEMA>-<MUN>.
    ['OM-CIRC-SCTF', 'trafico'],
    ['OM-ZBE-SCTF', 'trafico'],
    ['OM-ANIM-SCTF', 'animales'],
    ['OM-RUIDO-SCTF', 'ocio'],
    ['OM-TERRAZAS-SCTF', 'ocio'],
  ];

  it.each(casos)('clasifica %s en la materia %s', (codigo, materia) => {
    expect(materiaDeNorma(codigo)).toBe(materia);
  });

  it('NINGUNA norma del catálogo actual cae en "otras" (fallback vacío hoy)', () => {
    expect(casos.some(([, materia]) => materia === 'otras')).toBe(false);
    expect(casos.every(([codigo]) => materiaDeNorma(codigo) !== 'otras')).toBe(true);
  });

  it('un código futuro reutiliza el tema (CCAA/municipio nuevos heredan la clasificación)', () => {
    expect(materiaDeNorma('OM-CIRC-MADRID')).toBe('trafico');
    expect(materiaDeNorma('CAN-ANIM')).toBe('animales');
  });

  it('un código desconocido cae en "otras" (fallback conservador)', () => {
    expect(materiaDeNorma('ZZZ')).toBe('otras');
    expect(materiaDeNorma('OM-DESCONOCIDA-SCTF')).toBe('otras');
    expect(materiaDeNorma('CAN-XYZ')).toBe('otras');
  });
});

describe('materiaAdmiteTerritorio', () => {
  it('las materias con normas territoriales (tráfico, ocio, organización, animales) sí', () => {
    for (const m of ['trafico', 'ocio', 'organizacion', 'animales'] as Materia[]) {
      expect(materiaAdmiteTerritorio(m)).toBe(true);
    }
  });

  it('las materias puramente estatales no ofrecen franja territorial', () => {
    for (const m of ['penal', 'extranjeria', 'seguridad', 'armas', 'victimaMenores'] as Materia[]) {
      expect(materiaAdmiteTerritorio(m)).toBe(false);
    }
  });
});

describe('contarPorMateria', () => {
  it('respeta MATERIA_ORDEN y omite las materias con count 0', () => {
    const conteo = contarPorMateria([norma('CP'), norma('RGC'), norma('LSV'), norma('LOSC')]);
    // Tráfico (2) va antes que Seguridad (1) y que Penal (1) por su orden en la taxonomía.
    expect(conteo.map((c) => c.materia)).toEqual(['trafico', 'seguridad', 'penal']);
    expect(conteo.find((c) => c.materia === 'trafico')?.count).toBe(2);
    // No aparece ninguna materia vacía (extranjería, armas, etc.).
    expect(conteo.every((c) => c.count > 0)).toBe(true);
  });

  it('cuenta lo que recibe (el filtro por cuerpo se aplica ANTES): una lista filtrada da menos', () => {
    const todas = [norma('CP'), norma('RGC')];
    // Simula "Solo mi cuerpo" de un perfil para el que RGC no es relevante: se pasa ya filtrado.
    const soloMio = todas.filter((n) => n.codigo !== 'RGC');
    const conteo = contarPorMateria(soloMio);
    expect(conteo.map((c) => c.materia)).toEqual(['penal']);
  });

  it('el orden devuelto es un subconjunto en el mismo orden que MATERIA_ORDEN', () => {
    const conteo = contarPorMateria([norma('RA'), norma('CP'), norma('RGC')]);
    const materias = conteo.map((c) => c.materia);
    const indices = materias.map((m) => MATERIA_ORDEN.indexOf(m));
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });
});

describe('agruparPorAmbito', () => {
  it('ordena Estatal → Autonómico → Municipal y omite los ámbitos vacíos', () => {
    const secciones = agruparPorAmbito([
      norma('OM-ANIM-SCTF', { ambito: 'municipal', territorioId: 'mun-x' }),
      norma('LPPP', { ambito: 'estatal' }),
      norma('CAN-ANIM', { ambito: 'autonomico', territorioId: 'es-ccaa-05' }),
    ]);
    expect(secciones.map((s) => s.ambito)).toEqual(['estatal', 'autonomico', 'municipal']);
    expect(secciones[0]?.data.map((n) => n.codigo)).toEqual(['LPPP']);
  });

  it('sin normas de un ámbito, ese ámbito no aparece', () => {
    const secciones = agruparPorAmbito([norma('CP'), norma('RGC')]);
    expect(secciones.map((s) => s.ambito)).toEqual(['estatal']);
  });
});

describe('filtroTerritorialSql: capa por territorio (ADR-006/008)', () => {
  it('sin cadena → solo lo estatal (territorio_id IS NULL)', () => {
    const f = filtroTerritorialSql([], 'n.territorio_id');
    expect(f.sql).toBe('n.territorio_id IS NULL');
    expect(f.params).toEqual([]);
  });

  it('con cadena → estatal o dentro de la cadena, con placeholders y params', () => {
    const f = filtroTerritorialSql(
      ['es-ccaa-05', 'es-prov-38', 'mun-santa-cruz-de-tenerife'],
      'n.territorio_id',
    );
    expect(f.sql).toBe('(n.territorio_id IS NULL OR n.territorio_id IN (?, ?, ?))');
    expect(f.params).toEqual(['es-ccaa-05', 'es-prov-38', 'mun-santa-cruz-de-tenerife']);
  });

  it('descarta ids vacíos de la cadena', () => {
    const f = filtroTerritorialSql(['', 'mun-x', ''], 'n.territorio_id');
    expect(f.sql).toBe('(n.territorio_id IS NULL OR n.territorio_id IN (?))');
    expect(f.params).toEqual(['mun-x']);
  });
});
