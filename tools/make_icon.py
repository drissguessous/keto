"""Icônes de l'application (Android, iPhone, web), dessinées en haute résolution puis réduites.

  python3 tools/make_icon.py [dossier_app] [--style k-feuilles|assiette-avocat|avocat] [--preview fichier.png]
"""
import argparse
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

S = 2048  # dessin en 2048 px puis réduction (anticrénelage)
GREEN, GREEN2, DARK = (40, 87, 58), (63, 122, 82), (24, 54, 36)
LIME, CREAM, PIT = (200, 226, 120), (246, 242, 234), (140, 86, 52)


def squircle(d, fill_top, fill_bottom, img):
    """Fond carré arrondi avec léger dégradé vertical."""
    grad = Image.new("RGB", (S, S))
    gd = ImageDraw.Draw(grad)
    for y in range(S):
        t = y / S
        gd.line([(0, y), (S, y)], fill=tuple(int(a + (b - a) * t) for a, b in zip(fill_top, fill_bottom)))
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, S - 1, S - 1), radius=int(S * 0.225), fill=255)
    img.paste(grad, (0, 0), mask)


def leaf(d, cx, cy, length, width, angle, fill, vein=None):
    pts = []
    for i in range(61):
        t = i / 60
        x = (t - 0.5) * length
        y = math.sin(math.pi * t) * width / 2
        pts.append((x, y))
    pts += [(x, -y) for x, y in reversed(pts)]
    a = math.radians(angle)
    rot = [(cx + x * math.cos(a) - y * math.sin(a), cy + x * math.sin(a) + y * math.cos(a)) for x, y in pts]
    d.polygon(rot, fill=fill)
    if vein:
        p1 = (cx - length * 0.42 * math.cos(a), cy - length * 0.42 * math.sin(a))
        p2 = (cx + length * 0.42 * math.cos(a), cy + length * 0.42 * math.sin(a))
        d.line([p1, p2], fill=vein, width=int(S * 0.012))


def style_feuille():
    """Assiette crème vue de dessus avec une feuille verte et un cœur de famille : sobre et lisible."""
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    squircle(d, (52, 110, 72), GREEN, img)
    c = S // 2
    # ombre douce de l'assiette
    sh = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse((c - 690, c - 650, c + 690, c + 730), fill=(0, 0, 0, 90))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(40)))
    d.ellipse((c - 700, c - 700, c + 700, c + 700), fill=CREAM)
    d.ellipse((c - 560, c - 560, c + 560, c + 560), outline=(226, 219, 204), width=18)
    # avocat en coupe, au centre
    d.ellipse((c - 330, c - 170, c + 330, c + 470), fill=DARK)
    d.ellipse((c - 230, c - 470, c + 230, c + 40), fill=DARK)
    d.ellipse((c - 285, c - 125, c + 285, c + 425), fill=LIME)
    d.ellipse((c - 185, c - 425, c + 185, c + 0), fill=LIME)
    d.ellipse((c - 150, c + 10, c + 150, c + 310), fill=PIT)
    d.ellipse((c - 90, c + 50, c - 25, c + 115), fill=(178, 122, 84))
    # feuille qui dépasse
    leaf(d, c + 400, c - 430, 520, 230, -38, (95, 170, 90), vein=(60, 120, 60))
    return img


def style_assiette():
    """Lettre K stylisée formée d'une tige et de deux feuilles, sur dégradé vert-lime."""
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    squircle(d, (120, 180, 80), GREEN, img)
    c = S // 2
    d.rounded_rectangle((c - 470, c - 640, c - 270, c + 640), radius=100, fill=(255, 255, 255))
    leaf(d, c + 120, c - 330, 760, 330, -45, (255, 255, 255))
    leaf(d, c + 120, c + 330, 760, 330, 45, LIME)
    return img


def style_avocat():
    """Avocat entier en grand, version d'origine retravaillée."""
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    squircle(d, (247, 241, 226), (236, 226, 204), img)
    c = S // 2
    d.ellipse((c - 520, c - 300, c + 520, c + 760), fill=GREEN)
    d.ellipse((c - 360, c - 760, c + 360, c + 80), fill=GREEN)
    d.ellipse((c - 440, c - 220, c + 440, c + 680), fill=LIME)
    d.ellipse((c - 285, c - 680, c + 285, c + 20), fill=LIME)
    d.ellipse((c - 250, c + 40, c + 250, c + 540), fill=PIT)
    d.ellipse((c - 150, c + 110, c - 40, c + 220), fill=(178, 122, 84))
    leaf(d, c + 300, c - 760, 380, 170, -30, (95, 170, 90))
    return img


STYLES = {"k-feuilles": style_assiette, "assiette-avocat": style_feuille, "avocat": style_avocat}
DENSITIES = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("app", nargs="?", default=str(Path(__file__).resolve().parents[1] / "app"))
    ap.add_argument("--style", default="k-feuilles", choices=STYLES)
    ap.add_argument("--preview")
    a = ap.parse_args()
    big = STYLES[a.style]()
    if a.preview:
        big.resize((512, 512), Image.LANCZOS).save(a.preview)
        return
    root = Path(a.app)
    for dens, px in DENSITIES.items():
        out = root / "res" / f"mipmap-{dens}" / "ic_launcher.png"
        out.parent.mkdir(parents=True, exist_ok=True)
        big.resize((px, px), Image.LANCZOS).save(out)
    www = root / "assets" / "www"
    for name, px in [("icon.png", 512), ("icon-192.png", 192), ("icon-512.png", 512)]:
        big.resize((px, px), Image.LANCZOS).save(www / name)
    # iPhone : pas de transparence, iOS arrondit lui-même
    flat = Image.new("RGB", (S, S), GREEN)
    flat.paste(big, (0, 0), big)
    flat.resize((180, 180), Image.LANCZOS).save(www / "apple-touch-icon.png")
    print("icônes générées :", a.style)


if __name__ == "__main__":
    main()
