import type { EstadoFeedback } from '@agente/shared';
import type { BadgeTone } from '@/ui/components/Badge';

/**
 * Mapea el estado de una aportación al tono del `Badge` (color + SIEMPRE texto, regla 02-ui §2.4):
 *  - `enviada` (registrada) → info; `en_estudio` → warning; `aplicada` → success; `descartada` → neutral.
 *
 * Solo `import type` (se borra en runtime): el módulo queda puro y no arrastra React Native, así
 * lo pueden usar las pantallas sin acoplar la lógica pura de `serialize.ts` al sistema visual.
 */
export function estadoBadgeTone(estado: EstadoFeedback): BadgeTone {
  switch (estado) {
    case 'enviada':
      return 'info';
    case 'en_estudio':
      return 'warning';
    case 'aplicada':
      return 'success';
    case 'descartada':
      return 'neutral';
  }
}
