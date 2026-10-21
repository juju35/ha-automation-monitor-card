/*
 * Automation Monitor Card for Home Assistant
 * https://github.com/juju35/ha-automation-monitor-card
 *
 * Lovelace cards for the Automation Monitor integration (https://github.com/olli-dot-dev/ha-automation-monitor).
 * The two sensors of the integration are resolved through the entity registry (platform and
 * translation_key), so the cards work whatever the Home Assistant language or entity ids.
 */

const VERSION = "1.4.1";
const IMG_LOGO = "data:image/png;base64,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";
const INTEGRATION_SITE = "https://github.com/olli-dot-dev/ha-automation-monitor";
const PLATFORM = "automation_monitor";
const DEFAULT_MAX_ITEMS = 5;

const ICONS = {
  robot_alert:
    "M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A2.5,2.5 0 0,0 5,15.5A2.5,2.5 0 0,0 7.5,18A2.5,2.5 0 0,0 10,15.5A2.5,2.5 0 0,0 7.5,13M16.5,13A2.5,2.5 0 0,0 14,15.5A2.5,2.5 0 0,0 16.5,18A2.5,2.5 0 0,0 19,15.5A2.5,2.5 0 0,0 16.5,13Z",
  disconnect:
    "M4,1C2.89,1 2,1.89 2,3V7C2,8.11 2.89,9 4,9H1V11H13V9H10C11.11,9 12,8.11 12,7V3C12,1.89 11.11,1 10,1H4M4,3H10V7H4V3M14,13C12.89,13 12,13.89 12,15V19C12,20.11 12.89,21 14,21H11V23H23V21H20C21.11,21 22,20.11 22,19V15C22,13.89 21.11,13 20,13H14M3.88,13.46L2.46,14.88L4.59,17L2.46,19.12L3.88,20.54L6,18.41L8.12,20.54L9.54,19.12L7.41,17L9.54,14.88L8.12,13.46L6,15.59L3.88,13.46M14,15H20V19H14V15Z",
  check: "M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z",
  alert: "M13 14H11V9H13M13 18H11V16H13M1 21H23L12 2L1 21Z",
  clock:
    "M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z",
  step: "M3,3H9V7H3V3M15,10H21V14H15V10M15,17H21V21H15V17M13,13H7V18H13V20H7L5,20V9H7V11H13V13Z",
  repeat: "M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z",
  trace: "M2,2H4V20H22V22H2V2M7,10H17V13H7V10M11,15H21V18H11V15M6,4H22V8H20V6H8V8H6V4Z",
  edit: "M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z",
  reset: "M12,4C14.1,4 16.1,4.8 17.6,6.3C20.7,9.4 20.7,14.5 17.6,17.6C15.8,19.5 13.3,20.2 10.9,19.9L11.4,17.9C13.1,18.1 14.9,17.5 16.2,16.2C18.5,13.9 18.5,10.1 16.2,7.7C15.1,6.6 13.5,6 12,6V10.6L7,5.6L12,0.6V4M6.3,17.6C3.7,15 3.3,11 5.1,7.9L6.6,9.4C5.5,11.6 5.9,14.4 7.8,16.2C8.3,16.7 8.9,17.1 9.6,17.4L9,19.4C8,19 7.1,18.4 6.3,17.6Z",
  clear: "M5,13H19V11H5M3,17H17V15H3M7,7V9H21V7",
  refresh:
    "M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z",
  automation: "M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A2.5,2.5 0 0,0 5,15.5A2.5,2.5 0 0,0 7.5,18A2.5,2.5 0 0,0 10,15.5A2.5,2.5 0 0,0 7.5,13M16.5,13A2.5,2.5 0 0,0 14,15.5A2.5,2.5 0 0,0 16.5,18A2.5,2.5 0 0,0 19,15.5A2.5,2.5 0 0,0 16.5,13Z",
  script: "M14.6,16.6L19.2,12L14.6,7.4L16,6L22,12L16,18L14.6,16.6M9.4,16.6L4.8,12L9.4,7.4L8,6L2,12L8,18L9.4,16.6Z",
  scene: "M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M14.5,8A1.5,1.5 0 0,1 13,6.5A1.5,1.5 0 0,1 14.5,5A1.5,1.5 0 0,1 16,6.5A1.5,1.5 0 0,1 14.5,8M9.5,8A1.5,1.5 0 0,1 8,6.5A1.5,1.5 0 0,1 9.5,5A1.5,1.5 0 0,1 11,6.5A1.5,1.5 0 0,1 9.5,8M6.5,12A1.5,1.5 0 0,1 5,10.5A1.5,1.5 0 0,1 6.5,9A1.5,1.5 0 0,1 8,10.5A1.5,1.5 0 0,1 6.5,12M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A1.5,1.5 0 0,0 13.5,19.5C13.5,19.11 13.35,18.76 13.11,18.5C12.88,18.23 12.73,17.88 12.73,17.5A1.5,1.5 0 0,1 14.23,16H16A5,5 0 0,0 21,11C21,6.58 16.97,3 12,3Z",
  chevron_down: "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
  chevron_up: "M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z",
};

