// Browser test (Chromium through Playwright): at the narrowest sizes the cards allow (6 columns of the Sections
// view: 156-178 px on a phone, ~245 px on a tablet; the default size of the mini card) and wider, in every
// language, light and dark, with readable and unavailable sensors, nothing may overflow:
// the header keeps a readable title and keeps its chip and buttons inside the card, the section title buttons keep
// their text, list item names stay readable next to their time, and counter labels stay in their counter.
// Skipped when Playwright or Chromium is not installed, except in CI, where it must run.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { entities, states } from "../scripts/mock-states.mjs";

const src = readFileSync(new URL("../src/automation-monitor-card.js", import.meta.url), "utf8");
const LANGS = ["en", "fr", "de", "es", "it", "nl", "pt", "pl", "sr", "sr-Latn"];
const WIDTHS = [245, 300, 360, 420, 500];
// Phone widths of 6 columns of the Sections view (half of a 320-364 px section, less the gap).
const PHONE = [156, 178];
const FAILED = "sensor.automatisations_en_echec";
const LINKED = "sensor.entites_liees_indisponibles";
const VARIANTS = {
  normal: states,
  failedUnavailable: { ...states, [FAILED]: { ...states[FAILED], state: "unavailable", attributes: {} } },
  linkedUnavailable: { ...states, [LINKED]: { ...states[LINKED], state: "unavailable", attributes: {} } },
  // No known problem and an unreadable sensor: the longest chip label, "Sensor unavailable".
  sensorUnavailable: {
    ...states,
    [FAILED]: { ...states[FAILED], state: "unavailable", attributes: {} },
    [LINKED]: { ...states[LINKED], state: "0", attributes: { ...states[LINKED].attributes, entities: [] } },
  },
  allGood: {
    ...states,
    [FAILED]: { ...states[FAILED], state: "0", attributes: { ...states[FAILED].attributes, automations: [] } },
    [LINKED]: { ...states[LINKED], state: "0", attributes: { ...states[LINKED].attributes, entities: [] } },
  },
};
// HA's dark theme colours: the layout must not depend on the theme.
const DARK = "--primary-text-color:#e1e1e1;--secondary-text-color:#9b9b9b;--card-background-color:#1c1c1c;--secondary-background-color:#282828;background:#111;";
// About four characters of the 16px title, or of the 13px item name, stay visible.
const MIN_NAME = 36;
const MIN_ITEM_TITLE = 30;

let browser;
let skip = false;
before(async () => {
  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  } catch (err) {
    if (process.env.CI) throw err;
    skip = `Chromium not available: ${err.message.split("\n")[0]}`;
  }
});
after(() => browser?.close());

