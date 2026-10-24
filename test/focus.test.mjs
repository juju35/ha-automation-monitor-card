// Browser test (Chromium through Playwright): a list reordered while one of its buttons has the keyboard
// focus must not hand that focus to another row. Skipped when Playwright or Chromium is not installed,
// except in CI, where it must run. CHROMIUM_PATH points to a local Chromium if needed.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { entities, failures, states } from "../scripts/mock-states.mjs";

const src = readFileSync(new URL("../src/automation-monitor-card.js", import.meta.url), "utf8");
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

const FAILED = "sensor.automatisations_en_echec";

// Focuses the Reset button of `focus`, replaces the failure list by `next`, then presses Enter.
const run = async ({ focus, next, noMoveBefore = false }) => {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setContent("<!doctype html><body><div id=root></div></body>");
  // Older browsers: no Element.moveBefore, a moved node loses the focus.
  if (noMoveBefore) await page.addScriptTag({ content: "delete Element.prototype.moveBefore;" });
  await page.addScriptTag({
    content: `customElements.define("ha-card", class extends HTMLElement { constructor() { super(); this.attachShadow({ mode: "open" }).innerHTML = "<slot></slot>"; } });`,
  });
  await page.addScriptTag({ content: src });
  const res = await page.evaluate(
    ({ states, entities, focus, next, FAILED }) => {
      window.confirm = () => true;
      window.calls = [];
      const hass = (st) => ({ states: st, entities, language: "en", callService: (d, s, data) => window.calls.push(`${d}.${s} ${data.entity_id}`) });
      const el = document.createElement("automation-monitor-card");
      el.setConfig({ type: "custom:automation-monitor-card", expand_failed: true, show_linked: false });
      el.hass = hass(states);
      document.getElementById("root").appendChild(el);
      el.shadowRoot.querySelector(`button[data-action="reset"][data-entity="${focus}"]`).focus();
      el.hass = hass({ ...states, [FAILED]: { ...states[FAILED], state: String(next.length), attributes: { ...states[FAILED].attributes, automations: next } } });
      const tpl = document.createElement("template");
      tpl.innerHTML = el._html;
      const fresh = document.createElement("div");
      fresh.append(tpl.content.cloneNode(true));
      return { focused: el.shadowRoot.activeElement?.dataset?.entity ?? null, faithful: el.shadowRoot.innerHTML === fresh.innerHTML };
    },
    { states, entities, focus, next, FAILED }
  );
  await page.keyboard.press("Enter");
  const calls = await page.evaluate(() => window.calls);
  await page.close();
  return { ...res, calls, errors };
};

// A new failure of the second automation: it moves to the top (newest first) and shifts the first one.
const target = failures[0].entity_id;
const reordered = () => [{ ...failures[1], last_error_time: new Date().toISOString() }, failures[0], failures[2]];

test("reordered failures: the focus stays on the same automation and Enter resets it", async (t) => {
  if (skip) return t.skip(skip);
  const r = await run({ focus: target, next: reordered() });
  assert.deepEqual(r.errors, []);
  assert.equal(r.faithful, true);
  assert.equal(r.focused, target);
  assert.deepEqual(r.calls, [`automation_monitor.reset ${target}`]);
});

test("reordered failures without moveBefore: Enter never resets another automation", async (t) => {
  if (skip) return t.skip(skip);
  const r = await run({ focus: target, next: reordered(), noMoveBefore: true });
  assert.deepEqual(r.errors, []);
  assert.equal(r.faithful, true);
  assert.ok(r.focused === null || r.focused === target, `focus moved to ${r.focused}`);
  assert.ok(r.calls.every((c) => c.endsWith(` ${target}`)), `unexpected calls: ${r.calls}`);
});
