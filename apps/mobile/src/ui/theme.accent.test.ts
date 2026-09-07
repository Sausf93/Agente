import { describe, expect, it } from 'vitest';
import {
  accentByCuerpo,
  accentDefault,
  accentKeyFor,
  accentKeyFromCuerpo,
  darkTheme,
  lightTheme,
  mixHex,
  resolveTheme,
} from './theme';

/**
 * Resolución del tema ACTIVO = mode (claro/oscuro) × cuerpo (sistema visual v2, §1).
 * El acento sustituye el rol de `brand`; la gravedad y los neutros NO cambian con el cuerpo.
 */
describe('accentKeyFromCuerpo', () => {
  it('mapea cada cuerpo del dominio a su clave de acento', () => {
    expect(accentKeyFromCuerpo('guardia_civil')).toBe('guardiaCivil');
    expect(accentKeyFromCuerpo('policia_nacional')).toBe('policiaNacional');
    expect(accentKeyFromCuerpo('policia_local')).toBe('policiaLocal');
    expect(accentKeyFromCuerpo('policia_autonomica')).toBe('autonomica');
  });

  it('sin cuerpo (null/undefined) devuelve null → marca neutra por defecto', () => {
    expect(accentKeyFromCuerpo(null)).toBeNull();
    expect(accentKeyFromCuerpo(undefined)).toBeNull();
  });

  it('policia_autonomica (sin subtipo) mapea al genérico', () => {
    expect(accentKeyFromCuerpo('policia_autonomica')).toBe('autonomica');
  });
});

describe('accentKeyFor (cuerpo × autonómica concreta)', () => {
  it('mapea cada autonómica concreta a su clave de acento propia', () => {
    expect(accentKeyFor('policia_autonomica', 'mossos')).toBe('autonomicaMossos');
    expect(accentKeyFor('policia_autonomica', 'ertzaintza')).toBe('autonomicaErtzaintza');
    expect(accentKeyFor('policia_autonomica', 'policia_foral')).toBe('autonomicaForal');
    expect(accentKeyFor('policia_autonomica', 'policia_canaria')).toBe('autonomicaCanaria');
  });

  it('autonómica sin subtipo cae al genérico', () => {
    expect(accentKeyFor('policia_autonomica', null)).toBe('autonomica');
  });

  it('para el resto de cuerpos ignora el subtipo autonómico', () => {
    expect(accentKeyFor('guardia_civil', 'mossos')).toBe('guardiaCivil');
    expect(accentKeyFor(null, 'mossos')).toBeNull();
  });
});

describe('mixHex', () => {
  it('devuelve el primer color con ratio 1 y el segundo con ratio 0', () => {
    expect(mixHex('#2E6A4E', '#FFFFFF', 1)).toBe('#2E6A4E');
    expect(mixHex('#2E6A4E', '#FFFFFF', 0)).toBe('#FFFFFF');
  });

  it('mezcla a mitad de camino', () => {
    // (0x00+0xFF)/2 = 127.5 → 128 = 0x80 en cada canal.
    expect(mixHex('#000000', '#FFFFFF', 0.5)).toBe('#808080');
  });

  it('recorta ratios fuera de [0,1]', () => {
    expect(mixHex('#123456', '#FFFFFF', 2)).toBe('#123456');
    expect(mixHex('#123456', '#FFFFFF', -1)).toBe('#FFFFFF');
  });
});

