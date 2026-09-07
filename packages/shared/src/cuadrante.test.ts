import { describe, it, expect } from 'vitest';
import { Cuadrante, PatronTurno, DiaCuadrante } from './user.js';
import {
  computarTurno,
  construirFestivos,
  diasEntre,
  diaSemanaLunes0,
  duracionMinutos,
  esFinDeSemana,
  horaAMinutos,
  horasReferenciaPeriodo,
  indicePatron,
  minutosNocturnos,
  PATRONES_PREDEFINIDOS,
  proyectarDia,
  proyectarMes,
  proyectarRango,
  resumenHoras,
  resumenHorasMes,
  sumarDias,
  type DiaProyectado,
} from './cuadrante.js';

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
    expect(() => DiaCuadrante.parse({ fecha: '2026-09-14', servicio: 'libre' })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Lógica pura del cuadrante (proyección + cálculo de horas). Núcleo crítico.
// ---------------------------------------------------------------------------

/** Cuadrante GC "6+saliente+3" empezando el martes 2026-09-01, 37,5 h/semana. */
function hacerCuadrante(overrides: Record<string, unknown> = {}) {
  return Cuadrante.parse({
    patron: PATRONES_PREDEFINIDOS[0],
    inicioCiclo: '2026-09-01',
    jornadaRefHorasSemana: 37.5,
    ...overrides,
  });
}

describe('utilidades de fecha', () => {
  it('cuenta días entre fechas, con signo, y cruza el fin de mes', () => {
    expect(diasEntre('2026-09-01', '2026-09-02')).toBe(1);
    expect(diasEntre('2026-09-30', '2026-10-01')).toBe(1);
    expect(diasEntre('2026-09-05', '2026-09-01')).toBe(-4);
    expect(diasEntre('2026-02-28', '2026-03-01')).toBe(1); // 2026 no es bisiesto
  });

  it('suma días cruzando meses y años', () => {
    expect(sumarDias('2026-09-30', 1)).toBe('2026-10-01');
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(sumarDias('2026-09-01', -1)).toBe('2026-08-31');
  });

  it('calcula el día de semana con lunes=0 y el fin de semana', () => {
    expect(diaSemanaLunes0('2026-09-01')).toBe(1); // martes
    expect(diaSemanaLunes0('2026-09-05')).toBe(5); // sábado
    expect(esFinDeSemana('2026-09-05')).toBe(true); // sábado
    expect(esFinDeSemana('2026-09-06')).toBe(true); // domingo
    expect(esFinDeSemana('2026-09-07')).toBe(false); // lunes
  });
});

describe('cálculo de duración y nocturnidad', () => {
  it('mide turnos diurnos y turnos que cruzan la medianoche', () => {
    expect(duracionMinutos('06:00', '14:00')).toBe(480);
    expect(duracionMinutos('22:00', '06:00', true)).toBe(480);
    expect(duracionMinutos('22:00', '06:00')).toBe(480); // detecta el cruce solo
    expect(duracionMinutos('08:00', '08:00', true)).toBe(1440); // 24 h explícitas
    expect(duracionMinutos('08:00', '08:00')).toBe(0);
  });

  it('una noche 22:00→06:00 es íntegramente nocturna', () => {
    expect(minutosNocturnos(horaAMinutos('22:00'), 480, { inicio: '22:00', fin: '06:00' })).toBe(480);
  });

  it('mañana y tarde no tienen minutos nocturnos con la franja por defecto', () => {
    expect(minutosNocturnos(horaAMinutos('06:00'), 480, { inicio: '22:00', fin: '06:00' })).toBe(0);
    expect(minutosNocturnos(horaAMinutos('14:00'), 480, { inicio: '22:00', fin: '06:00' })).toBe(0);
  });

  it('cuenta solo la parte nocturna de un turno mixto', () => {
    // 20:00→24:00 (4 h): de 22 a 24 son 2 h nocturnas.
    expect(minutosNocturnos(horaAMinutos('20:00'), 240, { inicio: '22:00', fin: '06:00' })).toBe(120);
    // 04:00→08:00 (4 h): de 04 a 06 son 2 h nocturnas.
    expect(minutosNocturnos(horaAMinutos('04:00'), 240, { inicio: '22:00', fin: '06:00' })).toBe(120);
  });

  it('admite una franja nocturna configurable que no envuelve la medianoche', () => {
    // Franja 00:00→06:00; una noche 22:00→06:00 aporta 6 h.
    expect(minutosNocturnos(horaAMinutos('22:00'), 480, { inicio: '00:00', fin: '06:00' })).toBe(360);
  });
});

describe('proyección del calendario', () => {
  it('indexa el patrón con módulo seguro para fechas anteriores al inicio', () => {
    const len = PATRONES_PREDEFINIDOS[0]!.secuencia.length; // 10
    expect(indicePatron('2026-09-01', '2026-09-01', len)).toBe(0);
    expect(indicePatron('2026-09-01', '2026-09-11', len)).toBe(0); // ciclo completo
    expect(indicePatron('2026-09-01', '2026-08-31', len)).toBe(9); // día anterior
  });

  it('proyecta los tipos del patrón GC día a día', () => {
    const c = hacerCuadrante();
    expect(proyectarDia(c, '2026-09-01').servicio).toBe('manana');
    expect(proyectarDia(c, '2026-09-03').servicio).toBe('tarde');
    expect(proyectarDia(c, '2026-09-05').servicio).toBe('noche');
    expect(proyectarDia(c, '2026-09-07').servicio).toBe('saliente');
    expect(proyectarDia(c, '2026-09-08').servicio).toBe('libre');
    // se repite el ciclo tras 10 días
    expect(proyectarDia(c, '2026-09-11').servicio).toBe('manana');
    expect(proyectarDia(c, '2026-09-05').origen).toBe('patron');
  });

  it('la noche hereda las horas de su definición y marca que cruza medianoche', () => {
    const dia = proyectarDia(hacerCuadrante(), '2026-09-05');
    expect(dia.horaInicio).toBe('22:00');
    expect(dia.horaFin).toBe('06:00');
    expect(dia.cruzaMedianoche).toBe(true);
    expect(dia.computaPresencia).toBe(true);
  });

  it('proyecta un mes completo y mantiene la continuidad al cambiar de mes', () => {
    const c = hacerCuadrante();
    const sept = proyectarMes(c, 2026, 9);
    expect(sept).toHaveLength(30);
    expect(sept[0]!.fecha).toBe('2026-09-01');
    expect(sept[29]!.fecha).toBe('2026-09-30');
    // El 30/09 y el 01/10 son días consecutivos del mismo ciclo (sin saltos).
    const dia30 = proyectarDia(c, '2026-09-30');
    const dia01oct = proyectarDia(c, '2026-10-01');
    const idx30 = indicePatron('2026-09-01', '2026-09-30', 10);
    const idx01 = indicePatron('2026-09-01', '2026-10-01', 10);
    expect(idx01).toBe((idx30 + 1) % 10);
    expect(dia30.servicio).toBe(c.patron.secuencia[idx30]);
    expect(dia01oct.servicio).toBe(c.patron.secuencia[idx01]);
  });

  it('marca festivos (extra) y fines de semana en la proyección', () => {
    const c = hacerCuadrante({ festivosExtra: ['2026-09-02'] });
    expect(proyectarDia(c, '2026-09-02').esFestivo).toBe(true);
    expect(proyectarDia(c, '2026-09-01').esFestivo).toBe(false);
    expect(proyectarDia(c, '2026-09-05').esFinDeSemana).toBe(true); // sábado
  });
});

describe('excepciones manuales SAGRADAS', () => {
  it('la excepción manual gana sobre el patrón', () => {
    const c = hacerCuadrante({
      dias: [
        {
          fecha: '2026-09-05', // el patrón diría "noche"
          servicio: 'libre',
          nota: 'Cambié la noche por la libranza de un compañero',
          editadoEl: '2026-09-01T10:00:00+02:00',
        },
      ],
    });
    const dia = proyectarDia(c, '2026-09-05');
    expect(dia.servicio).toBe('libre');
    expect(dia.origen).toBe('manual');
    expect(dia.nota).toContain('compañero');
  });

  it('la excepción SOBREVIVE a cambiar la fecha de inicio del ciclo', () => {
    const base = {
      dias: [{ fecha: '2026-09-05', servicio: 'vacaciones', editadoEl: '2026-09-01T10:00:00+02:00' }],
    };
    const antes = hacerCuadrante({ ...base, inicioCiclo: '2026-09-01' });
    const despues = hacerCuadrante({ ...base, inicioCiclo: '2026-09-03' });
    // Aunque el patrón regenerado daría otro tipo, la excepción se mantiene intacta.
    expect(proyectarDia(antes, '2026-09-05').servicio).toBe('vacaciones');
    expect(proyectarDia(despues, '2026-09-05').servicio).toBe('vacaciones');
    expect(proyectarDia(despues, '2026-09-05').origen).toBe('manual');
  });

  it('la excepción SOBREVIVE a cambiar de patrón por completo', () => {
    const dias = [{ fecha: '2026-09-05', servicio: 'curso', editadoEl: '2026-09-01T10:00:00+02:00' }];
    const conOtroPatron = hacerCuadrante({ patron: PATRONES_PREDEFINIDOS[3], dias });
    expect(proyectarDia(conOtroPatron, '2026-09-05').servicio).toBe('curso');
    expect(proyectarDia(conOtroPatron, '2026-09-05').origen).toBe('manual');
  });

  it('una excepción puede fijar sus propias horas (cambio de servicio)', () => {
    const c = hacerCuadrante({
      dias: [
        {
          fecha: '2026-09-08', // patrón: libre
          servicio: 'servicio_extra',
          horaInicio: '09:00',
          horaFin: '15:00',
          editadoEl: '2026-09-01T10:00:00+02:00',
        },
      ],
    });
    const dia = proyectarDia(c, '2026-09-08');
    expect(dia.horaInicio).toBe('09:00');
    expect(dia.horaFin).toBe('15:00');
    expect(dia.computaPresencia).toBe(true);
  });
});

describe('cómputo de horas de un turno', () => {
  const franja = { inicio: '22:00', fin: '06:00' } as const;
  const noEsFestivo = () => false;

  function diaTrabajo(overrides: Partial<DiaProyectado>): DiaProyectado {
    return {
      fecha: '2026-09-02',
      servicio: 'manana',
      horaInicio: '06:00',
      horaFin: '14:00',
      clase: 'trabajo',
      computaPresencia: true,
      cruzaMedianoche: false,
      origen: 'patron',
      esFestivo: false,
      esFinDeSemana: false,
      nota: null,
      alarmaMinutosAntes: null,
      ...overrides,
    };
  }

  it('no computa presencia para saliente, libre, disponibilidad ni ausencias', () => {
    const libre = diaTrabajo({ servicio: 'libre', horaInicio: null, horaFin: null, computaPresencia: false });
    expect(computarTurno(libre, franja, noEsFestivo).minutosTotales).toBe(0);
    const dispo = diaTrabajo({ servicio: 'disponibilidad', computaPresencia: false });
    expect(computarTurno(dispo, franja, noEsFestivo).minutosTotales).toBe(0);
  });

  it('reparte una noche que cruza la medianoche entre sus dos fechas (festivo)', () => {
    // Sábado 2026-09-05 22:00 → domingo 06:00. Festivo solo el domingo 06.
    const noche = diaTrabajo({
      fecha: '2026-09-05',
      servicio: 'noche',
      horaInicio: '22:00',
      horaFin: '06:00',
      cruzaMedianoche: true,
      esFinDeSemana: true,
    });
    const esFestivo = (f: string) => f === '2026-09-06';
    const c = computarTurno(noche, franja, esFestivo);
    expect(c.minutosTotales).toBe(480);
    expect(c.minutosNocturnos).toBe(480);
    // 22→24 (120 min) el sábado + 00→06 (360 min) el domingo: todo es fin de semana.
    expect(c.minutosFinDeSemana).toBe(480);
    // Festivo solo el domingo: los 360 min de la madrugada.
    expect(c.minutosFestivos).toBe(360);
  });

  it('cuenta horas festivas cuando se trabaja un festivo de día', () => {
    const dia = diaTrabajo({ esFestivo: true });
    const c = computarTurno(dia, franja, (f) => f === '2026-09-02');
    expect(c.minutosFestivos).toBe(480);
    expect(c.minutosNocturnos).toBe(0);
  });
});

describe('resumen de horas del periodo', () => {
  it('prorratea la jornada de referencia configurable (no fija 37,5)', () => {
    expect(horasReferenciaPeriodo(37.5, 30)).toBeCloseTo(160.71, 2);
    expect(horasReferenciaPeriodo(37.5, 7)).toBeCloseTo(37.5, 2);
    // La GC puede exigir otra jornada: el parámetro manda.
    expect(horasReferenciaPeriodo(40, 7)).toBeCloseTo(40, 2);
  });

  it('agrega totales, nocturnas, festivas y calcula el exceso del mes', () => {
    const c = hacerCuadrante({ festivosExtra: ['2026-09-02'] });
    const r = resumenHorasMes(c, 2026, 9);
    // GC 6+saliente+3 en 30 días: 3 ciclos de 10 → 6 mañana/tarde/tarde... 18 días de
    // trabajo (6 de trabajo por ciclo × 3), 8 h cada uno = 144 h.
    expect(r.diasTrabajados).toBe(18);
    expect(r.horasTotales).toBeCloseTo(144, 2);
    // 6 noches en el mes (2 por ciclo × 3) × 8 h = 48 h nocturnas.
    expect(r.noches).toBe(6);
    expect(r.horasNocturnas).toBeCloseTo(48, 2);
    // 2026-09-02 es una mañana festiva trabajada: 8 h festivas.
    expect(r.festivosTrabajados).toBe(1);
    expect(r.horasFestivas).toBeCloseTo(8, 2);
    // Exceso = totales − referencia prorrateada.
    expect(r.horasReferencia).toBeCloseTo(horasReferenciaPeriodo(37.5, 30), 2);
    expect(r.exceso).toBeCloseTo(144 - horasReferenciaPeriodo(37.5, 30), 2);
    expect(r.exceso).toBeLessThan(0); // por debajo de la referencia mensual
  });

  it('el exceso es positivo cuando se supera la jornada de referencia', () => {
    // Jornada de referencia muy baja: el mismo mes queda muy por encima.
    const c = hacerCuadrante({ jornadaRefHorasSemana: 20 });
    const r = resumenHorasMes(c, 2026, 9);
    expect(r.exceso).toBeGreaterThan(0);
    expect(r.exceso).toBeCloseTo(144 - horasReferenciaPeriodo(20, 30), 2);
  });

  it('respeta diasNaturales explícito para prorratear un rango parcial', () => {
    const c = hacerCuadrante();
    const dias = proyectarRango(c, '2026-09-01', '2026-09-07'); // una semana
    const r = resumenHoras(dias, {
      jornadaRefHorasSemana: 37.5,
      franjaNocturna: c.franjaNocturna,
      festivos: construirFestivos(c),
      diasNaturales: 7,
    });
    expect(r.horasReferencia).toBeCloseTo(37.5, 2);
  });
});
