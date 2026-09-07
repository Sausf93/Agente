import { describe, expect, it } from 'vitest';
import type { TipoConsecuencia } from '@agente/shared';
import {
  accionOperativaFrom,
  esConsultableSinSancion,
  fichaKindFrom,
  tilesFicha,
  type FichaInfraccion,
} from './ficha';
import { formatEuros } from './format';

/**
 * Tests de la FICHA ADAPTATIVA (rediseño 2026-09): la derivación de `fichaKind` y la regla de oro
 * "un tile solo si tiene valor" (nunca "—"). Cubre el bug del usuario: un DELITO no debe pintar los
 * tiles de tráfico (importe / pronto pago / puntos), sino su marco penal.
 */

/** Factoría de ficha con valores por defecto de una administrativa de tráfico. */
function fichaDe(over: Partial<FichaInfraccion>): FichaInfraccion {
  const base: FichaInfraccion = {
    infraccionId: 'inf-x',
    tituloCorto: 'Infracción de prueba',
    gravedad: 'grave',
    tipo: 'administrativa',
    fichaKind: 'trafico',
    importeEur: 200,
    importeReducidoEur: 100,
    puntos: 3,
    penaTexto: null,
    gravedadPenal: null,
    textoBoletin: 'Texto de boletín.',
    variantesBoletin: [],
    competencia: { cuerpos: [], via: 'ambas' },
    estadoRevision: 'pendiente_revision',
    notaRevision: null,
    normaCodigo: 'LSV',
    articuloNumero: '76.c',
    urlBoe: null,
    articuloTitulo: null,
    articuloTexto: 'Artículo.',
    consecuencias: [],
    actualizadoEn: null,
  };
  // `fichaKind` se recalcula salvo que el test lo fije explícitamente.
  const merged = { ...base, ...over };
  if (over.fichaKind === undefined) {
    merged.fichaKind = fichaKindFrom(merged);
  }
  return merged;
}

describe('fichaKindFrom', () => {
  it('un delito (tipo penal) es `penal`', () => {
    expect(
      fichaKindFrom({ tipo: 'penal', gravedad: 'delito', puntos: null, normaCodigo: 'CP' }),
    ).toBe('penal');
  });

  it('gravedad `delito` es `penal` aunque el tipo no lo diga', () => {
    expect(
      fichaKindFrom({ tipo: 'administrativa', gravedad: 'delito', puntos: null, normaCodigo: 'CP' }),
    ).toBe('penal');
  });

  it('la LO 4/2015 (código LOSC) es `seguridad_ciudadana` y nunca `trafico`', () => {
    expect(
      fichaKindFrom({ tipo: 'administrativa', gravedad: 'grave', puntos: null, normaCodigo: 'LOSC' }),
    ).toBe('seguridad_ciudadana');
  });

  it('detraer puntos implica `trafico`', () => {
    expect(
      fichaKindFrom({ tipo: 'administrativa', gravedad: 'grave', puntos: 6, normaCodigo: 'LSV' }),
    ).toBe('trafico');
  });

  it('una norma de tráfico sin puntos sigue siendo `trafico` (RGC/RGV)', () => {
    expect(
      fichaKindFrom({ tipo: 'administrativa', gravedad: 'leve', puntos: null, normaCodigo: 'RGC' }),
    ).toBe('trafico');
  });

  it('el resto de administrativas cae a `administrativa`', () => {
    expect(
      fichaKindFrom({ tipo: 'administrativa', gravedad: 'leve', puntos: null, normaCodigo: 'ORD-MUNI' }),
    ).toBe('administrativa');
  });

  it('la LO 4/2000 (código LOEX) es `extranjeria` (no se destaca el importe)', () => {
    expect(
      fichaKindFrom({ tipo: 'administrativa', gravedad: 'grave', puntos: null, normaCodigo: 'LOEX' }),
    ).toBe('extranjeria');
  });
});

