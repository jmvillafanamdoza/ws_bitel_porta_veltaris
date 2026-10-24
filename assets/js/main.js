/* =====================================================================
   LÓGICA COMPARTIDA DE LAS LANDINGS (sin dependencias)
   Lee todo de window.LANDING_CONFIG (config.js).
   ===================================================================== */
(function () {
  'use strict';

  var C = window.LANDING_CONFIG || {};
  var doc = document;
  var body = doc.body;
  var VERSION = body.getAttribute('data-version') || '';
  var ICONS = 'assets/icons.svg';

  /* ---------- Utilidades ---------- */
  function isPlaceholder(v) { return !v || String(v).indexOf('[') !== -1; }
  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function icon(name) {
    return '<svg class="icon" aria-hidden="true"><use href="' + ICONS + '#i-' + name + '"></use></svg>';
  }
  function store(kind) {
    try { var s = window[kind]; s.setItem('__t', '1'); s.removeItem('__t'); return s; } catch (e) { return null; }
  }
  var session = store('sessionStorage');
  var local = store('localStorage');
  var params = new URLSearchParams(window.location.search);

  /* ---------- Medición: Consent Mode + gtag / GTM ---------- */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  var T = C.tracking || {};
  var savedConsent = local ? local.getItem('cookie_consent') : null;
  var granted = savedConsent === 'granted' ? 'granted' : 'denied';

  window.gtag('consent', 'default', {
    ad_storage: granted, ad_user_data: granted, ad_personalization: granted,
    analytics_storage: granted, wait_for_update: 500
  });

  var trackingActivo = !isPlaceholder(T.id);
  if (trackingActivo) {
    var s = doc.createElement('script');
    s.async = true;
    if (T.modo === 'gtm') {
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      s.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(T.id);
    } else {
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(T.id);
      window.gtag('js', new Date());
      window.gtag('config', T.id);
    }
    doc.head.appendChild(s);
  }

  /* Envía un evento al dataLayer y, en modo gtag, la conversión de Ads.
     cb se ejecuta siempre (máx. 1.2 s) para no bloquear redirecciones. */
  function track(evento, claveConversion, datos, cb) {
    var done = false;
    function finish() { if (!done) { done = true; if (cb) cb(); } }
    var payload = Object.assign({ event: evento, landing_version: VERSION }, datos || {});
    window.dataLayer.push(payload);

    var sendTo = (T.conversiones || {})[claveConversion];
    if (trackingActivo && T.modo !== 'gtm' && !isPlaceholder(sendTo)) {
      window.gtag('event', 'conversion', Object.assign({ send_to: sendTo, event_callback: finish }, datos || {}));
      setTimeout(finish, 1200);
    } else {
      if (!trackingActivo && window.console) console.info('[tracking simulado]', evento, payload);
      finish();
    }
  }

  /* ---------- Banner de cookies ---------- */
  var banner = $('[data-cookie-banner]');
  if (banner && !savedConsent) banner.hidden = false;
  $$('[data-cookie]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var value = btn.getAttribute('data-cookie') === 'accept' ? 'granted' : 'denied';
      if (local) local.setItem('cookie_consent', value);
      window.gtag('consent', 'update', {
        ad_storage: value, ad_user_data: value, ad_personalization: value, analytics_storage: value
      });
      if (banner) banner.hidden = true;
    });
  });

  /* ---------- Atribución: gclid, gbraid, wbraid y UTM ---------- */
  var CAMPOS_ATRIB = ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  var atrib = {};
  try { atrib = JSON.parse((session && session.getItem('atribucion')) || '{}'); } catch (e) { atrib = {}; }
  var hayNuevos = CAMPOS_ATRIB.some(function (k) { return params.get(k); });
  if (hayNuevos) {
    atrib = {};
    CAMPOS_ATRIB.forEach(function (k) { if (params.get(k)) atrib[k] = params.get(k).slice(0, 200); });
    if (session) session.setItem('atribucion', JSON.stringify(atrib));
  }

  /* ---------- Contacto (WhatsApp y llamada desde config) ---------- */
  var K = C.contacto || {};
  function waLink(msg) {
    return 'https://wa.me/' + encodeURIComponent(K.whatsapp || '') + '?text=' + encodeURIComponent(msg || K.whatsappMensaje || '');
  }
  var waHref = waLink();
  function prepararWA(a) {
    a.href = waLink(a.getAttribute('data-wa-msg'));
    a.target = '_blank'; a.rel = 'noopener';
  }
  $$('[data-wa]').forEach(prepararWA);
  $$('[data-tel]').forEach(function (a) { a.href = 'tel:' + (K.telefonoLink || ''); });
  $$('[data-tel-text]').forEach(function (el) { el.textContent = K.telefono || ''; });
  $$('[data-wa-text]').forEach(function (el) { if (K.whatsappTexto) el.textContent = K.whatsappTexto; });
  $$('[data-desde]').forEach(function (el) { if (C.desde) el.textContent = C.desde; });
  $$('[data-horario-text]').forEach(function (el) { if (K.horarioAtencion) el.textContent = K.horarioAtencion; });
  $$('[data-marca]').forEach(function (el) { el.textContent = C.marca || ''; });
  $$('[data-distribuidor]').forEach(function (el) { el.textContent = C.distribuidor || ''; });
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* Número del header: visible solo en el horario de llamadas (hora de Lima).
     En equipos que pueden llamar (táctiles) es un enlace tel:; en PC es solo texto. */
  var puedeLlamar = matchMedia('(hover: none) and (pointer: coarse)').matches;
  function horaLima() {
    try {
      var h = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Lima', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
      var get = function (t) { var x = h.filter(function (p) { return p.type === t; })[0]; return x ? +x.value : 0; };
      return get('hour') + get('minute') / 60;
    } catch (e) { var d = new Date(); return ((d.getUTCHours() + 19) % 24) + d.getUTCMinutes() / 60; } // UTC-5
  }
  function pintarLlamada() {
    var H = K.horarioLlamadas || { desde: 9, hasta: 18 };
    var hora = horaLima();
    var abierto = hora >= H.desde && hora < H.hasta;
    $$('[data-call-head]').forEach(function (el) {
      el.hidden = !abierto;
      if (puedeLlamar) { el.href = 'tel:' + (K.telefonoLink || ''); el.classList.remove('is-static'); }
      else { el.removeAttribute('href'); el.classList.add('is-static'); }
    });
  }
  pintarLlamada();
  setInterval(pintarLlamada, 60000);

  // Clics de WhatsApp y llamada como conversión (delegado: cubre todos los enlaces).
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var datos = { ubicacion: a.getAttribute('data-ubicacion') || '', plan: a.getAttribute('data-plan') || '' };
    if (href.indexOf('tel:') === 0) track('click_llamar', 'llamada', datos);
    else if (href.indexOf('wa.me') !== -1) track('click_whatsapp', 'whatsapp', datos);
  });

  /* ---------- Planes ---------- */
  var planes = C.planes || [];
  var planPorClave = {};
  planes.forEach(function (p) { planPorClave[p.clave] = p; });
  var planURL = params.get('plan');
  if (planURL && !planPorClave[planURL]) planURL = null;

  var NOMBRE_APP = { whatsapp: 'WhatsApp', facebook: 'Facebook', instagram: 'Instagram', spotify: 'Spotify', tiktok: 'TikTok', youtube: 'YouTube' };

  // Píldora de bono: texto de config o, si hay promo, el ahorro calculado ("Ahorra 50% x 12 meses").
  function textoBono(p) {
    if (p.bono) return p.bono;
    if (!p.promo) return '';
    var reg = parseFloat(p.precio), pro = parseFloat(p.promo.precio);
    if (!(reg > 0) || !(pro > 0) || pro >= reg) return '';
    return 'Ahorra ' + Math.round((1 - pro / reg) * 100) + '% x ' + p.promo.meses + ' meses';
  }
  // Beneficios por defecto si el plan no trae la lista en config.
  function beneficiosPorDefecto(p) {
    var lista = [];
    if (p.tv360) lista.push({ icono: 'television-simple', nombre: 'TV360', detalle: 'Incluido en tu plan' });
    if (p.cincoG) lista.push({ icono: 'cell-signal-full', nombre: 'Red 5G', detalle: 'Según cobertura' });
    return lista;
  }
  // Precio vigente (promo si existe) y texto de meses, para banners y modal.
  function precioPlan(p) { return p.promo ? p.promo.precio : p.precio; }
  function pintarResaltado(el, texto) {
    // *tramo* va en amarillo; se arma con nodos de texto (sin innerHTML).
    el.textContent = '';
    String(texto).split('*').forEach(function (parte, i) {
      if (!parte) return;
      if (i % 2 === 1) { var sp = doc.createElement('span'); sp.className = 'hl'; sp.textContent = parte; el.appendChild(sp); }
      else el.appendChild(doc.createTextNode(parte));
    });
  }

  // Precio al estilo bitel.com.pe: "S/39" grande y ".90" pequeño.
  function precioPartido(v) {
    var partes = String(v).split('.');
    return '<span class="cur">S/</span>' + esc(partes[0]) + (partes[1] ? '<span class="dec">.' + esc(partes[1]) + '</span>' : '');
  }

  // "50% de descuento x 12 meses" a partir de precio regular y promo.
  function textoDescuento(p) {
    var reg = parseFloat(p.precio), pro = parseFloat(p.promo.precio);
    if (!(reg > 0) || !(pro > 0) || pro >= reg) return '';
    return Math.round((1 - pro / reg) * 100) + '% de descuento x ' + p.promo.meses + ' meses';
  }

  // Tarjeta de plan con la línea de bitel.com.pe y el orden que convierte:
  // gigas, precio tachado frente al precio a pagar, "Lo quiero" y WhatsApp juntos
  // arriba (sin hacer scroll en la tarjeta), y después beneficios y apps.
  function tarjetaPlan(p) {
    var destacado = /solicitado|vendido/i.test(p.etiqueta || '');
    var etiqueta = destacado ? (p.bono || '') : (p.etiqueta || p.bono || '');
    var gb = esc(p.gb.replace(/[\[\]]/g, ''));
    var ahorro = p.promo ? Math.round((1 - parseFloat(p.promo.precio) / parseFloat(p.precio)) * 100) : 0;
    var precio = p.promo
      ? '<p class="pc-before">Antes <s>S/ ' + esc(p.precio) + '</s>' + (ahorro > 0 ? ' <span class="pc-off">-' + ahorro + '%</span>' : '') + '</p>' +
        '<p class="pc-price">' + precioPartido(p.promo.precio) + '</p>' +
        '<p class="pc-per">al mes x ' + esc(p.promo.meses) + ' meses</p>'
      : '<p class="pc-before pc-before--fixed">Precio fijo</p>' +
        '<p class="pc-price">' + precioPartido(p.precio) + '</p>' +
        '<p class="pc-per">al mes</p>';
    var feats = [
      '<li>' + icon('infinity') + '<span><b>Internet, llamadas y SMS</b> ilimitados</span></li>'
    ];
    (p.beneficios || beneficiosPorDefecto(p)).forEach(function (b) {
      feats.push('<li>' + icon(b.icono || 'check-circle') + '<span><b>' + esc(b.nombre) + '</b>' + (b.detalle ? ' · ' + esc(b.detalle) : '') + '</span></li>');
    });
    var apps = (p.apps || []).map(function (a) {
      return '<li class="app app--' + esc(a) + '" title="' + esc(NOMBRE_APP[a] || a) + '"><svg aria-hidden="true"><use href="' + ICONS + '#app-' + esc(a) + '"></use></svg><span class="sr-only">' + esc(NOMBRE_APP[a] || a) + '</span></li>';
    }).join('');
    var msg = 'Hola, quiero portarme a Bitel con el plan ' + p.nombre + '.';
    return '<article class="pc' + (destacado ? ' is-featured' : '') + '">' +
      (destacado ? '<p class="pc-flag">' + esc(p.etiqueta) + '</p>' : '') +
      '<div class="pc-card">' +
        '<header class="pc-head">' +
          '<h3 class="pc-name">' + esc(p.nombre.replace(/ 5G$/, '')) + (p.cincoG ? ' <span class="tag-5g">5G</span>' : '') + '</h3>' +
          (etiqueta ? '<p class="pc-tag">' + esc(etiqueta) + '</p>' : '') +
        '</header>' +
        '<p class="pc-gb">' + gb + '</p><p class="pc-speed">en alta velocidad</p>' +
        '<div class="pc-pricebox">' + precio + '</div>' +
        '<a class="btn btn--primary pc-cta" href="#formulario" data-elegir-plan="' + esc(p.clave) + '">Lo quiero</a>' +
        '<a class="btn btn--wa pc-wa" href="https://wa.me/" data-wa data-plan="' + esc(p.clave) + '" data-ubicacion="card" data-wa-msg="' + esc(msg) + '">' + icon('whatsapp-logo-fill') + 'Pedir por WhatsApp</a>' +
        '<ul class="pc-feats">' + feats.join('') + '</ul>' +
        (apps ? '<p class="pc-title">Apps ilimitadas</p><ul class="pc-apps">' + apps + '</ul>' : '') +
      '</div>' +
    '</article>';
  }

  $$('[data-plans="cards"]').forEach(function (el) {
    el.innerHTML = planes.map(tarjetaPlan).join('');
    $$('[data-wa]', el).forEach(prepararWA);
  });

  /* ---------- Carrusel de planes (arrastrable, flechas y puntos; sin librerías) ---------- */
  $$('[data-carousel]').forEach(function (car) {
    var track = $('[data-car-track]', car);
    var prev = $('[data-car-prev]', car), next = $('[data-car-next]', car), dotsBox = $('[data-car-dots]', car);
    if (!track) return;
    var paso = function () { var c = track.children[0]; if (!c) return 1; return c.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 16); };
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ir = function (x) { track.scrollTo({ left: x, behavior: reduce ? 'auto' : 'smooth' }); };
    var dots = [];
    var armarDots = function () {
      if (!dotsBox) return;
      var posiciones = Math.max(1, Math.round((track.scrollWidth - track.clientWidth) / paso()) + 1);
      if (dots.length === posiciones) return;
      dotsBox.innerHTML = '';
      dots = [];
      for (var i = 0; i < posiciones; i++) {
        var d = doc.createElement('button');
        d.type = 'button'; d.className = 'car-dot'; d.setAttribute('aria-label', 'Ir al grupo de planes ' + (i + 1));
        (function (n) { d.addEventListener('click', function () { ir(n * paso()); }); })(i);
        dotsBox.appendChild(d); dots.push(d);
      }
      dotsBox.hidden = posiciones < 2;
    };
    var pintar = function () {
      var max = track.scrollWidth - track.clientWidth - 2;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max;
      var activo = Math.round(track.scrollLeft / paso());
      dots.forEach(function (d, i) { d.setAttribute('aria-current', i === activo ? 'true' : 'false'); });
    };
    if (prev) prev.addEventListener('click', function () { ir(track.scrollLeft - paso()); });
    if (next) next.addEventListener('click', function () { ir(track.scrollLeft + paso()); });
    var pendiente = false;
    track.addEventListener('scroll', function () {
      if (pendiente) return; pendiente = true;
      requestAnimationFrame(function () { pendiente = false; pintar(); });
    }, { passive: true });

    // Arrastrar con el mouse (en táctil el scroll nativo ya funciona).
    var arrastre = null, movido = false;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      if (track.scrollWidth <= track.clientWidth + 2) return; // en grilla no hay nada que arrastrar
      arrastre = { x: e.clientX, left: track.scrollLeft }; movido = false;
    });
    window.addEventListener('pointermove', function (e) {
      if (!arrastre) return;
      var dx = e.clientX - arrastre.x;
      if (!movido && Math.abs(dx) > 6) { movido = true; track.classList.add('is-dragging'); }
      if (movido) track.scrollLeft = arrastre.left - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!arrastre) return;
      arrastre = null;
      if (movido) {
        track.classList.remove('is-dragging');
        ir(Math.round(track.scrollLeft / paso()) * paso());
        setTimeout(function () { movido = false; }, 0);
      }
    });
    // Un arrastre no debe contar como clic en "Lo quiero".
    track.addEventListener('click', function (e) { if (movido) { e.preventDefault(); e.stopPropagation(); movido = false; } }, true);
    track.addEventListener('dragstart', function (e) { e.preventDefault(); });

    var listo = function () { armarDots(); pintar(); };
    listo();
    window.addEventListener('resize', listo);
  });

  /* ---------- Banners del hero (slides 2 y 3 desde config.banners) ---------- */
  var hsTrack = $('[data-hs-track]');
  if (hsTrack) {
    var banners = (C.banners || []).filter(function (b) { return planPorClave[b.plan]; });
    var total = banners.length + 1;
    var s1 = $('.hs-slide--1', hsTrack);
    if (s1) s1.setAttribute('aria-label', '1 de ' + total);
    banners.forEach(function (b, i) {
      var p = planPorClave[b.plan];
      var meses = p.promo ? 'al mes x ' + p.promo.meses + ' meses' : 'al mes';
      var msg = 'Hola, quiero portarme a Bitel con el plan ' + p.nombre + '.';
      var slide = doc.createElement('div');
      slide.className = 'hs-slide';
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'diapositiva');
      slide.setAttribute('aria-label', (i + 2) + ' de ' + total);
      slide.setAttribute('data-slide-plan', p.clave);
      slide.innerHTML =
        '<div class="hs-copy">' +
          (b.etiqueta ? '<span class="pill-outline">' + esc(b.etiqueta) + '</span>' : '') +
          '<h2 class="hs-title"></h2>' +
          (b.subtitulo ? '<p class="hero-sub">' + esc(b.subtitulo) + '</p>' : '') +
          '<p class="price-tag hs-price"><small>' + esc(p.nombre) + ': ' + esc(p.gb.replace(/[\[\]]/g, '')) + '</small>' +
            '<strong>S/ ' + esc(precioPlan(p)) + '</strong><small>' + esc(meses) + '</small></p>' +
          '<div class="hero-ctas">' +
            '<button class="btn btn--accent btn--lg" type="button" data-elegir-plan="' + esc(p.clave) + '" data-ubicacion="banner">Lo quiero</button>' +
            '<a class="btn btn--ghost-light btn--lg" href="https://wa.me/" data-wa data-plan="' + esc(p.clave) + '" data-ubicacion="banner" data-wa-msg="' + esc(msg) + '">' + icon('whatsapp-logo-fill') + 'Pedir por WhatsApp</a>' +
          '</div>' +
        '</div>' +
        (b.imagen ? '<img class="hs-photo" src="' + esc(b.imagen) + '" alt="' + esc(b.alt || '') + '" width="381" height="542" loading="lazy" decoding="async">' : '');
      pintarResaltado($('.hs-title', slide), b.titulo || p.nombre);
      hsTrack.appendChild(slide);
      $$('[data-wa]', slide).forEach(prepararWA);
    });
  }

  // Selects de plan y operador.
  $$('select[data-plan-select]').forEach(function (sel) {
    planes.forEach(function (p) {
      var o = doc.createElement('option');
      o.value = p.clave; o.textContent = p.nombre + ' (' + p.gb.replace(/[\[\]]/g, '') + ')';
      sel.appendChild(o);
    });
    var o2 = doc.createElement('option');
    o2.value = 'asesoria'; o2.textContent = 'Aún no sé, quiero asesoría';
    sel.appendChild(o2);
    if (planURL) sel.value = planURL;
  });
  $$('select[data-operador-select]').forEach(function (sel) {
    (C.operadores || []).forEach(function (op) {
      var o = doc.createElement('option'); o.value = op; o.textContent = op; sel.appendChild(o);
    });
  });

  /* ---------- Menú: enlaces en el header (escritorio) y panel lateral (móvil) ---------- */
  var navBtn = $('[data-nav-toggle]');
  var drawer = $('[data-nav-drawer]');
  var navFondo = $('[data-nav-backdrop]');
  function abrirMenu() {
    if (!drawer) return;
    drawer.removeAttribute('inert');
    drawer.classList.add('is-open');
    if (navFondo) navFondo.hidden = false;
    body.classList.add('menu-open');
    navBtn.setAttribute('aria-expanded', 'true');
    navBtn.setAttribute('aria-label', 'Cerrar menú');
    var primero = $('.nav-link', drawer);
    if (primero) setTimeout(function () { primero.focus(); }, 50);
  }
  function cerrarMenu(devolverFoco) {
    if (!drawer || !drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('inert', '');
    if (navFondo) navFondo.hidden = true;
    body.classList.remove('menu-open');
    navBtn.setAttribute('aria-expanded', 'false');
    navBtn.setAttribute('aria-label', 'Abrir menú');
    if (devolverFoco) navBtn.focus();
  }
  if (navBtn && drawer) {
    navBtn.addEventListener('click', function () { drawer.classList.contains('is-open') ? cerrarMenu(true) : abrirMenu(); });
    if (navFondo) navFondo.addEventListener('click', function () { cerrarMenu(true); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarMenu(true); });
    $$('a.nav-link', drawer).forEach(function (a) { a.addEventListener('click', function () { cerrarMenu(); }); });
    window.addEventListener('resize', function () { if (matchMedia('(min-width: 1024px)').matches) cerrarMenu(); });
  }

  /* ---------- Panel inferior con formulario rápido (móvil) ---------- */
  var sheet = $('[data-sheet]');
  var esMovil = function () { return matchMedia('(max-width: 899px)').matches; };
  function abrirSheet(enfocar) {
    if (!sheet) return;
    sheet.classList.remove('is-collapsed');
    $$('[data-sheet-toggle]').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    if (enfocar) { var f = $('input[name="telefono"]', sheet); if (f) setTimeout(function () { f.focus(); }, 250); }
  }
  function cerrarSheet() {
    if (!sheet) return;
    sheet.classList.add('is-collapsed');
    $$('[data-sheet-toggle]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
  }
  $$('[data-sheet-close]').forEach(function (b) { b.addEventListener('click', cerrarSheet); });
  $$('[data-sheet-toggle]').forEach(function (b) {
    b.addEventListener('click', function () { sheet.classList.contains('is-collapsed') ? abrirSheet(true) : cerrarSheet(); });
  });

  /* ---------- Barra fija inferior con formulario (escritorio) ----------
     Aparece cuando el hero sale de la pantalla y se oculta al volver a él
     (como el form__sticky de la referencia). Se puede cerrar y reabrir. */
  var dbar = $('[data-dsticky]');
  var dshow = $('[data-dsticky-show]');
  if (dbar && 'IntersectionObserver' in window) {
    var heroFuera = false;
    var cerrada = session && session.getItem('barra_cerrada') === '1';
    var escritorio = function () { return matchMedia('(min-width: 900px)').matches; };
    var pintarBarra = function () {
      var visible = escritorio() && heroFuera && !cerrada;
      dbar.classList.toggle('is-visible', visible);
      if (visible) dbar.removeAttribute('inert'); else dbar.setAttribute('inert', '');
      body.classList.toggle('dbar-on', visible);
      if (dshow) dshow.hidden = !(escritorio() && heroFuera && cerrada);
    };
    var hero = $('.hero');
    if (hero) {
      new IntersectionObserver(function (en) {
        heroFuera = !en[0].isIntersecting;
        pintarBarra();
      }, { rootMargin: '-300px 0px 0px 0px' }).observe(hero);
    }
    $$('[data-dsticky-close]').forEach(function (b) {
      b.addEventListener('click', function () {
        cerrada = true; if (session) session.setItem('barra_cerrada', '1'); pintarBarra();
        if (dshow && !dshow.hidden) dshow.focus();
      });
    });
    if (dshow) dshow.addEventListener('click', function () {
      cerrada = false; if (session) session.removeItem('barra_cerrada'); pintarBarra();
      var f = $('input[name="telefono"]', dbar); if (f) setTimeout(function () { f.focus(); }, 300);
    });
    window.addEventListener('resize', pintarBarra);
  }

  // Plan elegido: se guarda en el campo oculto "plan" de cada formulario y se muestra como etiqueta.
  function marcarPlan(clave) {
    var p = planPorClave[clave];
    $$('input[name="plan"]').forEach(function (inp) { inp.value = clave; });
    $$('[data-plan-chip]').forEach(function (chip) {
      chip.hidden = !p;
      if (p) $('[data-plan-chip-text]', chip).textContent = p.nombre + ' (' + p.gb.replace(/[\[\]]/g, '') + ')';
    });
  }
  if (planURL) marcarPlan(planURL);

  // Banner del hero: plan de ?plan= (concordancia con el anuncio) o config.destacado.
  var pOferta = planPorClave[planURL] || planPorClave[C.destacado];
  $$('[data-offer]').forEach(function (box) {
    if (!pOferta) return;
    var p = pOferta;
    var set = function (sel, txt) { var el = $(sel, box); if (el) el.textContent = txt; };
    var tag = p.promo ? textoDescuento(p) : (p.etiqueta || (p.cincoG ? 'Red 5G' : ''));
    var tagEl = $('[data-offer-tag]', box);
    if (tagEl) { tagEl.textContent = tag; tagEl.hidden = !tag; }
    set('[data-offer-nombre]', p.nombre);
    set('[data-offer-gb]', p.gb.replace(/[\[\]]/g, ''));
    set('[data-offer-precio]', precioPlan(p));
    set('[data-offer-per]', p.promo ? 'al mes x ' + p.promo.meses + ' meses' : 'al mes');
    var antes = $('[data-offer-before]', box);
    if (antes) {
      antes.hidden = !p.promo;
      if (p.promo) { antes.textContent = 'Antes '; var s = doc.createElement('s'); s.textContent = 'S/ ' + p.precio; antes.appendChild(s); }
    }
    box.setAttribute('data-plan', p.clave);
    $$('[data-offer-cta]', box).forEach(function (b) { b.setAttribute('data-elegir-plan', p.clave); });
    $$('[data-offer-wa]', box).forEach(function (a) {
      a.setAttribute('data-plan', p.clave);
      a.setAttribute('data-wa-msg', 'Hola, quiero portarme a Bitel con el plan ' + p.nombre + '.');
      prepararWA(a);
    });
  });
  $$('[data-plan-chip-clear]').forEach(function (b) { b.addEventListener('click', function () { marcarPlan(''); }); });

  /* ---------- Modal "Lo quiero" (modals__banners): foto + resumen del plan + formulario ---------- */
  var modal = $('[data-plan-modal]');
  var ultimoFoco = null;
  // Bloquea el scroll del body mientras haya cualquier <dialog> abierto (contacto o legales).
  function actualizarBloqueo() { body.classList.toggle('modal-open', !!$('dialog[open]')); }
  function abrirModal(clave, ubicacion) {
    if (!modal || typeof modal.showModal !== 'function') return false;
    if (!clave) { var oculto = $('input[name="plan"]', modal); clave = oculto ? oculto.value : ''; }
    // El resumen del plan solo se muestra al venir de la parrilla de planes;
    // desde el banner u otros botones el modal sale limpio (el plan igual viaja oculto).
    var p = ubicacion === 'card' ? planPorClave[clave] : null;
    var caja = $('[data-pm-plan]', modal);
    if (caja) caja.hidden = !p;
    if (p && caja) {
      caja.hidden = false;
      $('[data-pm-nombre]', modal).textContent = p.nombre;
      $('[data-pm-gb]', modal).textContent = p.gb.replace(/[\[\]]/g, '');
      $('[data-pm-precio]', modal).textContent = p.promo ? p.promo.precio : p.precio;
      $('[data-pm-per]', modal).textContent = p.promo ? 'al mes x ' + p.promo.meses + ' meses\nluego S/ ' + p.precio : 'al mes';
    }
    // El WhatsApp del modal lleva el plan elegido en el mensaje.
    $$('[data-wa]', modal).forEach(function (a) {
      if (p) { a.setAttribute('data-wa-msg', 'Hola, quiero portarme a Bitel con el plan ' + p.nombre + '.'); a.setAttribute('data-plan', p.clave); }
      else { a.removeAttribute('data-wa-msg'); a.removeAttribute('data-plan'); }
      prepararWA(a);
    });
    if (!modal.open) {
      ultimoFoco = doc.activeElement;
      modal.showModal();
    }
    actualizarBloqueo();
    var tel = $('input[name="telefono"]', modal);
    if (tel) setTimeout(function () { tel.focus(); }, 60);
    window.dataLayer.push({ event: 'abrir_modal_plan', plan: clave || '', ubicacion: ubicacion || '', landing_version: VERSION });
    return true;
  }
  function cerrarModal() { if (modal && modal.open) modal.close(); }
  // Botones que abren el modal sin plan: barra promo, slide 1, menú, "Quiero cambiarme a Bitel".
  $$('[data-open-modal]').forEach(function (b) {
    b.addEventListener('click', function () {
      cerrarMenu();
      var ub = b.getAttribute('data-ubicacion') || '';
      if (ub === 'banner') window.dataLayer.push({ event: 'click_banner', plan: '', ubicacion: ub, landing_version: VERSION });
      if (!abrirModal('', ub)) { var f = $('#formulario'); if (f) f.scrollIntoView({ block: 'center' }); }
    });
  });
  if (modal) {
    $$('[data-pm-close]', modal).forEach(function (b) { b.addEventListener('click', cerrarModal); });
    // Clic en el fondo oscuro (fuera de la caja) cierra el modal.
    modal.addEventListener('click', function (e) { if (e.target === modal) cerrarModal(); });
    modal.addEventListener('close', function () {
      actualizarBloqueo();
      if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus({ preventScroll: true });
    });
  }

  /* ---------- Modales legales: términos y consentimiento ----------
     Se apilan ENCIMA del modal de contacto (showModal los pone arriba en la capa superior)
     y al cerrarlos el foco vuelve al botón que los abrió, dentro del formulario. */
  var TEXTOS_LEGALES = C.legal || {};
  $$('dialog[data-legal]').forEach(function (dlg) {
    var caja = $('[data-legal-text]', dlg);
    (TEXTOS_LEGALES[dlg.getAttribute('data-legal')] || []).forEach(function (parrafo) {
      var p = doc.createElement('p'); p.textContent = parrafo; caja.appendChild(p);
    });
    var origen = null;
    dlg._abrir = function (desde) { origen = desde; if (!dlg.open) dlg.showModal(); actualizarBloqueo(); };
    $$('[data-legal-close]', dlg).forEach(function (b) { b.addEventListener('click', function () { dlg.close(); }); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () {
      actualizarBloqueo();
      if (origen && origen.focus) origen.focus({ preventScroll: true });
    });
  });
  doc.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-open-legal]');
    if (!b) return;
    // Dentro de un <label>: no debe marcar ni desmarcar la casilla.
    e.preventDefault();
    e.stopPropagation();
    var tipo = b.getAttribute('data-open-legal');
    var dlg = $('dialog[data-legal="' + tipo + '"]');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    dlg._abrir(b);
    window.dataLayer.push({ event: tipo === 'terminos' ? 'abrir_modal_terminos' : 'abrir_modal_consentimiento', landing_version: VERSION });
  }, true);

  // "Lo quiero" y "Quiero portarme": llevan al formulario rápido (hero en escritorio, panel en móvil).
  doc.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-elegir-plan], a[href="#formulario"]');
    if (!b) return;
    var clave = b.getAttribute('data-elegir-plan');
    if (clave) {
      var ub = b.getAttribute('data-ubicacion') || 'card';
      marcarPlan(clave);
      window.dataLayer.push({ event: ub === 'banner' ? 'click_banner' : 'elegir_plan', plan: clave, ubicacion: ub, landing_version: VERSION });
      e.preventDefault();
      if (abrirModal(clave, ub)) return;
    }
    e.preventDefault();
    if (esMovil() && sheet) { abrirSheet(true); return; }
    var form = $('#formulario');
    if (!form) return;
    form.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    var first = $('input[name="telefono"]', form);
    if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 450);
  });

  /* ---------- Carrusel del hero: autoplay 5 s, pausa con mouse/foco, puntos, inert ---------- */
  var slider = $('[data-hero-slider]');
  if (slider && hsTrack) {
    var slides = $$('.hs-slide', hsTrack);
    var hsDots = $('[data-hs-dots]', slider);
    var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var activo = -1, timer = null, pausado = false;
    var puntos = slides.map(function (sl, i) {
      var d = doc.createElement('button');
      d.type = 'button'; d.className = 'hs-dot';
      d.setAttribute('aria-label', 'Ver promoción ' + (i + 1) + ' de ' + slides.length);
      d.addEventListener('click', function () { irSlide(i); reiniciar(); });
      if (hsDots) hsDots.appendChild(d);
      return d;
    });
    if (hsDots) hsDots.hidden = slides.length < 2;
    function marcar(i) {
      if (i === activo) return;
      activo = i;
      slides.forEach(function (sl, k) {
        if (k === i) sl.removeAttribute('inert'); else sl.setAttribute('inert', '');
        sl.setAttribute('aria-hidden', k === i ? 'false' : 'true');
      });
      puntos.forEach(function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    }
    function irSlide(i) {
      var n = (i + slides.length) % slides.length;
      hsTrack.scrollTo({ left: n * hsTrack.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' });
      marcar(n);
    }
    function avanzar() { if (!pausado && !doc.hidden) irSlide(activo + 1); }
    function reiniciar() {
      if (timer) clearInterval(timer);
      timer = (!reduceMotion && slides.length > 1) ? setInterval(avanzar, 5000) : null;
    }
    var hsPend = false;
    hsTrack.addEventListener('scroll', function () {
      if (hsPend) return; hsPend = true;
      requestAnimationFrame(function () { hsPend = false; marcar(Math.round(hsTrack.scrollLeft / Math.max(1, hsTrack.clientWidth))); });
    }, { passive: true });
    slider.addEventListener('mouseenter', function () { pausado = true; });
    slider.addEventListener('mouseleave', function () { pausado = false; });
    slider.addEventListener('focusin', function () { pausado = true; });
    slider.addEventListener('focusout', function (e) { if (!slider.contains(e.relatedTarget)) pausado = false; });
    hsTrack.addEventListener('pointerdown', reiniciar);
    hsTrack.addEventListener('touchstart', reiniciar, { passive: true });
    window.addEventListener('resize', function () { hsTrack.scrollLeft = activo * hsTrack.clientWidth; });

    // Clic en el slide (fuera de botones y enlaces) = abre el modal con el plan del slide.
    hsTrack.addEventListener('click', function (e) {
      if (e.target.closest('a, button, input, label')) return;
      var sl = e.target.closest('.hs-slide');
      if (!sl) return;
      var clave = sl.getAttribute('data-slide-plan') || '';
      window.dataLayer.push({ event: 'click_banner', plan: clave, ubicacion: 'banner', landing_version: VERSION });
      if (clave) marcarPlan(clave);
      abrirModal(clave, 'banner');
    });
    marcar(0);
    reiniciar();
  }

  /* ---------- Titular dinámico (concordancia con el anuncio) ---------- */
  function pintarTitular(el, texto) {
    // *tramo* se pinta en amarillo. Se construye con nodos de texto (sin innerHTML).
    el.textContent = '';
    // Titulares largos (ej. desde ?titulo=) bajan un nivel de tamaño para no pasar de 2-3 líneas.
    el.toggleAttribute('data-largo', String(texto).replace(/\*/g, '').length > 30);
    String(texto).split('*').forEach(function (parte, i) {
      if (!parte) return;
      if (i % 2 === 1) {
        var span = doc.createElement('span'); span.className = 'hl'; span.textContent = parte; el.appendChild(span);
      } else {
        el.appendChild(doc.createTextNode(parte));
      }
    });
  }
  var H = C.titulares || {};
  var titulo = null;
  var tituloURL = params.get('titulo');
  if (tituloURL) {
    titulo = tituloURL.replace(/[<>{}\[\]]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
  } else if (planURL && H.porPlan && H.porPlan[planURL]) {
    titulo = H.porPlan[planURL];
  }
  $$('[data-headline]').forEach(function (el) {
    if (titulo) pintarTitular(el, titulo);
    else if (!el.textContent.trim() && H.porDefecto) pintarTitular(el, H.porDefecto);
  });
  if (titulo) doc.title = titulo.replace(/\*/g, '') + ' | ' + (C.marca || '');

  /* ---------- Formulario de lead ---------- */
  var REGLAS = {
    nombre: function (v) { return v.trim().length >= 3 ? '' : 'Escribe tu nombre y apellido.'; },
    dni: function (v) { return /^\d{8}$/.test(v) || /^(10|20)\d{9}$/.test(v) ? '' : 'Ingresa tu DNI (8 dígitos) o RUC (11 dígitos).'; },
    telefono: function (v) { return /^9\d{8}$/.test(v) ? '' : 'Ingresa un celular de 9 dígitos que empiece en 9.'; },
    operador: function (v) { return v ? '' : 'Elige tu operador actual.'; },
    privacidad: function (v, el) { return el.checked ? '' : 'Necesitamos tu autorización para contactarte.'; }
  };

  function validar(campo) {
    var regla = REGLAS[campo.name];
    if (!regla) return true;
    var msg = regla(campo.value || '', campo);
    var err = doc.getElementById(campo.getAttribute('aria-describedby') ? campo.getAttribute('aria-describedby').split(' ').pop() : '');
    campo.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg;
    return !msg;
  }

  $$('form[data-lead-form]').forEach(function (form) {
    // Campos ocultos de atribución.
    CAMPOS_ATRIB.concat(['landing_version', 'landing_url']).forEach(function (k) {
      var inp = form.querySelector('input[name="' + k + '"]');
      if (!inp) { inp = doc.createElement('input'); inp.type = 'hidden'; inp.name = k; form.appendChild(inp); }
      inp.value = k === 'landing_version' ? VERSION : k === 'landing_url' ? location.origin + location.pathname : (atrib[k] || '');
    });

    // Solo dígitos en DNI y celular.
    $$('input[inputmode="numeric"]', form).forEach(function (inp) {
      inp.addEventListener('input', function () {
        var limpio = inp.value.replace(/\D/g, '').slice(0, +inp.getAttribute('maxlength') || 9);
        if (limpio !== inp.value) inp.value = limpio;
      });
    });

    // Valida al salir del campo y corrige en vivo si ya tenía error.
    $$('input, select', form).forEach(function (campo) {
      if (!REGLAS[campo.name] || campo.type === 'hidden') return;
      campo.addEventListener('blur', function () { if (campo.value || campo.type === 'checkbox') validar(campo); });
      campo.addEventListener(campo.tagName === 'SELECT' || campo.type === 'checkbox' ? 'change' : 'input', function () {
        if (campo.getAttribute('aria-invalid') === 'true') validar(campo);
      });
    });

    var enviando = false;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (enviando) return;
      var status = $('[data-form-status]', form);
      if (status) status.textContent = '';

      var primerError = null;
      $$('input, select', form).forEach(function (campo) {
        if (REGLAS[campo.name] && campo.type !== 'hidden' && !validar(campo) && !primerError) primerError = campo;
      });
      if (primerError) { primerError.focus(); return; }

      var btn = $('button[type="submit"]', form);
      var textoBtn = btn.innerHTML;
      enviando = true;
      btn.setAttribute('aria-busy', 'true');
      btn.disabled = true;
      btn.textContent = 'Enviando…';

      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      data.privacidad = !!(form.privacidad && form.privacidad.checked);
      data.publicidad = !!(form.publicidad && form.publicidad.checked);
      data.fecha = new Date().toISOString();

      // Overlay de carga a pantalla completa mientras se envía; se oculta si falla.
      // Es un <dialog> para quedar ENCIMA del modal de contacto (capa superior del navegador).
      var cargando = $('[data-loading]');
      if (cargando && typeof cargando.showModal === 'function' && !cargando.open) cargando.showModal();
      function ocultarCarga() { if (cargando && cargando.open) cargando.close(); }

      function exito() {
        if (session) session.setItem('lead_pendiente', JSON.stringify({ version: VERSION, plan: data.plan, t: Date.now() }));
        track('envio_formulario', 'envioFormulario', { plan: data.plan }, function () {
          location.href = (C.formulario && C.formulario.paginaGracias || 'gracias.html') + '?v=' + encodeURIComponent(VERSION);
        });
      }
      function fallo() {
        ocultarCarga();
        enviando = false;
        btn.removeAttribute('aria-busy'); btn.disabled = false; btn.innerHTML = textoBtn;
        if (status) {
          status.innerHTML = 'No pudimos enviar tus datos. Inténtalo otra vez o escríbenos por <a data-wa data-ubicacion="error-form" href="' + esc(waHref) + '" target="_blank" rel="noopener">WhatsApp</a>.';
        }
      }

      var endpoint = C.formulario && C.formulario.endpoint;
      if (isPlaceholder(endpoint)) {
        if (window.console) console.info('[envío simulado] Configura formulario.endpoint en config.js', data);
        return setTimeout(exito, 900); // en modo simulado se espera para que se vea el overlay
      }
      var ctrl = 'AbortController' in window ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 12000);
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (r) {
        clearTimeout(timer);
        if (r.ok) exito(); else fallo();
      }).catch(function () { clearTimeout(timer); fallo(); });
    });
  });

  /* ---------- Contador de la promo (versión C) ---------- */
  var cdWrap = $('[data-countdown-wrap]');
  var P = C.promo || {};
  $$('[data-vigencia]').forEach(function (el) { el.textContent = P.vigenciaTexto || ''; });
  if (cdWrap) {
    var fin = P.fin ? new Date(P.fin).getTime() : NaN;
    if (isNaN(fin) || fin <= Date.now()) {
      cdWrap.hidden = true; // sin fecha real no hay contador: nada de urgencia falsa
    } else {
      var partes = { d: $('[data-cd="d"]'), h: $('[data-cd="h"]'), m: $('[data-cd="m"]'), s: $('[data-cd="s"]') };
      var tick = function () {
        var r = Math.max(0, fin - Date.now());
        var v = { d: Math.floor(r / 864e5), h: Math.floor(r / 36e5) % 24, m: Math.floor(r / 6e4) % 60, s: Math.floor(r / 1e3) % 60 };
        Object.keys(v).forEach(function (k) { if (partes[k]) partes[k].textContent = String(v[k]).padStart(2, '0'); });
        if (r <= 0) { clearInterval(intervalo); cdWrap.hidden = true; }
      };
      var intervalo = setInterval(tick, 1000);
      tick();
    }
  }

  /* ---------- CTA sticky en móvil: aparece al pasar el CTA del hero ---------- */
  var sticky = $('[data-sticky-cta]');
  var trigger = $('[data-sticky-trigger]');
  if (sticky && trigger && 'IntersectionObserver' in window) {
    var formVisible = false, triggerVisible = true;
    var actualizar = function () { sticky.classList.toggle('is-visible', !triggerVisible && !formVisible); };
    new IntersectionObserver(function (en) { triggerVisible = en[0].isIntersecting || en[0].boundingClientRect.top > 0; actualizar(); }).observe(trigger);
    var f = $('#formulario');
    if (f) new IntersectionObserver(function (en) { formVisible = en[0].isIntersecting; actualizar(); }, { threshold: 0.15 }).observe(f);
  }

  // Volver con "atrás" desde gracias restaura la página desde caché con el overlay visible:
  // se recarga para dejar formularios y overlay en su estado inicial.
  window.addEventListener('pageshow', function (e) {
    var ov = $('[data-loading]');
    if (e.persisted && ov && ov.open) location.reload();
  });
  // El overlay de carga no se cierra con Esc.
  $$('[data-loading]').forEach(function (ov) { ov.addEventListener('cancel', function (e) { e.preventDefault(); }); });

  /* ---------- Página de gracias: conversión principal (una sola vez) ---------- */
  var vOrigen = params.get('v');
  $$('[data-volver]').forEach(function (a) {
    if (/^[abc]$/.test(vOrigen || '')) a.href = 'portabilidad-' + vOrigen + '.html';
  });

  if (body.getAttribute('data-page') === 'gracias') {
    var pendiente = session && session.getItem('lead_pendiente');
    if (pendiente) {
      var info = {};
      try { info = JSON.parse(pendiente); } catch (e) { info = {}; }
      session.removeItem('lead_pendiente'); // recargar la página no duplica la conversión
      track('lead_confirmado', 'lead', { plan: info.plan || '', landing_version: info.version || '' });
    }
  }
})();
