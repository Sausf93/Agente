import { describe, expect, it } from 'vitest';
import { extraerVariables, renderPlantilla } from '@agente/shared';
import { seccionDe } from './campos';
import { PLANTILLAS_SEED, plantillaPorId, validarSeed } from './plantillasSeed';

describe('seed de plantillas', () => {
  it('valida contra el esquema Plantilla de @agente/shared', () => {
    expect(() => validarSeed()).not.toThrow();
  });

  it('cada variable {{clave}} del Markdown tiene su descriptor de campo (1:1)', () => {
    for (const p of PLANTILLAS_SEED) {
      const variables = extraerVariables(p.markdownConVariables).sort();
      const claves = p.campos.map((c) => c.clave).sort();
      expect(claves, `plantilla ${p.id}`).toEqual(variables);
    }
  });

  it('el encabezado es NEUTRO: cuerpo/unidad son campos de texto del agente, no de terceros', () => {
    for (const p of PLANTILLAS_SEED) {
      const cuerpo = p.campos.find((c) => c.clave === 'cuerpo');
      const unidad = p.campos.find((c) => c.clave === 'unidad');
      expect(cuerpo?.esDatoTercero).toBe(false);
      expect(unidad?.esDatoTercero).toBe(false);
    }
  });

  it('los datos de vehículo/persona van marcados como dato de tercero', () => {
    const clavesTercero = ['matricula', 'denunciado', 'conductor', 'nombre', 'documento', 'domicilio'];
    for (const p of PLANTILLAS_SEED) {
      for (const campo of p.campos) {
        if (clavesTercero.includes(campo.clave)) {
          expect(campo.esDatoTercero, `${p.id}.${campo.clave}`).toBe(true);
        }
      }
    }
  });

  it('solo se recuerdan campos del agente (nunca datos de terceros)', () => {
    for (const p of PLANTILLAS_SEED) {
      for (const campo of p.campos) {
        if (campo.recordar) expect(campo.esDatoTercero).toBe(false);
      }
    }
  });

  it('plantillaPorId encuentra el boletín y devuelve null si no existe', () => {
    expect(plantillaPorId('seed-boletin-denuncia')?.tipo).toBe('boletin_denuncia');
    expect(plantillaPorId('no-existe')).toBeNull();
  });

  it('una plantilla rellena con solo campos del agente reporta los de tercero como faltantes', () => {
    const p = plantillaPorId('seed-diligencia-identificacion')!;
    const { camposFaltantes } = renderPlantilla(p.markdownConVariables, {
      cuerpo: 'Unidad X',
      unidad: 'Puesto Y',
      numeroTip: '12345',
      fecha: '07/09/2026',
      hora: '10:30',
      lugar: 'Calle Mayor',
      motivo: 'Indagación',
      amparo: 'art. 16 LO 4/2015',
      observaciones: 'Ninguna',
    });
    // Los datos de tercero (nombre, documento, nacimiento, nacionalidad, domicilio) quedan a rellenar.
    expect(camposFaltantes).toEqual(['nombre', 'documento', 'nacimiento', 'nacionalidad', 'domicilio']);
  });

  it('toda plantilla trae los tres campos de identidad del agente (cuerpo, unidad, nº TIP)', () => {
    for (const p of PLANTILLAS_SEED) {
      for (const clave of ['cuerpo', 'unidad', 'numeroTip']) {
        const campo = p.campos.find((c) => c.clave === clave);
        expect(campo, `${p.id}.${clave}`).toBeDefined();
        expect(seccionDe(campo!), `${p.id}.${clave}`).toBe('identidad');
        expect(campo!.recordar, `${p.id}.${clave}`).toBe(true);
        expect(campo!.esDatoTercero, `${p.id}.${clave}`).toBe(false);
      }
    }
  });

  it('ningún campo de la sección legal es dato de tercero (lo rellena la app, no el agente)', () => {
    for (const p of PLANTILLAS_SEED) {
      for (const campo of p.campos) {
        if (seccionDe(campo) === 'legal') {
          expect(campo.esDatoTercero, `${p.id}.${campo.clave}`).toBe(false);
        }
      }
    }
  });

  it('el boletín agrupa lo legal que llega de la ficha en la sección legal', () => {
    const boletin = plantillaPorId('seed-boletin-denuncia')!;
    for (const clave of ['norma', 'articulo', 'gravedad', 'importe', 'puntos', 'hecho']) {
      const campo = boletin.campos.find((c) => c.clave === clave);
      expect(seccionDe(campo!), clave).toBe('legal');
    }
  });

  it('incluye el acta de intervención de sustancias con su precepto en la sección legal', () => {
    const p = plantillaPorId('seed-acta-intervencion-sustancias');
    expect(p?.tipo).toBe('acta_intervencion_sustancias');
    const persona = p!.campos.find((c) => c.clave === 'persona');
    expect(persona?.esDatoTercero).toBe(true); // nombre de la persona = dato de tercero
    const articulo = p!.campos.find((c) => c.clave === 'articulo');
    expect(seccionDe(articulo!)).toBe('legal');
  });

  it('el boletín incluye el segundo agente actuante (identidad, no se recuerda, no es tercero)', () => {
    const boletin = plantillaPorId('seed-boletin-denuncia')!;
    const segundo = boletin.campos.find((c) => c.clave === 'numeroTip2');
    expect(segundo).toBeDefined();
    expect(seccionDe(segundo!)).toBe('identidad');
    expect(segundo!.esDatoTercero).toBe(false);
    expect(segundo!.recordar).toBe(false); // cambia según el compañero de patrulla
    expect(boletin.markdownConVariables).toContain('{{numeroTip2}}');
  });

  it('incluye el acta de prueba de alcoholemia con la segunda de contraste y el apercibimiento del art. 383', () => {
    const p = plantillaPorId('seed-acta-prueba-alcoholemia');
    expect(p?.tipo).toBe('acta_prueba_alcoholemia');
    // Garantías clave del procedimiento en el texto.
    expect(p!.markdownConVariables).toMatch(/[Ss]egunda prueba de contraste/);
    expect(p!.markdownConVariables).toMatch(/an[áa]lisis de sangre/i);
    expect(p!.markdownConVariables).toMatch(/art\. 383 CP/);
    // El interesado y su documento son datos de tercero; los mg/l y el etilómetro, del agente.
    const interesado = p!.campos.find((c) => c.clave === 'interesado');
    expect(interesado?.esDatoTercero).toBe(true);
    const resultado1 = p!.campos.find((c) => c.clave === 'resultado1');
    expect(resultado1?.esDatoTercero).toBe(false);
    const etilometro = p!.campos.find((c) => c.clave === 'etilometro');
    expect(etilometro?.esDatoTercero).toBe(false);
  });

  it('incluye el acta de retirada/depósito por grúa con importe orientativo y aviso de datos de tercero', () => {
    const p = plantillaPorId('seed-acta-deposito-grua');
    expect(p?.tipo).toBe('acta_deposito_grua');
    // Importe ORIENTATIVO y aviso de que los datos de tercero solo viven en el dispositivo.
    expect(p!.markdownConVariables.toLowerCase()).toMatch(/orientativo/);
    expect(p!.markdownConVariables.toLowerCase()).toMatch(/solo en este dispositivo|solo viven/);
    const matricula = p!.campos.find((c) => c.clave === 'matricula');
    expect(matricula?.esDatoTercero).toBe(true);
    const importe = p!.campos.find((c) => c.clave === 'importe');
    expect(seccionDe(importe!)).toBe('servicio');
    expect(importe?.esDatoTercero).toBe(false);
  });
});
