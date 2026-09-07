# Cómo prueba la beta tu compañero (Expo Go, sin tu PC)

La app está publicada en la nube de Expo (EAS Update, rama `preview`). No hace falta tu ordenador
encendido. Así se usa de forma **ágil** (sin copiar el enlace cada vez):

## Paso 1 — instalar Expo Go (una vez)
- iPhone: App Store → **Expo Go** → instalar.

## Paso 2 — abrir la app la primera vez (una vez)
Dos formas, la que le sea más cómoda:
- **Enlace**: le pasas este enlace y lo abre desde el móvil:
  `exp://u.expo.dev/92c01f68-bf32-494e-8a73-0b5489620845?channel-name=preview`
- **QR**: en https://expo.dev/accounts/sausf93s-team/projects/saulo hay un QR de la rama `preview`;
  lo escanea con la **cámara del iPhone** y se abre en Expo Go.

## Paso 3 — a partir de ahí, ágil (sin enlace)
- Una vez abierta, **queda guardada en Expo Go** (pantalla de inicio → "Recientes"): la próxima vez
  solo abre Expo Go y **toca la app**. No hay que copiar nada más.
- **Aún más cómodo (opcional, recomendado):** invítalo como miembro del proyecto en
  https://expo.dev (proyecto `saulo` → Members → invitar con su email). Cuando él inicie sesión en
  Expo Go con su cuenta, la app le aparece **fija** en "Projects" de la pantalla de inicio.

## Las mejoras le llegan solas
Cada vez que publiquemos una mejora (`eas update --branch preview`), le llega automáticamente al
**reabrir** la app en Expo Go. No hay que reinstalar ni reenviar enlaces.

## Importante que sepa (es una beta)
- El contenido está marcado **"pendiente de revisión"**: su trabajo es justamente **decir qué está
  mal o falta** (importes, artículos, consecuencias). Para eso está "Más → Sugerencias".
- Habrá detalles ásperos. Que mande pantallazos de cualquier cosa pobre o rara.
- Funciona **sin cobertura** para consultar, cuadrante y plantillas.

## Cuando queramos icono propio / app "de verdad" (más adelante)
Eso es **TestFlight**, que necesita la cuenta de Apple (99 €/año) y un build. TestFlight sigue
siendo beta privada (no tienda pública) y permite **subir versiones ilimitadas**. Lo damos cuando
la app esté fina tras una temporada en Expo Go.

---
_Publicado: 2026-09-07 · rama `preview` · commit del código en la descripción del update._
