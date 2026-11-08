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
  // Older browsers: no moveBefore, a moved node loses the focus. The shadow root inherits it from DocumentFragment.
  if (noMoveBefore) {
    await page.addScriptTag({
      content: "for (const c of [Element, DocumentFragment, Document]) delete c.prototype.moveBefore;",
    });
  }
  await page.addScriptTag({
    content: `customElements.define("ha-card", class extends HTMLElement { constructor() { super(); this.attachShadow({ mode: "open" }).innerHTML = "<slot></slot>"; } });`,
  });
  await page.addScriptTag({ content: src });
  const res = await page.evaluate(
    ({ states, entities, focus, next, FAILED }) => {
      window.calls = [];
      const hass = (st) => ({ states: st, entities, language: "en", user: { is_admin: true }, callService: (d, s, data) => window.calls.push(`${d}.${s} ${data.entity_id}`) });
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
  // First Enter opens the in-card confirmation popup (its OK button takes the focus), second confirms.
  await page.keyboard.press("Enter");
  const confirmOpen = await page.evaluate(() => !!document.querySelector("automation-monitor-card").shadowRoot.querySelector(".modal"));
  await page.keyboard.press("Enter");
  const calls = await page.evaluate(() => window.calls);
  await page.close();
  return { ...res, confirmOpen, calls, errors };
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
  assert.equal(r.confirmOpen, true);
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

// The section title toggle (role=button, aria-expanded) folds its list on Enter and Space and keeps the focus;
// the Clear all button next to it opens its popup and does not fold the list.
test("section toggle: Enter and Space fold the list and keep the focus, Clear all does not fold", async (t) => {
  if (skip) return t.skip(skip);
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setContent("<!doctype html><body><div id=root></div></body>");
  await page.addScriptTag({
    content: `customElements.define("ha-card", class extends HTMLElement { constructor() { super(); this.attachShadow({ mode: "open" }).innerHTML = "<slot></slot>"; } });`,
  });
  await page.addScriptTag({ content: src });
  await page.evaluate(
    ({ states, entities }) => {
      const el = document.createElement("automation-monitor-card");
      el.setConfig({ type: "custom:automation-monitor-card", show_linked: false });
      el.hass = { states, entities, language: "en", user: { is_admin: true }, callService: () => {} };
      document.getElementById("root").appendChild(el);
      el.shadowRoot.querySelector('[data-section="failed"] .toggle').focus();
    },
    { states, entities }
  );
  const state = () =>
    page.evaluate(() => {
      const sr = document.querySelector("automation-monitor-card").shadowRoot;
      return {
        expanded: sr.querySelector('[data-section="failed"] .toggle').getAttribute("aria-expanded"),
        items: !!sr.querySelector(".items"),
        focused: sr.activeElement?.classList.contains("toggle") ?? false,
        modal: !!sr.querySelector(".modal"),
      };
    });
  assert.deepEqual(await state(), { expanded: "false", items: false, focused: true, modal: false });
  await page.keyboard.press("Enter");
  assert.deepEqual(await state(), { expanded: "true", items: true, focused: true, modal: false });
  await page.keyboard.press(" ");
  assert.deepEqual(await state(), { expanded: "false", items: false, focused: true, modal: false });
  await page.evaluate(() => document.querySelector("automation-monitor-card").shadowRoot.querySelector('[data-action="reset_all"]').click());
  assert.deepEqual(await state(), { expanded: "false", items: false, focused: false, modal: true });
  await page.close();
  assert.deepEqual(errors, []);
});

// The focus given back after a re-render never scrolls the page: every focus() of the card passes preventScroll.
test("every focus() call of the card passes preventScroll: true", () => {
  const calls = src.match(/\.focus\([^)]*\)/g) ?? [];
  assert.ok(calls.length > 0);
  for (const call of calls) assert.match(call, /preventScroll:\s*true/, call);
});

// The mini card's detail button, used from the keyboard, is rendered again and gets the focus back without
// scrolling the page.
test("mini card detail button on Enter: the focus comes back without scrolling", async (t) => {
  if (skip) return t.skip(skip);
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setContent("<!doctype html><body style='margin:0'><div id=root></div></body>");
  await page.addScriptTag({
    content: `customElements.define("ha-card", class extends HTMLElement { constructor() { super(); this.attachShadow({ mode: "open" }).innerHTML = "<slot></slot>"; } });`,
  });
  await page.addScriptTag({ content: src });
  const res = await page.evaluate(
    ({ states, entities }) => {
      const args = [];
      const focus = HTMLElement.prototype.focus;
      HTMLElement.prototype.focus = function (opts) {
        args.push(opts ?? null);
        return focus.call(this, opts);
      };
      const el = document.createElement("automation-monitor-mini-card");
      el.setConfig({ type: "custom:automation-monitor-mini-card" });
      el.hass = { states, entities, language: "en", user: { is_admin: true }, callService: () => {} };
      document.getElementById("root").appendChild(el);
      el.shadowRoot.querySelector(".zoom").dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 0 }));
      return { zoomed: el._zoomed, focused: el.shadowRoot.activeElement?.classList.contains("zoom") ?? false, args };
    },
    { states, entities }
  );
  await page.close();
  assert.deepEqual(errors, []);
  assert.equal(res.zoomed, true);
  assert.equal(res.focused, true);
  assert.deepEqual(res.args, [{ preventScroll: true }]);
});
