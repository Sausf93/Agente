import { describe, expect, it } from 'vitest';
import {
  EntradaDetencion,
  PIE_DETENCION,
  PIE_DETENCION_MENOR,
  PIE_EXTRANJERIA,
  evaluarDetencion,
  textoConsecuenciaDetencion,
  type GravedadPenal,
} from './index.js';

/**
 * Tests del MOTOR DE DETENCIÓN (LECrim), núcleo crítico → cobertura exhaustiva de todas las
 * ramas del árbol (art. 490 / 492 / 493 / 495 y gravedad de la pena, art. 33 CP) y garantía
 * de las reglas no negociables: lenguaje ORIENTATIVO (nunca imperativo), FUENTES siempre y PIE
 * de responsabilidad fijo en cada salida.
 */

/** Circunstancias todas a `false`/por defecto para una gravedad dada. */
const base = (gravedadCp: GravedadPenal): EntradaDetencion => ({ gravedadCp });

describe('evaluarDetencion — DELITO LEVE (art. 495 rige sobre el 490)', () => {
  it('sin domicilio conocido ni fianza → puede proceder (excepción del 495)', () => {
    const r = evaluarDetencion({
      gravedadCp: 'leve',
      domicilioConocido: false,
      prestariaFianza: false,
    });
    expect(r.orientacion).toBe('puede_proceder');
    expect(r.fuentes).toEqual(['CP art. 33', 'LECrim art. 495']);
  });

  it('con domicilio conocido → no procede salvo excepción (identificar y dar cuenta)', () => {
    const r = evaluarDetencion({ gravedadCp: 'leve', domicilioConocido: true });
    expect(r.orientacion).toBe('no_procede_salvo');
    expect(r.fuentes).toContain('LECrim art. 495');
    expect(r.fuentes).toContain('LECrim art. 493');
  });

  it('sin domicilio pero prestaría fianza → no procede (excepción incompleta)', () => {
    const r = evaluarDetencion({
      gravedadCp: 'leve',
      domicilioConocido: false,
      prestariaFianza: true,
    });
    expect(r.orientacion).toBe('no_procede_salvo');
  });

  it('la flagrancia NO abre la detención en delito leve (495 se impone al 490)', () => {
    const r = evaluarDetencion({
      gravedadCp: 'leve',
      flagrancia: true,
      domicilioConocido: true,
    });
    expect(r.orientacion).toBe('no_procede_salvo');
    // No debe citar el 490: en delito leve la vía es el 495.
    expect(r.fuentes).not.toContain('LECrim art. 490');
  });
});

describe('evaluarDetencion — DELITO de SOLO MULTA (proporcionalidad, art. 492)', () => {
  it('la FLAGRANCIA no obliga a detener en un delito de solo multa (492, no 492.1)', () => {
    const r = evaluarDetencion({
      gravedadCp: 'menos_grave',
      penaSoloMulta: true,
      flagrancia: true,
      domicilioConocido: true,
    });
    expect(r.orientacion).toBe('no_procede_salvo');
    // NO debe orientar a "procede" ni citar la obligación de detener del 492.1.
    expect(r.fuentes).not.toContain('LECrim art. 492.1');
    expect(r.fuentes).toContain('LECrim art. 492');
    expect(r.fuentes).toContain('LECrim art. 493');
    // No es un delito leve: no debe apoyarse en el 495.
    expect(r.fuentes).not.toContain('LECrim art. 495');
  });

  it('sin identificación ni garantías → puede proceder (excepción por proporcionalidad)', () => {
    const r = evaluarDetencion({
      gravedadCp: 'menos_grave',
      penaSoloMulta: true,
      flagrancia: true,
      domicilioConocido: false,
      prestariaFianza: false,
    });
    expect(r.orientacion).toBe('puede_proceder');
    expect(r.fuentes).toContain('LECrim art. 492');
  });

  it('mantiene el lenguaje orientativo y el pie de responsabilidad', () => {
    const r = evaluarDetencion({ gravedadCp: 'menos_grave', penaSoloMulta: true, flagrancia: true });
    expect(r.titulo.toLowerCase()).not.toContain('detén');
    expect(r.pie).toBe(PIE_DETENCION);
  });
});

