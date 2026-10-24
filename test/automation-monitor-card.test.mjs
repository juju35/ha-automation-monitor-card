import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./load.mjs";

const { AutomationMonitorCard, resolve, sameSig, esc } = load("automation-monitor-card.js", [
  "AutomationMonitorCard",
  "resolve",
  "sameSig",
  "esc",
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
