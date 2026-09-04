/**
 * Cliente de la API de datos abiertos del BOE (legislación consolidada).
 *
 * Fuente PRIMARIA oficial (regla no negociable de `LEGAL-PLAGIO-Y-RESPONSABILIDAD.md`):
 * el contenido se ingiere del BOE, nunca de la app competidora.
 *
 * Endpoints (verificados contra la API real, septiembre 2026):
 *   - Texto consolidado:  GET /legislacion-consolidada/id/{id}/texto
 *   - Metadatos:          GET /legislacion-consolidada/id/{id}/metadatos
 * Ambos devuelven XML envuelto en `<response><status>...<data>...`.
 *
 * El cliente está AISLADO de la red mediante `fetchImpl` inyectable: los tests no
 * descargan nada (usan fixtures); solo el CLI hace la descarga real.
 */

/** Firma mínima de fetch que necesita el cliente (inyectable para test sin red). */
export type FetchImpl = (
  url: string,
  init?: { signal?: AbortSignal; headers?: Record<string, string> },
) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

export interface BoeClientOptions {
  /** Base de la API. Por defecto la oficial del BOE. */
  baseUrl?: string;
  /** Implementación de fetch (por defecto el `fetch` global de Node ≥ 18). */
  fetchImpl?: FetchImpl;
  /** Tiempo máximo por petición en milisegundos (por defecto 30 s). */
  timeoutMs?: number;
}

const BASE_URL_POR_DEFECTO = 'https://www.boe.es/datosabiertos/api';
const TIMEOUT_POR_DEFECTO_MS = 30_000;

/** Error de red o de protocolo al hablar con el BOE. */
export class BoeClientError extends Error {
  constructor(
    message: string,
    readonly detalle?: { url?: string; status?: number; causa?: unknown },
  ) {
    super(message);
    this.name = 'BoeClientError';
  }
}

/** Identificador BOE de una norma, p. ej. "BOE-A-2003-23514" (RGC). */
const RE_ID_BOE = /^BOE-[A-Z]-\d{4}-\d+$/;

export class BoeClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchImpl;
  private readonly timeoutMs: number;

  constructor(options: BoeClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? BASE_URL_POR_DEFECTO).replace(/\/$/, '');
    this.timeoutMs = options.timeoutMs ?? TIMEOUT_POR_DEFECTO_MS;
    const fetchImpl = options.fetchImpl ?? (globalThis.fetch as FetchImpl | undefined);
    if (!fetchImpl) {
      throw new BoeClientError(
        'No hay implementación de fetch disponible; pásala en `fetchImpl` (entorno sin fetch global)',
      );
    }
    this.fetchImpl = fetchImpl;
  }

  /** Descarga el XML del TEXTO consolidado de una norma por su identificador BOE. */
  async fetchTextoConsolidado(idBoe: string): Promise<string> {
    return this.get(`${this.rutaNorma(idBoe)}/texto`);
  }

  /** Descarga el XML de METADATOS de una norma (título, fecha de consolidación, ELI…). */
  async fetchMetadatos(idBoe: string): Promise<string> {
    return this.get(`${this.rutaNorma(idBoe)}/metadatos`);
  }

  private rutaNorma(idBoe: string): string {
    if (!RE_ID_BOE.test(idBoe)) {
      throw new BoeClientError(`Identificador BOE inválido: "${idBoe}"`);
    }
    return `${this.baseUrl}/legislacion-consolidada/id/${idBoe}`;
  }

  private async get(url: string): Promise<string> {
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), this.timeoutMs);
    try {
      const respuesta = await this.fetchImpl(url, {
        signal: controlador.signal,
        headers: { Accept: 'application/xml' },
      });
      if (!respuesta.ok) {
        throw new BoeClientError(`El BOE respondió ${respuesta.status}`, {
          url,
          status: respuesta.status,
        });
      }
      return await respuesta.text();
    } catch (causa) {
      if (causa instanceof BoeClientError) throw causa;
      const abortada = causa instanceof Error && causa.name === 'AbortError';
      throw new BoeClientError(
        abortada
          ? `Tiempo de espera agotado (${this.timeoutMs} ms)`
          : 'Fallo de red al descargar del BOE',
        { url, causa },
      );
    } finally {
      clearTimeout(temporizador);
    }
  }
}
