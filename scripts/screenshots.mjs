// Renders the cards with mock Automation Monitor data and saves the README screenshots.
// Usage: npm run build && npm run screenshots
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { states, entities, allGood, NOW } from "./mock-states.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const cardJs = readFileSync(`${root}dist/automation-monitor-card.js`, "utf8");

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
// returns it. With freezeClock, timers are frozen so a transient state (the refresh spin) holds still for capture.
async function openCard(browser, s, { freezeClock = false } = {}) {
  const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1000, height: 2000 } });
  page.on("pageerror", (err) => console.error(`${s.file}: ${err.message}`));
  if (freezeClock) await page.clock.install({ time: NOW });
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
  return page;
}

const shots = [
  { file: "card", type: "automation-monitor-card", theme: "light", width: 460, config: {} },
  { file: "card-open", type: "automation-monitor-card", theme: "light", width: 460, config: {}, clicks: ['[data-section="failed"]', '[data-section="linked"]'] },
  { file: "card-dark", type: "automation-monitor-card", theme: "dark", width: 460, config: {}, clicks: ['[data-section="failed"]', '[data-section="linked"]'] },
  { file: "card-ok", type: "automation-monitor-card", theme: "light", width: 460, config: {}, overrides: allGood },
  { file: "mini-card", type: "automation-monitor-mini-card", theme: "light", width: 380, config: {} },
  { file: "mini-card-dark", type: "automation-monitor-mini-card", theme: "dark", width: 380, config: {} },
  { file: "mini-card-ok", type: "automation-monitor-mini-card", theme: "light", width: 380, config: {}, overrides: allGood },
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
    path: `${root}screenshots/${s.file}.png`,
    clip: { x: 0, y: 0, width: s.width + 32, height: Math.ceil(box.height) + 32 },
    animations: "disabled",
  });
  console.log(`screenshots/${s.file}.png`);
  await page.close();
}

// The Refresh button spinning while the entity list rebuilds, recorded as a looping GIF — needs ffmpeg on PATH. The
// clock is frozen so the transient spin holds; every animation is paused and stepped frame by frame, so the GIF is
// identical whatever the machine's speed.
const gif = { file: "refreshing", type: "automation-monitor-card", theme: "light", width: 460, config: {} };
const FPS = 20;
const SECONDS = 2;

// Halve the retina capture and build a per-clip palette: the colours stay clean and the file stays small.
const encodeGif = (dir, file, width) => {
  const out = `${root}screenshots/${file}.gif`;
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(dir, "f%03d.png"),
    "-vf", `scale=${width}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`,
    "-loop", "0", out,
  ]);
  rmSync(dir, { recursive: true });
  console.log(`screenshots/${file}.gif`);
};
{
  const page = await openCard(browser, gif, { freezeClock: true });
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
    await page.evaluate((t) => {
      for (const a of document.getAnimations()) {
        a.pause();
        a.currentTime = t;
      }
    }, (i * 1000) / FPS);
    await page.screenshot({ path: join(dir, `f${String(i).padStart(3, "0")}.png`), clip });
  }
  await page.close();
  encodeGif(dir, gif.file, clip.width);
}

// The other animation of the card: a click on a section title folds or unfolds its list, turning the
// chevron (.2s transition). The transitions are paused and stepped frame by frame like the spin above.
const fold = { file: "folding", type: "automation-monitor-card", theme: "light", width: 460, config: {} };
{
  const page = await openCard(browser, fold, { freezeClock: true });
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
  // Steps the chevron transition the click just started, then jumps it to its end state.
  const turn = async (sel) => {
    await click(sel);
    for (let k = 0; k <= Math.round(FPS * 0.2); k++) {
      await page.evaluate((t) => {
        for (const a of document.getAnimations()) {
          a.pause();
          a.currentTime = t;
        }
      }, (k * 1000) / FPS);
      await shoot();
    }
    await page.evaluate(() => {
      for (const a of document.getAnimations()) a.finish();
    });
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
await browser.close();
