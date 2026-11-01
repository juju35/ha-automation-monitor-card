// One Biome version everywhere: the pre-commit hook (rev and the npm package it installs), the CI Biome job
// (which reads it from .pre-commit-config.yaml) and the schema of biome.json.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("pre-commit rev, its Biome package and the biome.json schema name the same Biome version", () => {
  const cfg = read(".pre-commit-config.yaml");
  const rev = cfg.match(/biomejs\/pre-commit\s*\n\s*rev:\s*"?v?([\d.]+)"?/)?.[1];
  const pkg = cfg.match(/@biomejs\/biome@([\d.]+)/)?.[1];
  const schema = JSON.parse(read("biome.json")).$schema.match(/schemas\/([\d.]+)\//)?.[1];
  assert.ok(rev && pkg && schema, `rev ${rev}, package ${pkg}, schema ${schema}`);
  assert.equal(pkg, rev, "additional_dependencies vs rev");
  assert.equal(schema, rev, "biome.json $schema vs rev");
});

test("the CI Biome job reads the version of the Biome package the pre-commit hook installs", () => {
  const lint = read(".github/workflows/lint.yml");
  assert.match(lint, /@biomejs\\?\/biome@/, "lint.yml does not read the @biomejs/biome@X version");
});
