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
    ambito: 'estatal',
    importeEur: 200,
    importeReducidoEur: 100,
    importeMaxEur: null,
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

  it('el transporte (LOTT) es marco de VEHÍCULO → `trafico` (sujeto vehículo), aunque no detraiga puntos', () => {
    expect(
      fichaKindFrom({ tipo: 'administrativa', gravedad: 'muy_grave', puntos: null, normaCodigo: 'LOTT' }),
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

  // Marco de HORQUILLA (I-2): seguridad ciudadana con máximo del tramo → RANGO ("601–30.000 €") sin
  // énfasis; el tile que MANDA es el TRAMO. Nunca puntos.
  it('seguridad ciudadana: multa como RANGO (sin énfasis) + pronto pago + TRAMO, NUNCA puntos', () => {
    const ficha = fichaDe({
      tipo: 'administrativa',
      gravedad: 'grave',
      normaCodigo: 'LOSC',
      importeEur: 601,
      importeReducidoEur: 300,
      importeMaxEur: 30000,
      puntos: null,
    });
    expect(ficha.fichaKind).toBe('seguridad_ciudadana');
    const tiles = tilesFicha(ficha, formatEuros);
    expect(tiles.map((x) => x.etiqueta)).toEqual(['Multa', 'Pronto pago', 'Tramo']);
    expect(tiles.map((x) => x.etiqueta)).not.toContain('Puntos');
    // El importe va como rango y SIN énfasis (no manda el número).
    expect(tiles[0]).toMatchObject({ etiqueta: 'Multa', valor: '601–30.000 €' });
    expect(tiles.some((x) => x.enfasis)).toBe(false);
    expect(tiles.find((x) => x.etiqueta === 'Tramo')?.valor).toBe('Grave');
  });

  // Sin máximo conocido, el marco de horquilla muestra "desde X" (como extranjería), sin énfasis.
  it('horquilla sin máximo: multa "desde X" sin énfasis', () => {
    const ficha = fichaDe({
      tipo: 'administrativa',
      gravedad: 'leve',
      normaCodigo: 'LOSC',
      importeEur: 100,
      importeReducidoEur: null,
      importeMaxEur: null,
      puntos: null,
    });
    const tiles = tilesFicha(ficha, formatEuros);
    expect(tiles[0]).toMatchObject({ etiqueta: 'Multa', valor: 'desde 100 €' });
    expect(tiles.some((x) => x.enfasis)).toBe(false);
  });

  it('administrativa ESTATAL con multa fija: importe con énfasis (no es horquilla)', () => {
    const ficha = fichaDe({
      tipo: 'administrativa',
      gravedad: 'leve',
      ambito: 'estatal',
      fichaKind: 'administrativa',
      normaCodigo: 'ORD-MUNI',
      importeEur: 80,
      importeReducidoEur: null,
      importeMaxEur: null,
      puntos: null,
    });
    expect(ficha.fichaKind).toBe('administrativa');
    expect(tilesFicha(ficha, formatEuros)[0]).toMatchObject({ etiqueta: 'Importe', enfasis: true });
  });

  // I-2: en autonómico/municipal la multa es un tramo amplio: va como RANGO/"desde", SIN énfasis, y
  // el tile que manda es el TRAMO (gravedad).
  it('autonómica/municipal: la multa va como rango/desde, SIN énfasis, con TRAMO', () => {
    const auton = fichaDe({
      tipo: 'administrativa',
      gravedad: 'muy_grave',
      ambito: 'autonomico',
      fichaKind: 'administrativa',
      normaCodigo: 'CAN-ESP',
      importeEur: 15001,
      importeReducidoEur: null,
      importeMaxEur: 30000,
      puntos: null,
    });
    const tiles = tilesFicha(auton, formatEuros);
    expect(tiles.map((x) => x.etiqueta)).toEqual(['Multa', 'Tramo']);
    expect(tiles[0]).toMatchObject({ etiqueta: 'Multa', valor: '15.001–30.000 €' });
    expect(tiles.some((x) => x.enfasis)).toBe(false);
    expect(tiles.find((x) => x.etiqueta === 'Tramo')?.valor).toBe('Muy grave');

    // Contraste: la MISMA administrativa pero ESTATAL con multa fija sí da énfasis al importe.
    const estatal = fichaDe({
      tipo: 'administrativa',
      gravedad: 'leve',
      ambito: 'estatal',
      fichaKind: 'administrativa',
      normaCodigo: 'ORD-MUNI',
      importeEur: 80,
      importeReducidoEur: null,
      importeMaxEur: null,
      puntos: null,
    });
    expect(tilesFicha(estatal, formatEuros)[0]).toMatchObject({ etiqueta: 'Importe', enfasis: true });
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

  // GC I1: los marcos de TRÁFICO que NO son cifra fija (seguro obligatorio, transporte/tacógrafo,
  // alcohol/drogas y el CUADRO de velocidad) llevan `importeMaxEur` y NO se pintan como cifra fija
  // enfatizada: van como rango, sin énfasis, pero conservan puntos.
  it('tráfico "seguro obligatorio" (601–3.005 €): rango SIN énfasis, no cifra fija', () => {
    const ficha = fichaDe({
      tipo: 'administrativa',
      gravedad: 'muy_grave',
      normaCodigo: 'LRCSCVM',
      ambito: 'estatal',
      importeEur: 601,
      importeReducidoEur: null,
      importeMaxEur: 3005,
      puntos: 0,
    });
    expect(ficha.fichaKind).toBe('trafico');
    const tiles = tilesFicha(ficha, formatEuros);
    const importe = tiles.find((x) => x.etiqueta === 'Importe');
    expect(importe?.valor).toBe('601–3.005 €');
    expect(tiles.some((x) => x.enfasis)).toBe(false);
  });

  it('tráfico "exceso de velocidad" (cuadro 100–600 €): rango SIN énfasis, no cifra fija', () => {
    const ficha = fichaDe({
      tipo: 'administrativa',
      gravedad: 'grave',
      normaCodigo: 'RGC',
      ambito: 'estatal',
      importeEur: 100,
      importeReducidoEur: 50,
      importeMaxEur: 600,
      puntos: null,
    });
    expect(ficha.fichaKind).toBe('trafico');
    const tiles = tilesFicha(ficha, formatEuros);
    const importe = tiles.find((x) => x.etiqueta === 'Importe');
    expect(importe?.valor).toBe('100–600 €');
    expect(importe?.enfasis).toBeUndefined();
    expect(tiles.some((x) => x.enfasis)).toBe(false);
    // Conserva el pronto pago (marco de tráfico), pero SIN énfasis en el importe.
    expect(tiles.some((x) => x.etiqueta === 'Pronto pago')).toBe(true);
  });

  it('tráfico con multa fija REAL (importeMaxEur null): SÍ énfasis en el importe (contraste)', () => {
    const ficha = fichaDe({
      tipo: 'administrativa',
      gravedad: 'grave',
      normaCodigo: 'RGV',
      ambito: 'estatal',
      importeEur: 200,
      importeReducidoEur: 100,
      importeMaxEur: null,
      puntos: 0,
    });
    expect(ficha.fichaKind).toBe('trafico');
    expect(tilesFicha(ficha, formatEuros)[0]).toMatchObject({ etiqueta: 'Importe', enfasis: true });
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

  // BLOQUEANTE (I-1): una administrativa NO de vehículo (ordenanza de perros, ocio canario) NUNCA
  // debe hablar de "El vehículo". Estado NEUTRO: "Sanción administrativa · sin medida cautelar".
  it('sin consecuencias, administrativa (municipal/autonómica): estado NEUTRO, NUNCA "El vehículo"', () => {
    const a = accionOperativaFrom({ fichaKind: 'administrativa', consecuencias: [] });
    expect(a?.kind).toBe('sigue');
    expect(a?.tono).toBe('positivo');
    expect(a?.titulo).toMatch(/^Sanción administrativa/);
    expect(a?.titulo).not.toMatch(/veh[íi]culo/i);
    expect(a?.detalle).not.toMatch(/veh[íi]culo/i);
  });

  it('una administrativa con identificación tampoco inventa un vehículo (estado neutro)', () => {
    const a = accionOperativaFrom({
      fichaKind: 'administrativa',
      consecuencias: [{ tipo: 'identificacion', fuente: 'Ordenanza art. X' }],
    });
    expect(a?.titulo).not.toMatch(/veh[íi]culo/i);
  });

  // I-1/I-2: el OCIO (Ley 7/2011) lleva la medida operativa `cese_actividad` (cese/desalojo/
  // precinto). Debe MANDAR sobre la multa: sube como acción destacada con su fuente.
  it('cese de actividad (ocio): acción destacada "Cese de actividad / desalojo" con su fuente', () => {
    const a = accionOperativaFrom({
      fichaKind: 'administrativa',
      consecuencias: [{ tipo: 'cese_actividad', fuente: 'Ley 7/2011 arts. 49 y 65.2' }],
    });
    expect(a?.kind).toBe('cese_actividad');
    expect(a?.tono).toBe('coercitivo');
    expect(a?.titulo).toMatch(/cese|desalojo/i);
    expect(a?.titulo).not.toMatch(/veh[íi]culo/i);
    expect(a?.fuente).toBe('Ley 7/2011 arts. 49 y 65.2');
  });

  it('la detención (persona) manda incluso sobre el cese de actividad', () => {
    const a = accionOperativaFrom({
      fichaKind: 'administrativa',
      consecuencias: [
        { tipo: 'cese_actividad', fuente: 'Ley 7/2011 arts. 49 y 65.2' },
        { tipo: 'detencion', fuente: 'art. X' },
      ],
    });
    expect(a?.kind).toBe('detencion');
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

  // T-2 (QA B-2): una ficha NO penal cuya única consecuencia sea `proteccion` NO puede caer al
  // estado verde tranquilizador "la persona sigue · solo denuncia". Con protección el banner debe
  // salir destacado (tono distinto de `positivo`) y con etiqueta de protección (ahora NEUTRA).
  it('T-2 · protección (sin detención): banner NO verde, etiqueta de protección', () => {
    const a = accionOperativaFrom({
      fichaKind: 'seguridad_ciudadana',
      consecuencias: [{ tipo: 'proteccion', fuente: 'LO 1/2004 art. 61' }],
    });
    expect(a?.kind).toBe('proteccion');
    expect(a?.tono).not.toBe('positivo');
    expect(a?.titulo).toMatch(/protecci[oó]n/i);
    expect(a?.fuente).toBe('LO 1/2004 art. 61');
  });

  // MEDIA-2: el banner de `proteccion` usa el `textoCorto` REVISADO de la consecuencia, no un copy
  // genérico de víctima de VG. Para MENA (protección del MENOR) NO debe hablar de "víctima" ni de
  // "orden de protección"; para VG SÍ conserva su texto propio.
  it('MEDIA-2 · MENA: el banner refleja protección del MENOR, sin "víctima" ni "orden de protección"', () => {
    const a = accionOperativaFrom({
      fichaKind: 'administrativa',
      consultable: true,
      consecuencias: [
        {
          tipo: 'proteccion',
          fuente: 'LO 1/1996 y LO 4/2000 art. 35',
          textoCorto:
            'Procede identificar al menor con cautelas, ponerlo a disposición de la Entidad Pública ' +
            'de protección de menores y comunicar al Ministerio Fiscal (Fiscalía de Menores). NUNCA ' +
            'procede calabozo por su condición de menor/extranjero.',
        },
      ],
    });
    expect(a?.kind).toBe('proteccion');
    expect(a?.tono).not.toBe('positivo');
    expect(a?.detalle).not.toMatch(/orden de protecci[oó]n/i);
    expect(a?.detalle).not.toMatch(/v[ií]ctima/i);
    expect(a?.detalle).toMatch(/Entidad P[uú]blica/i);
    expect(a?.detalle).toMatch(/Fiscal[ií]a/i);
    expect(a?.fuente).toBe('LO 1/1996 y LO 4/2000 art. 35');
  });

  it('MEDIA-2 · VG: una ficha de violencia de género con proteccion sigue mostrando su texto propio', () => {
    const a = accionOperativaFrom({
      fichaKind: 'penal',
      consecuencias: [
        {
          tipo: 'proteccion',
          fuente: 'LO 1/2004 art. 61',
          textoCorto:
            'Procede valorar el riesgo (VPR/VioGén) y solicitar la orden de protección de la víctima; ' +
            'la acuerda la autoridad judicial.',
        },
      ],
    });
    expect(a?.kind).toBe('proteccion');
    expect(a?.detalle).toMatch(/v[ií]ctima/i);
    expect(a?.detalle).toMatch(/orden de protecci[oó]n/i);
  });

  // MEDIA-1: una ficha CONSULTABLE (no_sancionador) SIN medida ni identificación (p. ej. la ZBE con
  // régimen sancionador aún no aplicable) NO debe caer al verde "se formula la denuncia": va como
  // estado INFORMATIVO de orientación (tono != positivo), nunca positivo.
  it('MEDIA-1 · consultable sin consecuencias: NO verde "se formula la denuncia" (informativo)', () => {
    const a = accionOperativaFrom({
      fichaKind: 'administrativa',
      consultable: true,
      consecuencias: [],
    });
    expect(a).not.toBeNull();
    expect(a?.tono).not.toBe('positivo');
    expect(a?.kind).toBe('consulta');
    expect(a?.detalle).not.toMatch(/se formula la denuncia/i);
  });

  it('MEDIA-1 · NO consultable sin consecuencias: mantiene el estado positivo (no cambia)', () => {
    const a = accionOperativaFrom({ fichaKind: 'administrativa', consecuencias: [] });
    expect(a?.tono).toBe('positivo');
    expect(a?.titulo).toMatch(/^Sanción administrativa/);
  });

  // Las consultables CON acción destacada siguen subiendo su acción (no las degrada la señal
  // `consultable`): MENA→protección, terrazas→cese de actividad.
  it('MEDIA-1 · una consultable CON protección (MENA) sigue subiendo la protección, no "consulta"', () => {
    const a = accionOperativaFrom({
      fichaKind: 'administrativa',
      consultable: true,
      consecuencias: [{ tipo: 'proteccion', fuente: 'LO 4/2000 art. 35' }],
    });
    expect(a?.kind).toBe('proteccion');
  });

  it('MEDIA-1 · una consultable CON cese de actividad (terrazas) sigue subiendo el cese', () => {
    const a = accionOperativaFrom({
      fichaKind: 'administrativa',
      consultable: true,
      consecuencias: [{ tipo: 'cese_actividad', fuente: 'Ordenanza municipal (terrazas)' }],
    });
    expect(a?.kind).toBe('cese_actividad');
  });

  it('la detención manda sobre la protección de la víctima (concurrencia en un delito de VG)', () => {
    const a = accionOperativaFrom({
      fichaKind: 'penal',
      consecuencias: cons('proteccion', 'detencion'),
    });
    expect(a?.kind).toBe('detencion');
  });

  // T-1 (QA B-1): la ficha elige el MISMO tipo determinante que la lista del buscador para los
  // casos que antes divergían.
  it("T-1 · ['deposito','inmovilizacion'] → la ficha elige depósito", () => {
    const a = accionOperativaFrom({
      fichaKind: 'trafico',
      consecuencias: cons('deposito', 'inmovilizacion'),
    });
    expect(a?.kind).toBe('deposito');
  });

  it("T-1 · ['decomiso','retirada_permiso'] → la ficha elige decomiso", () => {
    const a = accionOperativaFrom({
      fichaKind: 'trafico',
      consecuencias: cons('decomiso', 'retirada_permiso'),
    });
    expect(a?.kind).toBe('decomiso');
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
