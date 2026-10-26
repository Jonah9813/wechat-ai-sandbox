from pathlib import Path

root = Path(__file__).resolve().parent.parent
css = root / 'src' / 'styles.css'
s = css.read_text(encoding='utf-8')

s = s.replace("""  --wx-green: #5abe6c;
  --wx-green-dark: #4aa85a;
  --wx-bg: #191919;
  --wx-nav: #111111;
  --wx-tab: #111111;
  --wx-cell: #191919;
  --wx-text: #e6e6e6;
  --wx-secondary: #8a8a8a;
  --wx-tertiary: #6f6f6f;
  --wx-line: #2a2a2a;
  --wx-line-strong: #303030;""", """  --wx-green: #07c160;
  --wx-green-dark: #06ad56;
  --wx-bg: #191919;
  --wx-nav: #111111;
  --wx-tab: #1e1e1e;
  --wx-cell: #191919;
  --wx-text: #d1d1d1;
  --wx-secondary: #8c8c8c;
  --wx-tertiary: #5e5e5e;
  --wx-line: #242424;
  --wx-line-strong: #2e2e2e;""")

css.write_text(s, encoding='utf-8')

tab = root / 'src' / 'components' / 'TabIcon.tsx'
s = tab.read_text(encoding='utf-8')
s = s.replace("const color = active ? '#07C160' : '#7A7E83'", "const color = active ? '#07C160' : '#8C8C8C'")
tab.write_text(s, encoding='utf-8')

print('palette patched')
