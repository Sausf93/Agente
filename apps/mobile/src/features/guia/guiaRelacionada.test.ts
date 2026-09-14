import { describe, expect, it } from 'vitest';
import { guiaRelacionadaDe } from './guiaRelacionada';

/**
 * El enlace ficha → guía es el que hace que una búsqueda de calle acabe en la guía escaneable. Si un
 * cambio rompiera el mapa (id de ficha renombrado, guía movida), estas búsquedas dejarían de saltar.
 */
describe('guiaRelacionadaDe', () => {
  it('las fichas de identificación/cacheo/negativa enlazan a la guía de identificación', () => {
    for (const id of ['sc-identificacion-requerimiento', 'sc-cacheo-registro', 'sc-negativa-identificarse']) {
      expect(guiaRelacionadaDe(id)?.ruta).toBe('/guia-identificacion');
    }
  });

  it('las fichas de alcoholemia enlazan a la guía de alcoholemia', () => {
    for (const id of ['inf-alcoholemia', 'del-alcoholemia-penal', 'inf-negativa-prueba']) {
      expect(guiaRelacionadaDe(id)?.ruta).toBe('/guia-alcoholemia');
    }
  });

  it('la ficha del régimen del menor enlaza a la guía de menores', () => {
    expect(guiaRelacionadaDe('sc-menor-regimen')?.ruta).toBe('/guia-menores');
  });

  it('la ficha MENA enlaza a la guía de menores (más específica que la de extranjería)', () => {
    // sc-mena-consulta la declaran ambas guías; la precedencia deja ganar a la de menores.
    expect(guiaRelacionadaDe('sc-mena-consulta')?.ruta).toBe('/guia-menores');
  });

  it('las fichas de extranjería enlazan a la guía de extranjería', () => {
    for (const id of ['ext-estancia-irregular', 'ext-no-portar-documentacion']) {
      expect(guiaRelacionadaDe(id)?.ruta).toBe('/guia-extranjeria');
    }
  });

  it('las fichas de violencia de género enlazan a la guía de VG', () => {
    for (const id of ['del-violencia-genero', 'del-quebrantamiento']) {
      expect(guiaRelacionadaDe(id)?.ruta).toBe('/guia-violencia-genero');
    }
  });

  it('las fichas de ocupación enlazan a la guía de ocupación', () => {
    for (const id of ['del-allanamiento-morada', 'del-usurpacion', 'sc-ocupacion-inmueble']) {
      expect(guiaRelacionadaDe(id)?.ruta).toBe('/guia-ocupacion');
    }
  });

  it('una ficha sin guía asociada devuelve null', () => {
    expect(guiaRelacionadaDe('inf-exceso-velocidad')).toBeNull();
    expect(guiaRelacionadaDe('no-existe')).toBeNull();
  });
});
