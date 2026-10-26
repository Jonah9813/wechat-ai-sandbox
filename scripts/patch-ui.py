from pathlib import Path

p = Path(__file__).resolve().parent.parent / 'src' / 'styles.css'
s = p.read_text(encoding='utf-8')

replacements = [
    # device frame: match 412dp phone
    (""".device {
  width: 420px;
  height: 874px;
  padding: 10px;
  border-radius: 58px;""", """.device {
  width: 432px;
  height: 934px;
  padding: 10px;
  border-radius: 60px;"""),
    # status bar
    (""".statusbar {
  position: relative;
  z-index: 30;
  flex: 0 0 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: var(--wx-nav);
  color: var(--wx-text);
  font-size: 14px;""", """.statusbar {
  position: relative;
  z-index: 30;
  flex: 0 0 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: var(--wx-nav);
  color: var(--wx-text);
  font-size: 15px;"""),
    # photo status bar overlays the cover
    (""".statusbar--photo {
  background: linear-gradient(to bottom, #65798c, #6f8494);
  color: #fff;
}""", """.statusbar--photo {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: transparent;
  color: #fff;
  pointer-events: none;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
}"""),
    # nav
    (""".nav {
  position: relative;
  z-index: 20;
  flex: 0 0 44px;
  height: 44px;""", """.nav {
  position: relative;
  z-index: 20;
  flex: 0 0 48px;
  height: 48px;"""),
    ("""  white-space: nowrap;
  font-size: 17px;
  font-weight: 600;
  color: var(--wx-text);
}""", """  white-space: nowrap;
  font-size: 17.5px;
  font-weight: 600;
  color: var(--wx-text);
}"""),
    # chat list rhythm
    (""".chat-row {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;""", """.chat-row {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 8px 16px;"""),
    ("""  left: 68px;
  right: 0;
  bottom: 0;
  height: 0.5px;
  background: var(--wx-line);
}

.system-avatar {
  width: 44px;
  height: 44px;""", """  left: 71px;
  right: 0;
  bottom: 0;
  height: 0.5px;
  background: var(--wx-line);
}

.system-avatar {
  width: 42px;
  height: 42px;"""),
    (""".chat-time {
  flex: 0 0 auto;
  font-size: 11.5px;""", """.chat-time {
  flex: 0 0 auto;
  font-size: 12.5px;"""),
    # short chats start at the top like real WeChat
    (""".chat-date:first-child {
  margin-top: auto;
}

""", """.chat-date:first-child {
  margin-top: 14px;
}

"""),
    # contacts sizing
    (""".contact-func {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;""", """.contact-func {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 9px 16px;"""),
    ("""  left: 56px;
  right: 0;
  bottom: 0;
  height: 0.5px;
  background: var(--wx-line);
}

.contact-func:last-child::after""", """  left: 58px;
  right: 0;
  bottom: 0;
  height: 0.5px;
  background: var(--wx-line);
}

.contact-func:last-child::after"""),
    (""".section-letter {
  height: 24px;""", """.section-letter {
  height: 28px;"""),
    (""".contact-row {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;""", """.contact-row {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 9px 16px;"""),
    ("""  left: 68px;
  right: 0;
  bottom: 0;
  height: 0.5px;
  background: var(--wx-line);
}

.contact-row:last-child::after""", """  left: 70px;
  right: 0;
  bottom: 0;
  height: 0.5px;
  background: var(--wx-line);
}

.contact-row:last-child::after"""),
    (""".contact-index {
  position: absolute;
  z-index: 6;
  top: 100px;
  right: 2px;
  bottom: 60px;
  width: 17px;""", """.contact-index {
  position: absolute;
  z-index: 6;
  top: 24%;
  right: 2px;
  bottom: 20%;
  width: 17px;"""),
    # discover sizing
    (""".discover-group {
  margin-bottom: 8px;
  background: var(--wx-cell);
}""", """.discover-group {
  margin-bottom: 10px;
  background: var(--wx-cell);
}"""),
    (""".discover-row {
  position: relative;
  width: 100%;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 14px;""", """.discover-row {
  position: relative;
  width: 100%;
  height: 70px;
  display: flex;
  align-items: center;
  gap: 16px;"""),
    ("""  left: 64px;
  right: 0;
  bottom: 0;
  height: 0.5px;
  background: var(--wx-line);
}

.discover-row--last::after""", """  left: 56px;
  right: 0;
  bottom: 0;
  height: 0.5px;
  background: var(--wx-line);
}

.discover-row--last::after"""),
    # me page rhythm
    (""".me-scroll {
  background: var(--wx-nav);
  padding-top: 10px;
  padding-bottom: 12px;
}""", """.me-scroll {
  background: var(--wx-nav);
  padding-top: 20px;
  padding-bottom: 12px;
}"""),
    (""".me-profile {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 22px 16px 20px;
  background: var(--wx-cell);
}""", """.me-profile {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 9px;
  padding: 26px 16px 22px;
  background: var(--wx-cell);
}"""),
    (""".me-card {
  margin-bottom: 8px;
  background: var(--wx-cell);
}""", """.me-card {
  margin-bottom: 9px;
  background: var(--wx-cell);
}"""),
    (""".me-service {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 16px;
  font-size: 16px;
}""", """.me-service {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 68px;
  padding: 0 16px;
  font-size: 16px;
}"""),
    (""".me-row {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  font-size: 16px;
}""", """.me-row {
  position: relative;
  width: 100%;
  min-height: 64px;
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 0 16px;
  font-size: 16px;
}"""),
    # moments cover and profile block
    (""".moments-cover {
  position: relative;
  height: 260px;
  overflow: hidden;
  background: #333;
}""", """.moments-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 1.388 / 1;
  overflow: hidden;
  background: #333;
}"""),
    (""".moments-topbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 4;
  height: 48px;""", """.moments-topbar {
  position: absolute;
  top: 38px;
  left: 0;
  right: 0;
  z-index: 4;
  height: 44px;"""),
    (""".moments-me {
  position: absolute;
  right: 14px;
  bottom: 7px;
  z-index: 2;
  display: flex;
  align-items: flex-end;
  gap: 10px;
}""", """.moments-me {
  position: absolute;
  right: 14px;
  bottom: 29.5%;
  z-index: 2;
  display: flex;
  align-items: flex-end;
  gap: 9px;
}"""),
    (""".moments-feed {
  padding: 26px 16px 0;
  background: var(--wx-cell);
}""", """.moments-feed {
  padding: 48px 16px 0;
  background: var(--wx-cell);
}"""),
    # responsive: only true phones go full-bleed
    ("""@media (max-width: 560px), (max-height: 820px) {""", """@media (max-width: 480px) {"""),
    ("""@media (max-height: 820px) and (min-width: 561px) {
  .device {
    height: 94vh;
    width: calc(94vh * 0.4805);
  }
}""", """@media (min-width: 481px) and (max-height: 960px) {
  .device {
    height: 94vh;
    width: calc(94vh * 0.4625);
  }
}"""),
]

for old, new in replacements:
    if old not in s:
        raise SystemExit('MISS: ' + old[:60].replace('\n', '\\n'))
    s = s.replace(old, new, 1)

p.write_text(s, encoding='utf-8')
print('patched', len(replacements))