describe('evaluarDetencion — MENOS GRAVE / GRAVE con causa del art. 490 → procede', () => {
  const gravedades: GravedadPenal[] = ['menos_grave', 'grave'];
  for (const g of gravedades) {
    it(`${g}: flagrancia → procede (deber de detener, 492.1)`, () => {
      const r = evaluarDetencion({ gravedadCp: g, flagrancia: true });
      expect(r.orientacion).toBe('procede');
      expect(r.fuentes).toEqual(['LECrim art. 490', 'LECrim art. 492.1']);
      expect(r.motivo).toMatch(/flagrante/);
    });

    it(`${g}: intento de cometer el delito → procede`, () => {
      const r = evaluarDetencion({ gravedadCp: g, intentoDelito: true });
      expect(r.orientacion).toBe('procede');
      expect(r.motivo).toMatch(/intento/);
    });

    it(`${g}: fuga o rebeldía → procede`, () => {
      const r = evaluarDetencion({ gravedadCp: g, fugaORebeldia: true });
      expect(r.orientacion).toBe('procede');
      expect(r.motivo).toMatch(/fuga|rebeld/);
    });
  }
});

describe('evaluarDetencion — MENOS GRAVE / GRAVE sin flagrancia (arts. 492.3/492.4)', () => {
  it('indicios de delito + participación + riesgo de incomparecencia → puede proceder', () => {
    const r = evaluarDetencion({
      gravedadCp: 'menos_grave',
      indiciosRacionalesDelito: true,
      indiciosParticipacion: true,
      riesgoIncomparecencia: true,
    });
    expect(r.orientacion).toBe('puede_proceder');
    expect(r.fuentes).toEqual(['LECrim art. 492.3', 'LECrim art. 492.4']);
  });

  it('indicios completos pero SIN riesgo de incomparecencia → no procede (falta el riesgo)', () => {
    const r = evaluarDetencion({
      gravedadCp: 'grave',
      indiciosRacionalesDelito: true,
      indiciosParticipacion: true,
      riesgoIncomparecencia: false,
    });
    expect(r.orientacion).toBe('no_procede_salvo');
    // La carencia concreta va en la cláusula "Falta:"; solo debe faltar el riesgo.
    expect(r.motivo).toMatch(/Falta: riesgo de incomparecencia\./);
  });

  it('sin indicios de delito → no procede y lo señala', () => {
    const r = evaluarDetencion({
      gravedadCp: 'menos_grave',
      indiciosRacionalesDelito: false,
      indiciosParticipacion: true,
      riesgoIncomparecencia: true,
    });
    expect(r.orientacion).toBe('no_procede_salvo');
    expect(r.motivo).toMatch(/existencia del delito/);
  });

  it('sin ninguna circunstancia (solo la gravedad) → no procede, con las tres carencias', () => {
    const r = evaluarDetencion(base('grave'));
    expect(r.orientacion).toBe('no_procede_salvo');
    expect(r.motivo).toMatch(/existencia del delito/);
    expect(r.motivo).toMatch(/participación/);
    expect(r.motivo).toMatch(/riesgo de incomparecencia/);
    expect(r.fuentes).toContain('LECrim art. 493');
  });
});

describe('evaluarDetencion — invariantes de TODAS las salidas', () => {
  // Matriz de combinaciones que recorre las ramas relevantes del árbol.
  const gravedades: GravedadPenal[] = ['leve', 'menos_grave', 'grave'];
  const bools = [false, true];
  const combinaciones: EntradaDetencion[] = [];
  for (const gravedadCp of gravedades) {
    for (const flagrancia of bools) {
      for (const indiciosRacionalesDelito of bools) {
        for (const indiciosParticipacion of bools) {
          for (const riesgoIncomparecencia of bools) {
            for (const domicilioConocido of bools) {
              combinaciones.push({
                gravedadCp,
                flagrancia,
                indiciosRacionalesDelito,
                indiciosParticipacion,
                riesgoIncomparecencia,
                domicilioConocido,
              });
            }
          }
        }
      }
    }
  }

  it('nunca usan lenguaje imperativo ("detén"/"detener" como orden)', () => {
    for (const c of combinaciones) {
      const r = evaluarDetencion(c);
      const texto = `${r.titulo} ${r.motivo}`.toLowerCase();
      // El titular debe ser orientativo ("procede"/"puede"/"no procede").
      expect(r.titulo.toLowerCase()).toMatch(/procede|puede/);
      // Nunca la orden imperativa "detén" ni "detenga".
      expect(texto).not.toMatch(/\bdetén\b|\bdetenga\b|\bdetenlo\b/);
    }
  });

  it('siempre devuelven al menos una fuente y el pie de responsabilidad fijo', () => {
    for (const c of combinaciones) {
      const r = evaluarDetencion(c);
      expect(r.fuentes.length).toBeGreaterThan(0);
      expect(r.pie).toBe(PIE_DETENCION);
    }
  });

  it('la orientación es uno de los tres valores cerrados', () => {
    for (const c of combinaciones) {
      const r = evaluarDetencion(c);
      expect(['procede', 'puede_proceder', 'no_procede_salvo']).toContain(r.orientacion);
    }
  });
});

