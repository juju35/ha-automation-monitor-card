// Mock Home Assistant registry and states shaped like the Automation Monitor integration, used to
// render screenshots. Entity ids are in French on purpose: the cards never rely on them.
export const states = {};
export const entities = {};

const minutesAgo = (m) => new Date(Date.now() - m * 60e3).toISOString();
const state = (entity_id, value, attributes = {}) => (states[entity_id] = { entity_id, state: String(value), attributes });

// Automations, scripts and scenes referenced by the sensors (with their editor id).
const automations = {
  "automation.arrosage_jardin": ["Arrosage du jardin", "1712345678901"],
  "automation.volets_coucher_soleil": ["Volets au coucher du soleil", "1712345678902"],
  "automation.notification_lave_linge": ["Notification fin du lave-linge", "1712345678903"],
  "automation.lumiere_entree": ["Lumière de l'entrée", "1712345678904"],
  "automation.chauffage_matin": ["Chauffage du matin", "1712345678905"],
  "automation.alarme_depart": ["Alarme au départ", "1712345678906"],
};
for (const [id, [name, uid]] of Object.entries(automations)) state(id, "on", { id: uid, friendly_name: name });
for (let i = 1; i <= 18; i++) state(`automation.autre_${i}`, "on", { id: `17000000000${i}`, friendly_name: `Automatisation ${i}` });
state("script.ambiance_soiree", "off", { friendly_name: "Ambiance soirée" });
state("scene.cinema", "2026-10-19T20:00:00+00:00", { id: "1712345600001", friendly_name: "Cinéma" });

const failure = (entity_id, minutes, error_step, error_message, consecutive_failures = 1) => ({
  entity_id,
  name: automations[entity_id][0],
  unique_id: automations[entity_id][1],
  last_error_time: minutesAgo(minutes),
  error_message,
  error_step,
  consecutive_failures,
});

const source = (entity_id) => ({
  entity_id,
  name: states[entity_id].attributes.friendly_name,
  unique_id: states[entity_id].attributes.id || null,
  domain: entity_id.split(".")[0],
});

const linked = (entity_id, name, minutes, referenced_by) => ({
  entity_id,
  name,
  state: "unavailable",
  device_id: null,
  unavailable_since: minutesAgo(minutes),
  referenced_by,
  referenced_by_details: referenced_by.map(source),
});

export const failures = [
  failure("automation.arrosage_jardin", 12, "action/1", "Error calling service: valve.open_valve - Timeout while communicating with the device", 3),
  failure("automation.volets_coucher_soleil", 95, "action/0/choose/1/sequence/0", "Template error: float got invalid input 'unavailable' when rendering '{{ states(\"sensor.luminosite\") | float < 50 }}'"),
  failure("automation.notification_lave_linge", 60 * 26, "action/2", "Action notify.mobile_app_iphone not found"),
];

export const unavailable = [
  linked("light.entree", "Plafonnier entrée", 45, ["automation.lumiere_entree", "automation.alarme_depart", "scene.cinema"]),
  linked("climate.radiateur_salon", "Radiateur salon", 60 * 5, ["automation.chauffage_matin", "script.ambiance_soiree"]),
];

const sensor = (entity_id, translation_key, list, key, icon) => {
  entities[entity_id] = { entity_id, device_id: null, platform: "automation_monitor", translation_key };
  state(entity_id, list.length, { [key]: list, icon });
};
sensor("sensor.automatisations_en_echec", "failed_automations", failures, "automations", "mdi:robot-confused");
sensor("sensor.entites_liees_indisponibles", "linked_entities_unavailable", unavailable, "entities", "mdi:lan-disconnect");

// Everything fine: both sensors at 0.
export const allGood = {
  "sensor.automatisations_en_echec": { state: "0", attributes: { automations: [], icon: "mdi:robot-confused" } },
  "sensor.entites_liees_indisponibles": { state: "0", attributes: { entities: [], icon: "mdi:lan-disconnect" } },
};
