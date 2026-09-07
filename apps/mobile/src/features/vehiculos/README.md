# Vehículos (§4.12)

Caja de herramientas de apoyo para la calle: enlaces curados y utilidades de consulta de
vehículos y documentación, heredados y depurados de SPPLB (enlaces públicos), reorganizados por
categoría. **No es normativa** (eso vive en "Normas" y en el paquete SQLite): es un **recurso
bundlado** en la app, como la lectura de derechos, para funcionar **sin red** y sin tocar el `.db`.

## Estructura

- `contenido.ts` — contenido tipado (constante en la propia feature). Categorías → secciones →
  listas/enlaces. Cada sección declara su `estado` (`orientativo` | `pendiente`). Lógica pura y
  testeable (sin React Native).
- `VehiculosHubScreen.tsx` — hub con la lista de categorías (ruta `/vehiculos`).
- `CategoriaScreen.tsx` — detalle de una categoría (ruta `/vehiculos/<categoriaId>`).
- `contenido.test.ts` — tests de estructura/contrato del contenido.
- Rutas: `app/vehiculos/index.tsx` y `app/vehiculos/[categoriaId].tsx`. Enlazado desde
  `app/(tabs)/mas.tsx` (hub "Más"). No añade una sexta pestaña.

## Categorías incluidas

1. **Documentación española** — permiso de circulación, ficha técnica/ITV y permiso de conducir:
   qué conviene comprobar y posibles indicios de falsedad (orientativo, con fuente).
2. **Vehículos y permisos extranjeros** — documentación de circulación, permiso armonizado UE,
   validez y canje de permisos de conducir (orientativo, con fuente).
3. **Comprobaciones** — accesos a recursos públicos (DGT, consulta de vehículo/ITV, bastidor/VIN).
   Los enlaces están **pendientes** de URL fija.
4. **Falsedad documental** — guía orientativa de indicios de manipulación.

## Reglas respetadas

- Lenguaje **orientativo**, sin imperativos (verificado por test).
- Fuente citada cuando la hay; nada de datos de terceros se guarda ni se envía.
- **No se inventan URLs**: si no hay enlace fijo verificado, `url` es `null` y se cita el recurso
  público de forma genérica (`referencia`), con marca "Pendiente".
- Enlaces externos se abren con `Linking.openURL` de forma segura.

## Pendiente por que lo aporte el cofundador (TODO)

URLs concretas y verificadas para "Comprobaciones":

- Sede electrónica de la DGT (ruta de trámites/consultas de vehículos y conductores).
- Servicio de "informe de vehículo" de la DGT (datos técnicos, cargas, situación administrativa).
- Recurso oficial de descodificación/comprobación de bastidor (VIN).

Otras dudas para el socio (llevar a `docs/preguntas-socio.md`):

- ¿Qué enlaces exactos usaba SPPLB y cuáles siguen vigentes? (bases de robados, falsedad).
- ¿Interesa una subsección de "vehículos robados / señalados" con recurso público concreto?
- ¿Conviene ampliar equivalencias de permisos extranjeros por país/tabla?
