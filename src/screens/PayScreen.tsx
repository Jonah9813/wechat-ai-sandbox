import QRCode from 'qrcode'
import { ChevronLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { useApp } from '../store'

export function PayScreen() {
  const navigate = useNavigate()
  const me = useApp((state) => state.me)
  const showToast = useApp((state) => state.showToast)
  const [qr, setQr] = useState('')

  useEffect(() => {
    void QRCode.toDataURL(`wxp://f2f0DEMO${me.wechatId}`, {
      margin: 1,
      width: 520,
      color: { dark: '#111111', light: '#ffffff' },
    }).then(setQr)
  }, [me.wechatId])

  return (
    <div className="page page--sub pay-page">
      <div className="pay-topbar">
        <button type="button" className="pay-back" aria-label="返回" onClick={() => navigate(-1)}>
          <ChevronLeft size={27} strokeWidth={1.8} />
        </button>
        <span>收付款</span>
        <span className="pay-topbar-space" />
      </div>
      <div className="pay-body">
        <div className="pay-qr-card">
          <div className="pay-qr-name">{me.name}</div>
          <div className="pay-qr-frame">
            {qr ? <img src={qr} alt="付款码" /> : <div className="pay-qr-loading" />}
          </div>
          <div className="pay-qr-caption">向商家付款</div>
          <div className="pay-qr-hint">请出示给收银员扫描</div>
        </div>
        <div className="pay-links">
          <button type="button" onClick={() => showToast('二维码收款为演示壳')}>二维码收款</button>
          <button type="button" onClick={() => showToast('零钱余额为 0.00（演示）')}>零钱 ¥0.00</button>
          <button type="button" onClick={() => showToast('银行卡为演示壳')}>银行卡</button>
        </div>
        <div className="pay-methods">
          <div className="pay-methods-head">付款方式</div>
          <button type="button" onClick={() => showToast('零钱余额为 0.00（演示）')}>
            <span className="pay-method-name">零钱</span>
            <span className="pay-method-value">¥0.00 ›</span>
          </button>
          <button type="button" onClick={() => showToast('添加银行卡为演示壳')}>
            <span className="pay-method-name">添加银行卡</span>
            <span className="pay-method-value">›</span>
          </button>
        </div>
        <p className="pay-note">演示页面 · 不产生任何真实支付</p>
      </div>
    </div>
  )
}
