import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./load.mjs";

const {
  AutomationMonitorCard,
  AutomationMonitorMiniCard,
  AutomationMonitorCardEditor,
  resolve,
  sameSig,
  esc,
  editorPath,
  excludedDevices,
  rtfFor,
  DIALOG_STYLE,
  STRINGS,
  lang,
  window: win,
} = load("automation-monitor-card.js", [
  "AutomationMonitorCard",
  "AutomationMonitorCardEditor",
  "rtfFor",
  "DIALOG_STYLE",
  "window",
  "AutomationMonitorMiniCard",
  "resolve",
  "sameSig",
  "esc",
  "editorPath",
  "excludedDevices",
  "STRINGS",
  "lang",
]);

const entities = {
  "sensor.failed": { entity_id: "sensor.failed", platform: "automation_monitor", translation_key: "failed_automations" },
  "sensor.linked": { entity_id: "sensor.linked", platform: "automation_monitor", translation_key: "linked_entities_unavailable" },
};
const failure = { entity_id: "automation.a", name: "A", last_error_time: "2026-10-24T10:00:00Z" };
const baseStates = () => ({
  "sensor.failed": { entity_id: "sensor.failed", state: "1", attributes: { automations: [failure] } },
  "sensor.linked": { entity_id: "sensor.linked", state: "0", attributes: { entities: [] } },
  "automation.a": { entity_id: "automation.a", state: "on", attributes: { id: "1" } },
  "light.kitchen": { entity_id: "light.kitchen", state: "off", attributes: {} },
});

const devices = {};
const card = (states) => {
  const el = new AutomationMonitorCard();
  el._config = {};
  el._hass = { states, entities, devices, language: "en" };
  return el;
};

test("resolve finds the sensors through the registry and caches on hass.entities", () => {
  const states = baseStates();
  const found = resolve({ entities, states });
  assert.equal(found.failed, "sensor.failed");
  assert.equal(found.linked, "sensor.linked");
  // Mutating the returned object must not leak into the cache.
  found.failed = "x";
  assert.equal(resolve({ entities, states }).failed, "sensor.failed");
});

test("an unrelated state change keeps the render signature", () => {
  const states = baseStates();
  const before = card(states)._signature();
  const after = card({ ...states, "light.kitchen": { ...states["light.kitchen"], state: "on" } })._signature();
  assert.ok(sameSig(before, after));
});

test("a change of a monitored sensor changes the render signature", () => {
  const states = baseStates();
  const before = card(states)._signature();
  const next = { ...states, "sensor.failed": { ...states["sensor.failed"], state: "2" } };
  assert.ok(!sameSig(before, card(next)._signature()));
});

test("esc escapes HTML text and attribute characters", () => {
  assert.equal(esc(`<img src=x onerror="a('b')">&`), "&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;");
});

test("the script editor link uses the script key (unique_id) when given", () => {
  const hass = { states: {} };
  assert.equal(editorPath(hass, "script.renamed", "ambiance_soiree"), "/config/script/edit/ambiance_soiree");
  assert.equal(editorPath(hass, "script.ambiance", undefined), "/config/script/edit/ambiance");
  assert.equal(editorPath(hass, "script.a", "x y"), "/config/script/edit/x%20y");
});

test("excluded devices are matched by id or name and cached on hass.devices", () => {
  const devs = { d1: { id: "d1", name: "Hall sensor" }, d2: { id: "d2", name: "Plug", name_by_user: "Kitchen plug" } };
  const hass = { devices: devs };
  const ids = excludedDevices(hass, { exclude_devices: ["kitchen plug", "d9"] });
  assert.deepEqual([...ids].sort(), ["d2", "d9", "kitchen plug"].sort());
  assert.equal(excludedDevices(hass, { exclude_devices: ["kitchen plug", "d9"] }), ids);
  // Another exclude_devices value, or a new device registry, is recomputed.
  assert.ok(excludedDevices(hass, { exclude_devices: ["Hall sensor"] }).has("d1"));
  assert.ok(!excludedDevices({ devices: { ...devs } }, { exclude_devices: ["kitchen plug"] }).has("d9"));
  assert.equal(excludedDevices(hass, {}), null);
});

