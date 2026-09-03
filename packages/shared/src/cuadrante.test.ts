import { describe, it, expect } from 'vitest';
import { Cuadrante, PatronTurno, DiaCuadrante } from './user.js';

/** Patrón Guardia Civil "6 + saliente + 3" mínimo válido. */
const patronGC = {
  nombre: '6 + saliente + 3',
  cuerpo: 'guardia_civil',
  secuencia: ['manana', 'manana', 'tarde', 'tarde', 'noche', 'noche', 'saliente', 'libre', 'libre', 'libre'],
  definiciones: [
    { tipo: 'noche', horaInicioDefecto: '22:00', horaFinDefecto: '06:00', cruzaMedianoche: true, computaPresencia: true, clase: 'trabajo' },
    { tipo: 'disponibilidad', computaPresencia: false, clase: 'disponibilidad' },
  ],
  editable: true,
};

describe('PatronTurno', () => {
  it('acepta un patrón por cuerpo con definiciones de servicio', () => {
    const p = PatronTurno.parse(patronGC);
    expect(p.cuerpo).toBe('guardia_civil');
    expect(p.definiciones[0]?.cruzaMedianoche).toBe(true);
    // la disponibilidad no computa como presencia efectiva
    expect(p.definiciones[1]?.computaPresencia).toBe(false);
  });

  it('rechaza una secuencia vacía', () => {
    expect(() => PatronTurno.parse({ ...patronGC, secuencia: [] })).toThrow();
  });
});

describe('Cuadrante (modelo de dos capas)', () => {
  it('parsea un cuadrante con solo excepciones y aplica defaults', () => {
    const c = Cuadrante.parse({
      patron: patronGC,
      inicioCiclo: '2026-09-01',
      jornadaRefHorasSemana: 37.5,
      dias: [
        { fecha: '2026-09-14', servicio: 'libre', editadoEl: '2026-09-01T10:00:00+02:00' },
      ],
    });
    expect(c.schemaVersion).toBe(1); // default
    expect(c.franjaNocturna.inicio).toBe('22:00'); // default
    expect(c.dias).toHaveLength(1);
    // la excepción manual queda marcada como sagrada
    expect(c.dias[0]?.origen).toBe('manual');
    expect(c.festivosExtra).toEqual([]);
  });

  it('exige jornada de referencia (no asume 37,5 como verdad)', () => {
    expect(() =>
      Cuadrante.parse({ patron: patronGC, inicioCiclo: '2026-09-01' }),
    ).toThrow();
  });

  it('una excepción de día requiere editadoEl para resolver conflictos de respaldo', () => {
    expect(() =>
      DiaCuadrante.parse({ fecha: '2026-09-14', servicio: 'libre' }),
    ).toThrow();
  });
});