const STRINGS = {
  en: {
    failed_automations: "Failed automations",
    linked_unavailable: "Unavailable linked entities",
    failed_short: "Failed",
    linked_short: "Unavailable",
    all_ok: "All good",
    one_problem: "1 problem",
    n_problems: "{n} problems",
    monitored: "{n} automations monitored",
    last_failure: "Last failure {when}",
    step: "Step",
    streak: "{n} failures in a row",
    unavailable_since: "Unavailable {when}",
    used_by: "Used by",
    trace: "Trace",
    edit: "Edit",
    reset: "Clear",
    reset_all: "Clear all",
    rebuild: "Refresh",
    rebuild_title: "rebuild the list of entities used by automations, scripts and scenes",
    confirm_reset: "Clear the failure of {name}? It will be reported again on its next failure.",
    confirm_reset_all: "Clear all failed automations? They will be reported again on their next failure.",
    show_more: "Show {n} more",
    show_less: "Show less",
    just_now: "just now",
    no_integration: "Automation Monitor not found. Is the Automation Monitor integration installed?",
    unavailable: "The Automation Monitor sensors are unavailable.",
    no_registry: "This card needs Home Assistant 2023.4 or later.",
    // Editor
    title: "Title (optional)",
    show_logo: "Show Automation Monitor logo",
    show_failed: "Show failed automations",
    show_linked: "Show unavailable linked entities",
    expand_failed: "Failed automations expanded by default",
    expand_linked: "Unavailable linked entities expanded by default",
    show_controls: "Show clear buttons",
    show_details: "Show error details",
    max_items: "Items shown per list",
    language: "Language",
    lang_auto: "Automatic",
  },
  fr: {
    failed_automations: "Automatisations en échec",
    linked_unavailable: "Entités liées indisponibles",
    failed_short: "En échec",
    linked_short: "Indisponibles",
    all_ok: "Tout va bien",
    one_problem: "1 problème",
    n_problems: "{n} problèmes",
    monitored: "{n} automatisations surveillées",
    last_failure: "Dernier échec {when}",
    step: "Étape",
    streak: "{n} échecs consécutifs",
    unavailable_since: "Indisponible {when}",
    used_by: "Utilisée par",
    trace: "Trace",
    edit: "Modifier",
    reset: "Effacer",
    reset_all: "Tout effacer",
    rebuild: "Actualiser",
    rebuild_title: "reconstruire la liste des entités utilisées par les automatisations, scripts et scènes",
    confirm_reset: "Effacer l'échec de {name} ? Il sera de nouveau signalé au prochain échec.",
    confirm_reset_all: "Effacer toutes les automatisations en échec ? Elles seront de nouveau signalées au prochain échec.",
    show_more: "Afficher {n} de plus",
    show_less: "Afficher moins",
    just_now: "à l'instant",
    no_integration: "Automation Monitor introuvable. L'intégration Automation Monitor est-elle installée ?",
    unavailable: "Les capteurs d'Automation Monitor sont indisponibles.",
    no_registry: "Cette carte nécessite Home Assistant 2023.4 ou plus récent.",
    // Editor
    title: "Titre (optionnel)",
    show_logo: "Afficher le logo Automation Monitor",
    show_failed: "Afficher les automatisations en échec",
    show_linked: "Afficher les entités liées indisponibles",
    expand_failed: "Automatisations en échec dépliées par défaut",
    expand_linked: "Entités liées indisponibles dépliées par défaut",
    show_controls: "Afficher les boutons Effacer",
    show_details: "Afficher le détail des erreurs",
    max_items: "Éléments affichés par liste",
    language: "Langue",
    lang_auto: "Automatique",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const lang = (hass, config) => {
  const l = (config && config.language) || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

const t = (hass, config, key, vars = {}) =>
  String(STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

const valid = (s) => s && !["unknown", "unavailable", ""].includes(s.state);

const ago = (hass, config, iso) => {
  const d = Date.parse(iso);
  if (!Number.isFinite(d)) return null;
  const diff = (d - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return t(hass, config, "just_now");
  const rtf = new Intl.RelativeTimeFormat(lang(hass, config), { numeric: "auto" });
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  return rtf.format(Math.round(diff / 86400), "day");
};

const fullDate = (hass, config, iso) => {
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d.toLocaleString(lang(hass, config), { dateStyle: "medium", timeStyle: "short" }) : "";
};

const byDateDesc = (key) => (a, b) => (Date.parse(b[key]) || 0) - (Date.parse(a[key]) || 0);

const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24"><path d="${path}"/></svg>`;

// Open a Home Assistant page (automation editor, trace…) without reloading the frontend.
const navigate = (path) => {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
};

// ---------------------------------------------------------------------------
// Registry-based resolution
// ---------------------------------------------------------------------------

const KEYS = { failed: "failed_automations", linked: "linked_entities_unavailable" };

/**
 * Find the two sensors of the integration: { failed, linked } entity ids. The entity registry is used
 * first (platform + translation_key); the default entity ids are a fallback.
 */
const resolve = (hass) => {
  if (!hass.entities) return null;
  const found = {};
  for (const e of Object.values(hass.entities)) {
    if (e.platform !== PLATFORM) continue;
    for (const [k, key] of Object.entries(KEYS)) if (e.translation_key === key && !found[k]) found[k] = e.entity_id;
  }
  for (const [k, key] of Object.entries(KEYS)) if (!found[k] && hass.states[`sensor.${key}`]) found[k] = `sensor.${key}`;
  return found;
};

const findSensors = (hass, config) => {
  const found = resolve(hass);
  if (!found) return { error: "no_registry" };
  const failed = config.failed_entity || found.failed;
  const linked = config.linked_entity || found.linked;
  if (!failed && !linked) return { error: "no_integration" };
  return { failed, linked };
};

// Editor page of an automation, script or scene, when it was created in the UI.
const editorPath = (hass, entityId, uniqueId) => {
  const [domain, objectId] = String(entityId).split(".");
  const s = hass.states[entityId];
  if (domain === "automation") {
    const id = s?.attributes?.id ?? uniqueId;
    return id ? `/config/automation/edit/${encodeURIComponent(id)}` : null;
  }
  if (domain === "script") return objectId ? `/config/script/edit/${encodeURIComponent(objectId)}` : null;
  if (domain === "scene") {
    const id = s?.attributes?.id ?? uniqueId;
    return id ? `/config/scene/edit/${encodeURIComponent(id)}` : null;
  }
  return null;
};

const tracePath = (hass, entityId, uniqueId) => {
  const id = hass.states[entityId]?.attributes?.id ?? uniqueId;
  return id ? `/config/automation/trace/${encodeURIComponent(id)}` : null;
};

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const BASE_STYLE = `
  :host { --am-blue: #1db6ec; --am-navy: #0d4a68; --am-ok: var(--success-color, #43a047); --am-warn: var(--warning-color, #ffa000);
          --am-crit: var(--error-color, #db4437); --am-idle: var(--disabled-text-color, #9e9e9e); }
  ha-card { overflow: hidden; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
  .muted { color: var(--secondary-text-color); }
  .clickable { cursor: pointer; }
  .ok { --c: var(--am-ok); } .warn { --c: var(--am-warn); } .crit { --c: var(--am-crit); } .idle { --c: var(--am-idle); }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--c, var(--am-ok)); flex: none; display: inline-block; }
  .chip { display: inline-flex; align-items: center; gap: 6px; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; white-space: nowrap;
          background: color-mix(in srgb, var(--c, var(--am-ok)) 15%, transparent); color: var(--c, var(--am-ok)); flex: none; }
  .header { display: flex; align-items: center; gap: 12px; padding: 16px 16px 8px; }
  .logo { height: 40px; width: 40px; border-radius: 10px; flex: none; }
  a.logo-link { display: flex; flex: none; }
  .refresh { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: none; border-radius: 50%; padding: 0;
             flex: none; cursor: pointer; background: transparent; color: var(--secondary-text-color); }
  .refresh:hover { background: var(--secondary-background-color, rgba(127,127,127,.12)); color: var(--am-blue); }
  .refresh .icon { width: 20px; height: 20px; }
  .refresh.spin .icon { color: var(--am-blue); animation: am-spin 1s linear infinite; }
  @keyframes am-spin { to { transform: rotate(360deg); } }
  .titles { flex: 1; min-width: 0; }
  .name { font-size: 18px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 13px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .warning { padding: 16px; color: var(--am-warn); }
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: none; cursor: pointer; font: inherit; font-size: 12px;
         font-weight: 500; padding: 5px 10px; border-radius: 16px; background: var(--secondary-background-color, rgba(127,127,127,.12));
         color: var(--primary-text-color); min-width: 0; white-space: nowrap; }
  .btn:hover { background: color-mix(in srgb, var(--am-blue) 16%, var(--secondary-background-color, rgba(127,127,127,.12))); }
  .btn .icon { width: 16px; height: 16px; color: var(--am-blue); }
  .counters { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .counter { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; min-width: 0;
             background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .counter.crit, .counter.warn { background: color-mix(in srgb, var(--c) 12%, transparent); }
  .counter .badge { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex: none;
                    background: color-mix(in srgb, var(--c) 18%, transparent); color: var(--c); }
  .counter .badge .icon { width: 20px; height: 20px; }
  .counter .n { font-size: 24px; font-weight: 500; line-height: 1.1; }
  .counter.crit .n, .counter.warn .n { color: var(--c); }
  .counter .lbl { font-size: 12px; color: var(--secondary-text-color); line-height: 1.2; }
  .counter > div:last-child { min-width: 0; }
`;

class AutomationMonitorBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._html = "";
    this._expanded = {};
    this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
  }

  set hass(hass) {
    this._hass = hass;
    this._update();
  }

  get hass() {
    return this._hass;
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = { ...config };
    this._folds = {};
    this._html = "";
    this._update();
  }

  // Relative times ("5 minutes ago") are refreshed every minute even without a state change.
  connectedCallback() {
    this._timer = setInterval(() => this._update(), 60000);
  }

  disconnectedCallback() {
    clearInterval(this._timer);
  }

  _t(key, vars) {
    return t(this._hass, this._config, key, vars);
  }

  _s(id) {
    return id ? this._hass.states[id] : undefined;
  }

  _update() {
    if (!this._hass || !this._config) return;
    const html = this._render();
    if (html !== this._html) {
      this._html = html;
      this.shadowRoot.innerHTML = html;
    }
  }

  _onClick(ev) {
    const el = ev.composedPath().find((n) => n.dataset && (n.dataset.entity || n.dataset.action || n.dataset.path));
    if (!el) return;
    ev.stopPropagation();
    const { action, entity, label, path } = el.dataset;
    if (path) return navigate(path);
    if (action === "fold") {
      this._folds = { ...this._folds, [el.dataset.section]: !this._isOpen(el.dataset.section) };
      return this._update();
    }
    if (action === "expand") {
      this._expanded = { ...this._expanded, [entity]: !this._expanded[entity] };
      return this._update();
    }
    if (action === "reset") {
      if (window.confirm(this._t("confirm_reset", { name: label }))) this._hass.callService(PLATFORM, "reset", { entity_id: entity });
    } else if (action === "reset_all") {
      if (window.confirm(this._t("confirm_reset_all"))) this._hass.callService(PLATFORM, "reset", {});
    } else if (action === "rebuild") {
      this._hass.callService(PLATFORM, "rebuild_linked_entities", {});
      // Short spin of the button: the sensors update on their own once the rebuild is done.
      this._refreshing = true;
      this._update();
      setTimeout(() => {
        this._refreshing = false;
        this._update();
      }, 1200);
    } else if (entity) {
      this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: entity }, bubbles: true, composed: true }));
    }
  }

  // Current data of the integration: lists from the sensor attributes, most recent first.
  _data() {
    const found = findSensors(this._hass, this._config);
    if (found.error) return found;
    const f = this._s(found.failed);
    const l = this._s(found.linked);
    if (!valid(f) && !valid(l)) return { error: "unavailable" };
    const failures = (valid(f) && Array.isArray(f.attributes.automations) ? f.attributes.automations : []).slice().sort(byDateDesc("last_error_time"));
    const linked = (valid(l) && Array.isArray(l.attributes.entities) ? l.attributes.entities : []).slice().sort(byDateDesc("unavailable_since"));
    return { failedId: found.failed, linkedId: found.linked, failures, linked };
  }

  _status(data) {
    const c = this._config;
    const nf = c.show_failed === false ? 0 : data.failures.length;
    const nl = c.show_linked === false ? 0 : data.linked.length;
    const n = nf + nl;
    if (!n) return { cls: "ok", text: this._t("all_ok"), entity: data.failedId || data.linkedId };
    return { cls: nf ? "crit" : "warn", text: n === 1 ? this._t("one_problem") : this._t("n_problems", { n }), entity: nf ? data.failedId : data.linkedId };
  }

  _sub(data) {
    const last = data.failures[0];
    const when = last && ago(this._hass, this._config, last.last_error_time);
    if (when && this._config.show_failed !== false) return this._t("last_failure", { when });
    const n = Object.keys(this._hass.states).filter((id) => id.startsWith("automation.")).length;
    return n ? this._t("monitored", { n }) : "";
  }

  _header(data, sub) {
    const c = this._config;
    const status = this._status(data);
    return `
      <div class="header">
        ${
          c.show_logo !== false
            ? `<a class="logo-link" href="${INTEGRATION_SITE}" target="_blank" rel="noopener noreferrer" title="Automation Monitor"><img class="logo" src="${IMG_LOGO}" alt="Automation Monitor"></a>`
            : ""
        }
        <div class="titles">
          <div class="name">${esc(c.title || "Automation Monitor")}</div>
          ${sub ? `<div class="sub">${esc(sub)}</div>` : ""}
        </div>
        <span class="chip clickable ${status.cls}" data-entity="${status.entity || ""}"><span class="dot"></span>${esc(status.text)}</span>
        <button class="refresh ${this._refreshing ? "spin" : ""}" data-action="rebuild" title="${esc(`${this._t("rebuild")} · ${this._t("rebuild_title")}`)}">${svgIcon(ICONS.refresh)}</button>
      </div>`;
  }

  _counters(data) {
    const c = this._config;
    const counter = (id, icon, n, label, cls) =>
      `<div class="counter clickable ${n ? cls : "ok"}" data-entity="${id || ""}">
        <div class="badge">${svgIcon(n ? icon : ICONS.check)}</div>
        <div><div class="n">${n}</div><div class="lbl">${esc(label)}</div></div>
      </div>`;
    const list = [];
    if (c.show_failed !== false)
      list.push(counter(data.failedId, ICONS.robot_alert, data.failures.length, this._t(this._compact ? "failed_short" : "failed_automations"), "crit"));
    if (c.show_linked !== false)
      list.push(counter(data.linkedId, ICONS.disconnect, data.linked.length, this._t(this._compact ? "linked_short" : "linked_unavailable"), "warn"));
    return list.length ? `<div class="counters" style="${list.length === 1 ? "grid-template-columns:1fr" : ""}">${list.join("")}</div>` : "";
  }

  _errorCard(key) {
    return `<style>${BASE_STYLE}</style><ha-card><div class="warning">${esc(this._t(key))}</div></ha-card>`;
  }
}

