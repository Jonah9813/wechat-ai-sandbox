"""从官方手机截图裁剪图标，输出到 public/icons，供 UI 直接引用。

坐标是 1260×2800 原始像素；显示时按 CSS px 使用（约 3.07 px/dp）。
"""
from PIL import Image
import numpy as np
import os

OUT = 'public/icons'
os.makedirs(OUT, exist_ok=True)


def save(src, box, name):
    im = Image.open(src).convert('RGB').crop(box)
    im.save(f'{OUT}/{name}.png')
    print(name, im.size)


CONTACTS = 'images/Screenshot_20261026_014238.jpg'
for name, (y0, y1) in zip(
    ['contacts-new', 'contacts-chatonly', 'contacts-group', 'contacts-tag',
     'contacts-official', 'contacts-service', 'contacts-enterprise'],
    [(318, 445), (494, 621), (670, 797), (846, 973),
     (1022, 1149), (1198, 1325), (1475, 1602)],
):
    save(CONTACTS, (49, y0, 176, y1), name)

CHATS = 'images/Screenshot_20261026_014211.jpg'
# 文件传输助手与通讯录 tile 同尺寸同 x 区间，固定框裁剪避免误扩背景
save(CHATS, (49, 321, 176, 448), 'chat-fileassistant')

DISCOVER = 'images/Screenshot_20261026_014242.jpg'
for name, (x0, y0, x1, y1) in zip(
    ['discover-moments', 'discover-channels', 'discover-scan', 'discover-listen',
     'discover-search', 'discover-nearby', 'discover-mini'],
    [(54, 351, 122, 417), (55, 558, 120, 614), (57, 757, 119, 819), (68, 933, 114, 994),
     (53, 1132, 123, 1201), (55, 1336, 120, 1402), (54, 1536, 121, 1603)],
):
    save(DISCOVER, (x0, y0, x1, y1), name)

ME = 'images/Screenshot_20261026_014246.jpg'
for name, (x0, y0, x1, y1) in zip(
    ['me-service', 'me-fav', 'me-moments', 'me-works', 'me-store', 'me-emoji', 'me-settings'],
    [(54, 790, 121, 851), (57, 989, 118, 1058), (54, 1171, 122, 1226), (57, 1340, 120, 1409),
     (54, 1519, 121, 1582), (54, 1693, 121, 1751), (54, 1895, 122, 1963)],
):
    save(ME, (x0, y0, x1, y1), name)

# 底栏：每个页面各有一个激活态，其余为未激活态
pages = {'chat': CHATS, 'contacts': CONTACTS, 'discover': DISCOVER, 'me': ME}
centers = {'chat': 157, 'contacts': 472, 'discover': 787, 'me': 1102}
for active, path in pages.items():
    arr = np.array(Image.open(path).convert('RGB')).astype(int)
    for name, cx in centers.items():
        seg = arr[2625:2733, cx - 60:cx + 60]
        if name == active:
            mask = (seg[:, :, 1] > seg[:, :, 0] + 25) & (seg[:, :, 1] > seg[:, :, 2] + 25) & (seg[:, :, 1] > 80)
        else:
            mask = seg.mean(2) > 90
        ys, xs = np.where(mask)
        if not len(xs):
            print('MISS', active, name)
            continue
        x0, x1 = cx - 60 + xs.min(), cx - 60 + xs.max()
        y0, y1 = 2625 + ys.min(), 2625 + ys.max()
        suffix = '-active' if name == active else ''
        save(path, (x0 - 1, y0 - 1, x1 + 2, y1 + 2), f'tab-{name}{suffix}')
