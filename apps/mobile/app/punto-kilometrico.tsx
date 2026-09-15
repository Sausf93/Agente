import { PuntoKilometricoScreen } from '@/features/puntoKilometrico/PuntoKilometricoScreen';

/**
 * Ruta "PUNTO KILOMÉTRICO" (`/punto-kilometrico`), desde "Más": ayudante manual para componer la
 * localización de una intervención en carretera y copiarla al atestado. El mapa y el p.k. automático
 * (con datos de carreteras) llegarán más adelante.
 */
export default function PuntoKilometricoRoute() {
  return <PuntoKilometricoScreen />;
}
