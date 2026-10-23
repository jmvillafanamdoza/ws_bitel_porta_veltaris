# Landing de portabilidad Bitel (Google Ads)

Estructura tomada de planesbitel.pe/portabilidad (mejorada para conversión) con la temática de bitel.com.pe.
HTML + CSS + JavaScript sin frameworks ni build. Se sube tal cual a `public_html` (cPanel).
La versión anterior (A/B/C) está en `..\_archivo_v1_ABC`.

## Estructura de la página (22/10/2026)

Funcionalidad y flujo de venta de planesmovistar.pe/p/movistar-portabilidad con la marca Bitel (`tokens.css`).
Lo nuevo de esta etapa vive en `assets/css/cambios.css` (se carga después de `landing.css`).

1. **Header** amarillo: logo, menú con anclas (Planes, Requisitos, Contáctanos → modal) y botón "Solo contrataciones" con teléfono que timbra. Móvil: hamburguesa a la izquierda del logo con panel lateral azul (cierra con Esc, fondo o al elegir enlace) y "Llama gratis al [tel]" al final.
2. **Barra promo** bajo el header: "Pásate a Bitel y llévate internet ilimitado / Tu plan desde S/ [desde] / Lo quiero" (abre el modal).
3. **Hero = carrusel de 3 slides** (slide 1 con el H1 del titular dinámico; slides 2 y 3 desde `config.banners`). Autoplay 5 s con pausa en hover/foco, sin autoplay con movimiento reducido, puntos, scroll-snap, slides ocultos con `inert`. Clic en el slide = modal con su plan. Formulario "Te llamamos" a la derecha en escritorio.
4. Franja amarilla de ventajas.
5. **Planes**: grilla centrada de 250 px desde 990 px (4 + 2); carrusel debajo (tarjeta al 80 %, máx. 300 px). Píldora de bono (de `bono` o calculada de la promo), "Beneficios incluidos", precio regular tachado. Bajo la grilla, "Consulta términos y restricciones" abre el modal de condiciones.
6. **Portabilidad Bitel** (`#requisitos`): 3 requisitos y "Quiero cambiarme a Bitel".
7. Footer con datos del distribuidor y aviso "no somos el portal oficial".
8. **Modales** (`<dialog>`): contacto (foto + plan + formulario; en móvil foto arriba), "Condiciones generales" y "Promociones y novedades" (textos en `config.legal`), que se apilan sobre el de contacto y vuelven a él al cerrarse. Overlay de carga a pantalla completa al enviar.
9. **Escritorio**: barra fija inferior con formulario al salir del hero. **Móvil**: panel con formulario (al cerrarlo queda la pestaña "Déjanos tu número y te llamamos") + barra "Llama gratis al [tel]" con WhatsApp.

Números: **llamadas** `contacto.telefono` / `telefonoLink` (939 730 787) y **WhatsApp** `contacto.whatsapp` / `whatsappTexto` (939 730 707). Son distintos: no mezclarlos.
Los `href` se escriben también en el HTML (respaldo sin JS) con `_herramientas/generar_html.py`, que los lee de `config.js`:
`python -I "..\_herramientas\generar_html.py" "."` desde la carpeta `sitio` después de cambiar números o estructura.

Datos que envía el formulario: telefono, dni (DNI 8 o RUC 11), plan, privacidad, publicidad + gclid/gbraid/wbraid/utm_* + landing_version/landing_url.
Las casillas de privacidad y promociones vienen **marcadas por defecto** (pedido del cliente). Validar con el área legal (Ley 29733).

Eventos en `dataLayer`: elegir_plan, abrir_modal_plan, envio_formulario, click_llamar, click_whatsapp, lead_confirmado, click_banner, abrir_modal_terminos, abrir_modal_consentimiento. Ubicaciones: header, header-movil, menu, barra-promo, banner, hero, card, callbar, barra-escritorio, footer, flotante.

## Archivos

| Archivo | Qué es |
|---|---|
| `portabilidad.html` | La landing |
| `gracias.html` | Página de gracias (dispara la conversión principal, `noindex`) |
| `privacidad.html`, `terminos.html` | Legales (estructura, contenido [PLACEHOLDER]) |
| `assets/js/config.js` | **Único archivo de configuración**: IDs de Google, endpoint, teléfono, WhatsApp, planes, titulares |
| `assets/css/tokens.css` | Colores, tipografía, radios y sombras de Bitel |
| `assets/css/landing.css` | Estilos de la página |
| `assets/css/cambios.css` | Estilos de la etapa planesmovistar (menú, barra promo, carrusel del hero, grilla, modales legales, overlay, barras móviles) |
| `assets/js/main.js` | Tracking, consentimiento, gclid/UTM, titular dinámico, planes, formulario |
| `assets/img/` | Fotos (hero y sección Portabilidad Bitel) y logos de Bitel (bitel.com.pe) |
| `.htaccess` | Gzip + caché para Apache |

## Ver en local

```
cd "D:\AIwara\Páginas Web\Landing-Leads\sitio"
python -m http.server 8765
```
Abrir http://localhost:8765/portabilidad.html

## Google Ads

En `assets/js/config.js` > `tracking`:
- `id`: `AW-XXXXXXXXXX` (modo `gtag`) o `GTM-XXXXXXX` (modo `gtm`).
- `conversiones`: etiquetas `send_to`. Marca **solo `lead`** (gracias.html) como conversión principal; `envioFormulario`, `whatsapp` y `llamada` como secundarias.
- Eventos en `dataLayer`: `envio_formulario`, `lead_confirmado`, `click_whatsapp` (con `plan` y `ubicacion`), `click_llamar`, `elegir_plan`.
- Consent Mode v2: `denied` hasta que el usuario acepta cookies.

URL final del anuncio:
- `?plan=ilimitado-39` (o cualquier `clave` de `planes`) → titular del plan y plan preseleccionado.
- `?titulo=Texto con *resaltado*` → titular libre.

## Pendiente antes de publicar

- **Autorización de marca**: usar el logo, nombre e imágenes de Bitel requiere ser distribuidor autorizado. Google Ads puede pedir prueba de autorización.
- Razón social, RUC, dirección, correo, teléfono y WhatsApp reales (`config.js` y footer).
- **Verificar planes y precios** con la oferta vigente de Bitel (en `config.js` son referenciales al 13/10/2026; el GB del plan 105.90 está marcado para confirmar) y poner la vigencia en la nota legal.
- Endpoint del CRM en `formulario.endpoint`.
- Modalidad de entrega del chip y horario de atención real (`contacto.horarioAtencion` en config.js y gracias.html).
- Textos legales completos y URL del Libro de Reclamaciones; textos de `config.legal.terminos` y `config.legal.consentimiento`.
- Fotos propias para los slides 2 y 3 (`config.banners[].imagen`; hoy se reutilizan las 2 fotos existentes).
- Confirmar "Llama gratis": el 939 730 787 no es gratuito para quien llama.
- Imagen Open Graph `assets/img/og-portabilidad.jpg` (1200x630) y dominio en `og:image`/`canonical`.

## Resultados de prueba (Lighthouse, servidor local sin gzip)

| | Rendimiento | Accesibilidad | Buenas prácticas | SEO |
|---|---|---|---|---|
| Móvil | 97 | 100 | 100 | 100 |
| Escritorio | 100 | 100 | 100 | 100 |