// ---------------------------------------------------------------------------
// Full card
// ---------------------------------------------------------------------------

const FULL_STYLE = `
  .content { padding: 0 16px 16px; display: flex; flex-direction: column; gap: 16px; }
  .section-title { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; text-transform: uppercase;
                   letter-spacing: .04em; color: var(--secondary-text-color); margin-bottom: 8px; min-height: 26px; }
  .section-title .icon { width: 16px; height: 16px; }
  .section-title .count { text-transform: none; letter-spacing: 0; font-weight: 400; }
  .section-title .spacer { flex: 1; }
  .section-title .btn { text-transform: none; letter-spacing: 0; }
  .section-title.fold { cursor: pointer; user-select: none; }
  .section-title .chevron { transition: transform .2s ease; }
  .section-title.closed { margin-bottom: 0; }
  .section-title.closed .chevron { transform: rotate(-90deg); }
  .items { display: flex; flex-direction: column; gap: 8px; }
  .item { display: flex; gap: 10px; padding: 10px 12px; border-radius: 12px; min-width: 0;
          background: var(--secondary-background-color, rgba(127,127,127,.08)); border-left: 3px solid var(--c); }
  .item > .icon { width: 20px; height: 20px; color: var(--c); margin-top: 1px; }
  .item .body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
  .item .top { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
  .item .title { flex: 1; min-width: 0; font-size: 14px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .item .when { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; flex: none; }
  .item .eid { font-size: 12px; color: var(--secondary-text-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .item .msg { font-family: var(--code-font-family, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace); font-size: 12px; line-height: 1.4;
               padding: 6px 8px; border-radius: 8px; overflow-wrap: anywhere; color: var(--primary-text-color);
               background: color-mix(in srgb, var(--c) 10%, transparent); }
  .tags { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .tag { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; padding: 2px 8px; border-radius: 8px; max-width: 100%;
         background: var(--card-background-color, rgba(127,127,127,.12)); color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tag .icon { width: 14px; height: 14px; color: var(--secondary-text-color); }
  .tag.link { cursor: pointer; }
  .tag.link:hover { color: var(--am-blue); }
  .tag.link:hover .icon { color: var(--am-blue); }
  .tag.streak { color: var(--am-crit); }
  .tag.streak .icon { color: var(--am-crit); }
  .actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px; }
  .item .btn { background: var(--card-background-color, rgba(127,127,127,.12)); }
  .used { font-size: 12px; color: var(--secondary-text-color); }
  .more { align-self: center; }
`;

