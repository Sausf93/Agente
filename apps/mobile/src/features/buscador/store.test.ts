import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Robustez del store de BUSCAR: si la consulta LANZA (fallo del runner), el catch debe caer a
 * "nada exacto" —no a "Contenido no disponible"—. Antes el catch no tocaba `sinContenido`, así
 * que podía arrastrar un `true` anterior y mostrar el mensaje equivocado.
 */

// El runner del paquete vive tras `expo-*`: se mockea. En este test se fuerza a que RECHACE.
vi.mock('@/db/contentDb', () => ({ getContentRunner: vi.fn() }));
// `userDb` y `haptics` arrastran módulos nativos; se sustituyen por dobles inertes.
vi.mock('@/db/userDb', () => ({ recordSearchMiss: vi.fn() }));
vi.mock('@/ui/haptics', () => ({ hapticWarning: vi.fn() }));

import { getContentRunner } from '@/db/contentDb';
import { useBuscadorStore } from './store';

describe('buscador store · el catch resetea sinContenido', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBuscadorStore.setState({
      consulta: '',
      resultados: [],
      articulos: [],
      buscando: false,
      buscado: false,
      sinContenido: false,
    });
  });

  it('tras un estado con sinContenido=true, una búsqueda que lanza deja sinContenido=false y buscado=true', async () => {
    // Estado previo pegado (p. ej. un intento anterior en plataforma sin paquete).
    useBuscadorStore.setState({ sinContenido: true });
    vi.mocked(getContentRunner).mockRejectedValue(new Error('fallo al consultar el paquete'));

    await useBuscadorStore.getState().buscar('hurto');

    const s = useBuscadorStore.getState();
    expect(s.sinContenido).toBe(false); // "nada exacto", no "Contenido no disponible"
    expect(s.buscado).toBe(true);
    expect(s.buscando).toBe(false);
    expect(s.resultados).toEqual([]);
    expect(s.articulos).toEqual([]);
  });
});
