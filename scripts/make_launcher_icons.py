#!/usr/bin/env python3
"""生成安卓启动图标（绿底 + 两个白色气泡，接近微信风格）。

在 `npx cap add android` 之后运行一次：
    python scripts/make_launcher_icons.py

只改 android/app/src/main/res 里的图标资源，不动其他文件。
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
RES = ROOT / "android" / "app" / "src" / "main" / "res"

GREEN = (7, 193, 96, 255)
WHITE = (255, 255, 255, 255)

DENSITIES = {
    "mdpi": 1.0,
    "hdpi": 1.5,
    "xhdpi": 2.0,
    "xxhdpi": 3.0,
    "xxxhdpi": 4.0,
}


def draw_master(size: int, background: bool, content_scale: float = 1.0) -> Image.Image:
    """画一张 1024 逻辑尺寸的图，再缩放到目标尺寸。"""
    scale = 4
    canvas = 1024 * scale
    img = Image.new("RGBA", (canvas, canvas), GREEN if background else (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    def s(value: float) -> float:
        # 以 1024 为基准，先把内容缩到 content_scale，再居中
        return value * scale * content_scale + canvas * (1 - content_scale) / 2

    # 大气泡
    big = [s(168), s(210), s(742), s(660)]
    draw.rounded_rectangle(big, radius=s(150), fill=WHITE)
    draw.polygon(
        [(s(215), s(600)), (s(215), s(742)), (s(365), s(645))],
        fill=WHITE,
    )
    # 大气泡的两只眼睛（绿色圆点）
    for eye_x in (330, 500):
        draw.ellipse(
            [s(eye_x - 32), s(360 - 32), s(eye_x + 32), s(360 + 32)],
            fill=GREEN,
        )

    # 小气泡：先描一圈绿色，和大气泡区分开
    small = [s(512), s(470), s(936), s(800)]
    draw.rounded_rectangle(small, radius=s(130), fill=GREEN, outline=GREEN, width=int(s(26)))
    inner = [s(538), s(496), s(910), s(774)]
    draw.rounded_rectangle(inner, radius=s(108), fill=WHITE)
    draw.polygon(
        [(s(772), s(742)), (s(772), s(862)), (s(662), s(772))],
        fill=WHITE,
    )
    # 小气泡的两只眼睛
    for eye_x in (672, 812):
        draw.ellipse(
            [s(eye_x - 26), s(600 - 26), s(eye_x + 26), s(600 + 26)],
            fill=GREEN,
        )

    img = img.resize((size, size), Image.LANCZOS)
    return img


def rounded(img: Image.Image) -> Image.Image:
    size = img.size[0]
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def rounded_square(img: Image.Image, radius_ratio: float = 0.22) -> Image.Image:
    size = img.size[0]
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, size - 1, size - 1), radius=int(size * radius_ratio), fill=255
    )
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


SPLASH_SIZES = {
    "drawable": (480, 320),
    "drawable-land-mdpi": (480, 320),
    "drawable-land-hdpi": (800, 480),
    "drawable-land-xhdpi": (1280, 720),
    "drawable-land-xxhdpi": (1600, 960),
    "drawable-land-xxxhdpi": (1920, 1280),
    "drawable-port-mdpi": (320, 480),
    "drawable-port-hdpi": (480, 800),
    "drawable-port-xhdpi": (720, 1280),
    "drawable-port-xxhdpi": (960, 1600),
    "drawable-port-xxxhdpi": (1280, 1920),
}


def make_splash(width: int, height: int) -> Image.Image:
    image = Image.new("RGBA", (width, height), (17, 17, 17, 255))
    icon_size = max(72, int(min(width, height) * 0.3))
    icon = rounded_square(draw_master(icon_size, background=True))
    image.paste(icon, ((width - icon_size) // 2, (height - icon_size) // 2), icon)
    return image


def main() -> None:
    if not RES.exists():
        raise SystemExit("找不到 android/app/src/main/res，先运行 npx cap add android")

    for density, factor in DENSITIES.items():
        folder = RES / f"mipmap-{density}"
        folder.mkdir(parents=True, exist_ok=True)

        legacy_size = int(48 * factor)
        legacy = draw_master(legacy_size, background=True)
        legacy.save(folder / "ic_launcher.png")
        rounded(legacy).save(folder / "ic_launcher_round.png")

        # 自适应图标前景：108dp，内容放在中间约 60% 的安全区
        fg_size = int(108 * factor)
        foreground = draw_master(fg_size, background=False, content_scale=0.7)
        foreground.save(folder / "ic_launcher_foreground.png")

    # 自适应图标配置 + 背景色
    anydpi = RES / "mipmap-anydpi-v26"
    anydpi.mkdir(parents=True, exist_ok=True)
    adaptive = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
"""
    (anydpi / "ic_launcher.xml").write_text(adaptive, encoding="utf-8")
    (anydpi / "ic_launcher_round.xml").write_text(adaptive, encoding="utf-8")

    values = RES / "values"
    values.mkdir(parents=True, exist_ok=True)
    (values / "ic_launcher_background.xml").write_text(
        """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#07C160</color>
</resources>
""",
        encoding="utf-8",
    )

    # 启动图：暗色背景 + 居中图标，避免 Capacitor 默认白屏一闪
    for folder, (width, height) in SPLASH_SIZES.items():
        target_dir = RES / folder
        if not target_dir.exists():
            continue
        make_splash(width, height).save(target_dir / "splash.png")

    # 供网页里的「关于微信」页复用同一枚图标
    public = ROOT / "public"
    public.mkdir(exist_ok=True)
    draw_master(512, background=True).save(public / "app-icon.png")

    print(f"图标和启动图已生成：{RES}")


if __name__ == "__main__":
    main()
