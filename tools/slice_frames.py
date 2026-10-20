#!/usr/bin/env python3
"""
slice_frames.py — turn the Kling laptop-opening clip into the hero's frame set.

Step 0 of the Opus builder brief (see 02_Opus_Builder_Brief.md). Produces:

  assets/frames/1920/lid_01.webp … lid_45.webp   desktop set (1920 wide)
  assets/frames/1280/lid_01.webp … lid_45.webp   mobile set  (1280 wide)
  assets/frames/screen-rect.json                 inner screen rectangle on lid_45
  assets/frames/screen-rect.css                  the same as CSS custom properties
  assets/poster-closed.jpg                       frame 1 at 1600 wide (og:image / no-JS)
  assets/frames/contact_sheet.png                9x5 sheet of the 45 frames for a visual check

Measured on the clip kling_20261017_VIDEO_Static_loc_2012_0.mp4 (1920x1080, 24 fps, 20.04 s):
  lid motion runs t = 3.75 s -> 11.50 s (frame-difference measurement, 2026-10-19);
  the baked "ZOE AI" logo drifts ~10 px over the motion, so it is kept, not masked;
  the Kling watermark sits bottom-right (x > 84 %, y > 90 %) and is painted black.

Usage:
  python tools/slice_frames.py --video "assets/laptop_open_raw.mp4" --out assets
Requires: ffmpeg on PATH, Pillow, numpy.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

T_START = 3.75      # s, first frame of lid motion
T_END = 11.50       # s, lid locked at 90 degrees
N_FRAMES = 45
QUALITY = 78
WIDTHS = (1920, 1280)
WATERMARK_BOX = (0.84, 0.90)   # x_frac, y_frac of the frame; everything right/below is painted black


def run(cmd: list[str]) -> None:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"command failed: {' '.join(cmd)}\n{r.stderr}")


def extract_pngs(video: Path, tmp: Path) -> list[Path]:
    """Pull N_FRAMES evenly spaced PNGs from the motion window at native resolution."""
    tmp.mkdir(parents=True, exist_ok=True)
    fps = N_FRAMES / (T_END - T_START)
    run([
        "ffmpeg", "-v", "error", "-y",
        "-ss", str(T_START), "-t", str(T_END - T_START), "-i", str(video),
        "-vf", f"fps={fps}", "-frames:v", str(N_FRAMES),
        str(tmp / "raw_%02d.png"),
    ])
    frames = sorted(tmp.glob("raw_*.png"))
    if len(frames) != N_FRAMES:
        sys.exit(f"expected {N_FRAMES} frames, got {len(frames)}")
    return frames


def paint_watermark(img: Image.Image) -> Image.Image:
    w, h = img.size
    d = ImageDraw.Draw(img)
    d.rectangle([int(w * WATERMARK_BOX[0]), int(h * WATERMARK_BOX[1]), w, h], fill=(0, 0, 0))
    return img


def measure_screen_rect(img: Image.Image) -> dict:
    """
    Inner screen rectangle of the open laptop: scan a row above the baked on-screen logo
    and a column left of it for the bright bezel on either side of the dark panel.
    Returns fractions of the frame plus pixels at this frame's size.
    """
    g = np.asarray(img.convert("L"))
    H, W = g.shape
    bright = g > 110
    y = int(H * 0.42)
    cols = np.where(bright[y])[0]
    c = W // 2
    left, right = int(cols[cols < c].max()), int(cols[cols > c].min())
    x = int(W * 0.40)
    rows = np.where(bright[:, x])[0]
    mid = int(H * 0.50)
    top, bottom = int(rows[rows < mid].max()), int(rows[rows > mid].min())
    return {
        "frame": {"w": W, "h": H},
        "px": {"left": left, "top": top, "width": right - left, "height": bottom - top},
        "frac": {
            "x": round(left / W, 4), "y": round(top / H, 4),
            "w": round((right - left) / W, 4), "h": round((bottom - top) / H, 4),
        },
    }


def contact_sheet(frames: list[Image.Image], out: Path, cols: int = 9, thumb_w: int = 320) -> None:
    th = int(thumb_w * frames[0].height / frames[0].width)
    rows = -(-len(frames) // cols)
    sheet = Image.new("RGB", (cols * thumb_w, rows * th), (0, 0, 0))
    for i, f in enumerate(frames):
        sheet.paste(f.resize((thumb_w, th)), ((i % cols) * thumb_w, (i // cols) * th))
    sheet.save(out)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True, type=Path)
    ap.add_argument("--out", default=Path("assets"), type=Path)
    args = ap.parse_args()

    frames_dir = args.out / "frames"
    tmp = frames_dir / "_tmp"
    raw = extract_pngs(args.video, tmp)

    cleaned: list[Image.Image] = []
    for p in raw:
        cleaned.append(paint_watermark(Image.open(p).convert("RGB")))

    for width in WIDTHS:
        d = frames_dir / str(width)
        d.mkdir(parents=True, exist_ok=True)
        for i, img in enumerate(cleaned, start=1):
            h = int(width * img.height / img.width)
            img.resize((width, h), Image.LANCZOS).save(d / f"lid_{i:02d}.webp", "WEBP", quality=QUALITY, method=6)
        total = sum(f.stat().st_size for f in d.glob("*.webp"))
        print(f"{width} wide: {N_FRAMES} frames, {total/1024:.0f} KB")

    rect = measure_screen_rect(cleaned[-1])
    (frames_dir / "screen-rect.json").write_text(json.dumps(rect, indent=2))
    fr = rect["frac"]
    (frames_dir / "screen-rect.css").write_text(
        ":root {\n"
        f"  --screen-x: {fr['x']*100:.2f}%;\n  --screen-y: {fr['y']*100:.2f}%;\n"
        f"  --screen-w: {fr['w']*100:.2f}%;\n  --screen-h: {fr['h']*100:.2f}%;\n}}\n"
    )
    print("screen rect:", rect["frac"])

    poster = cleaned[0].resize((1600, int(1600 * cleaned[0].height / cleaned[0].width)), Image.LANCZOS)
    poster.save(args.out / "poster-closed.jpg", "JPEG", quality=88, optimize=True)

    contact_sheet(cleaned, frames_dir / "contact_sheet.png")

    for p in raw:
        p.unlink()
    tmp.rmdir()
    print("done")


if __name__ == "__main__":
    main()