class AutomationMonitorCard extends AutomationMonitorBase {
  static getConfigElement() {
    return document.createElement("automation-monitor-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  getCardSize() {
    return 6;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }

  _render() {
    const data = this._data();
    if (data.error) return this._errorCard(data.error);
    const c = this._config;
    const parts = [this._counters(data)];
    if (c.show_failed !== false) parts.push(this._failedSection(data));
    if (c.show_linked !== false) parts.push(this._linkedSection(data));
    return `<style>${BASE_STYLE}${FULL_STYLE}</style>
      <ha-card>
        ${this._header(data, this._sub(data))}
        <div class="content">${parts.filter(Boolean).join("")}</div>
      </ha-card>`;
  }

  _max() {
    const m = parseInt(this._config.max_items, 10);
    return Number.isFinite(m) && m > 0 ? m : DEFAULT_MAX_ITEMS;
  }

  // Items of a list, cut to max_items with a "show more" button.
  _list(key, items, renderItem) {
    const max = this._max();
    const open = this._expanded[key];
    const shown = open ? items : items.slice(0, max);
    const more =
      items.length > max
        ? `<button class="btn more" data-action="expand" data-entity="${key}">${svgIcon(open ? ICONS.chevron_up : ICONS.chevron_down)}<span>${esc(
            open ? this._t("show_less") : this._t("show_more", { n: items.length - max })
          )}</span></button>`
        : "";
    return `<div class="items">${shown.map(renderItem).join("")}${more}</div>`;
  }

  // Lists are collapsed until their title is clicked, unless expand_<key> is set
  // (collapse_<key>: false, the former option, is still honoured).
  _isOpen(key) {
    return this._folds?.[key] ?? (this._config[`expand_${key}`] === true || this._config[`collapse_${key}`] === false);
  }

  // Title: icon, label, actions, "shown/total" counter and chevron, as in the Dockhand card.
  _section(key, icon, label, items, renderItem, button) {
    const open = this._isOpen(key);
    const shown = this._expanded[key] ? items.length : Math.min(items.length, this._max());
    return `<div>
      <div class="section-title fold ${open ? "" : "closed"}" data-action="fold" data-section="${key}">${svgIcon(icon)}<span>${esc(
      label
    )}</span><span class="spacer"></span>${button || ""}<span class="count">${shown}/${items.length}</span>${svgIcon(ICONS.chevron_down, "chevron")}</div>
      ${open ? this._list(key, items, renderItem) : ""}
    </div>`;
  }

  _failedSection(data) {
    const controls = this._config.show_controls !== false;
    const button =
      controls && data.failures.length
        ? `<button class="btn" data-action="reset_all" title="${esc(this._t("reset_all"))}">${svgIcon(ICONS.clear)}<span>${esc(this._t("reset_all"))}</span></button>`
        : "";
    // Nothing to list: the counter above already says so.
    if (!data.failures.length) return "";
    return this._section("failed", ICONS.robot_alert, this._t("failed_automations"), data.failures, (a) => this._failure(a, controls), button);
  }

  _failure(a, controls) {
    const h = this._hass;
    const name = a.name || a.entity_id;
    const when = ago(h, this._config, a.last_error_time);
    const tags = [];
    if (a.error_step && a.error_step !== "unknown") tags.push(`<span class="tag" title="${esc(this._t("step"))}">${svgIcon(ICONS.step)}${esc(a.error_step)}</span>`);
    if (a.consecutive_failures > 1) tags.push(`<span class="tag streak">${svgIcon(ICONS.repeat)}${esc(this._t("streak", { n: a.consecutive_failures }))}</span>`);
    const actions = [];
    const trace = tracePath(h, a.entity_id, a.unique_id);
    const edit = editorPath(h, a.entity_id, a.unique_id);
    if (trace) actions.push(`<button class="btn" data-path="${esc(trace)}">${svgIcon(ICONS.trace)}<span>${esc(this._t("trace"))}</span></button>`);
    if (edit) actions.push(`<button class="btn" data-path="${esc(edit)}">${svgIcon(ICONS.edit)}<span>${esc(this._t("edit"))}</span></button>`);
    if (controls)
      actions.push(
        `<button class="btn" data-action="reset" data-entity="${esc(a.entity_id)}" data-label="${esc(name)}">${svgIcon(ICONS.reset)}<span>${esc(this._t("reset"))}</span></button>`
      );
    return `
      <div class="item crit">
        ${svgIcon(ICONS.robot_alert)}
        <div class="body">
          <div class="top">
            <span class="title clickable" data-entity="${esc(a.entity_id)}">${esc(name)}</span>
            ${when ? `<span class="when" title="${esc(fullDate(h, this._config, a.last_error_time))}">${esc(when)}</span>` : ""}
          </div>
          ${this._config.show_details !== false && a.error_message ? `<div class="msg">${esc(a.error_message)}</div>` : ""}
          ${tags.length ? `<div class="tags">${tags.join("")}</div>` : ""}
          ${actions.length ? `<div class="actions">${actions.join("")}</div>` : ""}
        </div>
      </div>`;
  }

  _linkedSection(data) {
    if (!data.linked.length) return "";
    return this._section("linked", ICONS.disconnect, this._t("linked_unavailable"), data.linked, (e) => this._linked(e));
  }

  _linked(e) {
    const h = this._hass;
    const when = ago(h, this._config, e.unavailable_since);
    const details = Array.isArray(e.referenced_by_details) && e.referenced_by_details.length ? e.referenced_by_details : (e.referenced_by || []).map((id) => ({ entity_id: id }));
    const sources = details.map((src) => {
      const domain = String(src.entity_id).split(".")[0];
      const name = src.name || h.states[src.entity_id]?.attributes?.friendly_name || src.entity_id;
      const path = editorPath(h, src.entity_id, src.unique_id);
      const icon = ICONS[domain] || ICONS.automation;
      return `<span class="tag link" ${path ? `data-path="${esc(path)}"` : `data-entity="${esc(src.entity_id)}"`} title="${esc(src.entity_id)}">${svgIcon(icon)}${esc(name)}</span>`;
    });
    return `
      <div class="item warn">
        ${svgIcon(ICONS.disconnect)}
        <div class="body">
          <div class="top">
            <span class="title clickable" data-entity="${esc(e.entity_id)}">${esc(e.name || e.entity_id)}</span>
            ${when ? `<span class="when" title="${esc(fullDate(h, this._config, e.unavailable_since))}">${esc(this._t("unavailable_since", { when }))}</span>` : ""}
          </div>
          <div class="eid">${esc(e.entity_id)}</div>
          ${sources.length ? `<div class="tags"><span class="used">${esc(this._t("used_by"))}</span>${sources.join("")}</div>` : ""}
        </div>
      </div>`;
  }
}

// ---------------------------------------------------------------------------
// Mini card
// ---------------------------------------------------------------------------

const MINI_STYLE = `
  .header { padding: 12px 12px 8px; }
  .logo { height: 32px; width: 32px; border-radius: 8px; }
  .name { font-size: 16px; }
  .content { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 8px; }
  .counter { padding: 8px 10px; }
  .counter .badge { width: 30px; height: 30px; }
  .counter .badge .icon { width: 18px; height: 18px; }
  .counter .n { font-size: 20px; }
  .line { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--secondary-text-color); min-width: 0; }
  .line .icon { width: 14px; height: 14px; color: var(--c); }
  .line span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .line b { font-weight: 500; color: var(--primary-text-color); }
`;

class AutomationMonitorMiniCard extends AutomationMonitorBase {
  constructor() {
    super();
    this._compact = true;
  }

