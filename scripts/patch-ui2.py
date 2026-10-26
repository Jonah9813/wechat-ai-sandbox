from pathlib import Path

root = Path(__file__).resolve().parent.parent
css = root / 'src' / 'styles.css'
s = css.read_text(encoding='utf-8')

reps = [
    # Me: profile starts lower and QR floats over the full-width info column
    (""".me-scroll {
  background: var(--wx-nav);
  padding-top: 20px;
  padding-bottom: 12px;
}""", """.me-scroll {
  background: var(--wx-nav);
  padding-top: 32px;
  padding-bottom: 12px;
}"""),
    (""".me-profile {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 9px;
  padding: 26px 16px 22px;
  background: var(--wx-cell);
}""", """.me-profile {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 9px;
  padding: 30px 16px 24px;
  background: var(--wx-cell);
}"""),
    (""".me-qr {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--wx-secondary);
}""", """.me-qr {
  position: absolute;
  top: 29px;
  right: 14px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--wx-secondary);
}"""),
    # Moments header + post avatars
    (""".moments-topbar {
  position: absolute;
  top: 38px;""", """.moments-topbar {
  position: absolute;
  top: 44px;"""),
    (""".moment {
  display: flex;
  gap: 10px;
  padding: 12px 0;""", """.moment {
  display: flex;
  gap: 10px;
  padding: 13px 0;"""),
    # Chat: taller composer like a real phone, slightly smaller time
    (""".chat-date {
  margin: 8px 0 14px;
  color: var(--wx-secondary);
  font-size: 11px;
  text-align: center;
}""", """.chat-date {
  margin: 8px 0 14px;
  color: var(--wx-secondary);
  font-size: 12px;
  text-align: center;
}"""),
    (""".composer {
  position: relative;
  z-index: 25;
  flex: 0 0 auto;
  padding: 8px 8px calc(8px + env(safe-area-inset-bottom, 0px));
  background: var(--wx-cell);
  border-top: 0.5px solid var(--wx-line);
}""", """.composer {
  position: relative;
  z-index: 25;
  flex: 0 0 auto;
  padding: 10px 8px calc(12px + env(safe-area-inset-bottom, 0px));
  background: var(--wx-cell);
  border-top: 0.5px solid var(--wx-line);
}"""),
    (""".composer-icon {
  flex: 0 0 auto;
  width: 34px;
  height: 38px;""", """.composer-icon {
  flex: 0 0 auto;
  width: 34px;
  height: 40px;"""),
    (""".composer-input-wrap {
  flex: 1;
  min-width: 0;
  min-height: 38px;
  padding: 4px 6px 4px 10px;""", """.composer-input-wrap {
  flex: 1;
  min-width: 0;
  min-height: 40px;
  padding: 5px 6px 5px 10px;"""),
    (""".composer-emoji {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;""", """.composer-emoji {
  flex: 0 0 auto;
  width: 34px;
  height: 34px;"""),
]

for old, new in reps:
    if old not in s:
        raise SystemExit('MISS: ' + old[:50].replace('\n', '\\n'))
    s = s.replace(old, new, 1)
css.write_text(s, encoding='utf-8')

# nav back icon slightly smaller
nb = root / 'src' / 'components' / 'NavBar.tsx'
text = nb.read_text(encoding='utf-8')
text = text.replace('<ChevronLeft size={28} strokeWidth={1.7} />', '<ChevronLeft size={26} strokeWidth={1.7} />')
nb.write_text(text, encoding='utf-8')

# moments: smaller header icons, smaller post avatars
m = root / 'src' / 'screens' / 'MomentsScreen.tsx'
text = m.read_text(encoding='utf-8')
text = text.replace('<ChevronLeft size={27} strokeWidth={1.8} />', '<ChevronLeft size={24} strokeWidth={1.8} />')
text = text.replace('<Camera size={23} strokeWidth={1.8} />', '<Camera size={21} strokeWidth={1.8} />')
text = text.replace('<Avatar src={author.avatar} name={author.name} size={40} radius={5} />', '<Avatar src={author.avatar} name={author.name} size={32} radius={5} />')
m.write_text(text, encoding='utf-8')

print('round 2 patched')