test("setConfig folds the lists shortened by Show more back", () => {
  const el = new AutomationMonitorCard();
  el._expanded = { failed: true };
  el.setConfig({ max_items: 3 });
  assert.deepEqual({ ...el._expanded }, {});
});

test("a failed Refresh call stops the spin and the timer is cleared on disconnect", async () => {
  const el = card(baseStates());
  el._update = () => {};
  el._hass.callService = () => Promise.reject(new Error("unloaded"));
  el._onClick({ composedPath: () => [{ dataset: { action: "rebuild" } }], stopPropagation() {} });
  assert.equal(el._refreshing, true);
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(el._refreshing, false);
  assert.equal(el._refreshTimer, null);

  el._hass.callService = () => new Promise(() => {});
  el._onClick({ composedPath: () => [{ dataset: { action: "rebuild" } }], stopPropagation() {} });
  assert.ok(el._refreshTimer);
  el.disconnectedCallback();
  assert.equal(el._refreshTimer, null);
  assert.equal(el._refreshing, false);
});

test("the automations are only counted while the subtitle shows their number", () => {
  const states = baseStates();
  let walks = 0;
  const counting = (st) =>
    new Proxy(st, {
      ownKeys: (t) => {
        walks++;
        return Reflect.ownKeys(t);
      },
    });
  // A recent failure is in the subtitle: no count.
  const el = card(counting(states));
  el._signature();
  assert.equal(walks, 0);
  // No failure: the subtitle shows "N automations", which follows the number of automations.
  const clear = { ...states, "sensor.failed": { ...states["sensor.failed"], state: "0", attributes: { automations: [] } } };
  const before = card(clear)._signature();
  const more = { ...clear, "automation.b": { entity_id: "automation.b", state: "on", attributes: {} } };
  assert.ok(!sameSig(before, card(more)._signature()));
  assert.match(card(more)._render(), /2 automations/);
});

// Mini card detail button: a mini card whose renders are captured instead of patched into a DOM.
const zoomCard = (config = {}) => {
  const el = new AutomationMonitorMiniCard();
  el._config = config;
  el._hass = { states: baseStates(), entities, devices, language: config.language || "en" };
  el._update = () => {
    el.html = el._render();
  };
  el.shadowRoot.querySelector = () => null;
  el._update();
  return el;
};
const node = (localName) => ({ localName });
const click = (path, extra = {}) => ({ composedPath: () => path, stopPropagation() {}, detail: 1, ...extra });
const zoomButton = () => click([], { target: { closest: (sel) => (sel === ".zoom" ? {} : null) } });