  static getConfigElement() {
    return document.createElement("automation-monitor-mini-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  getCardSize() {
    return 3;
  }

  getGridOptions() {
    return { columns: 6, min_columns: 6 };
  }

  _render() {
    const data = this._data();
    if (data.error) return this._errorCard(data.error);
    const c = this._config;
    const lines = [];
    const last = c.show_failed !== false && data.failures[0];
    if (last) {
      const when = ago(this._hass, c, last.last_error_time);
      lines.push(
        `<div class="line crit clickable" data-entity="${esc(last.entity_id)}">${svgIcon(ICONS.alert)}<span><b>${esc(last.name || last.entity_id)}</b>${
          when ? ` · ${esc(when)}` : ""
        }</span></div>`
      );
    }
    const off = c.show_linked !== false && data.linked[0];
    if (off) {
      const when = ago(this._hass, c, off.unavailable_since);
      lines.push(
        `<div class="line warn clickable" data-entity="${esc(off.entity_id)}">${svgIcon(ICONS.disconnect)}<span><b>${esc(off.name || off.entity_id)}</b>${
          when ? ` · ${esc(this._t("unavailable_since", { when }))}` : ""
        }</span></div>`
      );
    }
    return `<style>${BASE_STYLE}${MINI_STYLE}</style>
      <ha-card>
        ${this._header(data, "")}
        <div class="content">${this._counters(data)}${lines.join("")}</div>
      </ha-card>`;
  }
}

// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------

class AutomationMonitorEditorBase extends HTMLElement {
  // [name, default]
  static get toggles() {
    return [
      ["show_logo", true],
      ["show_failed", true],
      ["show_linked", true],
    ];
  }

