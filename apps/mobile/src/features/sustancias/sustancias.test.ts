import { describe, expect, it } from 'vitest';
import {
  normalizarBusqueda,
  RESULTADO_INDICIOS_TRAFICO,
  RESULTADO_PROBABLE_CONSUMO,
  type Sustancia,
} from '@agente/shared';
import {
  aliasesLabel,
  acopioLabel,
  basePesoUmbral,
  calcularOrientacion,
  consumoDiarioLabel,
  filtrarSustancias,
  parseArrayCadenas,
  parseCantidadG,
  parsePurezaPct,
  reducirAPureza,
  type SustanciaResumen,
} from './sustancias';

/** Construye una `Sustancia` de prueba (peso PURO por defecto). */
function sustancia(p: Partial<Sustancia> = {}): Sustancia {
  return {
    id: p.id ?? 'cocaina',
    nombre: p.nombre ?? 'Cocaína',
    aliases: p.aliases ?? ['coca', 'farlopa'],
    umbralConsumoDiarioMg: p.umbralConsumoDiarioMg ?? 1500,
    umbralAcopioG: p.umbralAcopioG ?? 7.5,
    notasPureza: p.notasPureza ?? 'Umbral referido a sustancia PURA: reducir a la riqueza real.',
    indicadoresTrafico: p.indicadoresTrafico ?? ['balanza de precisión', 'dinero fraccionado'],
    fuente: p.fuente ?? 'INTCF; Acuerdo TS 19/10/2001.',
    pendienteRevision: p.pendienteRevision ?? true,
    notaRevision: p.notaRevision ?? 'Verificar dosis.',
  };
}

/** Construye un `SustanciaResumen` de prueba (calcula el haystack si no se pasa). */
function resumen(p: Partial<SustanciaResumen> & { id: string; nombre: string }): SustanciaResumen {
  const aliases = p.aliases ?? [];
  return {
    id: p.id,
    nombre: p.nombre,
    aliases,
    pendienteRevision: p.pendienteRevision ?? true,
    textoBusqueda: p.textoBusqueda ?? normalizarBusqueda(`${p.nombre} ${aliases.join(' ')}`),
  };
}

describe('parseArrayCadenas', () => {
  it('parsea un JSON array de cadenas', () => {
    expect(parseArrayCadenas('["coca","farlopa"]')).toEqual(['coca', 'farlopa']);
  });

  it('es defensivo: nulo, JSON roto o no-array → []', () => {
    expect(parseArrayCadenas(null)).toEqual([]);
    expect(parseArrayCadenas('')).toEqual([]);
    expect(parseArrayCadenas('{no json')).toEqual([]);
    expect(parseArrayCadenas('{"a":1}')).toEqual([]);
  });

  it('descarta elementos que no son cadena no vacía', () => {
    expect(parseArrayCadenas('["coca", 1, "", null, "  ", "perico"]')).toEqual(['coca', 'perico']);
  });
});

describe('basePesoUmbral', () => {
  it('detecta peso PURO por las notas de pureza', () => {
    expect(basePesoUmbral('Umbral referido a sustancia PURA: reducir a la riqueza.')).toBe('puro');
  });

  it('detecta peso BRUTO por las notas', () => {
    expect(basePesoUmbral('El umbral se refiere al PESO BRUTO del material vegetal.')).toBe('bruto');
  });

  it('ante la duda, no aplica reducción (bruto)', () => {
    expect(basePesoUmbral('Sin nota relevante.')).toBe('bruto');
  });

  it('"peso bruto" gana aunque la nota mencione pureza', () => {
    expect(basePesoUmbral('Umbral sobre PESO BRUTO; la pureza varía mucho.')).toBe('bruto');
  });
});

describe('parseCantidadG', () => {
  it('acepta coma y punto decimal (uso español)', () => {
    expect(parseCantidadG('1,5')).toBe(1.5);
    expect(parseCantidadG('1.5')).toBe(1.5);
    expect(parseCantidadG(' 100 ')).toBe(100);
    expect(parseCantidadG('0.3')).toBe(0.3);
  });

  it('rechaza vacío, no numérico, cero y negativos', () => {
    expect(parseCantidadG('')).toBeNull();
    expect(parseCantidadG('  ')).toBeNull();
    expect(parseCantidadG('abc')).toBeNull();
    expect(parseCantidadG('0')).toBeNull();
    expect(parseCantidadG('-3')).toBeNull();
    expect(parseCantidadG('1,2,3')).toBeNull();
  });
});

describe('parsePurezaPct', () => {
  it('acepta 0 < pureza ≤ 100, con coma y con %', () => {
    expect(parsePurezaPct('50')).toBe(50);
    expect(parsePurezaPct('12,5')).toBe(12.5);
    expect(parsePurezaPct('80%')).toBe(80);
    expect(parsePurezaPct('100')).toBe(100);
  });

  it('rechaza vacío, fuera de rango y no numérico', () => {
    expect(parsePurezaPct('')).toBeNull();
    expect(parsePurezaPct('0')).toBeNull();
    expect(parsePurezaPct('120')).toBeNull();
    expect(parsePurezaPct('-10')).toBeNull();
    expect(parsePurezaPct('mucha')).toBeNull();
  });
});

