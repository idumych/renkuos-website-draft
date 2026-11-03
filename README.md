# Renku OS website — draft redesign

A draft of a new landing page for [Renku OS](https://renkuos.org/), the community-built fork of Haiku.

**Live preview:** https://idumych.github.io/renkuos-website-draft/

Design idea: *renku* is Japanese linked-verse poetry, so the page reads like a linked poem.
The palette is night ink with washi paper and a vermilion seal, the display type is the Shippori Mincho serif,
and sections are named after the verses of a renku (hokku, wakiku, ageku). The hero has a "constellation"
of linked nodes and a BeOS-style desktop vignette with yellow window tabs.

Plain static HTML/CSS/JS with no build step. Open `index.html` or serve the folder.

```
index.html
assets/style.css   all styles
assets/site.js     hero animation, terminal typing, scroll reveals, counters
assets/logo.png    current Renku OS wordmark
assets/seal.svg    favicon
```
