# Changelog

## 1.5.0

### Changes
- The warning color falls back to Home Assistant's default `#ffa600` (was `#ffa000`), like the other ha-* cards.

### Development
- Releases are published when `version` in `package.json` has no tag yet: bump the version, add its CHANGELOG section and push, like the other ha-* repositories (the manual Release workflow run is no longer needed).
- Issue templates, stale workflow and a "Update release notes" workflow, shared with the other repositories.

## 1.4.1

### 💄 Style

- Section titles show a "shown/total" counter next to the chevron (e.g. `3/3`, or `5/8` when the list is cut by `max_items`), as in the Dockhand card, instead of the colored badge.

## 1.4.0

### ✨ Features

- Same folding as the Dockhand card: Failed automations and Unavailable linked entities are folded by default, even with a single item; click the section title (with its chevron) to fold or unfold. The Show / Fold buttons are gone.
- New `expand_failed` and `expand_linked` options (also in the visual editor) keep a list expanded. They replace `collapse_failed` / `collapse_linked`; `collapse_*: false` is still honoured.

## 1.3.0

### ✨ Features

- The Refresh button is now in the header of both cards and always visible, whatever is shown below. It rebuilds the list of entities used by automations, scripts and scenes (`automation_monitor.rebuild_linked_entities`) and spins briefly while doing so.

## 1.2.0

### ✨ Features

- The Failed automations and Unavailable linked entities sections are hidden when they have nothing to list: the counters at the top already show 0. The Refresh button of the linked entities only appears when the section is shown.

## 1.1.0

### ✨ Features

- When there are several failed automations or several unavailable linked entities, their list is now folded by default: a "Show the N automations" / "Show the N entities" button unfolds it, and "Fold" folds it again. The counters and the status stay visible. Set `collapse_failed: false` or `collapse_linked: false` (also in the visual editor) to always show the lists.

## 1.0.0

First release of the Automation Monitor cards for Home Assistant, built for the [Automation Monitor integration](https://github.com/olli-dot-dev/ha-automation-monitor).

| Automation Monitor Card | Automation Monitor Mini Card |
|---|---|
| ![automation-monitor-card](https://raw.githubusercontent.com/juju35/ha-automation-monitor-card/main/screenshots/card.png) | ![automation-monitor-mini-card](https://raw.githubusercontent.com/juju35/ha-automation-monitor-card/main/screenshots/mini-card.png) |

### ✨ Features

- **Automation Monitor Card** (`custom:automation-monitor-card`): overall status, number of failed automations and of unavailable linked entities, then the details of each one.
- **Failed automations**: name, time of the last failure, error message, failed step and consecutive failures, with **Trace** and **Edit** buttons that open the automation's trace and editor, and a **Clear** button (plus **Clear all**) that calls `automation_monitor.reset`.
- **Unavailable linked entities**: name, entity id, unavailable since, and the automations, scripts and scenes that use it (click one to open its editor), with a **Refresh** button that calls `automation_monitor.rebuild_linked_entities`.
- **Automation Monitor Mini Card** (`custom:automation-monitor-mini-card`): compact overview with both counters and the latest problem of each kind.
- **Automatic discovery** of the two sensors through the entity registry: nothing to pick, works with entity ids in any language.
- **Visual editor** for both cards: title, sections to display, action buttons, number of items per list and language.
- Clicking the Automation Monitor logo opens the [integration's page](https://github.com/olli-dot-dev/ha-automation-monitor) in a new tab.
- Click a counter, an automation or an entity to open its more-info dialog.
- Light and dark mode, English and French.
- Single file with no external dependency.

### 📦 Installation

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=juju35&repository=ha-automation-monitor-card&category=plugin)

Open the link above (or add `https://github.com/juju35/ha-automation-monitor-card` as a **Dashboard** custom repository in HACS), click **Download**, then reload your browser. Manual install: copy `automation-monitor-card.js` from the assets below to `/config/www/` and add `/local/automation-monitor-card.js` as a JavaScript Module resource.

### 🚀 Quick start

```yaml
type: custom:automation-monitor-card
```

```yaml
type: custom:automation-monitor-mini-card
```

All options are described in the [README](https://github.com/juju35/ha-automation-monitor-card#configuration).
