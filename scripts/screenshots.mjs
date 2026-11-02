// Renders the cards with mock Automation Monitor data and saves the README screenshots.
// Usage: npm run build && npm run screenshots
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { states, entities, allGood, NOW } from "./mock-states.mjs";
import { keep as keepPixels } from "./pixels.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const cardJs = readFileSync(`${root}dist/automation-monitor-card.js`, "utf8");
// New renders are written here first, and only replace a committed screenshot whose pixels they change.
const work = mkdtempSync(join(tmpdir(), "am-shots-"));

// Moves the new render `tmp` to screenshots/`name` unless the committed file shows the same pixels (scripts/pixels.mjs).
const keep = (tmp, name) => console.log(`screenshots/${name}${keepPixels(tmp, `${root}screenshots/${name}`) ? "" : " (unchanged)"}`);

const THEMES = {
  light: {
    "--primary-background-color": "#e8eaed",
    "--secondary-background-color": "#ececec",
    "--card-background-color": "#ffffff",
    "--primary-text-color": "#212121",
    "--secondary-text-color": "#727272",
    "--divider-color": "rgba(0,0,0,.12)",
  },
  dark: {
    "--primary-background-color": "#111111",
    "--secondary-background-color": "#282828",
    "--card-background-color": "#1c1c1c",
    "--primary-text-color": "#e1e1e1",
    "--secondary-text-color": "#9b9b9b",
    "--divider-color": "rgba(225,225,225,.12)",
  },
};

// Minimal stand-in for Home Assistant's <ha-card>.
const HA_CARD = `customElements.define("ha-card", class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML =
      "<style>:host{display:block;background:var(--card-background-color);border-radius:12px;" +
      "border:1px solid var(--divider-color);color:var(--primary-text-color);overflow:hidden}</style><slot></slot>";
  }
});`;

const page_html = (theme, width) => `<!doctype html><html><head><meta charset="utf-8">
<style>
  :root { ${Object.entries(THEMES[theme]).map(([k, v]) => `${k}:${v};`).join("")} }
  body { margin: 0; padding: 16px; background: var(--primary-background-color); color: var(--primary-text-color);
         font-family: Roboto, "Segoe UI", Helvetica, Arial, sans-serif; width: ${width}px; }
</style></head><body><div id="root"></div></body></html>`;

// Mounts a shot's card on a fresh page (the card script declares its classes and custom elements once per page) and
// returns it. The page clock is paused at NOW, the epoch of the mock timestamps: the relative times ("12 minutes
// ago") are the same in every shot and every frame however long the run takes (a running clock turned them into
// "13 minutes ago" midway, and every GIF changed on each run), and a transient state (the refresh spin) holds still.
async function openCard(browser, s) {
  const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1000, height: 2000 } });
  page.on("pageerror", (err) => console.error(`${s.file}: ${err.message}`));
  await page.clock.install({ time: NOW - 1000 });
  await page.clock.pauseAt(NOW);
  await page.setContent(page_html(s.theme, s.width));
  await page.addScriptTag({ content: HA_CARD });
  await page.addScriptTag({ content: cardJs });
  await page.evaluate(
    ({ type, config, states, entities, overrides, zoom }) => {
      for (const [id, o] of Object.entries(overrides || {})) states[id] = { ...states[id], ...o };
      const el = document.createElement(type);
      el.setConfig({ type: `custom:${type}`, ...config });
      el.hass = {
        states, entities, language: "en", locale: { language: "en" }, callService: () => {},
      };
      document.getElementById("root").appendChild(el);
      // A mouse click (detail 1) on the detail button: the zoomed-in view, without a keyboard focus ring.
      if (zoom)
        el.shadowRoot
          .querySelector(".zoom")
          .dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 1 }));
    },
    { type: s.type, config: s.config, states, entities, overrides: s.overrides, zoom: !!s.zoom }
  );
  // The width attributes (narrow, compact…) are set on the animation frame after the card's ResizeObserver runs, and
  // the paused clock holds animation frames: let a real frame go by (the observer), then run one frame of the clock.
  await page.waitForTimeout(50);
  await page.clock.runFor(20);
  return page;
}

