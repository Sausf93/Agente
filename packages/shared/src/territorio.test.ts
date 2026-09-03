import { describe, it, expect } from 'vitest';
import { cadenaTerritorial, esVisible, resolverVisibles, avisoCompetencia } from './territorio.js';

// Territorios de ejemplo (ids ficticios).
const MURCIA_CCAA = 'ccaa_murcia';
const MURCIA_PROV = 'prov_murcia';
const MURCIA_MUN = 'mun_murcia';
const CATALUNA_CCAA = 'ccaa_cataluna';

// Perfil de Policía Local de Murcia (ve estatal + Murcia + su municipio).
const perfilLocalMurcia = {
  cuerpo: 'policia_local' as const,
  ccaaId: MURCIA_CCAA,
  provinciaId: MURCIA_PROV,
  municipioId: MURCIA_MUN,
};

describe('cadenaTerritorial', () => {
  it('incluye CCAA, provincia y municipio; excluye lo estatal (null)', () => {
    expect(cadenaTerritorial(perfilLocalMurcia)).toEqual([MURCIA_CCAA, MURCIA_PROV, MURCIA_MUN]);
  });
  it('omite el municipio cuando no aplica (no Local)', () => {
    expect(
      cadenaTerritorial({ ccaaId: MURCIA_CCAA, provinciaId: MURCIA_PROV, municipioId: null }),
    ).toEqual([MURCIA_CCAA, MURCIA_PROV]);
  });
});

describe('esVisible', () => {
  const cadena = cadenaTerritorial(perfilLocalMurcia);
  it('lo estatal (null) siempre es visible', () => {
    expect(esVisible(null, cadena)).toBe(true);
  });
  it('lo de tu territorio es visible', () => {
    expect(esVisible(MURCIA_MUN, cadena)).toBe(true);
  });
  it('lo de otra comunidad no es visible', () => {
    expect(esVisible(CATALUNA_CCAA, cadena)).toBe(false);
  });
});

describe('resolverVisibles (desplazamiento de capas)', () => {
  const cadena = cadenaTerritorial(perfilLocalMurcia);

  it('filtra por territorio y oculta la estatal desplazada por una municipal', () => {
    const items = [
      { id: 'estatal_A', territorioId: null, desplazaId: null },
      { id: 'muni_A', territorioId: MURCIA_MUN, desplazaId: 'estatal_A' }, // sustituye a la estatal
      { id: 'cat_A', territorioId: CATALUNA_CCAA, desplazaId: null }, // de otra CCAA: no visible
      { id: 'estatal_B', territorioId: null, desplazaId: null }, // se mantiene
    ];
    const visibles = resolverVisibles(items, cadena).map((i) => i.id);
    expect(visibles).toContain('muni_A');
    expect(visibles).toContain('estatal_B');
    expect(visibles).not.toContain('estatal_A'); // desplazada
    expect(visibles).not.toContain('cat_A'); // otro territorio
  });

  it('sin desplazamiento, la autonómica solo AÑADE a la estatal', () => {
    const items = [
      { id: 'estatal_A', territorioId: null, desplazaId: null },
      { id: 'ccaa_A', territorioId: MURCIA_CCAA, desplazaId: null },
    ];
    expect(resolverVisibles(items, cadena).map((i) => i.id)).toEqual(['estatal_A', 'ccaa_A']);
  });
});

describe('avisoCompetencia (orientativo, no bloqueante)', () => {
  it('no avisa si la infracción es de tu competencia', () => {
    const inf = { competencia: { cuerpos: ['policia_local' as const], via: 'urbana' as const } };
    expect(avisoCompetencia(inf, perfilLocalMurcia)).toBeNull();
  });

  it('avisa por cuerpo si tu cuerpo no está en la competencia', () => {
    const inf = { competencia: { cuerpos: ['guardia_civil' as const], via: 'ambas' as const } };
    const aviso = avisoCompetencia(inf, perfilLocalMurcia);
    expect(aviso?.motivo).toBe('cuerpo');
  });

  it('avisa por vía interurbana a un local', () => {
    const inf = { competencia: { cuerpos: [], via: 'interurbana' as const } };
    const aviso = avisoCompetencia(inf, perfilLocalMurcia);
    expect(aviso?.motivo).toBe('via');
  });
});
