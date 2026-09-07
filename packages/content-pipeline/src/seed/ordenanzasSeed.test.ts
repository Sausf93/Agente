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

  it('cada importe valida en el marco municipal y supera los mínimos de publicación', () => {
    for (const { infraccion, sinonimos, marcoImporte } of SEED_ORDENANZAS.infracciones) {
      expect(marcoImporte, infraccion.id).toBe('municipal');
      expect(validarImporte(infraccion, marcoImporte), infraccion.id).toEqual([]);
      expect(validarMinimosPublicacion(infraccion, sinonimos.length), infraccion.id).toEqual([]);
    }
  });

  it('NADA se autopublica: todo queda pendiente_revision con su nota "a verificar"', () => {
    for (const item of SEED_ORDENANZAS.infracciones) {
      expect(item.revision, item.infraccion.id).toBe('pendiente_revision');
      expect(item.notaRevision.length, item.infraccion.id).toBeGreaterThan(20);
      expect(item.notaRevision.toLowerCase(), item.infraccion.id).toContain('verificar');
    }
  });
});

describe('SEED_ORDENANZAS: cobertura de lo más usado por un Local', () => {
  it('siembra VMP/patinete, animales y ruido', () => {
    expect(porId('ord-sctf-vmp-acera')).toBeDefined();
    expect(porId('ord-sctf-perro-suelto')).toBeDefined();
    expect(porId('ord-sctf-ruido-convivencia')).toBeDefined();
  });

  it('la ZONA AZUL se ha retirado del piloto (no operativa en 2026; importe sin fuente)', () => {
    // El revisor jurídico retiró `ord-sctf-zona-azul`: la zona azul aún no está operativa en Santa
    // Cruz y sus 60/30 € eran una cifra sin fuente sobre una norma inexistente.
    expect(porId('ord-sctf-zona-azul')).toBeUndefined();
    const terminos = SEED_ORDENANZAS.infracciones.flatMap((i) => i.sinonimos.map((s) => s.termino));
    expect(terminos).not.toContain('zona azul tenerife');
  });

  it('el ruido/convivencia es LEVE (300 € queda por debajo del mínimo del tramo grave del ruido)', () => {
    const ruido = porId('ord-sctf-ruido-convivencia')!;
    expect(ruido.infraccion.gravedad).toBe('leve');
    expect(ruido.infraccion.importeEur).toBe(300);
  });
});
