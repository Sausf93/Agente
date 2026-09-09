# Resumen de la conversación y del proyecto (para retomar sin perder el hilo)

Narrativa de todo lo trabajado con Claude hasta 2026-09-09. Para el estado operativo y los pasos
inmediatos, ver [`docs/ESTADO-HANDOFF.md`](./ESTADO-HANDOFF.md); para la paridad con SPPLB,
[`docs/paridad-spplb.md`](./paridad-spplb.md). Fuente de verdad del producto: `docs/ESPECIFICACION.md`.

## Qué estamos construyendo
"Agente" (dominio modoagente.es): app móvil de suscripción para TODOS los cuerpos de FCSE en España
(Guardia Civil, Policía Nacional, Local, Autonómica) que sustituye a la app SPPLB. Valor: normativa
offline siempre a mano, buscador que entiende el lenguaje de la calle, ficha con la CONSECUENCIA
primero, detención en lenguaje orientativo, lectura de derechos multilingüe con audio, cuadrante de
turnos y plantillas de documentos. Cofundador: Saulo (usuario) + un amigo Guardia Civil de Tráfico que
probará la beta en iPhone. Precio previsto 2,99 €/mes; primero beta gratis en TestFlight.

## Recorrido de la conversación (hitos)
1. **Contenido a fondo (batería de validación)**: se lanzó una batería de 6 validadores simulados
   (Local, GC, PN, Autonómica, QA, revisor jurídico) sobre toda la app. De ahí salieron rondas que ya
   están publicadas: chip de acción por marco, importe como horquilla (no cifra fija donde la ley da
   rango), honestidad de la capa autonómica/municipal ("solicítala"), orden único de coerción,
   protección de víctima fuera del banner verde, corrección 557.3 (LO 14/2022), y contenido nuevo penal
   y de convivencia (falsedad, sustracción, usurpación, allanamiento, socorro, armas, botellón, MENA,
   derechos de la víctima, cacheo/registro), todo validado por el revisor.
2. **Endurecimiento y pulido pre-beta**: se blindó el arranque (la splash ya no se congela; un fallo del
   `.db` no cuelga pantallas), se dio confianza al contenido ("Borrador beta" en vez de "En revisión"),
   se ocultó el micro que prometía voz, y se añadió "¿Ves algo mal? Avísanos" en la ficha (feedback con
   contexto para que el socio corrija el contenido).
3. **Decisión de negocio**: pagar el Apple Developer Program (99 €) para dar una beta seria en TestFlight
   al socio; el nombre ("Agente") y el icono son provisionales; empezar como cuenta Individual y
   transferir a sociedad si crece; en TestFlight NO se cobra (sandbox), así que la beta es gratis por
   diseño. Se dejó el andamiaje listo (bundle id neutro `es.modoagente.app`, icono V1 de agente con
   gorra lisa —validado como legal—, `eas.json`). El alta de Apple queda para cuando el usuario vea al
   socio (semana del 15-sep-2026).
4. **Audio de derechos** (expo-speech) y mejoras del **cuadrante** (hoy resaltado, nocturnas por franja).
5. **Rediseños de UX pedidos por el usuario**:
   - **Normas por MATERIA** (estilo SPPLB): eliges una materia y salen todas sus leyes; se acabó el
     cajón "Otras normas".
   - **Documentos ágil**: "Generar y enviarme" en un toque, bloque legal plegado, y genera el ACTA
     correcta (alcoholemia→acta de alcoholemia; inmoviliza/grúa→su acta).
   - **Detalles de peso**: al abrir la app ya no salta el teclado; se vuelve atrás deslizando de
     izquierda a derecha (ficha y leyes), no de arriba a abajo.
6. **Comparación con SPPLB (en marcha)**: el usuario ve que SPPLB parece "más completa" por su
   organización en submenús y su volumen de infracciones. Conclusión honesta: en texto legal ya tenemos
   MÁS (leyes completas del BOE) y en derechos/cuadrante también ganamos; falta igualar el VOLUMEN del
   catálogo de infracciones y añadir la navegación por sub-temas. Se mapeó su árbol completo (11 áreas)
   en `docs/paridad-spplb.md` y se arrancó a crecer: Tráfico pasó de 5 a 10 leyes (BOE), +15 infracciones
   de tráfico (Ola 1, revisadas), y la Ola 2 de Transporte (+13, PENDIENTE de revisor).

## Estado técnico (2026-09-09)
- Monorepo pnpm: `apps/mobile` (Expo SDK 57 + RN + TS), `packages/shared` (Zod), `packages/content-pipeline`
  (ingesta BOE → paquete SQLite). Contenido offline en `apps/mobile/assets/content/contenido-0.1.0.db`.
- 26 normas (articulado completo del BOE), **105 infracciones** (todas pendiente_revision), 4 capas.
- Suite verde (~466 mobile, ~232 content-pipeline, ~199 shared). Todo en `main` y en GitHub
  (https://github.com/Sausf93/Agente). Publicado en Expo canal `preview`.

## Lo siguiente (empezar por aquí)
1. **Revisor de la Ola 2 de Transporte** (commit 59321bd) y, tras corregir, publicar en Expo (aún no
   publicada porque no ha pasado el revisor).
2. Olas 3-4 del catálogo (Seguridad Ciudadana/Penal a fondo; Armas/Extranjería/Animales) + el
   **derivador LSV** (Anexo II/IV + arts. 76-80) para dar volumen fiable de golpe.
3. Construir **"Explorar por temas"** (los submenús) cuando los sub-temas tengan densidad.
4. Usuario: pagar Apple + TestFlight con el socio; probar audio/gestos en el iPhone.
