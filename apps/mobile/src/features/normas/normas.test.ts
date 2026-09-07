import { describe, expect, it } from 'vitest';
import {
  agruparNormasPorBloque,
  esResumenOrientativo,
  estadoCambio,
  filtrarArticulos,
  normaRelevantePara,
  numeroSortKey,
  ordenarArticulos,
  parseCuerpos,
  type ArticuloResumen,
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

  it('agruparNormasPorBloque: agrupa por bloque, respeta el orden y omite vacíos', () => {
    const norma = (codigo: string): NormaResumen => ({
      id: `n-${codigo}`,
      codigo,
      titulo: codigo,
      tipo: 'ley',
      ambito: 'estatal',
      urlBoe: null,
      numArticulos: 1,
      cuerpos: [],
    });
    const secciones = agruparNormasPorBloque([norma('CP'), norma('RGC'), norma('LOSC')]);
    expect(secciones.map((s) => s.bloque)).toEqual(['trafico', 'penal', 'seguridad']);
    expect(secciones[0]?.data.map((n) => n.codigo)).toEqual(['RGC']);
  });
});
