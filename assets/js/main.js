(function () {
  "use strict";

  /* Envuelve cada init: un fallo aislado nunca tumba el resto de la página. */
  function safe(fn) { try { fn(); } catch (e) { /* silencioso en producción */ } }

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* --- 1. Secuencia de entrada del hero --------------------------------- */
  function initEnter() {
    document.body.classList.add("is-ready");
  }

  /* --- 2. Malla y rejilla reactivas al cursor ---------------------------- */
  function initPointer() {
    if (!finePointer || reduced) return;
    var hero = document.getElementById("inicio");
    var mesh = document.getElementById("mesh");
    var grid = document.getElementById("grid");
    var portrait = document.getElementById("portrait");
    var wide = window.matchMedia("(min-width: 1024px)");
    if (!hero || !mesh || !grid) return;

    var tx = 50, ty = 40, cx = 50, cy = 40, raf = null;

    function loop() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      var mx = cx.toFixed(2) + "%", my = cy.toFixed(2) + "%";
      mesh.style.setProperty("--mx", mx); mesh.style.setProperty("--my", my);
      grid.style.setProperty("--mx", mx); grid.style.setProperty("--my", my);

      /* El retrato se desplaza al contrario que la luz: profundidad, no movimiento. */
      if (portrait && wide.matches) {
        portrait.style.transform = "translate3d(" + ((50 - cx) * 0.045).toFixed(2) + "%,"
                                                  + ((50 - cy) * 0.03).toFixed(2) + "%,0)";
      }
      if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) { raf = requestAnimationFrame(loop); }
      else { raf = null; }
    }

    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 100;
      ty = ((e.clientY - r.top) / r.height) * 100;
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
  }

  /* --- 3. Inclinación sutil del Aspecto ---------------------------------- */
  function initTilt() {
    if (!finePointer) return;
    var el = document.getElementById("browser");
    if (!el) return;
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = "perspective(1100px) rotateY(" + (px * 5).toFixed(2) + "deg) rotateX(" + (-py * 4).toFixed(2) + "deg) translateY(-6px)";
    }, { passive: true });
    el.addEventListener("pointerleave", function () { el.style.transform = ""; });
  }

  /* --- 4. Revelado al hacer scroll -------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add("is-in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        entry.target.style.transitionDelay = (Math.min(i, 5) * 60) + "ms";
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -4% 0px" });

    Array.prototype.forEach.call(items, function (el) { io.observe(el); });

    /* Red de seguridad: nada puede quedarse invisible. */
    setTimeout(function () {
      document.querySelectorAll("[data-reveal]:not(.is-in)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-in");
      });
    }, 5000);
  }

  /* --- 5. Cabecera + sección activa -------------------------------------- */
  function initNav() {
    var nav = document.getElementById("nav");
    var links = document.querySelectorAll(".nav__links a");
    if (nav) {
      var onScroll = function () { nav.classList.toggle("is-stuck", window.scrollY > 40); };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    if (!links.length || !("IntersectionObserver" in window)) return;

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.setAttribute("aria-current", a.getAttribute("href") === "#" + entry.target.id ? "true" : "false");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    links.forEach(function (a) {
      var sec = document.querySelector(a.getAttribute("href"));
      if (sec) spy.observe(sec);
    });
  }

  /* --- 5a. Menú en móvil ------------------------------------------------ */
  function initMenu() {
    var btn = document.getElementById("toggle");
    var menu = document.getElementById("menu");
    if (!btn || !menu) return;

    function setOpen(open) {
      document.body.classList.toggle("menu-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.lastElementChild.textContent = open ? "Cerrar" : "Menú";
    }

    btn.addEventListener("click", function () {
      setOpen(!document.body.classList.contains("menu-open"));
    });

    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) {
        setOpen(false);
        btn.focus();
      }
    });
  }

  /* --- 6. Formulario ------------------ */
  function initForm() {
    var form = document.getElementById("form");
    var link = document.getElementById("f-send");
    var note = document.getElementById("form-note");
    var fallback = document.getElementById("fallback");
    var copyArea = document.getElementById("f-copy");
    var copyBtn = document.getElementById("f-copybtn");
    if (!form || !link) return;

    var DESTINO = "dima-dimi@hotmail.es";

    function compose() {
      var nombre = form.nombre.value.trim();
      var email = form.email.value.trim();
      var tipo = form.tipo.value;
      var mensaje = form.mensaje.value.trim();
      var cuerpo = "Hola Dmitry,\n\n" + mensaje + "\n\n—\n" + nombre + "\n" + email;
      var asunto = tipo + (nombre ? " — consulta de " + nombre : "");
      return {
        ok: !!(nombre && email && mensaje && email.indexOf("@") > 0),
        texto: "Para: " + DESTINO + "\nAsunto: " + asunto + "\n\n" + cuerpo,
        href: "mailto:" + DESTINO + "?subject=" + encodeURIComponent(asunto) + "&body=" + encodeURIComponent(cuerpo)
      };
    }

    function refresh() { link.setAttribute("href", compose().href); }
    form.addEventListener("input", refresh);
    refresh();

    function say(texto, destacado) {
      note.textContent = texto;
      note.style.color = destacado ? "var(--neon-2)" : "";
    }

    link.addEventListener("click", function (e) {
      var data = compose();

      if (!data.ok) {
        e.preventDefault();
        say("Faltan datos: necesito tu nombre, un email válido y el mensaje.", true);
        var vacio = !form.nombre.value.trim() ? form.nombre
                  : (form.email.value.indexOf("@") < 1 ? form.email : form.mensaje);
        vacio.focus();
        return;
      }

      link.setAttribute("href", data.href);
      say("Abriendo tu programa de correo con el mensaje listo para enviar.", true);

      /* Respaldo: si en un segundo seguimos aquí, damos el texto para copiar. */
      copyArea.value = data.texto;
      window.setTimeout(function () { fallback.hidden = false; }, 1000);
    });

    /* Enter dentro del formulario = pulsar el enlace de envío. */
    form.addEventListener("submit", function (e) { e.preventDefault(); link.click(); });

    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var hecho = false;
        try {
          copyArea.focus();
          copyArea.setSelectionRange(0, copyArea.value.length);
          hecho = document.execCommand("copy");
        } catch (err) { hecho = false; }

        if (!hecho && navigator.clipboard) {
          navigator.clipboard.writeText(copyArea.value).then(function () {
            copyBtn.textContent = "Mensaje copiado";
          }, function () {
            copyBtn.textContent = "Selecciónalo y cópialo";
          });
          return;
        }
        copyBtn.textContent = hecho ? "Mensaje copiado" : "Selecciónalo y cópialo";
      });
    }
  }

  /* --- 7. Año del pie ---------------------------------------------------- */
  function initYear() {
    var y = document.getElementById("year");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  function boot() {
    safe(initEnter);
    safe(initPointer);
    safe(initTilt);
    safe(initReveal);
    safe(initNav);
    safe(initMenu);
    safe(initForm);
    safe(initYear);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
