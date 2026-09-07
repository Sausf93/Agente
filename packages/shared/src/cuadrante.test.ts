import { describe, it, expect } from 'vitest';
import { Cuadrante, PatronTurno, DiaCuadrante } from './user.js';
import {
  anclarInicioCiclo,
  computarTurno,
  construirFestivos,
  diasEntre,
  diaSemanaLunes0,
  duracionMinutos,
  esFinDeSemana,
  horaAMinutos,
  horasReferenciaPeriodo,
  indicePatron,
  inicioCicloDesdeOffset,
  minutosNocturnos,
  ocurrenciasEnPatron,
  offsetsCompatibles,
  PATRONES_PREDEFINIDOS,
  proyectarDia,
  proyectarMes,
  proyectarRango,
  resumenHoras,
  resumenHorasMes,
  sumarDias,
  turnosDelPatron,
  type DiaProyectado,
} from './cuadrante.js';
import type { TipoServicio } from './enums.js';

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
    expect(c.schemaVersion).toBe(2); // default (v2: ancla por días seguidos)
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

// ---------------------------------------------------------------------------
// Anclaje por (día, turno) — el inverso de la proyección. Núcleo crítico del rediseño.
// ---------------------------------------------------------------------------

describe('turnosDelPatron', () => {
  it('devuelve los turnos DISTINTOS en orden de aparición (sin duplicados)', () => {
    // GC: M M T T N N · S · L L L → mañana, tarde, noche, saliente, libre.
    expect(turnosDelPatron(PATRONES_PREDEFINIDOS[0]!)).toEqual([
      'manana',
      'tarde',
      'noche',
      'saliente',
      'libre',
    ]);
    // Oficina L–V: solo mañana y libre.
    expect(turnosDelPatron(PATRONES_PREDEFINIDOS[3]!)).toEqual(['manana', 'libre']);
  });

  it('alimenta botones válidos para cada patrón predefinido (todos los turnos existen en la secuencia)', () => {
    for (const patron of PATRONES_PREDEFINIDOS) {
      const turnos = turnosDelPatron(patron);
      expect(turnos.length).toBeGreaterThan(0);
      for (const turno of turnos) {
        expect(patron.secuencia).toContain(turno);
      }
      // Sin duplicados.
      expect(new Set(turnos).size).toBe(turnos.length);
    }
  });
});

describe('ocurrenciasEnPatron', () => {
  const gc = PATRONES_PREDEFINIDOS[0]!.secuencia;
  it('localiza todas las posiciones de un turno repetido', () => {
    expect(ocurrenciasEnPatron(gc, 'manana')).toEqual([0, 1]);
    expect(ocurrenciasEnPatron(gc, 'noche')).toEqual([4, 5]);
    expect(ocurrenciasEnPatron(gc, 'libre')).toEqual([7, 8, 9]);
  });
  it('un turno que aparece una sola vez da un único índice', () => {
    expect(ocurrenciasEnPatron(gc, 'saliente')).toEqual([6]);
  });
  it('un turno ausente da lista vacía', () => {
    expect(ocurrenciasEnPatron(gc, 'vacaciones')).toEqual([]);
  });
});

