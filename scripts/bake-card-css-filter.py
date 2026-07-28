#!/usr/bin/env python3
"""Запекает CSS filter карточек hero в PNG (saturate → brightness → contrast)."""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image

# Как в landing-hero-v3.1.css: filter: saturate(0.78) brightness(0.91) contrast(0.98);
SATURATE = 0.78
BRIGHTNESS = 0.91
CONTRAST = 0.98


def apply_css_like_filters(rgb: np.ndarray) -> np.ndarray:
  """Применяет saturate/brightness/contrast близко к CSS Filters (sRGB 0..1)."""
  # saturate: смесь с luma (Rec.709)
  luma = (
    0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
  )[..., None]
  out = luma + (rgb - luma) * SATURATE

  # brightness: линейный множитель
  out = out * BRIGHTNESS

  # contrast: вокруг 0.5
  out = (out - 0.5) * CONTRAST + 0.5

  return np.clip(out, 0.0, 1.0)


def bake_png(src: Path, dst: Path) -> None:
  """Читает PNG, запекает filter, сохраняет PNG с alpha."""
  img = Image.open(src).convert("RGBA")
  arr = np.asarray(img).astype(np.float32) / 255.0
  rgb = apply_css_like_filters(arr[..., :3])
  out = np.concatenate([rgb, arr[..., 3:4]], axis=-1)
  baked = Image.fromarray(np.round(out * 255.0).astype(np.uint8), "RGBA")
  dst.parent.mkdir(parents=True, exist_ok=True)
  baked.save(dst, format="PNG", optimize=True)


def main() -> None:
  """Batch: src → dst для всех PNG."""
  parser = argparse.ArgumentParser(description=__doc__)
  parser.add_argument(
    "--src",
    type=Path,
    default=Path("public/assets/hero-v3/cards"),
  )
  parser.add_argument(
    "--dst",
    type=Path,
    # Вне public/: иначе vite/rsync тащат дубликаты на прод
    default=Path("design/orbit-cards/cards-muted"),
  )
  args = parser.parse_args()

  files = sorted(args.src.glob("*.png"))
  if not files:
    raise SystemExit(f"Нет PNG в {args.src}")

  for i, src in enumerate(files, 1):
    dst = args.dst / src.name
    bake_png(src, dst)
    print(f"[{i}/{len(files)}] {src.name}")

  print(f"Готово: {len(files)} → {args.dst}")


if __name__ == "__main__":
  main()
