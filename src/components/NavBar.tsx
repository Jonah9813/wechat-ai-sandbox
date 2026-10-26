import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type NavBarProps = {
  title?: ReactNode
  subtitle?: ReactNode
  back?: boolean
  onBack?: () => void
  right?: ReactNode
  align?: 'center' | 'left'
  transparent?: boolean
  border?: boolean
}

export function defaultBack(navigate: ReturnType<typeof useNavigate>) {
  if (window.history.length > 1) navigate(-1)
  else navigate('/chats')
}

export function NavBar({
  title,
  subtitle,
  back = false,
  onBack,
  right,
  align = 'center',
  transparent = false,
  border = false,
}: NavBarProps) {
  const navigate = useNavigate()
  return (
    <header
      className={`nav ${align === 'left' ? 'nav--left' : ''} ${transparent ? 'nav--transparent' : ''} ${border ? 'nav--border' : ''}`}
    >
      <div className="nav-side nav-side--left">
        {back ? (
          <button
            type="button"
            className="nav-icon-btn nav-back"
            aria-label="返回"
            onClick={() => (onBack ? onBack() : defaultBack(navigate))}
          >
            <ChevronLeft size={24} strokeWidth={1.8} />
          </button>
        ) : null}
      </div>
      <div className="nav-title-wrap">
        <div className="nav-title">{title}</div>
        {subtitle ? <div className="nav-subtitle">{subtitle}</div> : null}
      </div>
      <div className="nav-side nav-side--right">{right}</div>
    </header>
  )
}

export function NavTextButton({
  children,
  onClick,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button type="button" className={`nav-text-btn ${className}`} onClick={onClick}>
      {children}
    </button>
  )
}