describe('anclarInicioCiclo (inverso de la proyección)', () => {
  const gc = PATRONES_PREDEFINIDOS[0]!.secuencia;

  it('reproduce el ejemplo real del rediseño (hoy = 2026-09-07)', () => {
    // Tabla de docs/diseno/cuadrante-rediseno.md §1.1.
    expect(anclarInicioCiclo(gc, '2026-09-07', 'manana', 0)).toBe('2026-09-07'); // índice 0
    expect(anclarInicioCiclo(gc, '2026-09-07', 'noche', 0)).toBe('2026-09-03'); // índice 4
    expect(anclarInicioCiclo(gc, '2026-09-07', 'saliente', 0)).toBe('2026-09-01'); // índice 6
  });

  it('el inicioCiclo calculado hace que la proyección en la fecha ancla dé el turno indicado', () => {
    // Para CADA patrón, CADA turno y CADA ocurrencia: anclar y volver a proyectar cuadra.
    const fechaAncla = '2026-09-07';
    for (const patron of PATRONES_PREDEFINIDOS) {
      const L = patron.secuencia.length;
      for (const servicio of turnosDelPatron(patron)) {
        const nOcurrencias = ocurrenciasEnPatron(patron.secuencia, servicio).length;
        for (let k = 0; k < nOcurrencias; k++) {
          const inicio = anclarInicioCiclo(patron.secuencia, fechaAncla, servicio, k);
          const idx = indicePatron(inicio, fechaAncla, L);
          expect(patron.secuencia[idx]).toBe(servicio);
        }
      }
    }
  });

  it('la ocurrencia elige QUÉ posición del ciclo (turno repetido)', () => {
    // Dos noches (índices 4 y 5). k=0 → resta 4 días; k=1 → resta 5 días.
    expect(anclarInicioCiclo(gc, '2026-09-07', 'noche', 0)).toBe('2026-09-03');
    expect(anclarInicioCiclo(gc, '2026-09-07', 'noche', 1)).toBe('2026-09-02');
  });

  it('la ocurrencia se toma MÓDULO el nº de ocurrencias (‹/› envuelve; admite negativos)', () => {
    // 'noche' aparece 2 veces: k=2 ≡ k=0, k=3 ≡ k=1, k=-1 ≡ k=1.
    expect(anclarInicioCiclo(gc, '2026-09-07', 'noche', 2)).toBe(
      anclarInicioCiclo(gc, '2026-09-07', 'noche', 0),
    );
    expect(anclarInicioCiclo(gc, '2026-09-07', 'noche', 3)).toBe(
      anclarInicioCiclo(gc, '2026-09-07', 'noche', 1),
    );
    expect(anclarInicioCiclo(gc, '2026-09-07', 'noche', -1)).toBe(
      anclarInicioCiclo(gc, '2026-09-07', 'noche', 1),
    );
  });

  it('es idempotente: proyectar en la fecha ancla devuelve el turno para CUALQUIER k', () => {
    const L = gc.length;
    for (let k = -3; k <= 5; k++) {
      const inicio = anclarInicioCiclo(gc, '2026-09-07', 'libre', k);
      expect(gc[indicePatron(inicio, '2026-09-07', L)]).toBe('libre');
    }
  });

  it('cruza el fin de mes hacia atrás al restar el índice', () => {
    // Ancla el 2 de octubre con la 3.ª libre (índice 9) → inicioCiclo el 23 de septiembre.
    expect(anclarInicioCiclo(gc, '2026-10-02', 'libre', 2)).toBe('2026-09-23');
    // Y la proyección cuadra.
    expect(indicePatron('2026-09-23', '2026-10-02', gc.length)).toBe(9);
  });

  it('cruza el fin de año hacia atrás', () => {
    // Ancla el 3 de enero de 2027 con la 2.ª noche (índice 5) → 29 de diciembre de 2026.
    expect(anclarInicioCiclo(gc, '2027-01-03', 'noche', 1)).toBe('2026-12-29');
    expect(indicePatron('2026-12-29', '2027-01-03', gc.length)).toBe(5);
  });

  it('lanza si el turno no está en el patrón', () => {
    expect(() => anclarInicioCiclo(gc, '2026-09-07', 'vacaciones')).toThrow();
    // Oficina L–V no tiene noche.
    const oficina = PATRONES_PREDEFINIDOS[3]!.secuencia;
    expect(() => anclarInicioCiclo(oficina, '2026-09-07', 'noche')).toThrow();
  });

  it('el cuadrante creado desde el ancla proyecta HOY como el turno indicado', () => {
    // Integración con la proyección real: anclar → construir Cuadrante → proyectarDia(hoy).
    const inicio = anclarInicioCiclo(gc, '2026-09-07', 'noche', 0);
    const c = Cuadrante.parse({
      patron: PATRONES_PREDEFINIDOS[0],
      inicioCiclo: inicio,
      ancla: { fechaBase: '2026-09-07', turnos: ['noche' as TipoServicio] },
      jornadaRefHorasSemana: 37.5,
    });
    expect(c.ancla?.turnos[0]).toBe('noche');
    expect(proyectarDia(c, '2026-09-07').servicio).toBe('noche');
  });
});

