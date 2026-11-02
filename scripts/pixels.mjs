// Screenshot comparison used by scripts/screenshots.mjs (and tested by test/pixels.test.mjs).
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, rmSync } from "node:fs";

// Decoded pixels (RGBA, every frame of a GIF) and size of an image: two encodings of the same picture compare equal,
// whatever their bytes (encoder version, compression, metadata), and a change in any channel (red, green, blue or
// alpha) of any pixel of any frame does not. Needs ffmpeg, as the GIFs do.
export const pixels = (file) => {
  const raw = execFileSync("ffmpeg", ["-loglevel", "error", "-i", file, "-f", "rawvideo", "-pix_fmt", "rgba", "-"], { maxBuffer: 1 << 30 });
  const size = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", file]).toString().trim();
  return { raw, size };
};

// Moves the new render `tmp` to `out` unless the committed file `out` shows the same pixels. Returns true when
// `out` is (re)written.
export const keep = (tmp, out) => {
  if (existsSync(out)) {
    const a = pixels(out);
    const b = pixels(tmp);
    if (a.size === b.size && a.raw.equals(b.raw)) {
      rmSync(tmp);
      return false;
    }
  }
  copyFileSync(tmp, out);
  rmSync(tmp);
  return true;
};
