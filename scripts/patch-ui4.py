from pathlib import Path

root = Path(__file__).resolve().parent.parent
css = root / 'src' / 'styles.css'
s = css.read_text(encoding='utf-8')

reps = [
    # dark-mode accent sampled from the phone screenshots
    ("  --wx-green: #07c160;\n  --wx-green-dark: #06ad56;", "  --wx-green: #58be6a;\n  --wx-green-dark: #4ca85e;"),
    # Me status bar / card run together like the real app
    (""".statusbar--dark {
  background: #111;
  color: #fff;
}""", """.statusbar--dark {
  background: #111;
  color: #fff;
}

.statusbar--me {
  background: #191919;
  color: #eeeeee;
}"""),
    (""".statusbar--green .battery,
.statusbar--dark .battery,
.statusbar--photo .battery {""", """.statusbar--green .battery,
.statusbar--dark .battery,
.statusbar--me .battery,
.statusbar--photo .battery {"""),
    (""".statusbar--green .battery::after,
.statusbar--dark .battery::after,
.statusbar--photo .battery::after {""", """.statusbar--green .battery::after,
.statusbar--dark .battery::after,
.statusbar--me .battery::after,
.statusbar--photo .battery::after {"""),
    (""".statusbar--green .battery-fill,
.statusbar--dark .battery-fill,
.statusbar--photo .battery-fill {""", """.statusbar--green .battery-fill,
.statusbar--dark .battery-fill,
.statusbar--me .battery-fill,
.statusbar--photo .battery-fill {"""),
    (""".me-scroll {
  background: var(--wx-nav);
  padding-top: 32px;
  padding-bottom: 12px;
}""", """.me-scroll {
  background: var(--wx-nav);
  padding-top: 0;
  padding-bottom: 12px;
}"""),
    (""".me-profile {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 9px;
  padding: 30px 16px 24px;
  background: var(--wx-cell);
}""", """.me-profile {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  min-height: 192px;
  margin-bottom: 9px;
  padding: 68px 16px 20px;
  background: var(--wx-cell);
}"""),
    (""".me-qr {
  position: absolute;
  top: 29px;
  right: 14px;""", """.me-qr {
  position: absolute;
  top: 68px;
  right: 14px;"""),
    (""".me-service {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 68px;
  padding: 0 16px;
  font-size: 16px;
}""", """.me-service {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 60px;
  padding: 0 16px;
  font-size: 16px;
}"""),
    (""".me-row {
  position: relative;
  width: 100%;
  min-height: 64px;""", """.me-row {
  position: relative;
  width: 100%;
  min-height: 60px;"""),
    # chat rows use the taller real rhythm
    (""".chat-row {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 8px 16px;
  background: var(--wx-cell);
}""", """.chat-row {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 15px 16px;
  background: var(--wx-cell);
}"""),
    (""".chat-time {
  flex: 0 0 auto;
  font-size: 12.5px;
  color: var(--wx-tertiary);
}""", """.chat-time {
  flex: 0 0 auto;
  font-size: 12.5px;
  color: #666666;
}"""),
    (""".chat-preview {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: var(--wx-secondary);
}""", """.chat-preview {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: #666666;
}"""),
    # the file assistant row sits on the pinned background in the reference
    (""".chat-row--system {
  background: var(--wx-cell);
}""", """.chat-row--system {
  background: var(--wx-pressed);
}"""),
    # contacts friend rows: 57dp total
    (""".contact-row {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 9px 16px;
  background: var(--wx-cell);
}""", """.contact-row {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 7px 16px;
  background: var(--wx-cell);
}"""),
    # discover rows are 57dp in the real app
    (""".discover-row {
  position: relative;
  width: 100%;
  height: 70px;""", """.discover-row {
  position: relative;
  width: 100%;
  height: 58px;"""),
    # composer matches the pure #111 chat surface
    (""".composer {
  position: relative;
  z-index: 25;
  flex: 0 0 auto;
  padding: 10px 8px calc(12px + env(safe-area-inset-bottom, 0px));
  background: var(--wx-cell);
  border-top: 0.5px solid var(--wx-line);
}""", """.composer {
  position: relative;
  z-index: 25;
  flex: 0 0 auto;
  padding: 10px 8px calc(12px + env(safe-area-inset-bottom, 0px));
  background: var(--wx-chat-bg);
  border-top: 0.5px solid var(--wx-line);
}"""),
    # timestamps in chat are darker than list previews
    (""".chat-date {
  margin: 8px 0 14px;
  color: var(--wx-secondary);
  font-size: 12px;
  text-align: center;
}""", """.chat-date {
  margin: 8px 0 14px;
  color: #595959;
  font-size: 12px;
  text-align: center;
}"""),
]

for old, new in reps:
    if old not in s:
        raise SystemExit('MISS: ' + old[:60].replace('\n', '\\n'))
    s = s.replace(old, new, 1)
css.write_text(s, encoding='utf-8')

# App: Me gets its own status-bar surface
app = root / 'src' / 'App.tsx'
s = app.read_text(encoding='utf-8')
s = s.replace("""        : location.pathname === '/moments'
          ? 'photo'
          : 'dark'""", """        : location.pathname === '/moments'
          ? 'photo'
          : location.pathname === '/me'
            ? 'me'
            : 'dark'""")
s = s.replace("export type StatusTheme = 'light' | 'dark' | 'green' | 'photo'", "export type StatusTheme = 'light' | 'dark' | 'green' | 'photo' | 'me'")
app.write_text(s, encoding='utf-8')

# StatusBar accepts the new theme
sb = root / 'src' / 'components' / 'StatusBar.tsx'
s = sb.read_text(encoding='utf-8')
s = s.replace("theme?: 'light' | 'dark' | 'green' | 'photo'", "theme?: 'light' | 'dark' | 'green' | 'photo' | 'me'")
sb.write_text(s, encoding='utf-8')

# active tab green sampled from the phone screenshots
tab = root / 'src' / 'components' / 'TabIcon.tsx'
s = tab.read_text(encoding='utf-8')
s = s.replace("const color = active ? '#07C160' : '#8C8C8C'", "const color = active ? '#58BE6A' : '#8C8C8C'")
tab.write_text(s, encoding='utf-8')

print('round 4 patched')