describe('evaluarDetencion — valores por defecto de la entrada', () => {
  it('con solo la gravedad (resto por defecto) no lanza y da un resultado coherente', () => {
    const r = evaluarDetencion({ gravedadCp: 'menos_grave' });
    expect(r.orientacion).toBe('no_procede_salvo');
  });

  it('delito leve por defecto tiene domicilio conocido → no procede', () => {
    const r = evaluarDetencion({ gravedadCp: 'leve' });
    expect(r.orientacion).toBe('no_procede_salvo');
  });
});

describe('evaluarDetencion — REGRESIÓN CERO: adulto por defecto = árbol penal actual', () => {
  it('sin edadAutor ni soloHechoMigratorio, el resultado es idéntico a informarlos como adulto', () => {
    const escenario: EntradaDetencion = { gravedadCp: 'menos_grave', flagrancia: true };
    const sinCampos = evaluarDetencion(escenario);
    const conAdulto = evaluarDetencion({
      ...escenario,
      edadAutor: 'adulto',
      soloHechoMigratorio: false,
    });
    expect(sinCampos).toEqual(conAdulto);
    // Y sigue sin avisos de menor (régimen ordinario).
    expect(sinCampos.avisosMenor).toBeUndefined();
    expect(sinCampos.pie).toBe(PIE_DETENCION);
  });
});

describe('evaluarDetencion — RAMA A1: autor menor de 14 (inimputable, LO 5/2000)', () => {
  it('no es detención penal, con protección de menores y sus fuentes', () => {
    const r = evaluarDetencion({ gravedadCp: 'grave', flagrancia: true, edadAutor: 'menor_14' });
    expect(r.orientacion).toBe('no_detencion_penal');
    expect(r.titulo).toMatch(/menor de 14 años/);
    expect(r.motivo).toMatch(/inimputable/);
    expect(r.fuentes).toEqual(['LO 5/2000 art. 1.1', 'LO 5/2000 art. 3', 'LO 1/1996']);
    expect(r.pie).toBe(PIE_DETENCION_MENOR);
  });

  it('lleva su bloque destacado (avisosMenor) con la ACCIÓN operativa "qué procede"', () => {
    const r = evaluarDetencion({ gravedadCp: 'grave', flagrancia: true, edadAutor: 'menor_14' });
    expect(r.avisosMenor).toBeDefined();
    expect(r.avisosMenor).toMatch(/Qué procede/);
    expect(r.avisosMenor).toMatch(/representantes legales|Entidad Pública/);
    expect(r.avisosMenor).toMatch(/Ministerio Fiscal/);
    // Sin hecho migratorio, no menciona MENA.
    expect(r.avisosMenor).not.toMatch(/MENA/);
  });

  it('menor de 14 + solo migratorio → el aviso añade la mención MENA (§3.1 gana, sigue A1)', () => {
    const r = evaluarDetencion({
      gravedadCp: 'grave',
      edadAutor: 'menor_14',
      soloHechoMigratorio: true,
    });
    expect(r.orientacion).toBe('no_detencion_penal');
    expect(r.titulo).toMatch(/menor de 14 años/);
    expect(r.avisosMenor).toMatch(/Qué procede/);
    expect(r.avisosMenor).toMatch(/MENA/);
  });

  it('precede a cualquier circunstancia penal (la edad cortocircuita el árbol)', () => {
    const r = evaluarDetencion({
      gravedadCp: 'grave',
      flagrancia: true,
      fugaORebeldia: true,
      edadAutor: 'menor_14',
    });
    expect(r.orientacion).toBe('no_detencion_penal');
    // No cita la LECrim del árbol penal.
    expect(r.fuentes).not.toContain('LECrim art. 490');
  });

  it('precede incluso al hecho migratorio (§3.1 gana a §3.2)', () => {
    const r = evaluarDetencion({
      gravedadCp: 'leve',
      edadAutor: 'menor_14',
      soloHechoMigratorio: true,
    });
    expect(r.titulo).toMatch(/menor de 14 años/);
    expect(r.fuentes).toContain('LO 5/2000 art. 3');
  });
});

