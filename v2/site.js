// Renku OS draft site: live nightly details and recent changes from GitHub,
// plus a screenshot viewer. The page stays usable without any of it, because
// its default links all go to the matching GitHub pages.
(function () {
  "use strict";
  var API = "https://api.github.com/repos/RenkuOS/Source/";
  var CACHE_MS = 10 * 60 * 1000; // GitHub allows 60 anonymous requests an hour

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

    var meta = document.getElementById("build-meta");
    var build = /build(\d+)/.exec(release.name || "");
    var commit = /\|\s*Commit\s*\|\s*([0-9a-f]{40})/.exec(release.body || "");
    if (!build || !built) return;
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
    }).slice(0, 8);
    if (!merged.length) return;
    document.getElementById("changes-list").replaceChildren.apply(
      document.getElementById("changes-list"),
      merged.map(function (p) {
        var li = document.createElement("li"), a = document.createElement("a"), time = document.createElement("time");
        a.href = p.html_url;
        a.textContent = p.title;
        time.dateTime = p.merged_at;
        time.textContent = formatDate(p.merged_at, false);
        li.append(a, time);
        return li;
      })
    );
  }

  // On failure the default links stay in place, so there is nothing else to do.
  getJSON("releases/tags/nightly").then(showRelease).catch(function () {});
  getJSON("pulls?state=closed&sort=updated&direction=desc&per_page=30").then(showChanges).catch(function () {});

  // Screenshot viewer
  var lb = document.getElementById("lightbox");
  if (!lb.showModal) return;
  var shots = Array.prototype.slice.call(document.querySelectorAll("#shots a"));
  var lbImg = document.getElementById("lb-img"), current = 0;
  function show(i) {
    current = (i + shots.length) % shots.length;
    var a = shots[current], thumb = a.querySelector("img");
    lbImg.src = a.href;
    lbImg.alt = thumb.alt;
    document.getElementById("lb-title").textContent = a.querySelector("span").textContent + ".";
    document.getElementById("lb-desc").textContent = a.dataset.desc;
  }
  shots.forEach(function (a, i) {
    a.addEventListener("click", function (e) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      show(i);
      lb.showModal();
    });
  });
  document.getElementById("lb-prev").addEventListener("click", function () { show(current - 1); });
  document.getElementById("lb-next").addEventListener("click", function () { show(current + 1); });
  lb.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });
  lb.addEventListener("close", function () { shots[current].focus(); });
  lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
})();
