import { describe, expect, it, vi } from 'vitest';
import { BoeClient, BoeClientError, type FetchImpl } from './client.js';

/**
 * Tests del cliente BOE SIN RED: se inyecta un `fetchImpl` de mentira. Se comprueban
 * la construcción de URLs, la validación del identificador, y el manejo de errores y
 * timeouts (aislamiento exigido por el CLAUDE.md: los tests no dependen de la red).
 */

function fetchOk(cuerpo: string): { impl: FetchImpl; urls: string[] } {
  const urls: string[] = [];
  const impl: FetchImpl = async (url) => {
    urls.push(url);
    return { ok: true, status: 200, text: async () => cuerpo };
  };
  return { impl, urls };
}

describe('BoeClient — construcción de URLs', () => {
  it('usa el endpoint de texto consolidado por identificador', async () => {
    const { impl, urls } = fetchOk('<response/>');
    const cliente = new BoeClient({ fetchImpl: impl });
    await cliente.fetchTextoConsolidado('BOE-A-2003-23514');
    expect(urls[0]).toBe(
      'https://www.boe.es/datosabiertos/api/legislacion-consolidada/id/BOE-A-2003-23514/texto',
    );
  });

  it('usa el endpoint de metadatos por identificador', async () => {
    const { impl, urls } = fetchOk('<response/>');
    const cliente = new BoeClient({ fetchImpl: impl });
    await cliente.fetchMetadatos('BOE-A-2003-23514');
    expect(urls[0]).toBe(
      'https://www.boe.es/datosabiertos/api/legislacion-consolidada/id/BOE-A-2003-23514/metadatos',
    );
  });

  it('respeta un baseUrl personalizado', async () => {
    const { impl, urls } = fetchOk('<response/>');
    const cliente = new BoeClient({ fetchImpl: impl, baseUrl: 'https://example.test/api/' });
    await cliente.fetchTextoConsolidado('BOE-A-2003-23514');
    expect(urls[0]).toBe(
      'https://example.test/api/legislacion-consolidada/id/BOE-A-2003-23514/texto',
    );
  });
});

describe('BoeClient — validación y errores', () => {
  it('rechaza identificadores BOE inválidos', async () => {
    const { impl } = fetchOk('<response/>');
    const cliente = new BoeClient({ fetchImpl: impl });
    await expect(cliente.fetchTextoConsolidado('no-valido')).rejects.toBeInstanceOf(BoeClientError);
  });

  it('convierte respuestas no-OK en BoeClientError con el status', async () => {
    const impl: FetchImpl = async () => ({ ok: false, status: 404, text: async () => '' });
    const cliente = new BoeClient({ fetchImpl: impl });
    await expect(cliente.fetchMetadatos('BOE-A-2003-23514')).rejects.toMatchObject({
      name: 'BoeClientError',
      detalle: { status: 404 },
    });
  });

  it('aborta y reporta timeout si la petición tarda demasiado', async () => {
    vi.useFakeTimers();
    const impl: FetchImpl = (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const err = new Error('abortada');
          err.name = 'AbortError';
          reject(err);
        });
      });
    const cliente = new BoeClient({ fetchImpl: impl, timeoutMs: 50 });
    const promesa = cliente.fetchTextoConsolidado('BOE-A-2003-23514');
    const asercion = expect(promesa).rejects.toThrow(/Tiempo de espera agotado/);
    await vi.advanceTimersByTimeAsync(60);
    await asercion;
    vi.useRealTimers();
  });
});
