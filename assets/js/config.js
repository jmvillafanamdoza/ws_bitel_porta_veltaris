/* =====================================================================
   CONFIGURACIÓN ÚNICA DE LA LANDING DE PORTABILIDAD BITEL
   Todo lo que cambia entre campañas vive aquí. Lo que está entre
   [corchetes] es PLACEHOLDER: reemplázalo antes de publicar.
   ===================================================================== */
window.LANDING_CONFIG = {
  marca: 'Bitel',
  distribuidor: 'VELTARIS CONTACT CENTER E.I.R.L.',   // aparece como "Distribuidor autorizado de Bitel"

  /* ---------- Medición (Google Ads) ----------
     modo 'gtag': carga gtag.js con el ID de Google Ads (AW-XXXXXXXXXX).
     modo 'gtm' : carga Google Tag Manager (GTM-XXXXXXX) y solo empuja
                  eventos al dataLayer; las conversiones se configuran en GTM.
     Mientras el ID siga con corchetes no se carga ningún script. */
  tracking: {
    modo: 'gtm',
    id: 'GTM-W9JPSV6K',    // contenedor de GTM (el snippet también está en el <head> de cada página)
    conversiones: {
      lead: '[AW-XXXXXXXXXX/ETIQUETA_LEAD]',          // principal: se dispara en gracias.html
      envioFormulario: '[AW-XXXXXXXXXX/ETIQUETA_FORM]', // secundaria
      whatsapp: '[AW-XXXXXXXXXX/ETIQUETA_WHATSAPP]',    // secundaria
      llamada: '[AW-XXXXXXXXXX/ETIQUETA_LLAMADA]'       // secundaria
    }
  },

  /* ---------- Envío del formulario ----------
     POST con JSON al endpoint (CRM, webhook, etc.). Con el placeholder,
     el envío se simula y se redirige a gracias. */
  formulario: {
    endpoint: '[https://tu-crm.com/api/leads]',
    paginaGracias: 'gracias.html'
  },

  /* ---------- Contacto ----------
     ATENCIÓN: llamadas (…787) y WhatsApp (…707) son números DISTINTOS
     que solo difieren en dos dígitos. Nunca mezclarlos.
     El generador (_herramientas/generar_html.py) lee estos valores para
     escribir los href de respaldo sin JS: si los cambias, vuelve a generar. */
  contacto: {
    telefono: '939 730 787',              // LLAMADAS: texto visible
    telefonoLink: '+51939730787',         // LLAMADAS: formato E.164 para tel:
    whatsapp: '51939730707',              // WHATSAPP: solo dígitos, con 51, sin "+"
    whatsappTexto: '939 730 707',         // WHATSAPP: texto visible
    whatsappMensaje: 'Hola, quiero portarme a Bitel con mi mismo número.',
    horarioAtencion: '[Lunes a domingo de 8 a.m. a 10 p.m.]',  // texto de la página de gracias
    // El número del header solo se muestra en este horario (hora de Lima, 24 h).
    horarioLlamadas: { desde: 9, hasta: 18 }
  },

  /* ---------- Precio "desde" (barra promo de escritorio) ---------- */
  desde: '39.90',

  /* ---------- Plan del banner principal (hero) ----------
     Clave de "planes". Con ?plan=<clave> en la URL del anuncio se muestra ese plan.
     Conviene uno con promo: el precio tachado frente al precio a pagar convierte mejor. */
  destacado: 'ilimitado-69',

  /* ---------- Banners del hero (slides 2 y 3) ----------
     El slide 1 es el hero con el titular dinámico. Precio, GB y meses
     salen del plan indicado en "plan". Entre *asteriscos* va en amarillo.
     imagen: vertical ~380x540 WebP. Reemplazar por fotos propias. */
  banners: [
    { plan: 'ilimitado-79', etiqueta: '50% de descuento',
      titulo: 'Ilimitado 79.90 a *mitad de precio*',
      subtitulo: 'Internet, llamadas y SMS ilimitados con TV360 incluido.',
      imagen: 'assets/img/portabilidad-persona.webp', alt: 'Hombre con audífonos sonriendo mientras usa su celular' },
    { plan: 'ilimitado-49-5g', etiqueta: 'Red 5G',
      titulo: 'Pásate a la red *5G* de Bitel',
      subtitulo: 'Navega más rápido con tu mismo número. Sujeto a cobertura 5G.',
      imagen: 'assets/img/hero-persona.webp', alt: 'Mujer sonriendo mientras usa su celular' }
  ],

  /* ---------- Textos legales de los modales ----------
     Cada elemento es un párrafo. PLACEHOLDER: reemplazar por los textos
     reales de las promociones vigentes y del consentimiento del distribuidor. */
  legal: {
    terminos: [
      'Precios en soles, incluyen IGV. Gigas en alta velocidad.',
      'Los precios promocionales aplican por los meses indicados en cada plan; luego rige el precio regular.',
      'Planes y promociones sujetos a la oferta vigente de Bitel, evaluación crediticia y cobertura. Beneficio 5G sujeto a cobertura y equipo compatible.',
      '[Vigencia de la promoción: del DD/MM/AAAA al DD/MM/AAAA.]',
      '[PLACEHOLDER: pegar aquí los términos y restricciones oficiales de las promociones Bitel vigentes.]'
    ],
    consentimiento: [
      'Al marcar esta casilla autorizas a VELTARIS CONTACT CENTER E.I.R.L., distribuidor autorizado de Bitel, a usar tus datos de contacto para enviarte ofertas, promociones y novedades de productos y servicios Bitel por llamada, SMS, WhatsApp o correo.',
      'Esta autorización es opcional y no condiciona tu solicitud de portabilidad. Puedes revocarla en cualquier momento escribiendo a [correo de privacidad].',
      '[PLACEHOLDER: texto de consentimiento comercial del distribuidor, conforme a la Ley N.º 29733.]'
    ]
  },

  /* ---------- Titular dinámico (concordancia con el anuncio) ----------
     ?plan=<clave> usa el titular de ese plan y lo preselecciona.
     ?titulo=<texto> reemplaza el titular (máx. 80 caracteres).
     Entre *asteriscos* va el tramo resaltado en amarillo. */
  titulares: {
    porDefecto: 'Cámbiate a Bitel *con tu mismo número*',
    porPlan: {
      'ilimitado-39': 'Todo ilimitado a *S/ 39.90* con tu mismo número',
      'ilimitado-49-5g': 'Pásate a Bitel *5G* con tu mismo número',
      'ilimitado-55': '125 GB a *mitad de precio*',
      'ilimitado-69': '220 GB a *mitad de precio*',
      'ilimitado-79': 'Plan Ilimitado 79.90 a *mitad de precio*'
    }
  },

  /* ---------- Planes ----------
     DATOS de la web oficial bitel.com.pe/planes/control/ilimitado (consultada el 24/10/2026).
     ORDEN = prioridad de venta: lo que más empuja Bitel en sus anuncios de Meta
     (69.90, 55.90 y 79.90 con 50% de descuento). Vuelve a verificar antes de cada campaña.
     OJO: en anuncios Bitel muestra S/ 34.95 y S/ 27.95; en su web, S/ 34.90 y S/ 27.90.
     Aquí va lo de la web.
     gb: lo grande de la tarjeta ('220 GB' o 'Ilimitados').
     gbDetalle: línea bajo lo grande. datosExtra: segunda línea (opcional).
     sms: '500 SMS' si no son ilimitados (si se omite: "Internet, llamadas y SMS ilimitados").
     promo: precio promocional y meses; null si no hay promoción.
     etiqueta: 'Más vendido' marca la tarjeta destacada; otro texto va en la etiqueta amarilla.
     beneficios: [{ icono, nombre, detalle }] con íconos de assets/icons.svg.
     apps: redes ilimitadas (whatsapp, facebook, instagram, spotify, tiktok, youtube). */
  planes: [
    { clave: 'ilimitado-69', nombre: 'Ilimitado 69.90', gb: '220 GB', gbDetalle: 'en alta velocidad', sms: '500 SMS',
      precio: '69.90', promo: { precio: '34.90', meses: 12 }, etiqueta: 'Más vendido', cincoG: false,
      beneficios: [ { icono: 'television-simple', nombre: 'TV360', detalle: 'x 6 meses' }, { icono: 'gift', nombre: 'Spotify', detalle: '15 GB x 6 meses' } ],
      apps: ['facebook', 'instagram', 'spotify'] },
    { clave: 'ilimitado-55', nombre: 'Ilimitado 55.90', gb: '185 GB', gbDetalle: 'por portabilidad (regular 125 GB)', datosExtra: 'Datos 5G ilimitados x 12 meses', sms: '500 SMS',
      precio: '55.90', promo: { precio: '27.90', meses: 6 }, etiqueta: '', cincoG: false,
      beneficios: [ { icono: 'television-simple', nombre: 'TV360', detalle: 'x 6 meses' }, { icono: 'gift', nombre: 'Spotify', detalle: '15 GB x 6 meses' } ],
      apps: ['whatsapp', 'facebook', 'instagram', 'spotify'] },
    { clave: 'ilimitado-79', nombre: 'Ilimitado 79.90', gb: 'Ilimitados', gbDetalle: 'Datos 4G + 5G x 12 meses', datosExtra: 'Luego 250 GB desde el mes 13',
      precio: '79.90', promo: { precio: '39.90', meses: 12 }, etiqueta: '', cincoG: true,
      beneficios: [ { icono: 'television-simple', nombre: 'TV360', detalle: 'x 6 meses' }, { icono: 'gift', nombre: 'Spotify', detalle: '20 GB x 6 meses' } ],
      apps: ['facebook', 'instagram', 'spotify'] },
    { clave: 'ilimitado-39', nombre: 'Ilimitado 39.90', gb: '110 GB', gbDetalle: 'por portabilidad (regular 45 GB)', datosExtra: 'Datos 4G + 5G ilimitados x 12 meses', sms: '500 SMS',
      precio: '39.90', promo: null, etiqueta: '', cincoG: false,
      beneficios: [ { icono: 'television-simple', nombre: 'TV360', detalle: 'x 6 meses' }, { icono: 'gift', nombre: 'Spotify', detalle: '10 GB x 6 meses' } ],
      apps: ['whatsapp', 'facebook', 'instagram', 'spotify'] },
    { clave: 'ilimitado-49-5g', nombre: 'Ilimitado 49.90 5G', gb: 'Ilimitados', gbDetalle: 'Datos 4G + 5G x 12 meses', datosExtra: 'Luego 120 GB desde el mes 13',
      precio: '49.90', promo: null, etiqueta: '', cincoG: true,
      beneficios: [ { icono: 'television-simple', nombre: 'TV360', detalle: 'x 6 meses' } ],
      apps: ['whatsapp', 'facebook', 'instagram'] },
    { clave: 'ilimitado-99', nombre: 'Ilimitado 99.90', gb: 'Ilimitados', gbDetalle: 'Datos 5G x 12 meses', datosExtra: 'Luego 300 GB',
      precio: '99.90', promo: { precio: '49.90', meses: 12 }, etiqueta: '', cincoG: true,
      beneficios: [ { icono: 'television-simple', nombre: 'TV360', detalle: 'x 6 meses' } ],
      apps: ['facebook', 'instagram'] },
    { clave: 'ilimitado-105', nombre: 'Ilimitado 105.90', gb: 'Ilimitados', gbDetalle: 'Datos 5G x 12 meses', datosExtra: 'Luego 350 GB desde el mes 13',
      precio: '105.90', promo: { precio: '52.90', meses: 12 }, etiqueta: '', cincoG: true,
      beneficios: [ { icono: 'television-simple', nombre: 'TV360', detalle: 'x 6 meses' }, { icono: 'gift', nombre: 'Spotify', detalle: '20 GB x 6 meses' } ],
      apps: ['facebook', 'instagram', 'spotify'] }
  ],

  // Operadores de origen (Bitel no va: es el destino).
  operadores: ['Claro', 'Movistar', 'Entel', 'Otro']
};