describe('reducirAPureza', () => {
  it('reduce la cantidad bruta a su equivalente puro', () => {
    expect(reducirAPureza(10, 50)).toBe(5);
    expect(reducirAPureza(20, 25)).toBe(5);
    expect(reducirAPureza(100, 100)).toBe(100);
  });

  it('redondea a la milésima de gramo', () => {
    expect(reducirAPureza(1, 33.3333)).toBe(0.333);
  });
});

describe('calcularOrientacion', () => {
  it('reduce a pureza en sustancias de peso PURO: 20 g al 30 % (6 g) NO supera 7,5 g → consumo', () => {
    const s = sustancia({ umbralAcopioG: 7.5 }); // peso puro
    const o = calcularOrientacion(s, 20, 30);
    expect(o.base).toBe('puro');
    expect(o.purezaAplicada).toBe(30);
    expect(o.cantidadComparadaG).toBe(6);
    expect(o.resultado.titulo).toBe(RESULTADO_PROBABLE_CONSUMO);
    expect(o.resultado.orientacion).toBe('probable_consumo');
  });

  it('sin reducir, esos mismos 20 g brutos SÍ superarían el umbral (evita sobre-marcar tráfico)', () => {
    const s = sustancia({ umbralAcopioG: 7.5 });
    const sinPureza = calcularOrientacion(s, 20, null);
    expect(sinPureza.purezaAplicada).toBeNull();
    expect(sinPureza.cantidadComparadaG).toBe(20);
    expect(sinPureza.resultado.orientacion).toBe('indicios_trafico');
  });

  it('en peso BRUTO no aplica pureza aunque se pase (cannabis/hachís)', () => {
    const cannabis = sustancia({
      id: 'cannabis-marihuana',
      umbralAcopioG: 100,
      notasPureza: 'El umbral se refiere al PESO BRUTO del material vegetal.',
    });
    const o = calcularOrientacion(cannabis, 250, 10);
    expect(o.base).toBe('bruto');
    expect(o.purezaAplicada).toBeNull();
    expect(o.cantidadComparadaG).toBe(250);
    expect(o.resultado.titulo).toBe(RESULTADO_INDICIOS_TRAFICO);
  });

  it('el resultado arrastra SIEMPRE el pie de responsabilidad y los indicadores', () => {
    const o = calcularOrientacion(sustancia(), 1, 50);
    expect(o.resultado.pie.length).toBeGreaterThan(0);
    expect(o.resultado.indicadoresTrafico).toEqual([
      'balanza de precisión',
      'dinero fraccionado',
    ]);
  });
});

describe('filtrarSustancias', () => {
  const items = [
    resumen({ id: 'cocaina', nombre: 'Cocaína', aliases: ['coca', 'farlopa', 'perico'] }),
    resumen({ id: 'cannabis-marihuana', nombre: 'Cannabis (marihuana)', aliases: ['maria', 'hierba'] }),
    resumen({ id: 'heroina', nombre: 'Heroína', aliases: ['caballo', 'jaco'] }),
  ];

  it('consulta vacía → todas', () => {
    expect(filtrarSustancias(items, '')).toHaveLength(3);
  });

  it('encuentra por nombre con tildes plegadas', () => {
    const r = filtrarSustancias(items, 'heroina');
    expect(r.map((s) => s.id)).toEqual(['heroina']);
  });

  it('encuentra por jerga de calle', () => {
    expect(filtrarSustancias(items, 'farlopa').map((s) => s.id)).toEqual(['cocaina']);
    expect(filtrarSustancias(items, 'maria').map((s) => s.id)).toEqual(['cannabis-marihuana']);
  });

  it('no encuentra lo que no está', () => {
    expect(filtrarSustancias(items, 'zzz')).toHaveLength(0);
  });
});

describe('etiquetas de dominio', () => {
  it('consumoDiarioLabel muestra mg y su equivalente en g', () => {
    // es-ES no agrupa los números de 4 cifras (regla CLDR): 1500 → "1500"; 20000 → "20.000".
    expect(consumoDiarioLabel(20000)).toBe('20.000 mg (20 g)');
    expect(consumoDiarioLabel(1500)).toBe('1500 mg (1,5 g)');
  });

  it('acopioLabel añade la unidad', () => {
    expect(acopioLabel(100)).toBe('100 g');
    expect(acopioLabel(0.3)).toBe('0,3 g');
  });

  it('aliasesLabel une la jerga o devuelve null si no hay', () => {
    expect(aliasesLabel(['coca', 'farlopa'])).toBe('también: coca · farlopa');
    expect(aliasesLabel([])).toBeNull();
  });
});
