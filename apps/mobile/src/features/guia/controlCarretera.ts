/**
 * "CONTROL DE CARRETERA": checklist de un toque para un control en carretera (petición del GC de
 * Tráfico). Pensado para uso EN DIRECTO: el agente marca cada comprobación mientras la hace y abre
 * la ficha/guía de la que dude, sin teclear. Es NAVEGACIÓN + checklist efímero (no guarda estado ni
 * datos de terceros); todo el dato legal vive en las fichas del paquete o en la guía enlazada.
 */
export interface Comprobacion {
  id: string;
  label: string;
  /** Pista de una línea (qué mirar). */
  detalle?: string;
  /** Enlace: ficha del paquete (`fichaId`) o ruta directa (`ruta`, p. ej. la guía de alcoholemia). */
  fichaId?: string;
  ruta?: string;
}

export interface GrupoComprobacion {
  titulo: string;
  items: readonly Comprobacion[];
}

export const CONTROL_CARRETERA: readonly GrupoComprobacion[] = [
  {
    titulo: 'Conductor',
    items: [
      {
        id: 'permiso',
        label: 'Permiso de conducción',
        detalle: 'En vigor y de la clase adecuada',
        fichaId: 'inf-sin-permiso',
      },
      {
        id: 'alcohol',
        label: 'Alcohol y drogas',
        detalle: 'Prueba; ver tasas y frontera penal',
        ruta: '/guia-alcoholemia',
      },
      {
        id: 'cinturon',
        label: 'Cinturón, casco y sillita',
        detalle: 'Ocupantes y menores',
        fichaId: 'inf-sin-cinturon',
      },
      { id: 'movil', label: 'Uso del móvil o auriculares', fichaId: 'inf-movil-conduciendo' },
    ],
  },
  {
    titulo: 'Documentación del vehículo',
    items: [
      { id: 'seguro', label: 'Seguro obligatorio (SOA)', detalle: 'Vigente', fichaId: 'inf-sin-seguro' },
      { id: 'itv', label: 'ITV en vigor', fichaId: 'inf-itv-caducada' },
      {
        id: 'documentacion',
        label: 'Permiso de circulación y ficha técnica',
        fichaId: 'inf-sin-documentacion',
      },
      {
        id: 'matricula',
        label: 'Matrícula legible y sin alterar',
        fichaId: 'inf-matricula-oculta',
      },
    ],
  },
  {
    titulo: 'Estado del vehículo',
    items: [
      { id: 'alumbrado', label: 'Alumbrado y luces', fichaId: 'inf-alumbrado-deficiente' },
      { id: 'neumaticos', label: 'Neumáticos', fichaId: 'inf-neumaticos-mal-estado' },
    ],
  },
  {
    titulo: 'Transporte (si aplica)',
    items: [
      { id: 'tacografo', label: 'Tacógrafo y tiempos de conducción', fichaId: 'inf-tacografo' },
      { id: 'mma', label: 'Masa máxima y estiba de la carga', fichaId: 'inf-exceso-mma' },
      { id: 'adr', label: 'Mercancías peligrosas (ADR)', fichaId: 'inf-adr-mercancias-peligrosas' },
      {
        id: 'transporte',
        label: 'Tarjeta y documentación de transporte',
        fichaId: 'inf-documentacion-control',
      },
    ],
  },
];

/** Nº total de comprobaciones (para el indicador de progreso). */
export const TOTAL_COMPROBACIONES = CONTROL_CARRETERA.reduce((n, g) => n + g.items.length, 0);
