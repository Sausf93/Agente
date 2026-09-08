import { describe, expect, it } from 'vitest';
import { reportarErrorFichaLink } from './reportarError';

describe('reportarErrorFichaLink', () => {
  it('apunta a la ruta de alta de feedback', () => {
    expect(reportarErrorFichaLink('seed-alcoholemia').pathname).toBe('/feedback');
  });

  it('prerrellena el tipo como error_contenido', () => {
    expect(reportarErrorFichaLink('seed-alcoholemia').params.tipo).toBe('error_contenido');
  });

  it('propaga el id de la infracción y compone la pantalla de origen', () => {
    const { params } = reportarErrorFichaLink('seed-alcoholemia');
    expect(params.infraccionId).toBe('seed-alcoholemia');
    expect(params.pantalla).toBe('ficha:seed-alcoholemia');
  });

  it('no inventa contexto para ids distintos (pantalla derivada del id)', () => {
    expect(reportarErrorFichaLink('otra-123').params.pantalla).toBe('ficha:otra-123');
  });
});
