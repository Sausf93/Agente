# apps/landing — Web comercial de Agente

Landing estática (un solo `index.html`, sin build) que presenta la app y recoge interés
(lista de espera por correo). Nombre de marca en curso: **Modo Agente** (`modoagente.es`).

## Despliegue

Se despliega en **Cloudflare** (Workers con assets estáticos) mediante el `wrangler.toml`
de la raíz del repo, que apunta a esta carpeta (`directory = "./apps/landing"`).

- **Automático (Git):** el proyecto de Cloudflare conectado a `Sausf93/Agente` ejecuta
  `npx wrangler deploy` en cada push a `main`. Requiere Node ≥ 22 (fijado en `.nvmrc`).
- **Manual (subida directa):** en Cloudflare → Workers & Pages → Create → Pages →
  *Upload assets*, arrastrando `index.html`.
- **Desde local (con token):** `npx wrangler deploy` con `CLOUDFLARE_API_TOKEN` en el entorno.

## Reglas

- Sin escudos ni apariencia oficial de ningún cuerpo. Herramienta de apoyo, no oficial.
- Los importes/consecuencias que aparecen son **ejemplos ilustrativos**.
- No recoge datos en servidor: el CTA abre el correo del usuario (`mailto`).
