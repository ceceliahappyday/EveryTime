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


def rounded_gradient(size, radius, start, end):
    width, height = size
    start = hex_to_rgb(start)
    end = hex_to_rgb(end)
    gradient = Image.new("RGBA", size)
    pixels = gradient.load()
    for y in range(height):
      for x in range(width):
        ratio = (x + y) / (width + height - 2)
        color = tuple(int(start[i] * (1 - ratio) + end[i] * ratio) for i in range(3))
        pixels[x, y] = (*color, 255)

    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, width, height], radius=radius, fill=255)
    gradient.putalpha(mask)
    return gradient


def point(value):
    return int(round(value * SCALE))


def draw_icon():
    image = rounded_gradient((CANVAS, CANVAS), point(115.2), "#A0C4FF", "#C2E0FF")

    shadow = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_color = (74, 62, 61, 34)
    stroke = point(56)
    check_stroke = point(70)

    shadow_draw.arc([point(112), point(112), point(400), point(400)], 0, 300, fill=shadow_color, width=stroke)
    shadow_draw.line(
        [(point(190), point(260)), (point(240), point(315)), (point(370), point(170))],
        fill=shadow_color,
        width=check_stroke,
        joint="curve",
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(point(10)))
    image.alpha_composite(shadow, (0, point(10)))

    draw = ImageDraw.Draw(image)
    white = (255, 255, 255, 242)

    draw.arc([point(112), point(112), point(400), point(400)], 0, 300, fill=white, width=stroke)
    for x, y in [(256, 112), (112, 256), (256, 400)]:
        draw.ellipse(
            [point(x - 10), point(y - 10), point(x + 10), point(y + 10)],
            fill=(255, 255, 255, 255),
        )
    draw.line(
        [(point(190), point(260)), (point(240), point(315)), (point(370), point(170))],
        fill=(255, 255, 255, 255),
        width=check_stroke,
        joint="curve",
    )

    draw.polygon(
        [(point(380), point(130)), (point(388), point(145)), (point(403), point(153)), (point(388), point(161)),
         (point(380), point(176)), (point(372), point(161)), (point(357), point(153)), (point(372), point(145))],
        fill=(255, 255, 255, 230),
    )
    draw.polygon(
        [(point(130), point(370)), (point(134), point(378)), (point(142), point(382)), (point(134), point(386)),
         (point(130), point(394)), (point(126), point(386)), (point(118), point(382)), (point(126), point(378))],
        fill=(255, 255, 255, 180),
    )

    return image.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


if __name__ == "__main__":
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    icon = draw_icon()
    icon.save(PNG_PATH)
    icon.save(ICO_PATH, sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print(f"Wrote {PNG_PATH}")
    print(f"Wrote {ICO_PATH}")