  static extraFields() {
    return [];
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _schema() {
    const tr = (k) => t(this._hass, this._config, k);
    return [
      { name: "title", selector: { text: {} } },
      ...this.constructor.extraFields(tr),
      { type: "grid", name: "", schema: this.constructor.toggles.map(([name]) => ({ name, selector: { boolean: {} } })) },
      {
        name: "language",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "", label: tr("lang_auto") },
              { value: "en", label: "English" },
              { value: "fr", label: "Français" },
            ],
          },
        },
      },
    ];
  }

  _render() {
    if (!this._hass || !this._config) return;
    const toggles = this.constructor.toggles;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => t(this._hass, this._config, s.name);
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = { ...ev.detail.value };
        const defaults = { ...Object.fromEntries(toggles), max_items: DEFAULT_MAX_ITEMS };
        // Keep the YAML minimal: drop empty values and options left at their default.
        for (const [k, v] of Object.entries(config)) if (v === "" || v === undefined || v === null || (k in defaults && v === defaults[k])) delete config[k];
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const data = { ...this._config };
    for (const [name, def] of toggles) if (data[name] === undefined) data[name] = def;
    if (this.constructor.extraFields(() => "").some((f) => f.name === "max_items") && data.max_items === undefined) data.max_items = DEFAULT_MAX_ITEMS;
    this._form.hass = this._hass;
    this._form.data = data;
    this._form.schema = this._schema();
  }
}

