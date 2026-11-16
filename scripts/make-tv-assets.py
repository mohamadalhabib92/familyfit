"""Images obligatoires du catalogue tvOS (validation 90513).

Couches : dos plein, devant transparent. Tailles exigées par config-tv :
accueil 400×240 et 800×480, App Store 1280×768, Top Shelf 1920×720 et 3840×1440,
Top Shelf large 2320×720 et 4640×1440.
"""
import os
from PIL import Image, ImageDraw, ImageFont

OUT = "assets/tv"
BG = (47, 75, 67, 255)
INK = (246, 244, 239, 255)
ACCENT = (208, 140, 96, 255)
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def font(size):
    if os.path.exists(FONT):
        return ImageFont.truetype(FONT, size)
    return ImageFont.load_default()


def back(w, h):
    img = Image.new("RGBA", (w, h), BG)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, w - 1, h - 1), radius=max(8, h // 18), outline=ACCENT, width=max(4, h // 40))
    return img


def front_icon(w, h):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    f = font(int(h * 0.42))
    text = "Ff"
    box = d.textbbox((0, 0), text, font=f)
    tw, th = box[2] - box[0], box[3] - box[1]
    d.text(((w - tw) / 2 - box[0], (h - th) / 2 - box[1]), text, font=f, fill=INK)
    return img


def shelf(w, h):
    img = back(w, h)
    d = ImageDraw.Draw(img)
    f = font(int(h * 0.28))
    text = "FamilyFit"
    box = d.textbbox((0, 0), text, font=f)
    tw, th = box[2] - box[0], box[3] - box[1]
    x = int(w * 0.08)
    y = (h - th) / 2 - box[1]
    d.text((x, y), text, font=f, fill=INK)
    sub = font(int(h * 0.12))
    d.text((x, y + th + h * 0.04), "Salon", font=sub, fill=ACCENT)
    return img


def save(name, img):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name)
    img.save(path, "PNG")
    print(path, img.size)


def main():
    pairs = [
        ("icon-home-back.png", back(400, 240)),
        ("icon-home-back@2x.png", back(800, 480)),
        ("icon-home-front.png", front_icon(400, 240)),
        ("icon-home-front@2x.png", front_icon(800, 480)),
        ("icon-store-back.png", back(1280, 768)),
        ("icon-store-front.png", front_icon(1280, 768)),
        ("top-shelf.png", shelf(1920, 720)),
        ("top-shelf@2x.png", shelf(3840, 1440)),
        ("top-shelf-wide.png", shelf(2320, 720)),
        ("top-shelf-wide@2x.png", shelf(4640, 1440)),
    ]
    for name, img in pairs:
        save(name, img)


if __name__ == "__main__":
    main()
