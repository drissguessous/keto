"""Génère l'icône de lancement (avocat stylisé) à toutes les densités Android."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / "app"
SIZES = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}


def draw(size: int) -> Image.Image:
    s = 1024
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # fond arrondi vert profond
    d.rounded_rectangle((40, 40, s - 40, s - 40), radius=230, fill=(40, 87, 58, 255))
    # avocat : peau, chair, noyau
    cx, cy = s // 2, s // 2 + 40
    d.ellipse((cx - 250, cy - 170, cx + 250, cy + 330), fill=(28, 61, 40, 255))
    d.ellipse((cx - 170, cy - 380, cx + 170, cy + 40), fill=(28, 61, 40, 255))
    d.ellipse((cx - 215, cy - 135, cx + 215, cy + 295), fill=(200, 226, 120, 255))
    d.ellipse((cx - 140, cy - 340, cx + 140, cy + 20), fill=(200, 226, 120, 255))
    d.ellipse((cx - 115, cy - 10, cx + 115, cy + 220), fill=(140, 86, 52, 255))
    d.ellipse((cx - 70, cy + 20, cx - 20, cy + 70), fill=(176, 120, 82, 255))
    return img.resize((size, size), Image.LANCZOS)


for density, px in SIZES.items():
    out = ROOT / "res" / f"mipmap-{density}" / "ic_launcher.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    draw(px).save(out)
draw(512).save(ROOT / "assets" / "www" / "icon.png")
print("icônes générées")
