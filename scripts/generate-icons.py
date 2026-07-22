from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = ROOT / "assets" / "icons"
PNG_PATH = ICON_DIR / "app-icon.png"
ICO_PATH = ICON_DIR / "app-icon.ico"
SCALE = 4
SIZE = 512
CANVAS = SIZE * SCALE


def hex_to_rgb(value):
    value = value.lstrip("#")
    return tuple(int(value[index : index + 2], 16) for index in (0, 2, 4))


def point(value):
    return int(round(value * SCALE))


def draw_icon():
    image = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    shadow = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.ellipse([point(42), point(42), point(470), point(470)], fill=(7, 16, 27, 58))
    shadow = shadow.filter(ImageFilter.GaussianBlur(point(13)))
    image.alpha_composite(shadow, (0, point(10)))
    draw = ImageDraw.Draw(image)
    dark = (31, 42, 56, 255)
    line = (221, 237, 242, 255)
    soft_line = (221, 237, 242, 219)

    draw.ellipse([point(42), point(42), point(470), point(470)], fill=dark)
    draw.arc([point(116), point(116), point(396), point(396)], 0, 300, fill=line, width=point(42))
    draw.line(
        [(point(180), point(260)), (point(232), point(316)), (point(350), point(184))],
        fill=line,
        width=point(52),
        joint="curve",
    )
    draw.line(
        [(point(256), point(158)), (point(256), point(224)), (point(308), point(256))],
        fill=soft_line,
        width=point(24),
        joint="curve",
    )
    for x, y, radius, alpha in [(256, 116, 11, 255), (116, 256, 11, 255), (256, 396, 11, 255), (374, 138, 10, 224), (138, 374, 8, 178)]:
        draw.ellipse(
            [point(x - radius), point(y - radius), point(x + radius), point(y + radius)],
            fill=(*line[:3], alpha),
        )

    return image.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


if __name__ == "__main__":
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    icon = draw_icon()
    icon.save(PNG_PATH)
    icon.save(ICO_PATH, sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print(f"Wrote {PNG_PATH}")
    print(f"Wrote {ICO_PATH}")
