import { describe, expect, it } from 'vitest';
import { slugMunicipio, validarImporte, validarMinimosPublicacion } from '@agente/shared';
import {
  MUNICIPIOS_CON_ORDENANZA,
  SEED_ORDENANZAS,
  TERRITORIO_SCTF,
} from './ordenanzasSeed.js';

/**
 * Tests del SEED de ORDENANZAS MUNICIPALES (piloto Santa Cruz de Tenerife): integridad,
 * enganche territorial (el `territorioId` coincide con el que deriva el onboarding), marco
 * municipal, mínimos de publicación y estado editorial `pendiente_revision`.
 */

const porId = (id: string) => SEED_ORDENANZAS.infracciones.find((i) => i.infraccion.id === id);
const idsArticulos = new Set(SEED_ORDENANZAS.articulos.map((a) => a.id));

describe('SEED_ORDENANZAS: enganche territorial (capa municipal)', () => {
  it('el territorio del piloto coincide con el slug del municipio del perfil', () => {
    // El onboarding guarda `municipioId = slugMunicipio(nombre)`: el seed DEBE usar el mismo id o
    // el filtro territorial nunca engancharía la ordenanza al Local de ese municipio.
    expect(TERRITORIO_SCTF).toBe(slugMunicipio('Santa Cruz de Tenerife'));
    expect(TERRITORIO_SCTF).toBe('mun-santa-cruz-de-tenerife');
    expect(MUNICIPIOS_CON_ORDENANZA.map((m) => m.territorioId)).toContain(TERRITORIO_SCTF);
  });

  it('todas las normas son ORDENANZAS municipales ligadas al municipio', () => {
    expect(SEED_ORDENANZAS.normas.length).toBeGreaterThan(0);
    for (const n of SEED_ORDENANZAS.normas) {
      expect(n.ambito, n.codigo).toBe('municipal');
      expect(n.tipo, n.codigo).toBe('ordenanza');
      expect(n.territorioId, n.codigo).toBe(TERRITORIO_SCTF);
      // Relevancia: una ordenanza municipal la lleva la Local (y la autonómica canaria), no la GC/PN.
      expect(n.cuerpos, n.codigo).toContain('policia_local');
      expect(n.cuerpos, n.codigo).not.toContain('policia_nacional');
      expect(n.cuerpos, n.codigo).not.toContain('guardia_civil');
    }
  });

  it('todas las infracciones son municipales, urbanas y con territorio', () => {
    expect(SEED_ORDENANZAS.infracciones.length).toBeGreaterThanOrEqual(5);
    for (const { infraccion } of SEED_ORDENANZAS.infracciones) {
      expect(infraccion.ambito, infraccion.id).toBe('municipal');
      expect(infraccion.territorioId, infraccion.id).toBe(TERRITORIO_SCTF);
      expect(infraccion.tipo, infraccion.id).toBe('administrativa');
      expect(infraccion.competencia.via, infraccion.id).toBe('urbana');
      expect(infraccion.competencia.cuerpos, infraccion.id).toContain('policia_local');
    }
  });
});