describe('resolveTheme (mode × cuerpo)', () => {
  it('sin cuerpo usa el acento por defecto (marca neutra) en cada modo', () => {
    const claro = resolveTheme('light', null);
    expect(claro.mode).toBe('light');
    expect(claro.color.brand).toBe(accentDefault.light.accent);
    expect(claro.color.accent).toBe(accentDefault.light.accent);
    expect(claro.color.accentOn).toBe(accentDefault.light.on);

    const oscuro = resolveTheme('dark', null);
    expect(oscuro.color.brand).toBe(accentDefault.dark.accent);
  });

  it('sobrescribe brand/focusRing/textOnBrand con el acento del cuerpo', () => {
    const gc = resolveTheme('light', 'guardia_civil');
    expect(gc.color.brand).toBe(accentByCuerpo.guardiaCivil.light.accent);
    expect(gc.color.brandPressed).toBe(accentByCuerpo.guardiaCivil.light.pressed);
    expect(gc.color.textOnBrand).toBe(accentByCuerpo.guardiaCivil.light.on);
    expect(gc.color.focusRing).toBe(accentByCuerpo.guardiaCivil.light.accent);
    expect(gc.color.accent).toBe(accentByCuerpo.guardiaCivil.light.accent);
  });

  it('el acento se aclara en modo oscuro (distinto del claro)', () => {
    const claro = resolveTheme('light', 'policia_nacional');
    const oscuro = resolveTheme('dark', 'policia_nacional');
    expect(oscuro.color.accent).not.toBe(claro.color.accent);
    expect(oscuro.color.accent).toBe(accentByCuerpo.policiaNacional.dark.accent);
  });

  it('calcula accentWeak como mezcla del acento con la superficie', () => {
    const gc = resolveTheme('light', 'guardia_civil');
    const esperado = mixHex(accentByCuerpo.guardiaCivil.light.accent, lightTheme.color.surface, 0.14);
    expect(gc.color.accentWeak).toBe(esperado);
  });

  it('sin autonómica concreta usa el violeta genérico', () => {
    // Fallback: cuerpo autonómico elegido pero aún sin subtipo → acento genérico.
    expect(resolveTheme('light', 'policia_autonomica').color.accent).toBe(
      accentByCuerpo.autonomica.light.accent,
    );
    expect(resolveTheme('light', 'policia_autonomica', null).color.accent).toBe(
      accentByCuerpo.autonomica.light.accent,
    );
  });

  it('cada cuerpo autonómico concreto tiene su propio matiz de acento', () => {
    expect(resolveTheme('light', 'policia_autonomica', 'mossos').color.accent).toBe(
      accentByCuerpo.autonomicaMossos.light.accent,
    );
    expect(resolveTheme('light', 'policia_autonomica', 'ertzaintza').color.accent).toBe(
      accentByCuerpo.autonomicaErtzaintza.light.accent,
    );
    expect(resolveTheme('dark', 'policia_autonomica', 'policia_foral').color.accent).toBe(
      accentByCuerpo.autonomicaForal.dark.accent,
    );
    expect(resolveTheme('light', 'policia_autonomica', 'policia_canaria').color.accent).toBe(
      accentByCuerpo.autonomicaCanaria.light.accent,
    );
  });

  it('las cuatro autonómicas concretas tienen acentos distintos entre sí', () => {
    const acentos = (['mossos', 'ertzaintza', 'policia_foral', 'policia_canaria'] as const).map(
      (a) => resolveTheme('light', 'policia_autonomica', a).color.accent,
    );
    expect(new Set(acentos).size).toBe(4);
  });

  it('la autonómica concreta NO altera la gravedad ni los neutros', () => {
    const mossos = resolveTheme('light', 'policia_autonomica', 'mossos');
    expect(mossos.severity).toEqual(lightTheme.severity);
    expect(mossos.color.bg).toBe(lightTheme.color.bg);
    expect(mossos.color.surface).toBe(lightTheme.color.surface);
    expect(mossos.color.textPrimary).toBe(lightTheme.color.textPrimary);
  });

  it('la GRAVEDAD NO cambia con el cuerpo (mismos HEX que el tema base)', () => {
    for (const cuerpo of ['guardia_civil', 'policia_nacional', 'policia_local', 'policia_autonomica'] as const) {
      const tema = resolveTheme('light', cuerpo);
      expect(tema.severity).toEqual(lightTheme.severity);
      const oscuro = resolveTheme('dark', cuerpo);
      expect(oscuro.severity).toEqual(darkTheme.severity);
    }
  });

  it('los neutros de fondo/superficie/texto NO cambian con el cuerpo', () => {
    const gc = resolveTheme('light', 'guardia_civil');
    expect(gc.color.bg).toBe(lightTheme.color.bg);
    expect(gc.color.surface).toBe(lightTheme.color.surface);
    expect(gc.color.textPrimary).toBe(lightTheme.color.textPrimary);
  });
});
