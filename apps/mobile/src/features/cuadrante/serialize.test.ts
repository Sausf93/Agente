import { describe, expect, it } from 'vitest';
import { Cuadrante, DiaCuadrante, PATRONES_PREDEFINIDOS } from '@agente/shared';
import {
  configToRow,
  ensamblarCuadrante,
  excepcionToRow,
  rowToExcepcion,
  type CuadranteExcepcionRow,
} from './serialize';

function cuadranteBase(overrides: Record<string, unknown> = {}) {
  return Cuadrante.parse({
    patron: PATRONES_PREDEFINIDOS[0],
    inicioCiclo: '2026-09-01',
    jornadaRefHorasSemana: 37.5,
    festivosExtra: ['2026-09-02'],
    ...overrides,
  });
}

describe('serialización de la configuración del cuadrante', () => {
  it('la fila de config guarda el patrón, la jornada, la franja y los festivos', () => {
    const c = cuadranteBase({ computoAnualRefHoras: 1642 });
    const row = configToRow(c, '2026-09-01T10:00:00.000Z');
    expect(row.id).toBe(1);
    expect(row.inicio_ciclo).toBe('2026-09-01');
    expect(row.jornada_ref_h).toBe(37.5);
    expect(row.computo_anual_ref_h).toBe(1642);
    expect(row.franja_inicio).toBe('22:00');
    expect(row.franja_fin).toBe('06:00');
    expect(JSON.parse(row.festivos_extra_json)).toEqual(['2026-09-02']);
    expect(JSON.parse(row.patron_json).nombre).toBe(PATRONES_PREDEFINIDOS[0]!.nombre);
  });
});

describe('serialización del ancla (rediseño v3: días seguidos)', () => {
  it('guarda el ancla { fechaBase, turnos } como JSON y la reensambla', () => {
    const c = cuadranteBase({ ancla: { fechaBase: '2026-09-07', turnos: ['manana', 'manana'] } });
    const row = configToRow(c, '2026-09-07T10:00:00.000Z');
    expect(JSON.parse(row.ancla_json!)).toEqual({ fechaBase: '2026-09-07', turnos: ['manana', 'manana'] });
    const reensamblado = ensamblarCuadrante(row, []);
    expect(reensamblado.ancla).toEqual({ fechaBase: '2026-09-07', turnos: ['manana', 'manana'] });
  });

  it('sin ancla (cuadrante previo) la columna es NULL y se reensambla como null', () => {
    const c = cuadranteBase();
    const row = configToRow(c, '2026-09-07T10:00:00.000Z');
    expect(row.ancla_json).toBeNull();
    expect(ensamblarCuadrante(row, []).ancla).toBeNull();
  });

  it('un ancla_json corrupto no tumba el cuadrante (queda null)', () => {
    const c = cuadranteBase();
    const row = { ...configToRow(c, '2026-09-07T10:00:00.000Z'), ancla_json: '{roto' };
    expect(ensamblarCuadrante(row, []).ancla).toBeNull();
  });

  it('un ancla de la iteración por ordinal (formato viejo) degrada a null sin romper', () => {
    // Cuadrantes guardados con { fecha, servicio, ocurrencia } no validan contra el esquema
    // nuevo → ancla null; el inicio_ciclo persistido sigue proyectando (no se pierde el cuadrante).
    const c = cuadranteBase();
    const row = {
      ...configToRow(c, '2026-09-07T10:00:00.000Z'),
      ancla_json: JSON.stringify({ fecha: '2026-09-07', servicio: 'noche', ocurrencia: 0 }),
    };
    const reensamblado = ensamblarCuadrante(row, []);
    expect(reensamblado.ancla).toBeNull();
    expect(reensamblado.inicioCiclo).toBe('2026-09-01');
  });
});

describe('serialización de una excepción manual', () => {
  const dia = DiaCuadrante.parse({
    fecha: '2026-09-05',
    servicio: 'libre',
    nota: 'Cambio con un compañero',
    editadoEl: '2026-09-01T10:00:00.000Z',
  });

  it('va y vuelve sin perder información (round-trip)', () => {
    const row = excepcionToRow(dia);
    expect(row.fecha).toBe('2026-09-05');
    expect(row.servicio).toBe('libre');
    const vuelta = rowToExcepcion(row);
    expect(vuelta).toEqual(dia);
    expect(vuelta.origen).toBe('manual');
  });

  it('rechaza (lanza) una fila corrupta al deserializar', () => {
    const corrupta = { ...excepcionToRow(dia), servicio: 'inventado' };
    expect(() => rowToExcepcion(corrupta)).toThrow();
  });
});

describe('reensamblado completo del cuadrante', () => {
  it('reconstruye config + excepciones y valida con Zod', () => {
    const c = cuadranteBase();
    const configRow = configToRow(c, '2026-09-01T10:00:00.000Z');
    const excRows: CuadranteExcepcionRow[] = [
      excepcionToRow(
        DiaCuadrante.parse({
          fecha: '2026-09-05',
          servicio: 'vacaciones',
          editadoEl: '2026-09-01T10:00:00.000Z',
        }),
      ),
    ];
    const reensamblado = ensamblarCuadrante(configRow, excRows);
    expect(reensamblado.inicioCiclo).toBe('2026-09-01');
    expect(reensamblado.dias).toHaveLength(1);
    expect(reensamblado.dias[0]!.servicio).toBe('vacaciones');
    expect(reensamblado.festivosExtra).toEqual(['2026-09-02']);
  });

  it('descarta las excepciones corruptas sin tumbar el cuadrante entero', () => {
    const c = cuadranteBase();
    const configRow = configToRow(c, '2026-09-01T10:00:00.000Z');
    const buena = excepcionToRow(
      DiaCuadrante.parse({ fecha: '2026-09-05', servicio: 'libre', editadoEl: '2026-09-01T10:00:00.000Z' }),
    );
    const mala: CuadranteExcepcionRow = { ...buena, fecha: '2026-09-06', servicio: 'inventado' };
    const reensamblado = ensamblarCuadrante(configRow, [buena, mala]);
    // Solo sobrevive la buena; la corrupta se ignora (protege el activo de retención).
    expect(reensamblado.dias).toHaveLength(1);
    expect(reensamblado.dias[0]!.fecha).toBe('2026-09-05');
  });
});