// Every X / X-dark pair shares its config, overrides, clicks, zoom and width: only the theme differs.
const shots = [
  { file: "card", type: "automation-monitor-card", theme: "light", width: 460, config: {} },
  { file: "card-dark", type: "automation-monitor-card", theme: "dark", width: 460, config: {} },
  { file: "card-open", type: "automation-monitor-card", theme: "light", width: 460, config: {}, clicks: ['[data-section="failed"]', '[data-section="linked"]'] },
  { file: "card-open-dark", type: "automation-monitor-card", theme: "dark", width: 460, config: {}, clicks: ['[data-section="failed"]', '[data-section="linked"]'] },
  { file: "card-ok", type: "automation-monitor-card", theme: "light", width: 460, config: {}, overrides: allGood },
  { file: "card-ok-dark", type: "automation-monitor-card", theme: "dark", width: 460, config: {}, overrides: allGood },
  { file: "mini-card", type: "automation-monitor-mini-card", theme: "light", width: 380, config: {} },
  { file: "mini-card-dark", type: "automation-monitor-mini-card", theme: "dark", width: 380, config: {} },
  { file: "mini-card-ok", type: "automation-monitor-mini-card", theme: "light", width: 380, config: {}, overrides: allGood },
  { file: "mini-card-ok-dark", type: "automation-monitor-mini-card", theme: "dark", width: 380, config: {}, overrides: allGood },
  { file: "mini-card-zoom", type: "automation-monitor-mini-card", theme: "light", width: 460, config: {}, zoom: true },
  { file: "mini-card-zoom-dark", type: "automation-monitor-mini-card", theme: "dark", width: 460, config: {}, zoom: true },
];

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);
for (const s of shots) {
  const page = await openCard(browser, s);
  for (const sel of s.clicks || []) {
    await page.evaluate((sel) => document.querySelector("#root").firstElementChild.shadowRoot.querySelector(sel).click(), sel);
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(800);
  const box = await page.locator("#root").boundingBox();
  await page.screenshot({
    path: join(work, `${s.file}.png`),
    clip: { x: 0, y: 0, width: s.width + 32, height: Math.ceil(box.height) + 32 },
    animations: "disabled",
  });
  keep(join(work, `${s.file}.png`), `${s.file}.png`);
  await page.close();
}

// The Refresh button spinning while the entity list rebuilds, recorded as a looping GIF — needs ffmpeg on PATH. The
// clock is paused so the transient spin holds. Each frame sets the icon's rotation itself (inline transform, the CSS
// animation turned off): pausing the CSS animation and setting its currentTime was not reliably reflected in the
// screenshot (a compositor animation), so every run gave random angles and a new GIF. Each GIF is rendered once per
// theme (X.gif light, X-dark.gif dark), with the same setup.
const gifShot = (file, theme) => ({
  file: theme === "dark" ? `${file}-dark` : file,
  type: "automation-monitor-card",
  theme,
  width: 460,
  config: {},
});
const FPS = 20;
const SECONDS = 2;

// Halve the retina capture and build a per-clip palette: the colours stay clean and the file stays small. The
// palette comes from the frames and the dithering is ordered (Bayer, no random noise): the same frames give the
// same GIF.
const encodeGif = (dir, file, width) => {
  const out = join(work, `${file}.gif`);
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(dir, "f%03d.png"),
    "-vf", `scale=${width}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`,
    "-loop", "0", out,
  ]);
  rmSync(dir, { recursive: true });
  keep(out, `${file}.gif`);
};
async function recordRefreshing(gif) {
  const page = await openCard(browser, gif);
  await page.evaluate(() =>
    document
      .querySelector("#root")
      .firstElementChild.shadowRoot.querySelector('[data-action="rebuild"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 1 }))
  );
  await page.waitForTimeout(200);
  const box = await page.locator("#root").boundingBox();
  const clip = { x: 0, y: 0, width: gif.width + 32, height: Math.ceil(box.height) + 32 };
  const dir = mkdtempSync(join(tmpdir(), "am-frames-"));
  const frames = Math.round(FPS * SECONDS);
  for (let i = 0; i < frames; i++) {
    // am-spin: one turn per second, linear.
    await page.evaluate((deg) => {
      const icon = document.querySelector("#root").firstElementChild.shadowRoot.querySelector(".refresh.spin .icon");
      icon.style.animation = "none";
      icon.style.transform = `rotate(${deg}deg)`;
    }, (((i * 1000) / FPS) % 1000) * 0.36);
    await page.screenshot({ path: join(dir, `f${String(i).padStart(3, "0")}.png`), clip });
  }
  await page.close();
  encodeGif(dir, gif.file, clip.width);
}

// CSS "ease" (cubic-bezier(.25, .1, .25, 1)): progress at time fraction x, solved by bisection.
const ease = (x) => {
  const bez = (t, a, b) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (bez(mid, 0.25, 0.25) < x) lo = mid;
    else hi = mid;
  }
  return bez((lo + hi) / 2, 0.1, 1);
};

