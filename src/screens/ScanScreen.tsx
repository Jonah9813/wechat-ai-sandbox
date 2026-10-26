import { ChevronLeft, Flashlight, Image } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store'

export function ScanScreen() {
  const navigate = useNavigate()
  const showToast = useApp((state) => state.showToast)
  return (
    <div className="page page--sub scan-page">
      <div className="scan-topbar">
        <button type="button" aria-label="返回" onClick={() => navigate(-1)}>
          <ChevronLeft size={27} strokeWidth={1.8} />
        </button>
        <span>扫一扫</span>
        <span className="scan-space" />
      </div>
      <div className="scan-body">
        <button type="button" className="scan-frame" onClick={() => showToast('请用手机相机扫描（演示）')}>
          <span className="scan-corner scan-corner--tl" />
          <span className="scan-corner scan-corner--tr" />
          <span className="scan-corner scan-corner--bl" />
          <span className="scan-corner scan-corner--br" />
          <span className="scan-line" />
        </button>
        <p className="scan-hint">将二维码/条码放入框内，即可自动扫描</p>
        <div className="scan-actions">
          <button type="button" onClick={() => showToast('从相册选择为演示功能')}>
            <Image size={22} strokeWidth={1.7} />
            <span>相册</span>
          </button>
          <button type="button" onClick={() => showToast('手电筒为演示功能')}>
            <Flashlight size={22} strokeWidth={1.7} />
            <span>手电筒</span>
          </button>
        </div>
      </div>
    </div>
  )
}
