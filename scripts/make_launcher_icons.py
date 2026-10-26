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

SOURCE = ROOT / "scripts" / "assets" / "wechat-icon.jpg"
GREEN = (46, 194, 0, 255)

DENSITIES = {
    "mdpi": 1.0,
    "hdpi": 1.5,
    "xhdpi": 2.0,
    "xxhdpi": 3.0,
    "xxxhdpi": 4.0,
}


def load_master() -> Image.Image:
    """用用户提供的微信图标原图做母版：去水印、补满四角，得到全绿方块。"""
    if not SOURCE.exists():
        raise SystemExit(f"找不到图标原图：{SOURCE}")

    img = Image.open(SOURCE).convert("RGB")
    width, height = img.size
    draw = ImageDraw.Draw(img)

    # 原图底部有网站水印；最低的白色气泡约在 87% 高度，从 90% 往下直接铺绿
    draw.rectangle([0, int(height * 0.90), width, height], fill=GREEN[:3])

    # 原图是圆角绿方块、四角为白；从四角泛洪填绿，保留中间的白色气泡
    for corner in ((0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)):
        ImageDraw.floodfill(img, corner, GREEN[:3], thresh=48)

    # 原图边缘有一圈抗锯齿白线，直接压一圈绿盖掉
    draw.rectangle([0, 0, width - 1, height - 1], outline=GREEN[:3], width=4)

    return img.convert("RGBA")


def resized_master(size: int) -> Image.Image:
    return load_master().resize((size, size), Image.LANCZOS)


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
    icon = rounded_square(resized_master(icon_size), radius_ratio=0.12)
    image.paste(icon, ((width - icon_size) // 2, (height - icon_size) // 2), icon)
    return image


def main() -> None:
    if not RES.exists():
        raise SystemExit("找不到 android/app/src/main/res，先运行 npx cap add android")

    for density, factor in DENSITIES.items():
        folder = RES / f"mipmap-{density}"
        folder.mkdir(parents=True, exist_ok=True)

        legacy_size = int(48 * factor)
        legacy = rounded_square(resized_master(legacy_size), radius_ratio=0.12)
        legacy.save(folder / "ic_launcher.png")
        rounded(legacy).save(folder / "ic_launcher_round.png")

        # 自适应图标前景：108dp，原图缩到中间约 68% 的安全区
        fg_size = int(108 * factor)
        foreground = Image.new("RGBA", (fg_size, fg_size), GREEN)
        inner = resized_master(int(fg_size * 0.68))
        foreground.paste(inner, ((fg_size - inner.width) // 2, (fg_size - inner.height) // 2), inner)
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
    <color name="ic_launcher_background">#2EC100</color>
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
    rounded_square(resized_master(512), radius_ratio=0.12).save(public / "app-icon.png")

    print(f"图标和启动图已生成：{RES}")


if __name__ == "__main__":
    main()
