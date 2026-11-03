// Renku OS draft site: constellation hero, terminal typing, reveals, counters.
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Mobile menu
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("site-nav");
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });
  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", false); }
  });

  // Deskbar clock
  var clock = document.getElementById("clock");
  function tick() {
    var d = new Date();
    clock.textContent = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }
  tick(); setInterval(tick, 30000);

  // Constellation: verses (nodes) drift and link to their neighbours.
  var canvas = document.getElementById("constellation");
  var ctx = canvas.getContext("2d");
  var nodes = [], W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var mouse = { x: -9999, y: -9999 };
  function resize() {
    W = canvas.offsetWidth; H = canvas.offsetHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(Math.min(90, W * H / 16000));
    nodes = [];
    for (var i = 0; i < n; i++) {
      nodes.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
        r: Math.random() * 1.6 + .6, fire: Math.random() < .12
      });
    }
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    var LINK = 130;
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      if (!reduce) {
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > W) a.vx *= -1;
        if (a.y < 0 || a.y > H) a.vy *= -1;
        var mdx = a.x - mouse.x, mdy = a.y - mouse.y, md = Math.hypot(mdx, mdy);
        if (md < 120) { a.x += mdx / md * .6; a.y += mdy / md * .6; }
      }
      for (var j = i + 1; j < nodes.length; j++) {
        var b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          var alpha = (1 - d / LINK) * .35;
          ctx.strokeStyle = (a.fire || b.fire) ? "rgba(255,106,19," + alpha + ")" : "rgba(239,233,221," + alpha * .6 + ")";
          ctx.lineWidth = .7;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      ctx.fillStyle = a.fire ? "#ff6a13" : "rgba(239,233,221,.7)";
      ctx.beginPath(); ctx.arc(a.x, a.y, a.fire ? a.r + .8 : a.r, 0, Math.PI * 2); ctx.fill();
    }
    if (!reduce) requestAnimationFrame(draw);
  }
  canvas.parentElement.addEventListener("mousemove", function (e) {
    var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  canvas.parentElement.addEventListener("mouseleave", function () { mouse.x = mouse.y = -9999; });
  window.addEventListener("resize", resize);
  resize(); draw();

  // Terminal: a short linked exchange, typed out.
  var term = document.getElementById("term");
  var script = [
    ["~> ", "uname -o"],
    ["", "Renku"],
    ["~> ", "git clone https://github.com/RenkuOS/Source"],
    ["", "Cloning into 'Source'... done."],
    ["~> ", "cd Source && git checkout -b my-first-verse"],
    ["", "Switched to a new branch 'my-first-verse'"],
    ["~> ", ""]
  ];
  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
  if (reduce) {
    term.innerHTML = script.map(function (l) { return (l[0] ? '<span class="p">' + l[0] + "</span>" : "") + esc(l[1]); }).join("\n");
  } else {
    var line = 0, ch = 0, html = "";
    (function type() {
      if (line >= script.length) return;
      var l = script[line];
      if (ch === 0 && l[0]) html += '<span class="p">' + l[0] + "</span>";
      if (!l[0]) { html += esc(l[1]) + "\n"; line++; ch = 0; term.innerHTML = html; return setTimeout(type, 350); }
      if (ch < l[1].length) { html += esc(l[1][ch++]); term.innerHTML = html; return setTimeout(type, 28 + Math.random() * 50); }
      if (line < script.length - 1) html += "\n";
      line++; ch = 0; term.innerHTML = html; setTimeout(type, 500);
    })();
  }

  // Screenshot gallery
  var thumbs = document.querySelectorAll("#thumbs button");
  var stageImg = document.getElementById("stage-img");
  var current = 0;
  function show(i) {
    current = (i + thumbs.length) % thumbs.length;
    var b = thumbs[current];
    thumbs.forEach(function (t) { t.removeAttribute("aria-current"); });
    b.setAttribute("aria-current", "true");
    document.getElementById("stage-title").textContent = b.dataset.title;
    document.getElementById("stage-desc").textContent = b.dataset.desc;
    document.getElementById("stage-count").textContent =
      String(current + 1).padStart(2, "0") + " / " + String(thumbs.length).padStart(2, "0");
    stageImg.classList.add("swap");
    var next = new Image();
    next.onload = function () {
      stageImg.src = b.dataset.src; stageImg.alt = b.dataset.alt;
      stageImg.width = b.dataset.w; stageImg.height = b.dataset.h;
      stageImg.classList.remove("swap");
    };
    next.src = b.dataset.src;
  }
  thumbs.forEach(function (b, i) { b.addEventListener("click", function () { show(i); }); });
  document.getElementById("thumbs").addEventListener("keydown", function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    show(current + (e.key === "ArrowRight" ? 1 : -1));
    thumbs[current].focus(); e.preventDefault();
  });
  var lb = document.getElementById("lightbox"), lbImg = document.getElementById("lb-img");
  document.getElementById("stage-open").addEventListener("click", function () {
    lbImg.src = stageImg.src; lbImg.alt = stageImg.alt;
    if (lb.showModal) lb.showModal(); else window.open(stageImg.src);
  });
  lb.addEventListener("click", function (e) { if (e.target === lb || e.target === lbImg) lb.close(); });

  // Scroll reveals and stat counters
  var els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || reduce) {
    els.forEach(function (el) { el.classList.add("in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target, siblings = el.parentElement.querySelectorAll(":scope > .reveal");
      el.style.transitionDelay = (Array.prototype.indexOf.call(siblings, el) * 90) + "ms";
      el.classList.add("in");
      var b = el.querySelector("[data-count]");
      if (b) count(b);
      io.unobserve(el);
    });
  }, { threshold: .15 });
  els.forEach(function (el) { io.observe(el); });

  function count(b) {
    var target = +b.dataset.count, pad = +(b.dataset.pad || 0), t0 = performance.now(), dur = 1400;
    (function step(t) {
      var p = Math.min(1, (t - t0) / dur), v = Math.round(target * (1 - Math.pow(1 - p, 3)));
      b.textContent = pad ? String(v).padStart(pad, "0") : v;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
})();
