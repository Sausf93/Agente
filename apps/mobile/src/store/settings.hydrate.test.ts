import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * ROBUSTEZ DE PRIMER ARRANQUE (bloqueante para la beta): si al hidratar el perfil falla la
 * base local del usuario (crear/migrar `user.db` en la primera apertura), `hydrate` NO debe
 * rechazar ni dejar `loaded` en false: eso congelaría la splash para siempre (la splash solo se
 * oculta cuando `loaded === true`). Debe entrar con el estado por defecto y `loaded: true`.
 */

// `userDb` importa `expo-sqlite` (módulo nativo): se mockea entero para poder testear en Node.
vi.mock('@/db/userDb', () => ({
  loadPerfil: vi.fn(),
  getAppFlag: vi.fn(),
  savePerfil: vi.fn(),
  setAppFlag: vi.fn(),
}));

import { getAppFlag, loadPerfil } from '@/db/userDb';
import { useSettingsStore } from './settings';

describe('settings · hydrate (robustez de primer arranque)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Estado de partida: sin hidratar (como en un arranque en frío).
    useSettingsStore.setState({
      cuerpo: null,
      policiaAutonomica: null,
      ccaaId: null,
      provinciaId: null,
      municipioId: null,
      municipioNombre: null,
      tema: 'system',
      onboarded: false,
      loaded: false,
      hapticsEnabled: true,
    });
  });

  it('si loadPerfil RECHAZA (fallo al migrar user.db), hydrate NO rechaza y deja loaded=true', async () => {
    vi.mocked(loadPerfil).mockRejectedValue(new Error('no se pudo migrar user.db'));
    vi.mocked(getAppFlag).mockResolvedValue(null);

    // No rechaza: mejor entrar sin perfil que congelar la splash.
    await expect(useSettingsStore.getState().hydrate()).resolves.toBeUndefined();

    const s = useSettingsStore.getState();
    expect(s.loaded).toBe(true); // la splash SÍ se podrá ocultar
    // Estado por defecto: entra sin perfil y el onboarding se encargará.
    expect(s.onboarded).toBe(false);
    expect(s.cuerpo).toBeNull();
    expect(s.hapticsEnabled).toBe(true);
  });

  it('si getAppFlag RECHAZA, hydrate tampoco cuelga: loaded=true con estado por defecto', async () => {
    vi.mocked(loadPerfil).mockResolvedValue(null);
    vi.mocked(getAppFlag).mockRejectedValue(new Error('user.db bloqueada'));

    await expect(useSettingsStore.getState().hydrate()).resolves.toBeUndefined();
    expect(useSettingsStore.getState().loaded).toBe(true);
  });

  it('ruta feliz intacta: refleja el perfil cargado y sus flags, con loaded=true', async () => {
    vi.mocked(loadPerfil).mockResolvedValue({
      cuerpo: 'guardia_civil',
      policiaAutonomica: null,
      ccaaId: 'es-ccaa-05',
      provinciaId: null,
      municipioId: null,
      municipioNombre: null,
      tema: 'dark',
      onboarded: true,
    });
    vi.mocked(getAppFlag).mockResolvedValue('0'); // háptica desactivada explícitamente

    await useSettingsStore.getState().hydrate();

    const s = useSettingsStore.getState();
    expect(s.loaded).toBe(true);
    expect(s.cuerpo).toBe('guardia_civil');
    expect(s.tema).toBe('dark');
    expect(s.onboarded).toBe(true);
    expect(s.hapticsEnabled).toBe(false);
  });
});
