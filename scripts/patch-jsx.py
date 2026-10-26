from pathlib import Path

root = Path(__file__).resolve().parent.parent / 'src'

# --- Discover: match the real group structure ---
p = root / 'screens' / 'DiscoverScreen.tsx'
s = p.read_text(encoding='utf-8')
s = s.replace("""import {
  Asterisk,
  AtSign,
  CirclePlus,
  Infinity as InfinityIcon,
  MapPin,
  Music2,
  Plus,
  ScanLine,
  Search,
} from 'lucide-react'""", """import {
  Asterisk,
  CircleDashed,
  CirclePlus,
  Infinity as InfinityIcon,
  Music2,
  Radar,
  ScanLine,
  Search,
} from 'lucide-react'""")

old_groups = """        <div className="discover-group">
          <DiscoverRow
            glyph={<span className="moments-glyph" />}
            label="朋友圈"
            onClick={() => navigate('/moments')}
          />
          <DiscoverRow
            glyph={<InfinityIcon size={23} strokeWidth={2.2} color="#f0a23a" />}
            label="视频号"
            onClick={() => showToast('视频号暂未接入')}
          />
          <DiscoverRow
            glyph={<ScanLine size={22} strokeWidth={2} color="#4b8de8" />}
            label="扫一扫"
            last
            onClick={() => navigate('/scan')}
          />
        </div>

        <div className="discover-group">
          <DiscoverRow
            glyph={<Music2 size={21} strokeWidth={2.2} color="#e05a5a" />}
            label="听一听"
            onClick={() => showToast('听一听暂未接入')}
          />
          <DiscoverRow
            glyph={<Asterisk size={24} strokeWidth={2.2} color="#e05a5a" />}
            label="搜一搜"
            last
            onClick={() => navigate('/search')}
          />
        </div>

        <div className="discover-group">
          <DiscoverRow
            glyph={<MapPin size={22} strokeWidth={2} color="#4b8de8" />}
            label="附近"
            onClick={() => showToast('附近暂未接入')}
          />
          <DiscoverRow
            glyph={<AtSign size={22} strokeWidth={2} color="#7a6ff0" />}
            label="小程序"
            last
            onClick={() => showToast('小程序暂未接入')}
          />
        </div>"""

new_groups = """        <div className="discover-group">
          <DiscoverRow
            glyph={<span className="moments-glyph" />}
            label="朋友圈"
            last
            onClick={() => navigate('/moments')}
          />
        </div>

        <div className="discover-group">
          <DiscoverRow
            glyph={<InfinityIcon size={25} strokeWidth={2.2} color="#f0a23a" />}
            label="视频号"
            last
            onClick={() => showToast('视频号暂未接入')}
          />
        </div>

        <div className="discover-group">
          <DiscoverRow
            glyph={<ScanLine size={24} strokeWidth={1.9} color="#4b8de8" />}
            label="扫一扫"
            onClick={() => navigate('/scan')}
          />
          <DiscoverRow
            glyph={<Music2 size={23} strokeWidth={2.2} color="#e05a5a" />}
            label="听一听"
            last
            onClick={() => showToast('听一听暂未接入')}
          />
        </div>

        <div className="discover-group">
          <DiscoverRow
            glyph={<Asterisk size={26} strokeWidth={2.2} color="#e05a5a" />}
            label="搜一搜"
            last
            onClick={() => navigate('/search')}
          />
        </div>

        <div className="discover-group">
          <DiscoverRow
            glyph={<Radar size={24} strokeWidth={1.8} color="#4b8de8" />}
            label="附近"
            last
            onClick={() => showToast('附近暂未接入')}
          />
        </div>

        <div className="discover-group">
          <DiscoverRow
            glyph={<CircleDashed size={24} strokeWidth={1.8} color="#6f7bf0" />}
            label="小程序"
            last
            onClick={() => showToast('小程序暂未接入')}
          />
        </div>"""

if old_groups not in s:
    raise SystemExit('discover groups miss')
s = s.replace(old_groups, new_groups)
s = s.replace('<Search size={22} strokeWidth={1.8} />', '<Search size={24} strokeWidth={1.8} />')
s = s.replace('<CirclePlus size={23} strokeWidth={1.6} />', '<CirclePlus size={25} strokeWidth={1.6} />')
p.write_text(s, encoding='utf-8')

# --- Chats: avatar and nav icon sizes ---
p = root / 'screens' / 'ChatsScreen.tsx'
s = p.read_text(encoding='utf-8')
s = s.replace('<Search size={22} strokeWidth={1.8} />', '<Search size={24} strokeWidth={1.8} />')
s = s.replace('<CirclePlus size={23} strokeWidth={1.6} />', '<CirclePlus size={25} strokeWidth={1.6} />')
s = s.replace('name={friend.name} size={44}', 'name={friend.name} size={42}')
s = s.replace('<FileText size={24} strokeWidth={1.8} />', '<FileText size={23} strokeWidth={1.8} />')
p.write_text(s, encoding='utf-8')

# --- Contacts: bigger icon tiles, nav icons, avatar ---
p = root / 'screens' / 'ContactsScreen.tsx'
s = p.read_text(encoding='utf-8')
s = s.replace('<Search size={22} strokeWidth={1.8} />', '<Search size={24} strokeWidth={1.8} />')
s = s.replace('<CirclePlus size={23} strokeWidth={1.6} />', '<CirclePlus size={25} strokeWidth={1.6} />')
s = s.replace('  MessageCircle,\n  Plus,\n  Search,', '  MessageCircle,\n  Search,')
s = s.replace('size={30}', 'size={38}')
s = s.replace('<UserPlus size={18} strokeWidth={2} />', '<UserPlus size={21} strokeWidth={2} />')
s = s.replace('<MessageCircle size={18} strokeWidth={2} />', '<MessageCircle size={21} strokeWidth={2} />')
s = s.replace('<Users size={18} strokeWidth={2} />', '<Users size={21} strokeWidth={2} />')
s = s.replace('<Tag size={17} strokeWidth={2} />', '<Tag size={20} strokeWidth={2} />')
s = s.replace('<BookOpenText size={17} strokeWidth={2} />', '<BookOpenText size={20} strokeWidth={2} />')
s = s.replace('<Gem size={17} strokeWidth={2} />', '<Gem size={20} strokeWidth={2} />')
s = s.replace('<Briefcase size={17} strokeWidth={2} />', '<Briefcase size={20} strokeWidth={2} />')
s = s.replace('name={friend.name} size={40}', 'name={friend.name} size={42}')
p.write_text(s, encoding='utf-8')

# --- Me: avatar, QR icon, row icon sizes ---
p = root / 'screens' / 'MeScreen.tsx'
s = p.read_text(encoding='utf-8')
s = s.replace('name={me.name} size={60}', 'name={me.name} size={64}')
s = s.replace('<QrCode size={20} strokeWidth={1.7} />', '<QrCode size={22} strokeWidth={1.7} />')
p.write_text(s, encoding='utf-8')

# --- Moments: profile avatar size ---
p = root / 'screens' / 'MomentsScreen.tsx'
s = p.read_text(encoding='utf-8')
s = s.replace('name={me.name} size={54} radius={7}', 'name={me.name} size={42} radius={6}')
p.write_text(s, encoding='utf-8')

print('jsx patched')
