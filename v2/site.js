// Renku OS draft site: a still constellation, live nightly details and recent
// changes from GitHub, and the screenshot gallery. If GitHub can't be reached,
// the page's default links to the matching GitHub pages stay in place.
(function () {
  "use strict";
  var API = "https://api.github.com/repos/RenkuOS/Source/";
  var CACHE_MS = 10 * 60 * 1000; // GitHub allows 60 anonymous requests an hour

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

  // Constellation: verses (nodes) linked to their neighbours, drawn once.
  var canvas = document.getElementById("constellation");
  var ctx = canvas.getContext("2d");
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  function draw() {
    var W = canvas.offsetWidth, H = canvas.offsetHeight, LINK = 130, nodes = [];
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(Math.min(90, W * H / 16000));
    for (var i = 0; i < n; i++) {
      nodes.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + .6, fire: Math.random() < .12 });
    }
    nodes.forEach(function (a, i) {
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
    });
  }
  var lastWidth = 0;
  function redraw() {
    // Phones fire resize when the address bar hides; only redraw on real changes.
    if (canvas.offsetWidth !== lastWidth) { lastWidth = canvas.offsetWidth; draw(); }
  }
  window.addEventListener("resize", redraw);
  redraw();

  // Live data from GitHub
  function getJSON(path) {
    var key = "renku:" + path, cached = null;
    try { cached = JSON.parse(sessionStorage.getItem(key)); } catch (e) {}
    if (cached && Date.now() - cached.at < CACHE_MS) return Promise.resolve(cached.data);
    return fetch(API + path, { headers: { Accept: "application/vnd.github+json" } }).then(function (r) {
      if (!r.ok) throw new Error("GitHub returned " + r.status);
      return r.json();
    }).then(function (data) {
      try { sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data: data })); } catch (e) {}
      return data;
    });
  }

  function formatDate(iso, withYear) {
    var options = { day: "numeric", month: "short", timeZone: "UTC" };
    if (withYear) options.year = "numeric";
    return new Date(iso).toLocaleDateString("en-GB", options);
  }

  // Nightly filenames change with every build, so direct links have to be live.
  function showRelease(release) {
    var built = null;
    document.querySelectorAll(".downloads li").forEach(function (row) {
      var prefix = "RenkuOS-" + row.dataset.arch + "-";
      release.assets.forEach(function (asset) {
        if (asset.name.indexOf(prefix) !== 0) return;
        if (/\.iso$/.test(asset.name)) {
          row.querySelector(".btn").href = asset.browser_download_url;
          row.querySelector(".size").textContent = Math.round(asset.size / 1e6) + " MB";
          built = asset.updated_at;
        } else if (/\.iso\.sha256$/.test(asset.name)) {
          row.querySelector(".sum").href = asset.browser_download_url;
        }
      });
    });

    var build = /build(\d+)/.exec(release.name || "");
    var commit = /\|\s*Commit\s*\|\s*([0-9a-f]{40})/.exec(release.body || "");
    if (!build || !built) return;
    document.getElementById("hero-build").textContent = "Nightly build " + build[1];
    document.getElementById("stat-build").textContent = build[1];
    document.getElementById("stat-build-label").textContent = "the latest nightly build number";
    var meta = document.getElementById("build-meta");
    meta.textContent = "Build " + build[1] + " · built " + formatDate(built, true);
    if (commit) {
      var link = document.createElement("a");
      link.href = "https://github.com/RenkuOS/Source/commit/" + commit[1];
      link.textContent = commit[1].slice(0, 7);
      meta.append(" · commit ", link);
    }
  }

  function showChanges(pulls) {
    var merged = pulls.filter(function (p) { return p.merged_at; }).sort(function (a, b) {
      return b.merged_at.localeCompare(a.merged_at);
    }).slice(0, 6);
    if (!merged.length) return;
    var list = document.getElementById("changes-list");
    list.replaceChildren.apply(list, merged.map(function (p) {
      var li = document.createElement("li"), a = document.createElement("a"), time = document.createElement("time");
      a.href = p.html_url;
      a.textContent = p.title;
      time.dateTime = p.merged_at;
      time.textContent = formatDate(p.merged_at, false);
      li.append(a, time);
      return li;
    }));
  }

  getJSON("releases/tags/nightly").then(showRelease).catch(function () {});
  getJSON("pulls?state=closed&sort=updated&direction=desc&per_page=30").then(showChanges).catch(function () {});

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
    stageImg.src = b.dataset.src; stageImg.alt = b.dataset.alt;
    stageImg.width = b.dataset.w; stageImg.height = b.dataset.h;
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
})();
