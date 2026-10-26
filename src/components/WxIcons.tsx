/** 图标全部直接使用官方截图裁切出的 PNG，路径见 public/icons。 */
const ICON_BASE = `${import.meta.env.BASE_URL}icons/`

export function WxIconImage({
  name,
  width,
  height,
  className,
}: {
  name: string
  width: number
  height: number
  className?: string
}) {
  return (
    <img
      className={className}
      src={`${ICON_BASE}${name}.png`}
      width={width}
      height={height}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  )
}

type ContactKind = 'new' | 'chatOnly' | 'group' | 'tag' | 'official' | 'service' | 'enterprise'

const contactImage: Record<ContactKind, string> = {
  new: 'contacts-new',
  chatOnly: 'contacts-chatonly',
  group: 'contacts-group',
  tag: 'contacts-tag',
  official: 'contacts-official',
  service: 'contacts-service',
  enterprise: 'contacts-enterprise',
}

export function ContactTile({ kind }: { kind: ContactKind }) {
  return <WxIconImage className="contact-tile" name={contactImage[kind]} width={41} height={41} />
}

export function FileAssistantGlyph({ size = 41 }: { size?: number }) {
  return <WxIconImage className="contact-tile" name="chat-fileassistant" width={size} height={size} />
}

/* -------- 发现页 -------- */

export function MomentsGlyph() {
  return <WxIconImage name="discover-moments" width={22} height={21.5} />
}

export function ChannelsGlyph() {
  return <WxIconImage name="discover-channels" width={21} height={18.5} />
}

export function ScanGlyph() {
  return <WxIconImage name="discover-scan" width={20} height={20} />
}

export function ListenGlyph() {
  return <WxIconImage name="discover-listen" width={15} height={20} />
}

export function SearchGlyph() {
  return <WxIconImage name="discover-search" width={23} height={22.5} />
}

export function NearbyGlyph() {
  return <WxIconImage name="discover-nearby" width={21} height={21.5} />
}

export function MiniGlyph() {
  return <WxIconImage name="discover-mini" width={22} height={22} />
}

/* -------- 我页 -------- */

export function ServiceGlyph({ className }: { size?: number; className?: string }) {
  return <WxIconImage className={className} name="me-service" width={22} height={20} />
}

export function CubeGlyph({ className }: { size?: number; className?: string }) {
  return <WxIconImage className={className} name="me-fav" width={20} height={22.5} />
}

export function PhotoGlyph({ className }: { size?: number; className?: string }) {
  return <WxIconImage className={className} name="me-moments" width={22} height={18} />
}

export function WorksGlyph({ className }: { size?: number; className?: string }) {
  return <WxIconImage className={className} name="me-works" width={20.5} height={22.5} />
}

export function StoreGlyph({ className }: { size?: number; className?: string }) {
  return <WxIconImage className={className} name="me-store" width={22} height={20.5} />
}

export function EmojiGlyph({ className }: { size?: number; className?: string }) {
  return <WxIconImage className={className} name="me-emoji" width={22} height={19} />
}

export function SettingsGlyph({ className }: { size?: number; className?: string }) {
  return <WxIconImage className={className} name="me-settings" width={22} height={22} />
}
