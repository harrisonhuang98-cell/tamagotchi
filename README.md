# Bloom

A responsive, browser-local savings tracker and evolving virtual buddy. Built with plain HTML, CSS, and JavaScript. No dependencies or build step.

Open `index.html` in a browser, or serve this folder with any static server.

## GitHub Pages

1. Copy `index.html`, `styles.css`, `neon.css`, and `app.js` into the root of your GitHub repository.
2. In the repository, go to **Settings → Pages** and choose **Deploy from a branch**.
3. Select your branch and the **/ (root)** folder, then save.

All asset links are relative, so the site works on repository subpaths.

## Features

- Set a savings goal and name it.
- Record savings, use quick amount presets, and undo individual entries.
- Meet four stages at 0%, 25%, 50%, and 100% of your goal.
- Progress persists in localStorage in the same browser and origin. Private browsing, clearing website data, or switching browser/device may lose or separate progress.
- Optional synthesized sound, responsive layout, keyboard controls, and reduced-motion support.

This tracks money you enter; it does not move money or connect to a bank. Data stays on this device. Changing your goal recalculates the buddy’s stage against the new target.
