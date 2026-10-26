# Changelog

## 1.11.0
### Changes
- The Automation Monitor logo in the header of the full card is 40 px (was 36 px), the same size as the header icon of the other cards.
- Header geometry: 8 px between the header and the counters on the full card (was 4 px), as on the mini card and the other cards of the family.
- Detail button at the top right of the mini card (after the status pill and the Refresh button): it shows the full card with the same options, and a second click brings the compact view back. A click anywhere outside the card also folds it back; clicks on the card or in a dialog opened from it (more-info) do not. The logo stays 32 px on the compact view, 40 px zoomed in; the compact view's Refresh button is a little narrower (same icon) so the title keeps its room. New `zoom` option (on by default, in the visual editor): `zoom: false` removes the button.

### Maintenance
- Tests for the detail button; light and dark screenshots of the zoomed-in mini card.

## 1.10.1

### Fixes
- Keyboard focus stays on the row you were on when a new failure moves the list: pressing Enter on a Reset, trace or edit button now always acts on that automation, never on its neighbour.
- The automation count in the subtitle is only computed when it is shown.

### Maintenance
- Browser tests (Chromium) for focus and in-place updates, run in CI.

## 1.10.0

### Changes
- The subtitle reads "N automations" instead of "N automations monitored" ("N automatisations" in French): the card cannot see the exclusions set in the integration, so it no longer claims they are all monitored.
- The card only re-renders when something it shows changes, and updates the page in place: keyboard focus, hover and text selection survive updates, and the bars, rings and chevrons animate again. Relative times ("5 minutes ago") still tick every minute.
- Keyboard access: clickable items can be reached with Tab and opened with Enter or Space, with a visible focus outline; fold titles announce whether they are open.
- The script editor link still opens the right script after its entity_id was renamed.
- The Refresh button stops spinning as soon as the rebuild fails, and failed actions are logged instead of raising unhandled errors.
- Changing `max_items` in the editor no longer leaves a "Show more" list expanded; the error message gives the right minimum Home Assistant version (2024.8).

### Maintenance
- CI hardened: actions pinned by commit SHA, read-only token permissions, Dependabot for action updates, duplication report annotated on pull requests.
- Unit tests (`npm test`, run in CI); lighter updates (registry lookups and `exclude_devices` cached).

## 1.9.1

### Maintenance
- Tooling only, no functional change: Biome linting, pre-commit and a Lint CI (duplication checks). Card source modernized (optional chaining, template literals), identical behavior.

## 1.9.0

### Changes
- More compact layout with the same information, like the other ha-* cards: 12 px card padding, 36 px header icon, 16 px name and 12 px subtitle, 11 px pills, tighter tiles and sections.
- Smaller counters (20 px figures, 30 px badges) and list items (8 × 10 px padding, 13 px titles, 11 px tags).
- The mini card picks up the smaller pills and subtitle.

## 1.8.1

### Changes
- The status pill is back on the right of the header: moving it under the title in the previous version is undone.

## 1.8.0

### Changes
- The status pill sits under the title, as in the other ha-* cards, instead of on the right of the header.
- HACS now asks for Home Assistant 2024.8 or later, the version that brought the sections view the card supports; the README says so under **Prerequisites**.

### Maintenance
- CHANGELOG headings use the same plain English set as the other ha-* repositories.

## 1.7.0

### What's new
- New `exclude_devices` option (both cards, also in the visual editor with a device picker): the entities of these devices are ignored — left out of the lists, the counters and the status. Device ids or device names are accepted, so the YAML can stay readable.

## 1.6.0

### What's new
- A click anywhere else on the page folds the lists back to their defaults (`expand_failed`, `expand_linked`) and shortens the lists opened with "Show more" again, as in ha-carburants-france.

## 1.5.1

### Development
- The built card is no longer committed in `dist/`: CI builds it on every push, and the release workflow builds it and attaches it to the release, which is where HACS downloads it from. Nothing changes for users.

## 1.5.0

### Changes
- The warning color falls back to Home Assistant's default `#ffa600` (was `#ffa000`), like the other ha-* cards.

### Development
- Releases are published when `version` in `package.json` has no tag yet: bump the version, add its CHANGELOG section and push, like the other ha-* repositories (the manual Release workflow run is no longer needed).
- Issue templates, stale workflow and a "Update release notes" workflow, shared with the other repositories.

## 1.4.1

### Changes
- Section titles show a "shown/total" counter next to the chevron (e.g. `3/3`, or `5/8` when the list is cut by `max_items`), as in the Dockhand card, instead of the colored badge.

## 1.4.0

### What's new
- Same folding as the Dockhand card: Failed automations and Unavailable linked entities are folded by default, even with a single item; click the section title (with its chevron) to fold or unfold. The Show / Fold buttons are gone.
- New `expand_failed` and `expand_linked` options (also in the visual editor) keep a list expanded. They replace `collapse_failed` / `collapse_linked`; `collapse_*: false` is still honoured.

## 1.3.0

### What's new
- The Refresh button is now in the header of both cards and always visible, whatever is shown below. It rebuilds the list of entities used by automations, scripts and scenes (`automation_monitor.rebuild_linked_entities`) and spins briefly while doing so.

## 1.2.0

### What's new
- The Failed automations and Unavailable linked entities sections are hidden when they have nothing to list: the counters at the top already show 0. The Refresh button of the linked entities only appears when the section is shown.

## 1.1.0

### What's new
- When there are several failed automations or several unavailable linked entities, their list is now folded by default: a "Show the N automations" / "Show the N entities" button unfolds it, and "Fold" folds it again. The counters and the status stay visible. Set `collapse_failed: false` or `collapse_linked: false` (also in the visual editor) to always show the lists.

## 1.0.0

First release of the Automation Monitor cards for Home Assistant, built for the [Automation Monitor integration](https://github.com/olli-dot-dev/ha-automation-monitor).

| Automation Monitor Card | Automation Monitor Mini Card |
|---|---|
| ![automation-monitor-card](https://raw.githubusercontent.com/juju35/ha-automation-monitor-card/main/screenshots/card.png) | ![automation-monitor-mini-card](https://raw.githubusercontent.com/juju35/ha-automation-monitor-card/main/screenshots/mini-card.png) |

### What's new
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

### Installation
[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=juju35&repository=ha-automation-monitor-card&category=plugin)

Open the link above (or add `https://github.com/juju35/ha-automation-monitor-card` as a **Dashboard** custom repository in HACS), click **Download**, then reload your browser. Manual install: copy `automation-monitor-card.js` from the assets below to `/config/www/` and add `/local/automation-monitor-card.js` as a JavaScript Module resource.

### Quick start
```yaml
type: custom:automation-monitor-card
```

```yaml
type: custom:automation-monitor-mini-card
```

All options are described in the [README](https://github.com/juju35/ha-automation-monitor-card#configuration).
