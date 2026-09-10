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

  it('una ficha sin guía asociada devuelve null', () => {
    expect(guiaRelacionadaDe('inf-exceso-velocidad')).toBeNull();
    expect(guiaRelacionadaDe('no-existe')).toBeNull();
  });
});
