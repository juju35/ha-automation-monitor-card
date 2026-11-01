// Browser test (Chromium through Playwright): at the narrowest sizes the cards allow (6 columns of the Sections
// view, ~245 px, the default size of the mini card) and a little wider, in every language, nothing may overflow:
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

// Renders `type` at each width and language on one page and returns every overflow found.
const measure = async (type, config) => {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setContent(
    `<!doctype html><html><head><style>body { margin: 0; font-family: Roboto, "Segoe UI", Helvetica, Arial, sans-serif; }
     .slot { margin: 8px; }</style></head><body><div id=root></div></body></html>`
  );
  await page.addScriptTag({
    content: `customElements.define("ha-card", class extends HTMLElement { constructor() { super(); this.attachShadow({ mode: "open" }).innerHTML = "<style>:host{display:block;overflow:hidden}</style><slot></slot>"; } });`,
  });
  await page.addScriptTag({ content: src });
  const problems = await page.evaluate(
    ({ type, config, states, entities, LANGS, WIDTHS, MIN_NAME, MIN_ITEM_TITLE }) => {
      const out = [];
      const root = document.getElementById("root");
      for (const language of LANGS)
        for (const width of WIDTHS) {
          const slot = document.createElement("div");
          slot.className = "slot";
          slot.style.width = `${width}px`;
          const el = document.createElement(type);
          el.setConfig({ type: `custom:${type}`, language, ...config });
          el.hass = { states, entities, language: "en", locale: { language: "en" }, callService: () => {} };
          slot.append(el);
          root.append(slot);
          const sr = el.shadowRoot;
          const at = `${type} ${language} ${width}px`;
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
          }
          // Counters: the label stays in its counter.
          for (const c of sr.querySelectorAll(".counter")) {
            const lbl = c.querySelector(".lbl");
            clipped(lbl, `counter label "${lbl.textContent}"`);
            if (r(lbl).right > r(c).right + 0.5) out.push(`${at}: counter label "${lbl.textContent}" outside its counter`);
          }
          slot.remove();
        }
      return out;
    },
    { type, config, states, entities, LANGS, WIDTHS, MIN_NAME, MIN_ITEM_TITLE }
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