describe('evaluarDetencion — RAMA B1: solo hecho migratorio (extranjería, LO 4/2000)', () => {
  it('no es detención penal, con vía administrativa y sus fuentes', () => {
    const r = evaluarDetencion({ gravedadCp: 'grave', soloHechoMigratorio: true });
    expect(r.orientacion).toBe('no_detencion_penal');
    expect(r.titulo).toMatch(/infracción administrativa/);
    expect(r.motivo).toMatch(/estancia irregular/);
    expect(r.fuentes).toEqual([
      'LO 4/2000 art. 53.1.a',
      'LO 4/2000 art. 55.1',
      'LO 4/2000 art. 57',
      'LO 4/2000 art. 58',
      'LO 4/2000 art. 61',
      'LO 4/2000 art. 62',
    ]);
    // Todos los chips de extranjería llevan el prefijo de la ley (no solo el primero).
    for (const f of r.fuentes) expect(f).toMatch(/^LO 4\/2000 art\./);
    expect(r.pie).toBe(PIE_EXTRANJERIA);
    // Adulto: sin aviso de menor.
    expect(r.avisosMenor).toBeUndefined();
  });

  it('aclara la detención cautelar del art. 61 (a verificar) y la separa del CIE (art. 62)', () => {
    const r = evaluarDetencion({ gravedadCp: 'grave', soloHechoMigratorio: true });
    // Cautelar para incoar/ejecutar la expulsión: que el agente no lea "no puede retener".
    expect(r.motivo).toMatch(/cautelar/i);
    expect(r.motivo).toMatch(/art\. 61/);
    expect(r.motivo).toMatch(/a verificar/);
    // El CIE (art. 62, judicial) queda separado.
    expect(r.motivo).toMatch(/CIE/);
    expect(r.motivo).toMatch(/art\. 62/);
  });

  it('menor 14-17 + solo migratorio → añade aviso de protección de menores / MENA', () => {
    const r = evaluarDetencion({
      gravedadCp: 'grave',
      soloHechoMigratorio: true,
      edadAutor: 'menor_14_17',
    });
    expect(r.orientacion).toBe('no_detencion_penal');
    expect(r.avisosMenor).toMatch(/MENA/);
    expect(r.avisosMenor).toMatch(/protección de menores/);
    expect(r.pie).toBe(PIE_EXTRANJERIA);
  });
});

describe('evaluarDetencion — RAMA A2: menor 14-17 (overlay del art. 17 LO 5/2000)', () => {
  it('mantiene el título/motivo/orientación penal base y AÑADE garantías + fuente 17', () => {
    const adulto = evaluarDetencion({ gravedadCp: 'grave', flagrancia: true });
    const menor = evaluarDetencion({ gravedadCp: 'grave', flagrancia: true, edadAutor: 'menor_14_17' });
    // El resultado base no se toca: misma orientación, título y motivo.
    expect(menor.orientacion).toBe(adulto.orientacion);
    expect(menor.titulo).toBe(adulto.titulo);
    expect(menor.motivo).toBe(adulto.motivo);
    // Overlay: fuente del art. 17 y aviso destacado del régimen del menor.
    expect(menor.fuentes).toEqual([...adulto.fuentes, 'LO 5/2000 art. 17']);
    expect(menor.avisosMenor).toMatch(/24 horas/);
    expect(menor.avisosMenor).toMatch(/Ministerio Fiscal de Menores/);
    expect(menor.pie).toBe(PIE_DETENCION_MENOR);
  });

  it('cuando el árbol penal no procede, sigue sin proceder pero con las garantías del menor', () => {
    const r = evaluarDetencion({ gravedadCp: 'leve', edadAutor: 'menor_14_17' });
    expect(r.orientacion).toBe('no_procede_salvo');
    expect(r.avisosMenor).toMatch(/Régimen del menor/);
    expect(r.fuentes).toContain('LO 5/2000 art. 17');
  });
});

describe('textoConsecuenciaDetencion', () => {
  it('compone título + motivo + pie de responsabilidad', () => {
    const r = evaluarDetencion({ gravedadCp: 'menos_grave', flagrancia: true });
    const texto = textoConsecuenciaDetencion(r);
    expect(texto).toContain(r.titulo);
    expect(texto).toContain(r.motivo);
    expect(texto).toContain(PIE_DETENCION);
    expect(texto.toLowerCase()).toMatch(/procede|puede/);
  });
});