describe('tilesFicha — "solo con valor" y adaptación por tipo', () => {
  it('un DELITO no pinta NINGÚN tile de tráfico (importe/pronto pago/puntos)', () => {
    const ficha = fichaDe({
      tipo: 'penal',
      gravedad: 'delito',
      normaCodigo: 'CP',
      importeEur: null,
      importeReducidoEur: null,
      puntos: null,
      penaTexto: 'Prisión de 6 a 18 meses',
      gravedadPenal: 'menos_grave',
    });
    expect(ficha.fichaKind).toBe('penal');
    expect(tilesFicha(ficha, formatEuros)).toEqual([]);
  });

  it('tráfico completo: importe (énfasis) + pronto pago + puntos', () => {
    const ficha = fichaDe({ importeEur: 200, importeReducidoEur: 100, puntos: 6, normaCodigo: 'LSV' });
    const tiles = tilesFicha(ficha, formatEuros);
    expect(tiles.map((x) => x.etiqueta)).toEqual(['Importe', 'Pronto pago', 'Puntos']);
    expect(tiles[0]).toMatchObject({ valor: '200 €', enfasis: true });
    expect(tiles[2]).toMatchObject({ etiqueta: 'Puntos', valor: '6' });
  });

  it('sin pronto pago ni puntos, tráfico cae a un único tile (nunca "—")', () => {
    const ficha = fichaDe({ importeEur: 500, importeReducidoEur: null, puntos: null, normaCodigo: 'LSV' });
    const tiles = tilesFicha(ficha, formatEuros);
    expect(tiles).toHaveLength(1);
    expect(tiles[0]).toMatchObject({ etiqueta: 'Importe', valor: '500 €' });
    expect(tiles.some((x) => x.valor === '—')).toBe(false);
  });

  it('seguridad ciudadana: importe + pronto pago + TRAMO cualitativo, NUNCA puntos', () => {
    const ficha = fichaDe({
      tipo: 'administrativa',
      gravedad: 'grave',
      normaCodigo: 'LOSC',
      importeEur: 601,
      importeReducidoEur: 300,
      puntos: null,
    });
    expect(ficha.fichaKind).toBe('seguridad_ciudadana');
    const etiquetas = tilesFicha(ficha, formatEuros).map((x) => x.etiqueta);
    expect(etiquetas).toEqual(['Importe', 'Pronto pago', 'Tramo']);
    expect(etiquetas).not.toContain('Puntos');
    const tramo = tilesFicha(ficha, formatEuros).find((x) => x.etiqueta === 'Tramo');
    expect(tramo?.valor).toBe('Grave');
  });

  it('administrativa genérica: solo importe (+ pronto pago si aplica), sin puntos ni tramo', () => {
    const ficha = fichaDe({
      tipo: 'administrativa',
      gravedad: 'leve',
      normaCodigo: 'ORD-MUNI',
      importeEur: 80,
      importeReducidoEur: null,
      puntos: null,
    });
    expect(ficha.fichaKind).toBe('administrativa');
    expect(tilesFicha(ficha, formatEuros).map((x) => x.etiqueta)).toEqual(['Importe']);
  });

  it('extranjería: la sanción (multa o expulsión) MANDA y el importe NO se destaca (sin énfasis)', () => {
    const ficha = fichaDe({
      tipo: 'administrativa',
      gravedad: 'grave',
      normaCodigo: 'LOEX',
      importeEur: 501,
      importeReducidoEur: null,
      puntos: null,
    });
    expect(ficha.fichaKind).toBe('extranjeria');
    const tiles = tilesFicha(ficha, formatEuros);
    expect(tiles.map((x) => x.etiqueta)).toEqual(['Sanción', 'Multa desde']);
    expect(tiles[0]).toMatchObject({ valor: 'Multa o expulsión' });
    // El importe (501 €) va DE-ENFATIZADO: nunca como tile de acento (enfasis).
    expect(tiles.some((x) => x.enfasis)).toBe(false);
  });
});