describe('SEED_ORDENANZAS: calidad de contenido (§8.3)', () => {
  it('cada infracción cita un artículo del seed y tiene ≥2 sinónimos', () => {
    for (const { infraccion, sinonimos } of SEED_ORDENANZAS.infracciones) {
      expect(idsArticulos.has(infraccion.articuloId), infraccion.id).toBe(true);
      expect(sinonimos.length, infraccion.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('cada importe valida en su marco y supera los mínimos de publicación', () => {
    for (const { infraccion, sinonimos, marcoImporte } of SEED_ORDENANZAS.infracciones) {
      // La mayoría son `municipal` (importe orientativo); las CONSULTABLES sin cuantía confirmada
      // (terrazas, ZBE) van como `no_sancionador` (sin importe): mejor honesto que un dato falso.
      expect(['municipal', 'no_sancionador'], infraccion.id).toContain(marcoImporte);
      expect(validarImporte(infraccion, marcoImporte), infraccion.id).toEqual([]);
      expect(
        validarMinimosPublicacion(infraccion, sinonimos.length, marcoImporte),
        infraccion.id,
      ).toEqual([]);
    }
  });

  it('estado editorial: las cotejadas contra el texto consolidado quedan verificado; el resto, pendiente con nota "a verificar"', () => {
    for (const item of SEED_ORDENANZAS.infracciones) {
      expect(['verificado', 'pendiente_revision'], item.infraccion.id).toContain(item.revision);
      expect(item.notaRevision.length, item.infraccion.id).toBeGreaterThan(20);
      if (item.revision === 'verificado') {
        // Una ordenanza verificada deja constancia del cotejo contra su texto consolidado.
        expect(item.notaRevision.toLowerCase(), item.infraccion.id).toContain('cotejado');
      } else {
        expect(item.notaRevision.toLowerCase(), item.infraccion.id).toContain('verificar');
      }
    }
  });

  it('las CONSULTABLES sin cuantía (no_sancionador) nunca se marcan verificado', () => {
    // No hay importe que verificar: aunque se haya leído su artículo, permanecen pendiente_revision.
    for (const item of SEED_ORDENANZAS.infracciones) {
      if (item.marcoImporte === 'no_sancionador') {
        expect(item.revision, item.infraccion.id).toBe('pendiente_revision');
      }
    }
  });

  it('las 7 fichas de la ordenanza de limpieza (OMGRL) están cotejadas y verificadas', () => {
    const idsLimpieza = [
      'ord-sctf-orinar-defecar-escupir',
      'ord-sctf-pintadas-grafitis',
      'ord-sctf-abandono-enseres',
      'ord-sctf-contenedores-fuera-horario',
      'ord-sctf-vertidos-via-publica',
      'ord-sctf-playa-fumar',
      'ord-sctf-playa-residuos-arena',
    ];
    for (const id of idsLimpieza) {
      const item = porId(id);
      expect(item, id).toBeDefined();
      expect(item!.revision, id).toBe('verificado');
    }
  });
});

describe('SEED_ORDENANZAS: cobertura de lo más usado por un Local', () => {
  it('siembra VMP/patinete, animales y ruido', () => {
    expect(porId('ord-sctf-vmp-acera')).toBeDefined();
    expect(porId('ord-sctf-perro-suelto')).toBeDefined();
    expect(porId('ord-sctf-ruido-convivencia')).toBeDefined();
  });

  it('siembra las fichas de alto uso del Local: vado, carga/descarga y gorrillas con su consecuencia', () => {
    const vado = porId('ord-sctf-vado');
    const carga = porId('ord-sctf-carga-descarga');
    const gorrillas = porId('ord-sctf-gorrillas');
    expect(vado).toBeDefined();
    expect(carga).toBeDefined();
    expect(gorrillas).toBeDefined();
    // Vado y carga/descarga: la consecuencia estrella es la retirada por grúa (depósito).
    expect(vado!.consecuencias.some((c) => c.tipo === 'deposito')).toBe(true);
    expect(carga!.consecuencias.some((c) => c.tipo === 'deposito')).toBe(true);
    // Gorrillas: cese de la actividad no autorizada.
    expect(gorrillas!.consecuencias.some((c) => c.tipo === 'cese_actividad')).toBe(true);
    // Sin cuantía inventada: van como consultables.
    for (const item of [vado!, carga!, gorrillas!]) {
      expect(item.marcoImporte, item.infraccion.id).toBe('no_sancionador');
      expect(item.infraccion.importeEur, item.infraccion.id).toBeNull();
    }
  });

  it('la ZONA AZUL se ha retirado del piloto (no operativa en 2026; importe sin fuente)', () => {
    // El revisor jurídico retiró `ord-sctf-zona-azul`: la zona azul aún no está operativa en Santa
    // Cruz y sus 60/30 € eran una cifra sin fuente sobre una norma inexistente.
    expect(porId('ord-sctf-zona-azul')).toBeUndefined();
    const terminos = SEED_ORDENANZAS.infracciones.flatMap((i) => i.sinonimos.map((s) => s.termino));
    expect(terminos).not.toContain('zona azul tenerife');
  });

  it('el ruido/convivencia es LEVE con la multa municipal cotejada (OM ruidos art. 31: hasta 60,10 €)', () => {
    const ruido = porId('ord-sctf-ruido-convivencia')!;
    expect(ruido.infraccion.gravedad).toBe('leve');
    // Cotejado contra la OM de ruidos y vibraciones (art. 31): leve hasta 60,10 €. Se corrige el 300 €
    // orientativo anterior, que no tenía fuente.
    expect(ruido.infraccion.importeEur).toBe(60.1);
    expect(ruido.revision).toBe('verificado');
  });

  it('ZBE sigue CONSULTABLE sin cuantía inventada (régimen aún no aplicable)', () => {
    const zbe = porId('ord-sctf-zbe');
    expect(zbe).toBeDefined();
    // Sin importe fabricado: marco `no_sancionador` (misma regla honesta que la zona azul).
    expect(zbe!.marcoImporte).toBe('no_sancionador');
    expect(zbe!.infraccion.importeEur).toBeNull();
    expect(zbe!.notaRevision.toLowerCase()).toContain('verificar');
    // ZBE: se advierte que el régimen sancionador aún NO es aplicable.
    expect(zbe!.infraccion.textoBoletin.toLowerCase()).toMatch(/no es aplicable|no procede sanci/);
  });

  it('terrazas: cotejada contra la Ordenanza de Paisaje Urbano → GRAVE y verificada', () => {
    const terrazas = porId('ord-sctf-terrazas');
    expect(terrazas).toBeDefined();
    // Instalar en dominio público sin licencia = grave (750-1.500 €); se modela con el techo del tramo.
    expect(terrazas!.infraccion.gravedad).toBe('grave');
    expect(terrazas!.infraccion.importeEur).toBe(1500);
    expect(terrazas!.revision).toBe('verificado');
    // Sigue con la orientación de retirada/cese de la ocupación.
    expect(terrazas!.consecuencias.some((c) => c.tipo === 'cese_actividad')).toBe(true);
  });

  it('los sinónimos clave de terrazas y ZBE enganchan a su ficha', () => {
    const porTermino = (t: string) =>
      SEED_ORDENANZAS.infracciones
        .filter((i) => i.sinonimos.some((s) => s.termino === t))
        .map((i) => i.infraccion.id);
    expect(porTermino('terraza sin licencia')).toContain('ord-sctf-terrazas');
    expect(porTermino('zbe')).toContain('ord-sctf-zbe');
    expect(porTermino('zona de bajas emisiones')).toContain('ord-sctf-zbe');
  });
});
