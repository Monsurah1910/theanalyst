/* Portfolio interactions – plain JavaScript, no libraries. */
(function () {
  "use strict";
  var doc = document;
  var root = doc.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* 1. Light / dark theme (the first choice is set by a tiny script in <head>) */
  var tbtn = doc.getElementById("theme-toggle");
  function currentTheme() { return root.getAttribute("data-theme") === "dark" ? "dark" : "light"; }
  function syncToggle() {
    if (!tbtn) return;
    var dark = currentTheme() === "dark";
    tbtn.setAttribute("aria-pressed", dark ? "true" : "false");
    tbtn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  }
  if (tbtn) {
    syncToggle();
    tbtn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) { /* storage unavailable – fine */ }
      syncToggle();
    });
  }

  /* 2. Mobile menu */
  var menuBtn = doc.getElementById("menu-btn");
  var navLinks = doc.getElementById("nav-links");
  if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", function () {
      var open = navLinks.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navLinks.addEventListener("click", function (e) {
      if (e.target.tagName === "A") { navLinks.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); }
    });
  }

  /* 3. Reading-progress bar + active nav link */
  var bar = doc.getElementById("progress");
  function onScroll() {
    if (!bar) return;
    var h = root.scrollHeight - window.innerHeight;
    bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ")";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var links = [].slice.call(doc.querySelectorAll(".nav-links a[href^='#']"));
  if ("IntersectionObserver" in window && links.length) {
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (a) { a.classList.remove("active"); });
          map[en.target.id].classList.add("active");
        }
      });
    }, { rootMargin: "-35% 0px -55% 0px" });
    Object.keys(map).forEach(function (id) { var s = doc.getElementById(id); if (s) spy.observe(s); });
  }

  /* 4. Split text: hero name letter-by-letter, headings word-by-word */
  var h1 = doc.querySelector("[data-chars]");
  if (h1 && !reduce) {
    var label = h1.textContent;
    h1.setAttribute("aria-label", label);
    h1.textContent = "";
    label.split("").forEach(function (c, i) {
      var s = doc.createElement("span");
      s.className = "ch"; s.setAttribute("aria-hidden", "true");
      s.style.setProperty("--i", i);
      s.textContent = c === " " ? " " : c;
      h1.appendChild(s);
    });
  }
  [].slice.call(doc.querySelectorAll(".split")).forEach(function (el) {
    if (reduce) return;
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", words.join(" "));
    el.textContent = "";
    words.forEach(function (w, i) {
      var wm = doc.createElement("span"); wm.className = "wm"; wm.setAttribute("aria-hidden", "true");
      var ws = doc.createElement("span"); ws.className = "w"; ws.style.setProperty("--i", i); ws.textContent = w;
      wm.appendChild(ws); el.appendChild(wm);
      if (i < words.length - 1) el.appendChild(doc.createTextNode(" "));
    });
  });

  /* 5. Typewriter headline: types, holds, erases, moves to the next phrase */
  var tw = doc.getElementById("typed");
  if (tw && !reduce) {
    var phrases = (tw.getAttribute("data-phrases") || "").split("|").filter(Boolean);
    var pi = 0, ci = 0, del = false;
    (function tick() {
      var full = phrases[pi];
      if (!del) { ci++; } else { ci--; }
      tw.textContent = full.slice(0, ci);
      var wait = del ? 28 : 55 + Math.random() * 40;
      if (!del && ci === full.length) { del = true; wait = 1700; }
      else if (del && ci === 0) { del = false; pi = (pi + 1) % phrases.length; wait = 350; }
      setTimeout(tick, wait);
    })();
  }

  /* 6. Reveal on scroll, count-up numbers, growing bars */
  function countUp(el) {
    var m = el.textContent.match(/^(\D*?)([\d,]*\.?\d+)(.*)$/);
    if (!m || reduce) return;
    var target = parseFloat(m[2].replace(/,/g, ""));
    var dec = (m[2].split(".")[1] || "").length;
    var commas = m[2].indexOf(",") > -1;
    var t0 = null;
    function fmt(v) {
      var s = v.toFixed(dec);
      if (commas) { var p = s.split("."); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ","); s = p.join("."); }
      return m[1] + s + m[3];
    }
    el.textContent = fmt(0);
    (function step(ts) {
      if (!t0) t0 = ts;
      var k = Math.min(1, (ts - t0) / 1300);
      el.textContent = fmt(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  var reveals = [].slice.call(doc.querySelectorAll(".reveal"));
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        [].slice.call(en.target.querySelectorAll(".kpi b")).forEach(countUp);
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
  }
  [].slice.call(doc.querySelectorAll(".fact b")).forEach(function (b) {
    if (!reduce && "IntersectionObserver" in window) {
      var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { countUp(b); o.disconnect(); } });
      o.observe(b);
    }
  });

  /* 7. Interactive cards: pointer glow on all cards, gentle 3D tilt on smaller ones */
  var glowSel = ".card, .skill-box, .fact, .kpi, .tl-card, .cred-list li, .case, .looking, .index-card";
  var tiltSel = ".card:not(.wide), .skill-box, .fact, .kpi, .tl-card, .cred-list li, .looking";
  [].slice.call(doc.querySelectorAll(glowSel)).forEach(function (el) {
    el.classList.add("fx");
    var g = doc.createElement("span"); g.className = "glow"; g.setAttribute("aria-hidden", "true");
    el.insertBefore(g, el.firstChild);
    if (!fine) return;
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });
  if (fine && !reduce) {
    [].slice.call(doc.querySelectorAll(tiltSel)).forEach(function (el) {
      el.classList.add("tilt");
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        var max = r.width > 500 ? 1.2 : 3;
        el.style.transform = "perspective(900px) rotateX(" + (-y * max).toFixed(2) + "deg) rotateY(" + (x * max).toFixed(2) + "deg) translateY(-3px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* 8. Optional project screenshots (shown only if the image file exists) */
  var dlg = doc.getElementById("lightbox");
  var lbImg = dlg && dlg.querySelector("img");
  var lbCap = dlg && dlg.querySelector("p");
  [].slice.call(doc.querySelectorAll(".evidence")).forEach(function (box) {
    var buttons = [].slice.call(box.querySelectorAll("button"));
    var loaded = 0, settled = 0;
    buttons.forEach(function (btn) {
      var img = btn.querySelector("img");
      function done(ok) {
        settled++;
        if (ok) { loaded++; btn.hidden = false; } else { btn.hidden = true; }
        if (settled === buttons.length && loaded > 0) box.hidden = false;
      }
      btn.hidden = true;
      img.addEventListener("load", function () { done(true); });
      img.addEventListener("error", function () { done(false); });
      if (img.complete) done(img.naturalWidth > 0);
      btn.addEventListener("click", function () {
        if (!dlg || !dlg.showModal) { window.open(img.src, "_blank", "noopener"); return; }
        lbImg.src = img.src; lbImg.alt = img.alt; lbCap.textContent = img.alt; dlg.showModal();
      });
    });
  });
  if (dlg) {
    var close = dlg.querySelector(".lb-close");
    if (close) close.addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  }

  /* 9. Contact form (Formspree) */
  var form = doc.getElementById("contact-form");
  var status = doc.getElementById("form-status");
  if (form && window.fetch) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.className = "form-status"; status.textContent = "Sending…";
      fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (r) {
          if (!r.ok) throw new Error("failed");
          form.reset(); status.className = "form-status ok"; status.textContent = "Thank you – your message has been sent.";
        })
        .catch(function () {
          status.className = "form-status err";
          status.textContent = "Sorry, that didn't send. Please email me directly using the link on this page.";
        });
    });
  }

  var y = doc.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