/**
 * Tests de la ACCIÓN OPERATIVA (rediseño 2026-09, feedback "validadores de calle"): lo que el
 * agente decide ANTES que el importe. Se deriva del set de consecuencias con prioridad por
 * coerción y con estado POSITIVO explícito cuando no hay medida.
 */
describe('accionOperativaFrom — qué hace el agente con el vehículo/persona', () => {
  const cons = (...tipos: TipoConsecuencia[]) =>
    tipos.map((tipo) => ({ tipo, fuente: `art. X (${tipo})` }));

  it('la detención manda sobre cualquier otra medida (prioridad máxima)', () => {
    const a = accionOperativaFrom({
      fichaKind: 'penal',
      consecuencias: cons('deposito', 'detencion', 'inmovilizacion'),
    });
    expect(a).not.toBeNull();
    expect(a?.kind).toBe('detencion');
    expect(a?.tono).toBe('coercitivo');
    expect(a?.fuente).toBe('art. X (detencion)');
  });

  it('grúa/depósito por delante de inmovilización', () => {
    const a = accionOperativaFrom({
      fichaKind: 'trafico',
      consecuencias: cons('inmovilizacion', 'deposito'),
    });
    expect(a?.kind).toBe('deposito');
    expect(a?.tono).toBe('coercitivo');
  });

  it('inmovilización cuando es la única medida', () => {
    const a = accionOperativaFrom({ fichaKind: 'trafico', consecuencias: cons('inmovilizacion') });
    expect(a?.kind).toBe('inmovilizacion');
  });

  it('retirada de permiso se reconoce como acción coercitiva', () => {
    const a = accionOperativaFrom({ fichaKind: 'trafico', consecuencias: cons('retirada_permiso') });
    expect(a?.kind).toBe('retirada');
    expect(a?.tono).toBe('coercitivo');
  });

  it('la identificación NO es coercitiva: en tráfico el vehículo SIGUE (estado positivo)', () => {
    const a = accionOperativaFrom({ fichaKind: 'trafico', consecuencias: cons('identificacion') });
    expect(a?.kind).toBe('sigue');
    expect(a?.tono).toBe('positivo');
    expect(a?.fuente).toBeNull();
    expect(a?.titulo).toMatch(/^El vehículo sigue/);
  });

  it('sin consecuencias, tráfico: estado POSITIVO explícito "el vehículo sigue · solo denuncia"', () => {
    const a = accionOperativaFrom({ fichaKind: 'trafico', consecuencias: [] });
    expect(a?.kind).toBe('sigue');
    expect(a?.tono).toBe('positivo');
    expect(a?.titulo).toContain('solo denuncia');
  });

  it('sin consecuencias, seguridad ciudadana: el sujeto es la PERSONA, no el vehículo', () => {
    const a = accionOperativaFrom({ fichaKind: 'seguridad_ciudadana', consecuencias: [] });
    expect(a?.kind).toBe('sigue');
    expect(a?.titulo).toMatch(/^La persona sigue/);
  });

  it('un delito SIN medida coercitiva no fuerza un "sigue" falso: devuelve null (manda el bloque penal)', () => {
    const a = accionOperativaFrom({ fichaKind: 'penal', consecuencias: [] });
    expect(a).toBeNull();
  });

  it('un delito CON detención muestra "atestado + detención", coercitivo', () => {
    const a = accionOperativaFrom({ fichaKind: 'penal', consecuencias: cons('detencion') });
    expect(a?.kind).toBe('detencion');
    expect(a?.titulo).toContain('detención');
    expect(a?.tono).toBe('coercitivo');
  });

  it('extranjería con identificación: "Identificar · vía administrativa · NO detención penal" (informativo), NUNCA "el vehículo sigue"', () => {
    const a = accionOperativaFrom({
      fichaKind: 'extranjeria',
      consecuencias: cons('identificacion'),
    });
    expect(a?.kind).toBe('identificacion');
    expect(a?.tono).toBe('informativo');
    expect(a?.titulo).toMatch(/NO detención penal/);
    expect(a?.titulo).not.toMatch(/veh[íi]culo/i);
    expect(a?.fuente).toBe('art. X (identificacion)');
  });

  it('extranjería SIN medida: el sujeto es la PERSONA, no el vehículo', () => {
    const a = accionOperativaFrom({ fichaKind: 'extranjeria', consecuencias: [] });
    expect(a?.kind).toBe('sigue');
    expect(a?.titulo).toMatch(/^La persona sigue/);
  });

  it('en un delito, una detención concurrente manda sobre la identificación', () => {
    const a = accionOperativaFrom({
      fichaKind: 'penal',
      consecuencias: cons('identificacion', 'detencion'),
    });
    expect(a?.kind).toBe('detencion');
  });

  // REGRESIÓN (ronda validadores): el texto de EXTRANJERÍA (LOEX/expulsión) NO debe salir en una
  // ficha de seguridad ciudadana con consecuencia `identificacion` (art. 16 LOSC).
  it('identificación de seguridad ciudadana (art. 16 LOSC): NO menciona LOEX ni expulsión', () => {
    const a = accionOperativaFrom({
      fichaKind: 'seguridad_ciudadana',
      consecuencias: [{ tipo: 'identificacion', fuente: 'LO 4/2015 art. 16' }],
    });
    expect(a?.kind).toBe('identificacion');
    expect(a?.tono).toBe('informativo');
    const texto = `${a?.titulo} ${a?.detalle}`;
    expect(texto).not.toMatch(/LOEX/i);
    expect(texto).not.toMatch(/expulsi[oó]n/i);
    expect(texto).not.toMatch(/detenci[oó]n penal/i);
    expect(texto).toMatch(/art\. 16/i);
  });

  // La extranjería SÍ conserva su mensaje clave (LOEX / vía administrativa / no detención penal).
  it('identificación de extranjería mantiene el mensaje LOEX (no se rompe)', () => {
    const a = accionOperativaFrom({
      fichaKind: 'extranjeria',
      consecuencias: [{ tipo: 'identificacion', fuente: 'LO 4/2000 art. 53' }],
    });
    expect(`${a?.titulo} ${a?.detalle}`).toMatch(/LOEX/);
  });
});