// Renders `type` (or the zoomed mini card: `zoomed`) at each width and language on one page and returns every
// overflow found. `chipLabel`: the status chip shows its whole label from that width up and, below it, is only cut
// when the title block is down to its minimum width (the chip never takes the title's room, nor the reverse).
const measure = async (type, config, { langs = LANGS, widths = WIDTHS, variants = { normal: states }, dark = false, chipLabel = false } = {}) => {
  const page = await browser.newPage({ colorScheme: dark ? "dark" : "light" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setContent(
    `<!doctype html><html><head><style>body { margin: 0; font-family: Roboto, "Segoe UI", Helvetica, Arial, sans-serif; ${dark ? DARK : ""} }
     .slot { margin: 8px; }</style></head><body><div id=root></div></body></html>`
  );
  await page.addScriptTag({
    content: `customElements.define("ha-card", class extends HTMLElement { constructor() { super(); this.attachShadow({ mode: "open" }).innerHTML = "<style>:host{display:block;overflow:hidden}</style><slot></slot>"; } });`,
  });
  await page.addScriptTag({ content: src });
  const problems = await page.evaluate(
    async ({ type, config, variants, entities, langs, widths, MIN_NAME, MIN_ITEM_TITLE, chipLabel }) => {
      // The width attributes come from a ResizeObserver: measure on the next frames, as the user sees the card.
      const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const out = [];
      const root = document.getElementById("root");
      const tag = type === "zoomed" ? "automation-monitor-mini-card" : type;
      for (const [variant, states] of Object.entries(variants))
      for (const language of langs)
        for (const width of widths) {
          const slot = document.createElement("div");
          slot.className = "slot";
          slot.style.width = `${width}px`;
          const el = document.createElement(tag);
          el.setConfig({ type: `custom:${tag}`, language, ...config });
          el.hass = { states, entities, language: "en", locale: { language: "en" }, callService: () => {} };
          slot.append(el);
          root.append(slot);
          if (type === "zoomed") el._setZoom(true);
          await frame();
          const sr = el.shadowRoot;
          const at = `${type} ${variant} ${language} ${width}px`;
          const card = sr.querySelector("ha-card").getBoundingClientRect();
          const r = (n) => n.getBoundingClientRect();
          const inside = (n, what) => {
            const b = r(n);
            if (b.width && (b.left < card.left - 0.5 || b.right > card.right + 0.5)) out.push(`${at}: ${what} outside the card (${b.left.toFixed(0)}-${b.right.toFixed(0)} vs ${card.left}-${card.right})`);
          };
          const clipped = (n, what) => {
            if (n.scrollWidth > n.clientWidth + 1) out.push(`${at}: ${what} text overflows (${n.scrollWidth} > ${n.clientWidth})`);
          };
          // Header: readable title, chip and buttons inside the card.
          const name = sr.querySelector(".header .name");
          if (r(name).width < MIN_NAME) out.push(`${at}: title ${r(name).width.toFixed(0)}px wide`);
          for (const sel of [".chip", ".refresh", ".zoom", ".logo"]) for (const n of sr.querySelectorAll(`.header ${sel}`)) inside(n, sel);
          // Icon buttons never shrink.
          for (const n of sr.querySelectorAll(".header .refresh, .header .zoom")) {
            const min = n.classList.contains("zoom") ? 24 : 28;
            if (r(n).width < min - 0.5) out.push(`${at}: ${n.className} shrunk to ${r(n).width.toFixed(0)}px`);
          }
          // The chip keeps its whole label where there is room for it.
          const txt = sr.querySelector(".header .chip .txt");
          const titles = sr.querySelector(".header .titles");
          const atMin = titles && r(titles).width <= parseFloat(getComputedStyle(titles).minWidth) + 1;
          if (chipLabel && txt && (!r(txt).width || txt.scrollWidth > txt.clientWidth + 0.5) && (width >= chipLabel || !atMin))
            out.push(`${at}: chip label "${txt.textContent}" cut (${r(txt).width.toFixed(0)}px of ${txt.scrollWidth}px), title ${r(titles).width.toFixed(0)}px`);
          // Section titles: the Clear all button keeps its text and does not cover the count.
          for (const t of sr.querySelectorAll(".section-title")) {
            for (const b of t.querySelectorAll(".btn")) {
              clipped(b, "section button");
              const count = t.querySelector(".count");
              if (count && r(b).right > r(count).left + 0.5) out.push(`${at}: section button over the count`);
              inside(b, "section button");
            }
            const count = t.querySelector(".count");
            if (count) inside(count, ".count");
          }
          // List items: the name stays readable, the time stays in the item.
          for (const item of sr.querySelectorAll(".item")) {
            const title = item.querySelector(".title");
            if (r(title).width < MIN_ITEM_TITLE) out.push(`${at}: item name "${title.textContent}" ${r(title).width.toFixed(0)}px wide`);
            const when = item.querySelector(".when");
            if (when && r(when).right > r(item).right + 0.5) out.push(`${at}: item time outside its item`);
            for (const b of item.querySelectorAll(".btn")) {
              if (r(b).right > r(item).right + 0.5) out.push(`${at}: item button "${b.textContent.trim()}" outside its item`);
              clipped(b, `item button "${b.textContent.trim()}"`);
            }
          }
          for (const l of sr.querySelectorAll(".line")) inside(l, "mini line");
          // Counters: the label stays in its counter.
          for (const c of sr.querySelectorAll(".counter")) {
            const lbl = c.querySelector(".lbl");
            clipped(lbl, `counter label "${lbl.textContent}"`);
            if (r(lbl).right > r(c).right + 0.5) out.push(`${at}: counter label "${lbl.textContent}" outside its counter`);
            clipped(c.querySelector(".n"), `counter value "${c.querySelector(".n").textContent}"`);
            inside(c, "counter");
          }
          slot.remove();
        }
      return out;
    },
    { type, config, variants, entities, langs, widths, MIN_NAME, MIN_ITEM_TITLE, chipLabel }
  );
  await page.close();
  assert.deepEqual(errors, []);
  return problems;
};

test("full card, both lists open: nothing overflows from 245 px up, in every language", async (t) => {
  if (skip) return t.skip(skip);
  const problems = await measure("automation-monitor-card", { expand_failed: true, expand_linked: true });
  assert.deepEqual(problems, []);
});

test("mini card at its default size and wider: readable title, nothing overflows, in every language", async (t) => {
  if (skip) return t.skip(skip);
  const problems = await measure("automation-monitor-mini-card", {});
  assert.deepEqual(problems, []);
});

// Phone: 6 columns of the Sections view are 156-178 px wide. Every card and variant, en / pl / sr-Latn, light and
// dark, readable and unavailable sensors.
for (const dark of [false, true])
  for (const type of ["automation-monitor-card", "automation-monitor-mini-card", "zoomed"])
    test(`${type} at phone width (${PHONE.join(", ")} and 245 px), ${dark ? "dark" : "light"}: nothing overflows`, async (t) => {
      if (skip) return t.skip(skip);
      const problems = await measure(type, { expand_failed: true, expand_linked: true }, { langs: ["en", "pl", "sr-Latn"], widths: [...PHONE, 245], variants: VARIANTS, dark });
      assert.deepEqual(problems, []);
    });

// The title block must not take the chip's room (it used to cut "Ready" to "Re…" at 320 px): from 245 px up to 500 px
// the chip shows its whole label (a smaller logo below 320 px, none below 280 px). The longest label, "Sensor
// unavailable" (a rare state), needs 320 px on the mini card and 360 px zoomed (one more button); narrower, it is
// only cut once the title is down to its few characters, its text staying in the tooltip.
const { sensorUnavailable, ...SHORT_LABELS } = VARIANTS;
for (const [type, from, fromLong] of [
  ["automation-monitor-card", 245, 245],
  ["automation-monitor-mini-card", 245, 320],
  ["zoomed", 245, 360],
])
  test(`${type}: the status chip shows its whole label from ${from} px ("Sensor unavailable" from ${fromLong} px) to 500 px (en, pl, sr-Latn)`, async (t) => {
    if (skip) return t.skip(skip);
    const opts = { langs: ["en", "pl", "sr-Latn"], widths: [245, 280, 320, 360, 420, 500] };
    const problems = [
      ...(await measure(type, {}, { ...opts, variants: SHORT_LABELS, chipLabel: from })),
      ...(await measure(type, {}, { ...opts, variants: { sensorUnavailable }, chipLabel: fromLong })),
    ];
    assert.deepEqual(problems, []);
  });

// A card in a container that sizes it by its content (layout-card, button-card, an inline-block, a flex row, an
// `auto` grid column) keeps a usable width, and in a `1fr 1fr` grid (layout-card, grid card, horizontal-stack) of
// 320, 360 or 500 px it shrinks to its column: no overflow, no card at 0 px; directly or wrapped in a <div>.
test("intrinsic-width containers: the cards keep a usable width and still fit a narrow 1fr column", async (t) => {
  if (skip) return t.skip(skip);
  const page = await browser.newPage();
  await page.setContent(
    `<!doctype html><body style="margin:0;font-family:Arial">${["", "-div"]
      .map(
        (k) => `<div id=inline${k} style="display:inline-block"></div><div id=flex${k} style="display:flex;width:600px"></div>
     <div id=auto${k} style="display:grid;grid-template-columns:auto;width:600px"></div><div id=autos${k} style="display:grid;grid-template-columns:auto auto"></div>
     <div id=fr320${k} style="display:grid;grid-template-columns:1fr 1fr;gap:8px;width:320px"></div>
     <div id=fr360${k} style="display:grid;grid-template-columns:1fr 1fr;gap:8px;width:360px"></div>
     <div id=fr500${k} style="display:grid;grid-template-columns:1fr 1fr;gap:8px;width:500px"></div>`
      )
      .join("")}</body>`
  );
  await page.addScriptTag({
    content: `customElements.define("ha-card", class extends HTMLElement { constructor() { super(); this.attachShadow({ mode: "open" }).innerHTML = "<style>:host{display:block;overflow:hidden}</style><slot></slot>"; } });`,
  });
  await page.addScriptTag({ content: src });
  const res = await page.evaluate(
    async ({ states, entities }) => {
      const out = [];
      // Each card directly in the container, and wrapped in a plain <div> (as some wrappers do).
      for (const wrapped of [false, true])
        for (const id of ["inline", "flex", "auto", "autos", "fr320", "fr360", "fr500"])
          for (const type of ["automation-monitor-card", "automation-monitor-mini-card"]) {
            const el = document.createElement(type);
            el.setConfig({ type: `custom:${type}` });
            el.hass = { states, entities, language: "en", callService: () => {} };
            const box = wrapped ? document.createElement("div") : el;
            if (wrapped) box.append(el);
            document.getElementById(wrapped ? `${id}-div` : id).append(box);
            out.push([wrapped ? `${id} (in a div)` : id, type, el]);
          }
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      return out.map(([id, type, el]) => {
        const grid = el.closest("body > div").getBoundingClientRect();
        const card = el.shadowRoot.querySelector("ha-card").getBoundingClientRect();
        return { id, type, width: Math.round(card.width), over: Math.round(card.right - grid.right), column: Math.round((grid.width - 8) / 2) };
      });
    },
    { states, entities }
  );
  await page.close();
  for (const { id, type, width, over, column } of res) {
    const k = `${id} ${type}`;
    if (id.startsWith("fr")) {
      assert.ok(width > 0 && width <= column + 0.5, `${k}: ${width}px in a ${column} px column`);
      assert.ok(over <= 0, `${k}: overflows its grid by ${over}px`);
    } else assert.ok(width >= 245, `${k}: ${width}px`);
  }
});
