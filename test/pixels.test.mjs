// The screenshot script only rewrites a committed screenshot whose decoded pixels change (scripts/pixels.mjs): every
// channel of every pixel of every frame counts (a comparison of the alpha channel alone, such as
// ImageChops.difference(a, b).getbbox() on RGBA images, calls opaque pictures of different colours identical), and a
// new encoding of the same picture does not. Needs ffmpeg: skipped without it, except where REQUIRE_FFMPEG is set
// (the screenshots workflow, which installs it).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { keep, pixels } from "../scripts/pixels.mjs";

let skip = false;
try {
  execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
  execFileSync("ffprobe", ["-version"], { stdio: "ignore" });
} catch {
  if (process.env.REQUIRE_FFMPEG) throw new Error("ffmpeg / ffprobe not found");
  skip = "ffmpeg not available";
}

const dir = mkdtempSync(join(tmpdir(), "am-pixels-"));
after(() => rmSync(dir, { recursive: true, force: true }));
let n = 0;
// An image of one exact colour (0xRRGGBB or 0xRRGGBBAA; generated in RGBA, not through YUV), in the given pixel
// format and PNG compression.
const png = (color, { fmt = "rgb24", level = 9, size = "8x8" } = {}) => {
  const file = join(dir, `${n++}.png`);
  execFileSync("ffmpeg", ["-loglevel", "error", "-f", "lavfi", "-i", `color=c=${color}:s=${size},format=rgba`, "-frames:v", "1", "-pix_fmt", fmt, "-compression_level", String(level), file]);
  return file;
};
// A two-frame 8x8 GIF.
const gif = (first, second) => {
  const file = join(dir, `${n++}.gif`);
  const src = (c) => ["-f", "lavfi", "-i", `color=c=${c}:s=8x8:r=10:d=0.1,format=rgba`];
  execFileSync("ffmpeg", ["-loglevel", "error", ...src(first), ...src(second), "-filter_complex", "[0][1]concat=n=2:v=1", "-loop", "0", file]);
  return file;
};

test("pixels() decodes all four channels of every frame", (t) => {
  if (skip) return t.skip(skip);
  const { raw, size } = pixels(png("0x102030"));
  assert.equal(size, "8,8");
  assert.equal(raw.length, 8 * 8 * 4);
  assert.deepEqual([...raw.subarray(0, 4)], [0x10, 0x20, 0x30, 255]);
  assert.deepEqual([...pixels(png("0x10203080", { fmt: "rgba" })).raw.subarray(0, 4)], [0x10, 0x20, 0x30, 0x80]);
  // A GIF: every frame (ffmpeg may repeat a frame at its output rate), the first red and the last blue (the
  // GIF palette rounds the colours).
  const g = pixels(gif("red", "blue")).raw;
  assert.equal(g.length % (8 * 8 * 4), 0);
  assert.ok(g.length >= 2 * 8 * 8 * 4);
  const [r0, g0, b0] = g.subarray(0, 4);
  const [r1, g1, b1] = g.subarray(-4);
  assert.ok(r0 > 200 && g0 < 50 && b0 < 50, `first frame ${[r0, g0, b0]}`);
  assert.ok(b1 > 200 && r1 < 50 && g1 < 50, `last frame ${[r1, g1, b1]}`);
});

test("keep(): the same picture in another encoding keeps the committed file", (t) => {
  if (skip) return t.skip(skip);
  const committed = png("0x646464");
  for (const render of [png("0x646464", { level: 0 }), png("0x646464", { fmt: "rgba" }), png("0x646464ff", { fmt: "rgba", level: 3 })]) {
    const before = readFileSync(committed);
    const out = join(dir, `same-${n++}.png`);
    writeFileSync(out, before);
    assert.equal(keep(render, out), false);
    assert.ok(readFileSync(out).equals(before), "committed bytes untouched");
  }
  const g = gif("red", "blue");
  const out = join(dir, `same-${n++}.gif`);
  writeFileSync(out, readFileSync(g));
  assert.equal(keep(gif("red", "blue"), out), false);
});

test("keep(): opaque pictures of different colours are rewritten, one channel off by one is enough", (t) => {
  if (skip) return t.skip(skip);
  // Opaque red committed, opaque blue rendered: same alpha everywhere, so an alpha-only comparison misses it.
  for (const [committed, render, what] of [
    ["0xff0000", "0x0000ff", "red -> blue (opaque)"],
    ["0x646464", "0x656464", "red channel +1"],
    ["0x646464", "0x646564", "green channel +1"],
    ["0x646464", "0x646465", "blue channel +1"],
  ]) {
    const r = png(render);
    const expected = readFileSync(r);
    const out = join(dir, `diff-${n++}.png`);
    writeFileSync(out, readFileSync(png(committed)));
    assert.equal(keep(r, out), true, what);
    assert.ok(readFileSync(out).equals(expected), `${what}: the new render replaces the committed file`);
  }
  // Alpha alone.
  const out = join(dir, `diff-${n++}.png`);
  writeFileSync(out, readFileSync(png("0x646464ff", { fmt: "rgba" })));
  assert.equal(keep(png("0x646464fe", { fmt: "rgba" }), out), true, "alpha channel -1");
});

test("keep(): a different size or a different later GIF frame is rewritten, a missing file is written", (t) => {
  if (skip) return t.skip(skip);
  const out = join(dir, `size-${n++}.png`);
  writeFileSync(out, readFileSync(png("0x646464")));
  assert.equal(keep(png("0x646464", { size: "4x16" }), out), true, "8x8 -> 4x16, same byte count");
  const g = join(dir, `frames-${n++}.gif`);
  writeFileSync(g, readFileSync(gif("red", "blue")));
  assert.equal(keep(gif("red", "lime"), g), true, "second frame blue -> lime");
  assert.equal(keep(png("0x646464"), join(dir, `new-${n++}.png`)), true);
});
