import { describe, expect, it } from 'vitest';
import { validarImporte, validarMinimosPublicacion } from '@agente/shared';
import { SEED_TRAFICO } from './traficoSeed.js';

/**
 * Tests del seed de infracciones de tráfico: garantizan que TODO lo sembrado cumple los
 * mínimos de publicación (§8.3), que los importes caen en su rango legal según su marco, y que
 * la integridad referencial (artículo citado, sinónimos, consecuencias) es correcta. Es la red
 * que evita que un importe erróneo o una infracción sin fuente lleguen al paquete.
 */

const idsArticulos = new Set(SEED_TRAFICO.articulos.map((a) => a.id));

describe('SEED_TRAFICO: integridad', () => {
  it('siembra 21 infracciones de calle', () => {
    expect(SEED_TRAFICO.infracciones).toHaveLength(21);
  });

  it('cada infracción tiene al menos 3 sinónimos de calle (buscador con chicha)', () => {
    for (const { infraccion, sinonimos } of SEED_TRAFICO.infracciones) {
      expect(sinonimos.length, infraccion.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('cada infracción cita un artículo existente en el seed', () => {
    for (const { infraccion } of SEED_TRAFICO.infracciones) {
      expect(idsArticulos.has(infraccion.articuloId)).toBe(true);
    }
  });

  it('cada infracción tiene al menos 2 sinónimos de calle', () => {
    for (const { infraccion, sinonimos } of SEED_TRAFICO.infracciones) {
      expect(sinonimos.length, infraccion.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('todas quedan pendientes de revisión (nada se autopublica)', () => {
    for (const item of SEED_TRAFICO.infracciones) {
      expect(item.revision, item.infraccion.id).toBe('pendiente_revision');
      expect(item.notaRevision.length).toBeGreaterThan(0);
    }
  });
});

describe('SEED_TRAFICO: relevancia por cuerpo (bug E-03, filtro de Normas)', () => {
  it('las normas de tráfico NO se etiquetan para la Policía Nacional', () => {
    // RGC, LSV, RGV, LRCSCVM y LOTT son de tráfico: un PN no las lleva de oficio.
    for (const codigo of ['RGC', 'LSV', 'RGV', 'LRCSCVM', 'LOTT']) {
      const norma = SEED_TRAFICO.normas.find((n) => n.codigo === codigo);
      expect(norma, codigo).toBeDefined();
      expect(norma!.cuerpos, codigo).not.toContain('policia_nacional');
      expect(norma!.cuerpos, codigo).toEqual([
        'guardia_civil',
        'policia_local',
        'policia_autonomica',
      ]);
    }
  });

  it('el Código Penal SÍ es relevante para todos los cuerpos', () => {
    const cp = SEED_TRAFICO.normas.find((n) => n.codigo === 'CP');
    expect(cp!.cuerpos).toContain('policia_nacional');
  });
});

describe('SEED_TRAFICO: calidad de importes (§8.3)', () => {
  it('cada importe cae dentro de su rango legal según su marco', () => {
    for (const { infraccion, marcoImporte } of SEED_TRAFICO.infracciones) {
      const problemas = validarImporte(infraccion, marcoImporte);
      expect(problemas, `${infraccion.id}: ${JSON.stringify(problemas)}`).toEqual([]);
    }
  });

  it('cada infracción supera los mínimos de publicación', () => {
    for (const { infraccion, sinonimos } of SEED_TRAFICO.infracciones) {
      const problemas = validarMinimosPublicacion(infraccion, sinonimos.length);
      expect(problemas, `${infraccion.id}: ${JSON.stringify(problemas)}`).toEqual([]);
    }
  });
});

describe('SEED_TRAFICO: la negativa a la prueba es un delito (vía penal)', () => {
  it('"negativa" es delito penal, sin importe y con detención orientativa', () => {
    const negativa = SEED_TRAFICO.infracciones.find(
      (i) => i.infraccion.id === 'inf-negativa-prueba',
    );
    expect(negativa).toBeDefined();
    expect(negativa!.infraccion.tipo).toBe('penal');
    expect(negativa!.infraccion.gravedad).toBe('delito');
    expect(negativa!.infraccion.importeEur).toBeNull();
    const detencion = negativa!.consecuencias.find((c) => c.tipo === 'detencion');
    expect(detencion).toBeDefined();
    // Lenguaje ORIENTATIVO, nunca imperativo (CLAUDE.md §4.6).
    expect(detencion!.textoCorto.toLowerCase()).toMatch(/procede|puede/);
    expect(detencion!.textoCorto.toLowerCase()).not.toMatch(/\bdeten\b|\bdetén\b/);
  });

  it('temeraria, negativa y alcoholemia penal llevan la REGLA del motor de detención (árbol + "Leer derechos")', () => {
    for (const id of ['inf-conduccion-temeraria', 'inf-negativa-prueba', 'del-alcoholemia-penal']) {
      const item = SEED_TRAFICO.infracciones.find((i) => i.infraccion.id === id);
      const det = item!.consecuencias.find((c) => c.tipo === 'detencion');
      expect(det, id).toBeDefined();
      // La regla la construye el helper compartido: sin ella la ficha no pintaba el árbol (regresión).
      const regla = det!.regla as Record<string, unknown>;
      expect(regla.motor, id).toBe('detencion');
      expect(regla.gravedadCp, id).toBe('menos_grave');
      expect(regla.escenarioBase, id).toBeDefined();
      expect(regla.orientacionBase, id).toBe('procede');
    }
  });
});

describe('SEED_TRAFICO: la alcoholemia PENAL marca la frontera boletín↔atestado', () => {
  it('"alcoholemia penal" es delito, sin importe, con la frontera de 0,60 mg/l y detención orientativa', () => {
    const penal = SEED_TRAFICO.infracciones.find(
      (i) => i.infraccion.id === 'del-alcoholemia-penal',
    );
    expect(penal).toBeDefined();
    expect(penal!.infraccion.tipo).toBe('penal');
    expect(penal!.infraccion.gravedad).toBe('delito');
    expect(penal!.infraccion.importeEur).toBeNull();
    expect(penal!.marcoImporte).toBe('penal');
    // La FRONTERA administrativo↔penal (0,60 mg/l) es el mensaje operativo clave y va en el boletín.
    expect(penal!.infraccion.textoBoletin).toMatch(/0,60/);
    expect(penal!.infraccion.textoBoletin.toLowerCase()).toMatch(/atestado/);
    expect(penal!.infraccion.textoBoletin.toLowerCase()).toMatch(/administrativa|art\. 14 lsv/i);
    // Cita el art. 379.2 CP y ofrece detención + inmovilización.
    expect(penal!.infraccion.penaTexto).toMatch(/379\.2/);
    const tipos = penal!.consecuencias.map((c) => c.tipo).sort();
    expect(tipos).toEqual(['detencion', 'inmovilizacion']);
    const detencion = penal!.consecuencias.find((c) => c.tipo === 'detencion');
    // Lenguaje ORIENTATIVO, nunca imperativo (CLAUDE.md §4.6).
    expect(detencion!.textoCorto.toLowerCase()).toMatch(/procede|puede/);
    expect(detencion!.textoCorto.toLowerCase()).not.toMatch(/\bdeten\b|\bdetén\b/);
    // Sinónimos de calle que debe entender el buscador (frontera 0,60).
    const terminos = penal!.sinonimos.map((s) => s.termino);
    expect(terminos).toContain('alcoholemia penal');
    expect(terminos).toContain('0.60');
  });

  it('la alcoholemia penal cita el art. 379.2 CP como su artículo fuente del seed', () => {
    const penal = SEED_TRAFICO.infracciones.find(
      (i) => i.infraccion.id === 'del-alcoholemia-penal',
    );
    const articulo = SEED_TRAFICO.articulos.find((a) => a.id === penal!.infraccion.articuloId);
    expect(articulo).toBeDefined();
    expect(articulo!.numero).toBe('379.2');
  });
});

describe('SEED_TRAFICO: alcohol y drogas usan su marco de importe propio', () => {
  it('alcoholemia y drogas superan el tope de tráfico y validan con "alcohol_drogas"', () => {
    const ids = ['inf-alcoholemia', 'inf-drogas-volante'];
    for (const id of ids) {
      const item = SEED_TRAFICO.infracciones.find((i) => i.infraccion.id === id);
      expect(item, id).toBeDefined();
      expect(item!.marcoImporte).toBe('alcohol_drogas');
    }
    const drogas = SEED_TRAFICO.infracciones.find((i) => i.infraccion.id === 'inf-drogas-volante');
    expect(drogas!.infraccion.importeEur).toBe(1000);
  });

  it('exceso de velocidad valida con el marco "velocidad"', () => {
    const velocidad = SEED_TRAFICO.infracciones.find(
      (i) => i.infraccion.id === 'inf-exceso-velocidad',
    );
    expect(velocidad!.marcoImporte).toBe('velocidad');
  });
});

describe('SEED_TRAFICO: la infracción con consecuencia potente', () => {
  it('"sin seguro" es muy grave y lleva inmovilización + depósito con fuente', () => {
    const sinSeguro = SEED_TRAFICO.infracciones.find((i) => i.infraccion.id === 'inf-sin-seguro');
    expect(sinSeguro).toBeDefined();
    expect(sinSeguro!.infraccion.gravedad).toBe('muy_grave');
    const tipos = sinSeguro!.consecuencias.map((c) => c.tipo).sort();
    expect(tipos).toEqual(['deposito', 'inmovilizacion']);
    for (const c of sinSeguro!.consecuencias) {
      expect(c.fuente).toMatch(/LSV art\./);
      // Lenguaje orientativo, nunca imperativo (CLAUDE.md).
      expect(c.textoCorto.toLowerCase()).toMatch(/procede|puede/);
    }
  });
});
