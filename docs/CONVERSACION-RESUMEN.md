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
- 26 normas (articulado completo del BOE), **109 infracciones** (todas pendiente_revision), 4 capas.
- Suite verde (~468 mobile, ~231 content-pipeline, ~199 shared). Todo en `main` y en GitHub
  (https://github.com/Sausf93/Agente). Publicado en Expo canal `preview`.

## Sesión de mudanza + mejora autónoma (2026-09-09, tarde)
Tras mover el repo de `C:\Users\Public\Agente` a `Documents\Saulo\repos\Agente` (mudanza segura,
copia antigua borrada, identidades git personal/trabajo configuradas por repo), se hizo:
- **Ola 2 de Transporte revisada y publicada** (estaba pendiente); exceso de dimensiones retirado
  (era tráfico, no LOTT). 105 → 104 infracciones.
- **Evaluación de 4 agentes** (Local/GC/PN + diseño) usando la app como cada cuerpo → detectó dos
  quejas reales del fundador y un backlog (ver `ESTADO-HANDOFF.md`).
- **4 rondas de UX de Normas** (todas publicadas): franja "solicitar normativa" honesta y por cuerpo
  (GC/PN ya no la ven, sin share a terceros); el detalle de materia y el índice muestran las FICHAS
  (Seguridad Ciudadana ya no parece vacía); Ajustes ya no pierde el municipio.
- **5 olas de contenido, cada una vía `revisor-juridico`** (104 → 109 infracciones): sinónimos (A),
  Lesiones agravadas 148 (B), Extranjería trabajar sin autorización 53.1.b (C), Abandono del lugar
  del accidente 382 bis (D), Coacciones 172 + Receptación 298 (E).
- **Lección**: los agentes EXAGERAN los huecos (estafa, falsedad, reunión, botellón, temeraria penal
  YA existían). Verificar siempre contra el seed antes de crear una ficha.

## Lo siguiente (empezar por aquí)
1. **Backlog de la evaluación de calle** en `ESTADO-HANDOFF.md`. Contenido de más retorno pendiente:
   Armas administrativas (RA, ojo: encaje sancionador vía LOSC/RA, murky), más fichas penales de nicho.
2. **Features grandes** (necesitan decisión del fundador): **Mapa + Punto Kilométrico** offline con
   volcado al atestado (razón nº1-2 del GC de Tráfico para pagar); alcoholemia guiada en una pantalla;
   documentos de PN (acta de lectura de derechos 520 LECrim).
3. Olas 3-4 del catálogo + el **derivador LSV** (Anexo II/IV + arts. 76-80) para volumen de golpe.
4. Usuario: pagar Apple + TestFlight con el socio; probar audio/gestos en el iPhone; que el cofundador
   GC valide en la beta el lote de contenido nuevo (todo `pendiente_revision` / "Borrador beta").
