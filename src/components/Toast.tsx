import { useApp } from '../store'

export function Toast() {
  const toast = useApp((state) => state.toast)
  return <div className={`toast ${toast ? 'toast--show' : ''}`}>{toast}</div>
}
