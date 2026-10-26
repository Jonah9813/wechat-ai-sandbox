import { CreditCard, ReceiptText, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Cell, CellGroup, IconTile } from '../components/Cell'
import { NavBar } from '../components/NavBar'
import { useApp } from '../store'

export function WalletScreen() {
  const navigate = useNavigate()
  const showToast = useApp((state) => state.showToast)
  return (
    <div className="page page--sub wallet-page">
      <NavBar back title="钱包" />
      <div className="scroll settings-scroll">
        <section className="wallet-hero">
          <div className="wallet-hero-label">零钱</div>
          <div className="wallet-hero-balance">¥ 0.00</div>
          <div className="wallet-hero-actions">
            <button type="button" onClick={() => navigate('/pay')}>收付款</button>
            <button type="button" onClick={() => showToast('充值功能为演示壳')}>充值</button>
          </div>
        </section>

        <CellGroup>
          <Cell
            icon={<IconTile background="linear-gradient(135deg, #ffd15c, #ff9d1a)"><Wallet size={16} strokeWidth={2} /></IconTile>}
            title="零钱"
            value="¥ 0.00"
            onClick={() => showToast('零钱明细为演示壳')}
          />
          <Cell
            icon={<IconTile background="linear-gradient(135deg, #6bb9ff, #3a7cff)"><CreditCard size={16} strokeWidth={2} /></IconTile>}
            title="银行卡"
            value="未绑定"
            onClick={() => showToast('银行卡为演示壳')}
          />
          <Cell
            icon={<IconTile background="linear-gradient(135deg, #7bd88f, #07a83f)"><ReceiptText size={16} strokeWidth={2} /></IconTile>}
            title="账单"
            onClick={() => showToast('账单为演示壳')}
          />
        </CellGroup>

        <p className="settings-footer">钱包是纯视觉壳。后续接入真实支付需要商户号、合规与后端，不建议在个人沙盒里做。</p>
      </div>
    </div>
  )
}