class AutomationMonitorCardEditor extends AutomationMonitorEditorBase {
  static get toggles() {
    return [...super.toggles, ["expand_failed", false], ["expand_linked", false], ["show_details", true], ["show_controls", true]];
  }

  static extraFields() {
    return [{ name: "max_items", selector: { number: { min: 1, max: 50, mode: "box" } } }];
  }
}

class AutomationMonitorMiniCardEditor extends AutomationMonitorEditorBase {}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const define = (name, cls) => {
  if (!customElements.get(name)) customElements.define(name, cls);
};
define("automation-monitor-card", AutomationMonitorCard);
define("automation-monitor-mini-card", AutomationMonitorMiniCard);
define("automation-monitor-card-editor", AutomationMonitorCardEditor);
define("automation-monitor-mini-card-editor", AutomationMonitorMiniCardEditor);

window.customCards = window.customCards || [];
for (const card of [
  {
    type: "automation-monitor-card",
    name: "Automation Monitor Card",
    description: "Failed automations and unavailable linked entities reported by Automation Monitor, with error details, trace and editor links.",
  },
  {
    type: "automation-monitor-mini-card",
    name: "Automation Monitor Mini Card",
    description: "Compact Automation Monitor overview: number of failed automations and unavailable linked entities.",
  },
]) {
  if (!window.customCards.some((c) => c.type === card.type))
    window.customCards.push({ ...card, preview: true, documentationURL: "https://github.com/juju35/ha-automation-monitor-card" });
}

console.info(
  `%c AUTOMATION-MONITOR-CARD %c v${VERSION} `,
  "color: white; background: #1db6ec; font-weight: 700;",
  "color: #1db6ec; background: white; font-weight: 700;"
);
