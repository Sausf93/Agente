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
  it('siembra 54 infracciones de calle', () => {
    expect(SEED_TRAFICO.infracciones).toHaveLength(53);
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

describe('SEED_TRAFICO: nuevos delitos de tráfico (velocidad 379.1 y sin permiso 384)', () => {
  const find = (id: string) => SEED_TRAFICO.infracciones.find((i) => i.infraccion.id === id);

  // La app deriva `fichaKind: 'penal'` de `tipo === 'penal' || gravedad === 'delito'`
  // (ficha.ts `fichaKindFrom`). Aquí afirmamos esas propiedades: son las que disparan la forma
  // penal (bloque "Marco penal" + árbol de detención) en lugar de tiles de importe/puntos.
  it('las dos penales tienen tipo penal + gravedad delito (→ fichaKind penal), sin importe', () => {
    for (const id of ['del-velocidad-penal', 'del-conduccion-sin-permiso']) {
      const item = find(id);
      expect(item, id).toBeDefined();
      expect(item!.infraccion.tipo, id).toBe('penal');
      expect(item!.infraccion.gravedad, id).toBe('delito');
      expect(item!.infraccion.importeEur, id).toBeNull();
      expect(item!.marcoImporte, id).toBe('penal');
      expect(item!.infraccion.penaTexto, id).toBeTruthy();
    }
  });

  it('las dos penales disparan detención ORIENTATIVA con la regla del motor (árbol + derechos)', () => {
    for (const id of ['del-velocidad-penal', 'del-conduccion-sin-permiso']) {
      const item = find(id);
      const det = item!.consecuencias.find((c) => c.tipo === 'detencion');
      expect(det, id).toBeDefined();
      // Lenguaje orientativo, nunca imperativo (CLAUDE.md §4.6).
      expect(det!.textoCorto.toLowerCase(), id).toMatch(/procede|puede/);
      expect(det!.textoCorto.toLowerCase(), id).not.toMatch(/\bdeten\b|\bdetén\b/);
      const regla = det!.regla as Record<string, unknown>;
      expect(regla.motor, id).toBe('detencion');
      expect(regla.gravedadCp, id).toBe('menos_grave');
      expect(regla.orientacionBase, id).toBe('procede');
    }
  });

  it('citan su artículo penal (379.1 y 384) y marcan la frontera con la administrativa', () => {
    const velocidad = find('del-velocidad-penal')!;
    const artVel = SEED_TRAFICO.articulos.find((a) => a.id === velocidad.infraccion.articuloId);
    expect(artVel!.numero).toBe('379.1');
    expect(velocidad.infraccion.textoBoletin).toMatch(/60 km\/h|80 km\/h/);
    expect(velocidad.infraccion.textoBoletin.toLowerCase()).toMatch(/atestado/);

    const sinPermiso = find('del-conduccion-sin-permiso')!;
    const artSp = SEED_TRAFICO.articulos.find((a) => a.id === sinPermiso.infraccion.articuloId);
    expect(artSp!.numero).toBe('384');
    // Los tres supuestos del art. 384 CP y la frontera con el art. 77 LSV administrativo.
    expect(sinPermiso.infraccion.textoBoletin.toLowerCase()).toMatch(/art\. 77 lsv/i);
    expect(sinPermiso.infraccion.penaTexto).toMatch(/384/);
  });
});

describe('SEED_TRAFICO: transporte pesado (LOTT, marco transporte)', () => {
  // Solo LOTT: exceso de masa y ADR. La mala estiba (`inf-sujecion-carga`) se modela por la vía de
  // circulación (marco `trafico`), no por transporte (revisor jurídico: RGC art. 14 → LSV grave 200 €).
  const idsTransporte = ['inf-exceso-mma', 'inf-adr-mercancias-peligrosas'];

  it('cada una es administrativa del marco transporte, con inmovilización y horquilla', () => {
    for (const id of idsTransporte) {
      const item = SEED_TRAFICO.infracciones.find((i) => i.infraccion.id === id);
      expect(item, id).toBeDefined();
      expect(item!.infraccion.tipo, id).toBe('administrativa');
      expect(item!.marcoImporte, id).toBe('transporte');
      // Medida operativa determinante: inmovilización/precinto, con lenguaje orientativo.
      const inmov = item!.consecuencias.find((c) => c.tipo === 'inmovilizacion');
      expect(inmov, id).toBeDefined();
      expect(inmov!.textoCorto.toLowerCase(), id).toMatch(/procede|puede/);
      // Importe como HORQUILLA (no cifra fija): importeMaxEur presente y >= mínimo.
      expect(item!.infraccion.importeMaxEur, id).not.toBeNull();
      expect(item!.infraccion.importeMaxEur!, id).toBeGreaterThanOrEqual(item!.infraccion.importeEur!);
    }
  });

  it('sus importes caen en el rango legal del marco transporte', () => {
    for (const id of idsTransporte) {
      const item = SEED_TRAFICO.infracciones.find((i) => i.infraccion.id === id)!;
      expect(validarImporte(item.infraccion, 'transporte'), id).toEqual([]);
    }
  });
});

describe('SEED_TRAFICO: carga mal estibada (circulación, marco trafico)', () => {
  it('es infracción de circulación grave con cifra fija (no horquilla de transporte)', () => {
    const item = SEED_TRAFICO.infracciones.find((i) => i.infraccion.id === 'inf-sujecion-carga');
    expect(item).toBeDefined();
    expect(item!.infraccion.tipo).toBe('administrativa');
    expect(item!.marcoImporte).toBe('trafico');
    expect(item!.infraccion.gravedad).toBe('grave');
    // Cifra fija (con pronto pago), NO horquilla de transporte.
    expect(item!.infraccion.importeMaxEur).toBeNull();
    expect(item!.infraccion.importeEur).toBe(200);
    expect(item!.infraccion.importeReducidoEur).toBe(100);
    // Sigue llevando la inmovilización orientativa hasta la reestiba.
    const inmov = item!.consecuencias.find((c) => c.tipo === 'inmovilizacion');
    expect(inmov).toBeDefined();
    expect(validarImporte(item!.infraccion, 'trafico')).toEqual([]);
  });
});

describe('SEED_TRAFICO: los sinónimos clave resuelven a su ficha', () => {
  // Sinónimos que el buscador debe llevar a la ficha correcta. Comprobamos que la ficha OWNER
  // lleva el término. NOTA: «conducir sin puntos» es un término AMBIGUO que también sembró la
  // administrativa `inf-sin-permiso` (art. 77 LSV): es correcto que surja en ambas (el agente
  // decide si perdió todos los puntos —delito 384— o solo caducó), por eso aquí verificamos
  // PERTENENCIA, no exclusividad.
  const owner = (id: string) =>
    SEED_TRAFICO.infracciones.find((i) => i.infraccion.id === id)!.sinonimos.map((s) => s.termino);

  it.each([
    ['iba a 200', 'del-velocidad-penal'],
    ['conducir sin puntos', 'del-conduccion-sin-permiso'],
    ['sobrecargado', 'inf-exceso-mma'],
    ['carga suelta', 'inf-sujecion-carga'],
    ['adr', 'inf-adr-mercancias-peligrosas'],
  ])('«%s» pertenece a %s', (termino, id) => {
    expect(owner(id)).toContain(termino);
  });

  // Los términos NUEVOS y específicos de cada ficha SÍ son exclusivos (no los duplica otra ficha).
  it.each([
    ['iba a 200', 'del-velocidad-penal'],
    ['384', 'del-conduccion-sin-permiso'],
    ['sobrecargado', 'inf-exceso-mma'],
    ['carga suelta', 'inf-sujecion-carga'],
    ['adr', 'inf-adr-mercancias-peligrosas'],
  ])('«%s» es exclusivo de %s', (termino, id) => {
    const duenos = SEED_TRAFICO.infracciones
      .filter((i) => i.sinonimos.some((s) => s.termino === termino))
      .map((i) => i.infraccion.id);
    expect(duenos).toEqual([id]);
  });
});

describe('SEED_TRAFICO: ampliación del catálogo de calle (14 conductas nuevas)', () => {
  const find = (id: string) => SEED_TRAFICO.infracciones.find((i) => i.infraccion.id === id);

  // Las 14 fichas añadidas para que ningún sub-tema (conducta, estado, señales, docs) quede a 1.
  const IDS_NUEVAS = [
    'inf-sin-senalizar-maniobra',
    'inf-carril-reservado',
    'inf-distancia-seguridad',
    'inf-claxon-indebido',
    'inf-circular-arcen',
    'inf-marcha-atras-indebida',
    'inf-lunas-tintadas',
    'inf-escape-ruido',
    'inf-luces-no-homologadas',
    'inf-parada-lugar-peligroso',
    'inf-stop-ceda-el-paso',
    'inf-prioridad-peatones',
    'inf-sin-documentacion',
    'inf-auriculares-conduciendo',
  ];

  it('las 14 existen, son administrativas y quedan pendientes de revisión con nota', () => {
    for (const id of IDS_NUEVAS) {
      const item = find(id);
      expect(item, id).toBeDefined();
      expect(item!.infraccion.tipo, id).toBe('administrativa');
      expect(item!.revision, id).toBe('pendiente_revision');
      expect(item!.notaRevision.length, id).toBeGreaterThan(0);
    }
  });

  it('todas validan su importe en el marco tráfico (grave = 200 €, leve ≤ 100 €)', () => {
    for (const id of IDS_NUEVAS) {
      const item = find(id)!;
      expect(validarImporte(item.infraccion, item.marcoImporte), id).toEqual([]);
      expect(validarMinimosPublicacion(item.infraccion, item.sinonimos.length), id).toEqual([]);
    }
  });

  it('citan su artículo del RGC/RGV sembrado (fuente visible en la ficha)', () => {
    const idsArt = new Set(SEED_TRAFICO.articulos.map((a) => a.id));
    for (const id of IDS_NUEVAS) {
      expect(idsArt.has(find(id)!.infraccion.articuloId), id).toBe(true);
    }
  });

  // Cada ficha nueva debe resolver por su término clave, y ese término no puede colisionar con
  // ninguna otra ficha (buscador sin ruido). Son los términos de calle que el agente teclea.
  it.each([
    ['sin intermitente', 'inf-sin-senalizar-maniobra'],
    ['carril vao', 'inf-carril-reservado'],
    ['distancia de seguridad', 'inf-distancia-seguridad'],
    ['pitar sin motivo', 'inf-claxon-indebido'],
    ['circular por el arcen', 'inf-circular-arcen'],
    ['marcha atras en autovia', 'inf-marcha-atras-autopista'],
    ['lunas tintadas', 'inf-lunas-tintadas'],
    ['escape libre', 'inf-escape-ruido'],
    ['neones', 'inf-luces-no-homologadas'],
    ['parado en curva', 'inf-parada-lugar-peligroso'],
    ['se salto el stop', 'inf-stop-ceda-el-paso'],
    ['no cedio el paso al peaton', 'inf-prioridad-peatones'],
    ['sin la documentacion', 'inf-sin-documentacion'],
    ['airpods', 'inf-auriculares-conduciendo'],
  ])('«%s» resuelve SOLO a %s', (termino, id) => {
    const duenos = SEED_TRAFICO.infracciones
      .filter((i) => i.sinonimos.some((s) => s.termino === termino))
      .map((i) => i.infraccion.id);
    expect(duenos).toEqual([id]);
  });

  it('auriculares es GRAVE con 3 puntos (art. 18.2 RGC, dato confirmado)', () => {
    const item = find('inf-auriculares-conduciendo')!;
    expect(item.infraccion.gravedad).toBe('grave');
    expect(item.infraccion.importeEur).toBe(200);
    expect(item.infraccion.puntos).toBe(3);
  });

  it('el claxon y la documentación son LEVES (≤ 100 €) — no todo es 200 €', () => {
    for (const id of ['inf-claxon-indebido', 'inf-sin-documentacion']) {
      const item = find(id)!;
      expect(item.infraccion.gravedad, id).toBe('leve');
      expect(item.infraccion.importeEur!, id).toBeLessThanOrEqual(100);
    }
  });
});

describe('SEED_TRAFICO: OLA 2 del submenú Transporte (LOTT, marco transporte)', () => {
  const find = (id: string) => SEED_TRAFICO.infracciones.find((i) => i.infraccion.id === id);

  // Las 12 fichas nuevas del submenú Transporte (título habilitante, viajeros, escolar, ADR,
  // perecederas, documentación/visado y tacógrafo documental). NO duplican las de
  // Ola 1 (`inf-tacografo`, `inf-exceso-mma`, `inf-adr-mercancias-peligrosas`).
  const IDS_OLA2 = [
    'inf-transporte-sin-titulo',
    'inf-transporte-privado-excede',
    'inf-viajeros-sin-autorizacion',
    'inf-viajeros-exceso-plazas',
    'inf-viajeros-sin-billete',
    'inf-transporte-escolar',
    'inf-adr-documentacion',
    'inf-adr-conductor-formacion',
    'inf-perecederas-atp',
    'inf-documentacion-control',
    'inf-visado-transporte',
    'inf-tacografo-sin-registros',
  ];

  it('las 12 existen, son administrativas del marco transporte y quedan pendientes de revisión', () => {
    for (const id of IDS_OLA2) {
      const item = find(id);
      expect(item, id).toBeDefined();
      expect(item!.infraccion.tipo, id).toBe('administrativa');
      expect(item!.marcoImporte, id).toBe('transporte');
      expect(item!.revision, id).toBe('pendiente_revision');
      expect(item!.notaRevision.length, id).toBeGreaterThan(0);
      // La nota debe marcar explícitamente qué queda "a verificar" (apartado/gravedad/horquilla).
      expect(item!.notaRevision.toUpperCase(), id).toContain('A VERIFICAR');
    }
  });

  it('todas son HORQUILLA del tramo (importeMaxEur ≥ importeEur), sin puntos DGT ni pronto pago', () => {
    for (const id of IDS_OLA2) {
      const item = find(id)!;
      expect(item.infraccion.importeMaxEur, id).not.toBeNull();
      expect(item.infraccion.importeMaxEur!, id).toBeGreaterThanOrEqual(item.infraccion.importeEur!);
      // El transporte LOTT no detrae puntos DGT ni se modela con pronto pago.
      expect(item.infraccion.puntos, id).toBeNull();
      expect(item.infraccion.importeReducidoEur, id).toBeNull();
    }
  });

  it('sus importes caen en el rango legal del marco transporte (100–6.000 €) y superan mínimos', () => {
    for (const id of IDS_OLA2) {
      const item = find(id)!;
      expect(validarImporte(item.infraccion, 'transporte'), id).toEqual([]);
      expect(validarMinimosPublicacion(item.infraccion, item.sinonimos.length), id).toEqual([]);
    }
  });

  it('citan un artículo de la LOTT sembrado (fuente visible en la ficha)', () => {
    for (const id of IDS_OLA2) {
      const articulo = SEED_TRAFICO.articulos.find((a) => a.id === find(id)!.infraccion.articuloId);
      expect(articulo, id).toBeDefined();
      expect(articulo!.normaId, id).toBe('BOE-A-1987-17803');
    }
  });

  // Cada ficha nueva resuelve por su término de calle, sin colisionar con NINGUNA otra ficha
  // (incluidas las de transporte de Ola 1). Son los términos que el agente teclea en el buscador.
  it.each([
    ['sin tarjeta de transporte', 'inf-transporte-sin-titulo'],
    ['transporte privado ilegal', 'inf-transporte-privado-excede'],
    ['autobus sin licencia', 'inf-viajeros-sin-autorizacion'],
    ['exceso de viajeros', 'inf-viajeros-exceso-plazas'],
    ['sin hojas de reclamacion', 'inf-viajeros-sin-billete'],
    ['escolar sin acompañante', 'inf-transporte-escolar'],
    ['sin instrucciones escritas adr', 'inf-adr-documentacion'],
    ['sin certificado adr', 'inf-adr-conductor-formacion'],
    ['camion de perecederas sin atp', 'inf-perecederas-atp'],
    ['no exhibe la tarjeta de transporte', 'inf-documentacion-control'],
    ['visado caducado', 'inf-visado-transporte'],
    ['sin hojas del tacografo', 'inf-tacografo-sin-registros'],
  ])('«%s» resuelve SOLO a %s (sin colisión con Ola 1)', (termino, id) => {
    const duenos = SEED_TRAFICO.infracciones
      .filter((i) => i.sinonimos.some((s) => s.termino === termino))
      .map((i) => i.infraccion.id);
    expect(duenos).toEqual([id]);
  });

  it('las que precintan/inmovilizan llevan la consecuencia con lenguaje orientativo', () => {
    // Título, viajeros sin autorización, escolar y ADR llevan inmovilización/precinto.
    for (const id of [
      'inf-transporte-sin-titulo',
      'inf-viajeros-sin-autorizacion',
      'inf-transporte-escolar',
      'inf-adr-conductor-formacion',
    ]) {
      const inmov = find(id)!.consecuencias.find((c) => c.tipo === 'inmovilizacion');
      expect(inmov, id).toBeDefined();
      expect(inmov!.textoCorto.toLowerCase(), id).toMatch(/procede|puede/);
      expect(inmov!.textoCorto.toLowerCase(), id).not.toMatch(/\bdeten\b|\bdetén\b/);
    }
  });

  it('las variantes NO duplican las de Ola 1 (ids distintos, artículos distintos)', () => {
    // Tacógrafo y ADR de Ola 2 usan artículos LOTT propios (numero distinto),
    // no los de las fichas de Ola 1.
    const ola1 = ['inf-tacografo', 'inf-exceso-mma', 'inf-adr-mercancias-peligrosas'];
    for (const id of ola1) {
      expect(IDS_OLA2, id).not.toContain(id);
    }
    const artOla2 = new Set(IDS_OLA2.map((id) => find(id)!.infraccion.articuloId));
    for (const id of ola1) {
      expect(artOla2.has(find(id)!.infraccion.articuloId), id).toBe(false);
    }
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