// The other animation of the card: a click on a section title folds or unfolds its list, turning the
// chevron (.2s ease transition). Like the spin above, each frame sets the chevron's angle itself.
async function recordFolding(fold) {
  const page = await openCard(browser, fold);
  const click = (sel) =>
    page.evaluate((sel) => document.querySelector("#root").firstElementChild.shadowRoot.querySelector(sel).click(), sel);
  // Unfold both sections once to size the clip on the tallest layout, then fold them back.
  await click('[data-section="failed"]');
  await click('[data-section="linked"]');
  await page.waitForTimeout(100);
  const box = await page.locator("#root").boundingBox();
  const clip = { x: 0, y: 0, width: fold.width + 32, height: Math.ceil(box.height) + 32 };
  await click('[data-section="failed"]');
  await click('[data-section="linked"]');
  await page.waitForTimeout(400);
  const dir = mkdtempSync(join(tmpdir(), "am-frames-"));
  let i = 0;
  const shoot = () => page.screenshot({ path: join(dir, `f${String(i++).padStart(3, "0")}.png`), clip });
  const hold = async (frames) => {
    for (let k = 0; k < frames; k++) await shoot();
  };
  // Clicks a section title and steps its chevron from -90deg (folded) to 0 or back, then leaves it to the CSS
  // (already at the same angle, so nothing animates).
  const chevron = (sel, deg) =>
    page.evaluate(
      ({ sel, deg }) => {
        const icon = document.querySelector("#root").firstElementChild.shadowRoot.querySelector(`${sel} .chevron`);
        icon.style.transition = "none";
        icon.style.transform = deg === null ? "" : `rotate(${deg}deg)`;
      },
      { sel, deg }
    );
  const turn = async (sel) => {
    const opening = await page.evaluate(
      (sel) => document.querySelector("#root").firstElementChild.shadowRoot.querySelector(sel).classList.contains("closed"),
      sel
    );
    await click(sel);
    const steps = Math.round(FPS * 0.2);
    for (let k = 0; k <= steps; k++) {
      const p = ease(k / steps);
      await chevron(sel, opening ? -90 * (1 - p) : -90 * p);
      await shoot();
    }
    await chevron(sel, null);
  };
  await hold(6); // both sections folded
  await turn('[data-section="failed"]');
  await hold(4);
  await turn('[data-section="linked"]');
  await hold(14); // both sections unfolded
  await turn('[data-section="failed"]');
  await turn('[data-section="linked"]');
  await hold(10); // folded again
  await page.close();
  encodeGif(dir, fold.file, clip.width);
}
for (const theme of ["light", "dark"]) {
  await recordRefreshing(gifShot("refreshing", theme));
  await recordFolding(gifShot("folding", theme));
}
await browser.close();
rmSync(work, { recursive: true, force: true });
