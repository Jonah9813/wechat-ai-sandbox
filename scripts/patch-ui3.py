from pathlib import Path

root = Path(__file__).resolve().parent.parent

# status theme: only the feed is full-bleed, not the compose page
app = root / 'src' / 'App.tsx'
s = app.read_text(encoding='utf-8')
s = s.replace("""        : location.pathname.startsWith('/moments')
          ? 'photo'
          : 'dark'""", """        : location.pathname === '/moments'
          ? 'photo'
          : 'dark'""")
app.write_text(s, encoding='utf-8')

# tab icon: active discover is an outlined compass, not a filled disc
tab = root / 'src' / 'components' / 'TabIcon.tsx'
s = tab.read_text(encoding='utf-8')
s = s.replace("""        <circle
          cx="14"
          cy="14"
          r="10.4"
          fill={active ? color : 'none'}
          stroke={color}
          strokeWidth={active ? 0 : 1.75}
        />
        <path
          d="m18.7 9.3-2.8 6.1-6.1 2.8 2.8-6.1 6.1-2.8Z"
          fill={active ? '#fff' : 'none'}
          stroke={active ? 'none' : color}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />""", """        <circle cx="14" cy="14" r="10.4" fill="none" stroke={color} strokeWidth="1.8" />
        <path
          d="m18.7 9.3-2.8 6.1-6.1 2.8 2.8-6.1 6.1-2.8Z"
          fill={active ? color : 'none'}
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />""")
tab.write_text(s, encoding='utf-8')

# back chevron
nav = root / 'src' / 'components' / 'NavBar.tsx'
s = nav.read_text(encoding='utf-8')
s = s.replace('<ChevronLeft size={26} strokeWidth={1.7} />', '<ChevronLeft size={24} strokeWidth={1.8} />')
nav.write_text(s, encoding='utf-8')

# small spacing fixes
css = root / 'src' / 'styles.css'
s = css.read_text(encoding='utf-8')
s = s.replace(""".moments-topbar {
  position: absolute;
  top: 44px;""", """.moments-topbar {
  position: absolute;
  top: 50px;""")
s = s.replace(""".moments-feed {
  padding: 48px 16px 0;""", """.moments-feed {
  padding: 42px 16px 0;""")
s = s.replace(""".section-letter {
  height: 28px;""", """.section-letter {
  height: 30px;""")
css.write_text(s, encoding='utf-8')

# browser chrome color
html = root / 'index.html'
s = html.read_text(encoding='utf-8')
s = s.replace('<meta name="theme-color" content="#ededed" />', '<meta name="theme-color" content="#111111" />')
html.write_text(s, encoding='utf-8')

print('round 3 patched')