describe('esConsultableSinSancion — entrada que NO impone sanción (art. 16 LOSC)', () => {
  it('seguridad ciudadana sin importe ni puntos: es consultable → sin tiles (ni tramo)', () => {
    const ficha = fichaDe({
      fichaKind: 'seguridad_ciudadana',
      gravedad: 'leve',
      importeEur: null,
      importeReducidoEur: null,
      puntos: null,
    });
    expect(esConsultableSinSancion(ficha)).toBe(true);
    // No pinta "Tramo" ni ningún otro tile: no hay sanción que mostrar.
    expect(tilesFicha(ficha, formatEuros)).toEqual([]);
  });

  it('seguridad ciudadana CON importe (una sanción real) NO es consultable y sí pinta tramo', () => {
    const ficha = fichaDe({
      fichaKind: 'seguridad_ciudadana',
      gravedad: 'grave',
      importeEur: 601,
      importeReducidoEur: 300.5,
      puntos: null,
    });
    expect(esConsultableSinSancion(ficha)).toBe(false);
    expect(tilesFicha(ficha, formatEuros).some((x) => x.etiqueta === 'Tramo')).toBe(true);
  });

  it('un delito (marco penal) nunca se trata como consultable', () => {
    const ficha = fichaDe({
      fichaKind: 'penal',
      tipo: 'penal',
      gravedad: 'delito',
      importeEur: null,
      importeReducidoEur: null,
      puntos: null,
    });
    expect(esConsultableSinSancion(ficha)).toBe(false);
  });
});
