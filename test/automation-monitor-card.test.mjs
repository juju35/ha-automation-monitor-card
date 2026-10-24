import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./load.mjs";

const { AutomationMonitorCard, resolve, sameSig, esc, editorPath, excludedDevices } = load("automation-monitor-card.js", [
  "AutomationMonitorCard",
  "resolve",
  "sameSig",
  "esc",
  "editorPath",
  "excludedDevices",
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
