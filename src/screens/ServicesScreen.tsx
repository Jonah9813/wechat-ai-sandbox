import {
  ArrowLeftRight,
  Building2,
  CreditCard,
  HeartPulse,
  QrCode,
  ReceiptText,
  ScanLine,
  Smartphone,
  Wallet,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { useApp } from '../store'

const services = [
  { label: '收付款', icon: <ScanLine size={22} strokeWidth={1.8} />, bg: 'linear-gradient(135deg, #7bd88f, #07a83f)', action: 'pay' },
  { label: '钱包', icon: <Wallet size={22} strokeWidth={1.8} />, bg: 'linear-gradient(135deg, #ffd15c, #ff9d1a)', action: 'wallet' },
  { label: '转账', icon: <ArrowLeftRight size={22} strokeWidth={1.8} />, bg: 'linear-gradient(135deg, #7bd88f, #07a83f)', action: 'toast' },
  { label: '信用卡还款', icon: <CreditCard size={22} strokeWidth={1.8} />, bg: 'linear-gradient(135deg, #6bb9ff, #3a7cff)', action: 'toast' },
  { label: '手机充值', icon: <Smartphone size={22} strokeWidth={1.8} />, bg: 'linear-gradient(135deg, #6bb9ff, #3a7cff)', action: 'toast' },
  { label: '生活缴费', icon: <ReceiptText size={22} strokeWidth={1.8} />, bg: 'linear-gradient(135deg, #ffb15c, #ff7a1a)', action: 'toast' },
  { label: '城市服务', icon: <Building2 size={22} strokeWidth={1.8} />, bg: 'linear-gradient(135deg, #8f9bb3, #5c6982)', action: 'toast' },
  { label: '医疗健康', icon: <HeartPulse size={22} strokeWidth={1.8} />, bg: 'linear-gradient(135deg, #ff8f8f, #f05252)', action: 'toast' },
]

export function ServicesScreen() {
  const navigate = useNavigate()
  const showToast = useApp((state) => state.showToast)
  return (
    <div className="page page--sub services-page">
      <NavBar back title="服务" />
      <div className="scroll">
        <section className="service-pay-card" onClick={() => navigate('/pay')} role="button" tabIndex={0}>
          <div>
            <div className="service-pay-title">收付款</div>
            <div className="service-pay-sub">向商家付款或出示收款码</div>
          </div>
          <div className="service-pay-qr">
            <QrCode size={28} strokeWidth={1.6} />
          </div>
        </section>

        <section className="service-grid-card">
          {services.map((service) => (
            <button
              key={service.label}
              type="button"
              className="service-item"
              onClick={() => {
                if (service.action === 'pay') navigate('/pay')
                else if (service.action === 'wallet') navigate('/wallet')
                else showToast(`${service.label}为演示壳，未接入真实支付`)
              }}
            >
              <span className="service-icon" style={{ background: service.bg }}>
                {service.icon}
              </span>
              <span>{service.label}</span>
            </button>
          ))}
        </section>

        <section className="wallet-preview" onClick={() => navigate('/wallet')} role="button" tabIndex={0}>
          <div className="wallet-preview-left">
            <span className="wallet-preview-label">钱包</span>
            <span className="wallet-preview-balance">¥ 0.00</span>
          </div>
          <span className="wallet-preview-arrow">›</span>
        </section>

        <p className="settings-footer service-footer">
          支付相关页面只做视觉壳，没有真实账户、余额、银行卡或交易能力。
        </p>
      </div>
    </div>
  )
}
