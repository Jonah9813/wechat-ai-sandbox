import type { CSSProperties, MouseEventHandler } from 'react'

type AvatarProps = {
  src?: string
  name?: string
  size?: number
  radius?: number
  className?: string
  style?: CSSProperties
  onClick?: MouseEventHandler<HTMLDivElement>
}

export function Avatar({
  src,
  name = '',
  size = 48,
  radius = 6,
  className = '',
  style,
  onClick,
}: AvatarProps) {
  return (
    <div
      className={`avatar ${className}`}
      style={{ width: size, height: size, borderRadius: radius, ...style }}
      onClick={onClick}
      aria-label={name}
    >
      {src ? (
        <img src={src} alt={name} draggable={false} />
      ) : (
        <span className="avatar-fallback">{name.slice(0, 1)}</span>
      )}
    </div>
  )
}