// ---------------------------------------------------------------------------
// Anclaje por DÍAS SEGUIDOS (rediseño v3) — offsetsCompatibles / inicioCicloDesdeOffset.
// Núcleo crítico: cobertura al 100 % (regla CLAUDE.md). Sustituye a la desambiguación por ordinal.
// ---------------------------------------------------------------------------

describe('offsetsCompatibles (anclaje por días seguidos)', () => {
  const gc = PATRONES_PREDEFINIDOS[0]!; // M M T T N N · S · L L L (ciclo de 10)
  const L = gc.secuencia.length;

  it('con turnos = [] devuelve TODOS los desfases [0..L-1] (todo es posible aún)', () => {
    expect(offsetsCompatibles(gc, '2026-09-07', [])).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('reproduce los recorridos del rediseño §1.1 (hoy = 2026-09-07)', () => {
    // Hoy M → {0, 1} (dos mañanas en el ciclo, ambiguo).
    expect(offsetsCompatibles(gc, '2026-09-07', ['manana'])).toEqual([0, 1]);
    // Hoy M, mañana M → {0} (la transición mañana→mañana solo ocurre en el punto 0).
    expect(offsetsCompatibles(gc, '2026-09-07', ['manana', 'manana'])).toEqual([0]);
    // Hoy S → {6} (el saliente es único: cuadra al primer día).
    expect(offsetsCompatibles(gc, '2026-09-07', ['saliente'])).toEqual([6]);
    // Hoy L → {7, 8, 9}; +L → {7, 8}; +L → {7} (peor caso: racha de tres libres).
    expect(offsetsCompatibles(gc, '2026-09-07', ['libre'])).toEqual([7, 8, 9]);
    expect(offsetsCompatibles(gc, '2026-09-07', ['libre', 'libre'])).toEqual([7, 8]);
    expect(offsetsCompatibles(gc, '2026-09-07', ['libre', 'libre', 'libre'])).toEqual([7]);
  });

  it('una secuencia imposible en el patrón da [] (noche→tarde nunca ocurre en GC)', () => {
    expect(offsetsCompatibles(gc, '2026-09-07', ['noche', 'tarde'])).toEqual([]);
    // Tres mañanas seguidas: ningún punto del ciclo lo permite (solo hay dos mañanas contiguas).
    expect(offsetsCompatibles(gc, '2026-09-07', ['manana', 'manana', 'manana'])).toEqual([]);
  });

  it('un turno que NO está en el patrón produce [] (nunca lanza; el 0 es estado de UI)', () => {
    const oficina = PATRONES_PREDEFINIDOS[3]!; // solo mañana y libre
    expect(() => offsetsCompatibles(oficina, '2026-09-07', ['noche'])).not.toThrow();
    expect(offsetsCompatibles(oficina, '2026-09-07', ['noche'])).toEqual([]);
  });

  it('la matriz de desfases §1.1 cuadra: cada d proyecta secuencia[(d+i) mod L]', () => {
    // Para cada desfase d, la secuencia proyectada de L días desde hoy es la rotación por d.
    for (let d = 0; d < L; d++) {
      const proyeccion: TipoServicio[] = [];
      for (let i = 0; i < L; i++) proyeccion.push(gc.secuencia[(d + i) % L] as TipoServicio);
      // Alimentar esa proyección completa deja EXACTAMENTE ese desfase (el ciclo no se repite en L días).
      expect(offsetsCompatibles(gc, '2026-09-07', proyeccion)).toEqual([d]);
    }
  });
});

describe('inicioCicloDesdeOffset', () => {
  it('resta el desfase a fechaBase (inicioCiclo = fechaBase − d días)', () => {
    expect(inicioCicloDesdeOffset('2026-09-07', 0)).toBe('2026-09-07');
    expect(inicioCicloDesdeOffset('2026-09-07', 4)).toBe('2026-09-03');
    expect(inicioCicloDesdeOffset('2026-09-07', 6)).toBe('2026-09-01');
  });

  it('cruza el fin de mes y de año hacia atrás', () => {
    expect(inicioCicloDesdeOffset('2026-10-02', 9)).toBe('2026-09-23');
    expect(inicioCicloDesdeOffset('2027-01-03', 5)).toBe('2026-12-29');
  });

  it('coherencia: indicePatron(inicioCicloDesdeOffset(fechaBase, d), fechaBase, L) === d', () => {
    const gc = PATRONES_PREDEFINIDOS[0]!;
    const L = gc.secuencia.length;
    for (let d = 0; d < L; d++) {
      const inicio = inicioCicloDesdeOffset('2026-09-07', d);
      expect(indicePatron(inicio, '2026-09-07', L)).toBe(d);
    }
  });

  it('proyecta en fechaBase el turno secuencia[d]', () => {
    const gc = PATRONES_PREDEFINIDOS[0]!;
    const L = gc.secuencia.length;
    for (let d = 0; d < L; d++) {
      const inicio = inicioCicloDesdeOffset('2026-09-07', d);
      expect(gc.secuencia[indicePatron(inicio, '2026-09-07', L)]).toBe(gc.secuencia[d]);
    }
  });
});

describe('convergencia anclaje ↔ proyección (propiedad, todos los patrones)', () => {
  // Para varios inicioCiclo sembrados y varias fechaBase, alimentar la proyección REAL día a día
  // hace que offsetsCompatibles llegue a length === 1, e inicioCicloDesdeOffset reconstruye el
  // mismo inicioCiclo (módulo la longitud del ciclo). Es la idempotencia anclaje↔proyección.
  const fechasBase = ['2026-09-07', '2026-01-01', '2026-12-30', '2026-02-27', '2027-03-15'];
  const semillas = ['2026-01-01', '2026-06-15', '2026-09-07', '2025-11-20', '2026-12-31'];

  it('llega a un único desfase y reconstruye el inicioCiclo (mód L)', () => {
    for (const patron of PATRONES_PREDEFINIDOS) {
      const L = patron.secuencia.length;
      for (const inicioCiclo of semillas) {
        const cuadrante = Cuadrante.parse({
          patron,
          inicioCiclo,
          jornadaRefHorasSemana: 37.5,
        });
        for (const fechaBase of fechasBase) {
          // Se alimenta la proyección real, día a día, hasta que queda un único desfase.
          const turnos: TipoServicio[] = [];
          let compatibles = offsetsCompatibles(patron, fechaBase, turnos);
          let i = 0;
          // A lo sumo L días bastan para desambiguar cualquier ciclo (cota dura).
          while (compatibles.length > 1 && i < L) {
            turnos.push(proyectarDia(cuadrante, sumarDias(fechaBase, i)).servicio);
            compatibles = offsetsCompatibles(patron, fechaBase, turnos);
            i += 1;
          }
          expect(compatibles).toHaveLength(1);
          const inicioReconstruido = inicioCicloDesdeOffset(fechaBase, compatibles[0]!);
          // Mismo índice de ciclo para fechaBase ⟺ mismo inicioCiclo módulo L.
          expect(indicePatron(inicioReconstruido, fechaBase, L)).toBe(
            indicePatron(inicioCiclo, fechaBase, L),
          );
          // Y el turno de cada día dicho coincide con la proyección reconstruida.
          for (let k = 0; k < turnos.length; k++) {
            const fecha = sumarDias(fechaBase, k);
            expect(patron.secuencia[indicePatron(inicioReconstruido, fecha, L)]).toBe(turnos[k]);
          }
        }
      }
    }
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

describe('casos límite de calendario (DST, cambio de mes/año, festivo en libre)', () => {
  it('el cambio de hora (DST) NO desplaza ningún día del cuadrante', () => {
    // España: adelanto 2026-03-29 (02:00→03:00) y atraso 2026-10-25. Como todo se calcula en
    // UTC sobre fechas civiles, la proyección no debe saltarse ni duplicar días.
    const c = hacerCuadrante({ inicioCiclo: '2026-03-20' });
    const marzo = proyectarRango(c, '2026-03-28', '2026-03-30');
    expect(marzo.map((d) => d.fecha)).toEqual(['2026-03-28', '2026-03-29', '2026-03-30']);
    // Continuidad del índice del patrón a través del salto de hora primaveral.
    const len = c.patron.secuencia.length;
    expect(indicePatron(c.inicioCiclo, '2026-03-29', len)).toBe(
      (indicePatron(c.inicioCiclo, '2026-03-28', len) + 1) % len,
    );
    // Atraso de octubre: mismo comportamiento, sin días repetidos.
    const octubre = proyectarRango(c, '2026-10-24', '2026-10-26');
    expect(octubre.map((d) => d.fecha)).toEqual(['2026-10-24', '2026-10-25', '2026-10-26']);
  });

  it('proyecta correctamente el cruce de año (31/12 → 01/01)', () => {
    const c = hacerCuadrante({ inicioCiclo: '2026-12-01' });
    const cruce = proyectarRango(c, '2026-12-31', '2027-01-01');
    expect(cruce.map((d) => d.fecha)).toEqual(['2026-12-31', '2027-01-01']);
    const len = c.patron.secuencia.length;
    expect(indicePatron(c.inicioCiclo, '2027-01-01', len)).toBe(
      (indicePatron(c.inicioCiclo, '2026-12-31', len) + 1) % len,
    );
  });

  it('un festivo que cae en día LIBRE no suma horas festivas ni cuenta como festivo trabajado', () => {
    // 2026-09-08 es 'libre' en el patrón GC (inicio 2026-09-01). Marcarlo festivo no debe
    // inventar horas: sin presencia efectiva no hay festivo trabajado.
    const c = hacerCuadrante({ festivosExtra: ['2026-09-08'] });
    expect(proyectarDia(c, '2026-09-08').servicio).toBe('libre');
    expect(proyectarDia(c, '2026-09-08').esFestivo).toBe(true);
    const dias = proyectarRango(c, '2026-09-08', '2026-09-08');
    const r = resumenHoras(dias, {
      jornadaRefHorasSemana: 37.5,
      franjaNocturna: c.franjaNocturna,
      festivos: construirFestivos(c),
    });
    expect(r.horasFestivas).toBe(0);
    expect(r.festivosTrabajados).toBe(0);
    expect(r.horasTotales).toBe(0);
  });
});

describe('cómputo en los bordes de la medianoche', () => {
  const franja = { inicio: '22:00', fin: '06:00' } as const;

  it('un turno que acaba EXACTO a medianoche no vierte minutos al día siguiente', () => {
    // 16:00 → 00:00 (fin = 24:00). Duración 8 h, todas en la fecha de inicio.
    expect(duracionMinutos('16:00', '00:00')).toBe(480);
    const dia: DiaProyectado = {
      fecha: '2026-09-05', // sábado
      servicio: 'tarde',
      horaInicio: '16:00',
      horaFin: '00:00',
      clase: 'trabajo',
      computaPresencia: true,
      cruzaMedianoche: false,
      origen: 'patron',
      esFestivo: false,
      esFinDeSemana: true,
      nota: null,
      alarmaMinutosAntes: null,
    };
    const c = computarTurno(dia, franja, () => false);
    expect(c.minutosTotales).toBe(480);
    // 22:00→24:00 son nocturnas: 120 min.
    expect(c.minutosNocturnos).toBe(120);
    // Todo cae en sábado (fin de semana); nada se derrama al domingo.
    expect(c.minutosFinDeSemana).toBe(480);
  });

  it('un turno que arranca a las 00:00 computa íntegro en su fecha', () => {
    expect(duracionMinutos('00:00', '08:00')).toBe(480);
    const dia: DiaProyectado = {
      fecha: '2026-09-06', // domingo
      servicio: 'manana',
      horaInicio: '00:00',
      horaFin: '08:00',
      clase: 'trabajo',
      computaPresencia: true,
      cruzaMedianoche: false,
      origen: 'patron',
      esFestivo: false,
      esFinDeSemana: true,
      nota: null,
      alarmaMinutosAntes: null,
    };
    const c = computarTurno(dia, franja, () => false);
    expect(c.minutosTotales).toBe(480);
    // 00:00→06:00 nocturnas: 360 min.
    expect(c.minutosNocturnos).toBe(360);
    expect(c.minutosFinDeSemana).toBe(480);
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
