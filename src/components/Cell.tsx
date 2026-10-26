import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

type CellProps = {
  icon?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  value?: ReactNode
  extra?: ReactNode
  arrow?: boolean
  onClick?: () => void
  children?: ReactNode
  className?: string
  danger?: boolean
}

export function Cell({
  icon,
  title,
  subtitle,
  value,
  extra,
  arrow = true,
  onClick,
  children,
  className = '',
  danger = false,
}: CellProps) {
  const content = (
    <>
      {icon ? <div className="cell-icon">{icon}</div> : null}
      <div className="cell-body">
        <div className={`cell-title ${danger ? 'cell-title--danger' : ''}`}>{title}</div>
        {subtitle ? <div className="cell-subtitle">{subtitle}</div> : null}
      </div>
      {value ? <div className="cell-value">{value}</div> : null}
      {extra}
      {onClick && arrow ? <ChevronRight className="cell-arrow" size={18} strokeWidth={1.5} /> : null}
    </>
  )
  if (onClick) {
    return (
      <button type="button" className={`cell ${className}`} onClick={onClick}>
        {content}
      </button>
    )
  }
  return <div className={`cell ${className}`}>{content}</div>
}

export function CellGroup({
  children,
  className = '',
  title,
}: {
  children: ReactNode
  className?: string
  title?: string
}) {
  return (
    <section className={`cell-group ${className}`}>
      {title ? <div className="group-title">{title}</div> : null}
      <div className="cell-group-inner">{children}</div>
    </section>
  )
}

export function IconTile({
  children,
  background,
  size = 28,
}: {
  children: ReactNode
  background: string
  size?: number
}) {
  return (
    <span className="icon-tile" style={{ width: size, height: size, background }}>
      {children}
    </span>
  )
}

export function Switch({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`switch ${checked ? 'switch--on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="switch-knob" />
    </button>
  )
}