test("the mini card detail button switches to the full card content and back", () => {
  const el = zoomCard();
  const full = card(el._hass.states);
  full._hass = el._hass;
  assert.match(el.html, /class="line crit/);
  assert.match(el.html, />Failed</);
  // Rightmost header element, after the status pill and the Refresh button.
  assert.match(el.html, /class="chip[\s\S]*?class="refresh[\s\S]*?<button class="zoom" title="Show the full card">[\s\S]*?<\/button>\s*<\/div>/);
  assert.equal(el.getCardSize(), 3);
  let stopped = false;
  el._zoomClick({ ...zoomButton(), stopPropagation: () => (stopped = true) });
  assert.equal(stopped, true);
  assert.equal(el._zoomed, true);
  assert.doesNotMatch(el.html, /class="line/);
  assert.equal(el.html.replace(/<button class="zoom"[\s\S]*?<\/button>/, ""), full._render());
  assert.match(el.html, /<button class="zoom" title="Back to the compact view">/);
  assert.equal(el.getCardSize(), full.getCardSize());
  assert.deepEqual({ ...el.getGridOptions() }, { ...full.getGridOptions() });
  el._zoomClick(zoomButton());
  assert.equal(el._zoomed, false);
  assert.match(el.html, /class="line crit/);
  assert.equal(el.getCardSize(), 3);
});

test("a click outside the mini card collapses it, a click inside or in a dialog does not", () => {
  const el = zoomCard({ language: "fr" });
  assert.match(el.html, /title="Afficher la carte complète"/);
  el._zoomClick(zoomButton());
  assert.match(el.html, /title="Revenir à la vue compacte"/);
  el._onUnzoom(click([node("div"), el, node("body")]));
  assert.equal(el._zoomed, true);
  for (const dialog of ["ha-more-info-dialog", "ha-dialog", "dialog"]) {
    el._onUnzoom(click([node("div"), node(dialog), node("body")]));
    assert.equal(el._zoomed, true, dialog);
  }
  // Other clicks on the card leave it as it is.
  el._zoomClick(click([el], { target: { closest: () => null } }));
  assert.equal(el._zoomed, true);
  el._onUnzoom(click([node("div"), node("body")]));
  assert.equal(el._zoomed, false);
  assert.match(el.html, /class="line crit/);
});

test("a click outside the card folds its sections, a click inside or in a dialog does not", () => {
  const el = card(baseStates());
  el._update = () => {};
  el.connectedCallback();
  const open = () => {
    el._folds = { failed: true };
    el._expanded = { failed: true };
  };
  open();
  el._onOutside(click([node("div"), el, node("body")]));
  assert.deepEqual({ ...el._folds }, { failed: true });
  for (const dialog of ["ha-more-info-dialog", "ha-dialog", "dialog"]) {
    el._onOutside(click([node("div"), node(dialog), node("body")]));
    assert.deepEqual({ ...el._expanded }, { failed: true }, dialog);
  }
  el._onOutside(click([node("div"), node("body")]));
  assert.deepEqual({ ...el._folds }, {});
  assert.deepEqual({ ...el._expanded }, {});
  el.disconnectedCallback();
});

test("Clear asks through the in-card popup: OK calls the service, Cancel, Escape or outside do not", async () => {
  const el = card(baseStates());
  el._update = () => {};
  el.connectedCallback();
  const calls = [];
  el._hass.callService = (domain, service, data) => calls.push(`${domain}.${service} ${JSON.stringify(data)}`);
  const openReset = () => {
    el._confirmClosedAt = 0; // the double-click guard is not what this test exercises
    el._onClick(click([{ dataset: { action: "reset", entity: "automation.a", label: "A" } }]));
  };
  // Cancel button.
  openReset();
  assert.match(el._confirm.text, /A/);
  el._onClick(click([{ dataset: { action: "confirm_cancel" } }]));
  assert.equal(el._confirm, null);
  // Escape.
  openReset();
  el._onKey({ key: "Escape", stopPropagation() {} });
  assert.equal(el._confirm, null);
  // A click outside the card.
  openReset();
  el._onOutside(click([node("div"), node("body")]));
  assert.equal(el._confirm, null);
  // A click elsewhere on the card neither acts nor closes.
  openReset();
  el._onClick(click([{ dataset: { action: "rebuild" } }]));
  assert.ok(el._confirm);
  assert.deepEqual(calls, []);
  // OK calls the service, for one automation and for all.
  el._onClick(click([{ dataset: { action: "confirm_ok" } }]));
  assert.equal(el._confirm, null);
  el._confirmClosedAt = 0;
  el._onClick(click([{ dataset: { action: "reset_all" } }]));
  el._onClick(click([{ dataset: { action: "confirm_ok" } }]));
  await new Promise((r) => setTimeout(r, 0));
  assert.deepEqual(calls, ['automation_monitor.reset {"entity_id":"automation.a"}', "automation_monitor.reset {}"]);
  // Right after a close, the rest of a double click on OK is swallowed.
  el._onClick(click([{ dataset: { action: "reset", entity: "automation.a", label: "A" } }]));
  assert.equal(el._confirm, null);
  el.disconnectedCallback();
});

test("zoom: false removes the mini card detail button, the full card has none", () => {
  const el = zoomCard({ zoom: false });
  assert.doesNotMatch(el.html, /class="zoom"/);
  assert.doesNotMatch(card(baseStates())._render(), /class="zoom"/);
});

const LANGS = ["fr", "de", "es", "sr", "sr-Latn", "it", "nl", "pt", "pl"];

test("I18N parity: every language has exactly the English keys and placeholders, and no empty text", () => {
  const keys = Object.keys(STRINGS.en).sort();
  const vars = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  assert.equal(Object.keys(STRINGS).sort().join(), ["en", ...LANGS].sort().join());
  for (const l of LANGS) {
    assert.ok(STRINGS[l], l);
    assert.deepEqual(Object.keys(STRINGS[l]).sort(), keys, l);
    for (const k of keys) {
      assert.equal(typeof STRINGS[l][k], "string", `${l}.${k}`);
      assert.ok(STRINGS[l][k].trim(), `${l}.${k} is empty`);
      assert.equal(vars(STRINGS[l][k]), vars(STRINGS.en[k]), `${l}.${k}`);
    }
  }
});

test("Serbian: no Latin letters in sr and no Cyrillic in sr-Latn, except brand names", () => {
  // Brand names and the {x} placeholders stay in Latin letters.
  const kept = /Automation Monitor|Home Assistant|\{\w+\}/g;
  for (const [k, v] of Object.entries(STRINGS.sr)) assert.doesNotMatch(v.replace(kept, ""), /[A-Za-z]/, `sr.${k}`);
  for (const [k, v] of Object.entries(STRINGS["sr-Latn"])) assert.doesNotMatch(v, /[\u0400-\u04FF]/, `sr-Latn.${k}`);
});

test("the language resolves to the full code, then the part before the dash, then English", () => {
  const of = (language) => lang({ language }, {});
  assert.equal(of("fr-FR"), "fr");
  assert.equal(of("sr-Latn"), "sr-Latn");
  assert.equal(of("sr"), "sr");
  assert.equal(of("it-IT"), "it");
  assert.equal(of("nl-BE"), "nl");
  assert.equal(of("pt"), "pt");
  // Brazilian Portuguese falls back to European Portuguese, on purpose.
  assert.equal(of("pt-BR"), "pt");
  assert.equal(of("pl-PL"), "pl");
  assert.equal(of("ja"), "en");
  // The card option comes first, then hass.locale, then hass.language.
  assert.equal(lang({ language: "fr", locale: { language: "sr-Latn" } }, {}), "sr-Latn");
  assert.equal(lang({ language: "sr-Latn" }, { language: "sr" }), "sr");
  // The relative times and dates follow the script: Latin in sr-Latn, Cyrillic in sr.
  assert.match(rtfFor("sr-Latn").format(-3, "minute"), /^[^\u0400-\u04FF]*$/);
  assert.match(rtfFor("sr").format(-3, "minute"), /[\u0400-\u04FF]/);
});

test("the editor offers Serbian in Cyrillic and Latin", () => {
  const ed = new AutomationMonitorCardEditor();
  ed._hass = { states: {}, language: "en" };
  ed._config = {};
  const opts = ed._schema().find((f) => f.name === "language").selector.select.options;
  const sr = opts.filter((o) => o.value.startsWith("sr")).map((o) => `${o.value}=${o.label}`);
  assert.equal(sr.join(), "sr=Српски,sr-Latn=Srpski (latinica)");
});

test("the editor offers every language of the card, with its own name", () => {
  const ed = new AutomationMonitorCardEditor();
  ed._hass = { states: {}, language: "en" };
  ed._config = {};
  const opts = ed._schema().find((f) => f.name === "language").selector.select.options;
  // Joined: the arrays come from the card's own realm.
  assert.equal(
    opts
      .filter((o) => o.value)
      .map((o) => o.value)
      .sort()
      .join(),
    Object.keys(STRINGS).sort().join(),
  );
  const label = (v) => opts.find((o) => o.value === v).label;
  assert.equal(label("it"), "Italiano");
  assert.equal(label("nl"), "Nederlands");
  assert.equal(label("pt"), "Português");
  assert.equal(label("pl"), "Polski");
});

test("the confirmation popup OK button is not a filled button", () => {
  const rule = DIALOG_STYLE.match(/\.modal \.btn\.primary \{([^}]*)\}/)[1];
  assert.match(rule, /color: var\(--am-blue-text\)/);
  assert.doesNotMatch(rule, /#fff|background: var\(--am-blue\)/);
});

test("the signature does not format relative times and the render reuses its data", () => {
  // One RelativeTimeFormat per language.
  assert.equal(rtfFor("fr"), rtfFor("fr"));
  const el = card(baseStates());
  let formats = 0;
  const realAgo = el._lastFailure;
  el._lastFailure = (d) => (formats++, realAgo.call(el, d));
  el._signature();
  assert.equal(formats, 0);
  // Same hass and configuration: the filtered and sorted lists are computed once.
  assert.equal(el._data(), el._data());
  el._hass = { ...el._hass };
  assert.notEqual(el._dataMemo.hass, el._hass);
  // A failure without a valid date: the subtitle falls back to the automation count, which the signature follows.
  const bad = baseStates();
  bad["sensor.failed"] = { ...bad["sensor.failed"], attributes: { automations: [{ ...failure, last_error_time: "?" }] } };
  const before = card(bad)._signature();
  const more = { ...bad, "automation.b": { entity_id: "automation.b", state: "on", attributes: {} } };
  assert.ok(!sameSig(before, card(more)._signature()));
});

test("Escape is listened in the capture phase while the popup is open, and the focus returns to Clear", () => {
  const added = [];
  const removed = [];
  const add = win.addEventListener;
  const remove = win.removeEventListener;
  win.addEventListener = (...a) => added.push(a);
  win.removeEventListener = (...a) => removed.push(a);
  try {
    const el = card(baseStates());
    el._update = () => {};
    let focused = 0;
    const opener = { dataset: { action: "reset", entity: "automation.a", label: "A" }, isConnected: true, focus: () => focused++ };
    el._onClick(click([opener]));
    assert.equal(added.length, 1);
    assert.equal(added[0][0], "keydown");
    assert.equal(added[0][2], true);
    let stopped = false;
    el._onKey({ key: "Escape", stopPropagation: () => (stopped = true) });
    assert.ok(stopped);
    assert.equal(el._confirm, null);
    assert.deepEqual(removed[0], added[0]);
    assert.equal(focused, 1);
    // Closed by a click elsewhere on the page: the focus stays there.
    el._confirmClosedAt = 0;
    el.connectedCallback();
    el._onClick(click([opener]));
    el._onOutside(click([node("div"), node("body")]));
    assert.equal(focused, 1);
    el.disconnectedCallback();
  } finally {
    win.addEventListener = add;
    win.removeEventListener = remove;
  }
});

test("a click outside a zoomed mini card with the popup open only closes the popup", () => {
  const el = zoomCard();
  el.connectedCallback();
  el._zoomClick(zoomButton());
  assert.equal(el._zoomed, true);
  el._onClick(click([{ dataset: { action: "reset_all" } }]));
  assert.ok(el._confirm);
  const outside = click([node("div"), node("body")]);
  el._onOutside(outside);
  el._onUnzoom(outside);
  assert.equal(el._confirm, null);
  assert.equal(el._zoomed, true);
  // The next click outside brings the compact view back.
  el._onUnzoom(click([node("div"), node("body")]));
  assert.equal(el._zoomed, false);
  el.disconnectedCallback();
});

test("the editor gives ha-form a new schema only when the language changes", () => {
  const ed = new AutomationMonitorCardEditor();
  ed.setConfig({ type: "custom:automation-monitor-card" });
  const hass = { states: {}, language: "en" };
  ed.hass = hass;
  const { schema, data } = ed._form;
  ed.hass = { ...hass, states: { "light.a": {} } };
  assert.equal(ed._form.schema, schema);
  assert.equal(ed._form.data, data);
  ed.hass = { ...hass, language: "de" };
  assert.notEqual(ed._form.schema, schema);
  ed.setConfig({ type: "custom:automation-monitor-card", max_items: 3 });
  assert.notEqual(ed._form.data, data);
  assert.equal(ed._form.data.max_items, 3);
});

test("a popup still open when the card is attached again keeps closing on Escape", () => {
  const listeners = new Set();
  const add = win.addEventListener;
  const remove = win.removeEventListener;
  win.addEventListener = (type, fn, capture) => listeners.add(`${type}|${capture}|${fn === el._onKey}`);
  win.removeEventListener = (type, fn, capture) => listeners.delete(`${type}|${capture}|${fn === el._onKey}`);
  const el = card(baseStates());
  try {
    el._update = () => {};
    el.connectedCallback();
    el._onClick(click([{ dataset: { action: "reset", entity: "automation.a", label: "A" } }]));
    assert.ok(listeners.has("keydown|true|true"));
    // Lovelace view change: the card is detached, cached, then attached again with the popup still open.
    el.disconnectedCallback();
    assert.ok(el._confirm);
    el.connectedCallback();
    assert.ok(listeners.has("keydown|true|true"));
    el._onKey({ key: "Escape", stopPropagation() {} });
    assert.equal(el._confirm, null);
    assert.ok(!listeners.has("keydown|true|true"));
    // Attached again with no popup open: no keydown listener is added.
    el.disconnectedCallback();
    el.connectedCallback();
    assert.ok(!listeners.has("keydown|true|true"));
  } finally {
    el.disconnectedCallback();
    win.addEventListener = add;
    win.removeEventListener = remove;
  }
});

test("the editor turns the former collapse_<list>: false option into expand_<list>: true", () => {
  const ed = new AutomationMonitorCardEditor();
  const events = [];
  ed.dispatchEvent = (ev) => events.push(ev);
  ed.setConfig({ type: "custom:automation-monitor-card", collapse_failed: false, collapse_linked: true, max_items: 3 });
  assert.deepEqual({ ...ed._config }, { type: "custom:automation-monitor-card", expand_failed: true, max_items: 3 });
  assert.equal(events.length, 1);
  assert.deepEqual({ ...events[0].detail.config }, { ...ed._config });
  // The migrated configuration given back by Home Assistant (or a configuration without the former
  // options) is kept as is, without a new config-changed event.
  ed.setConfig({ ...events[0].detail.config });
  ed.setConfig({ type: "custom:automation-monitor-card", expand_linked: true });
  assert.equal(events.length, 1);
  assert.deepEqual({ ...ed._config }, { type: "custom:automation-monitor-card", expand_linked: true });
});

test("the mini card editor, without list toggles, leaves the collapse_<list> options alone", () => {
  const { AutomationMonitorMiniCardEditor } = load("automation-monitor-card.js", ["AutomationMonitorMiniCardEditor"]);
  const ed = new AutomationMonitorMiniCardEditor();
  const events = [];
  ed.dispatchEvent = (ev) => events.push(ev);
  ed.setConfig({ type: "custom:automation-monitor-mini-card", collapse_failed: false });
  assert.equal(events.length, 0);
  assert.equal(ed._config.collapse_failed, false);
});
