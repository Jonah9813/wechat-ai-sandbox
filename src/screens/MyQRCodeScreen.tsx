import QRCode from 'qrcode'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Avatar } from '../components/Avatar'
import { NavBar } from '../components/NavBar'
import { useApp } from '../store'

export function MyQRCodeScreen() {
  const navigate = useNavigate()
  const me = useApp((state) => state.me)
  const showToast = useApp((state) => state.showToast)
  const [qr, setQr] = useState('')

  useEffect(() => {
    void QRCode.toDataURL(`weixin://addfriend/${me.wechatId}`, {
      margin: 1,
      width: 560,
      color: { dark: '#191919', light: '#ffffff' },
    }).then(setQr)
  }, [me.wechatId])

  return (
    <div className="page page--sub my-qr-page">
      <NavBar back title="我的二维码" />
      <div className="scroll my-qr-scroll">
        <section className="my-qr-card">
          <div className="my-qr-person">
            <Avatar src={me.avatar} name={me.name} size={56} radius={7} />
            <div>
              <div className="my-qr-name">{me.name}</div>
              <div className="my-qr-region">{me.region}</div>
            </div>
          </div>
          <div className="my-qr-code">
            {qr ? <img src={qr} alt="我的二维码" /> : <div className="pay-qr-loading" />}
          </div>
          <div className="my-qr-hint">扫一扫上面的二维码，加我为朋友</div>
        </section>
        <div className="my-qr-actions">
          <button type="button" onClick={() => navigate('/scan')}>扫一扫</button>
          <button type="button" onClick={() => showToast('保存二维码为演示功能')}>保存图片</button>
        </div>
        <p className="settings-footer">二维码内容是本地演示链接，不会真的添加微信好友。</p>
      </div>
    </div>
  )
}
