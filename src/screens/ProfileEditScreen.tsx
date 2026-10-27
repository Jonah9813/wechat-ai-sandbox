import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavBar, defaultBack } from '../components/NavBar'
import { Cell, CellGroup } from '../components/Cell'
import { Avatar } from '../components/Avatar'
import { createSeedData } from '../seed'
import { useApp } from '../store'

// 头像统一压成 512px 方形 JPEG，避免 localStorage 撑爆
const AVATAR_SIZE = 512

async function fileToAvatarDataUrl(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('read-failed'))
    reader.readAsDataURL(file)
  })
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('decode-failed'))
    img.src = raw
  })
  const side = Math.min(image.naturalWidth, image.naturalHeight)
  const x = (image.naturalWidth - side) / 2
  const y = (image.naturalHeight - side) / 2
  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no-canvas')
  ctx.drawImage(image, x, y, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE)
  return canvas.toDataURL('image/jpeg', 0.85)
}

export function ProfileEditScreen() {
  const navigate = useNavigate()
  const me = useApp((state) => state.me)
  const updateMe = useApp((state) => state.updateMe)
  const showToast = useApp((state) => state.showToast)
  const fileInput = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(me.name)
  const [region, setRegion] = useState(me.region)
  const [avatar, setAvatar] = useState(me.avatar)

  const pickAvatar = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('请选择图片文件')
      return
    }
    try {
      setAvatar(await fileToAvatarDataUrl(file))
    } catch {
      showToast('这张图片读不出来，换一张试试')
    }
  }

  const save = () => {
    const trimmedName = name.trim().slice(0, 20)
    if (!trimmedName) {
      showToast('名字不能为空')
      return
    }
    updateMe({ name: trimmedName, region: region.trim(), avatar })
    showToast('个人资料已更新')
    defaultBack(navigate)
  }

  const restoreDefault = () => {
    const seed = createSeedData().me
    setName(seed.name)
    setRegion(seed.region)
    setAvatar(seed.avatar)
    showToast('已恢复默认资料，点保存生效')
  }

  return (
    <div className="page page--sub profile-page">
      <NavBar
        back
        title="个人信息"
        right={
          <button type="button" className="nav-text-btn nav-text-btn--green" onClick={save}>
            保存
          </button>
        }
      />
      <div className="scroll settings-scroll">
        <CellGroup>
          <div className="cell profile-avatar-row">
            <div className="cell-body">
              <div className="cell-title">头像</div>
            </div>
            <button type="button" className="profile-avatar-btn" onClick={() => fileInput.current?.click()}>
              <Avatar src={avatar} name={name} size={44} radius={6} />
            </button>
            <button type="button" className="profile-avatar-change" onClick={() => fileInput.current?.click()}>
              更换
            </button>
          </div>
          <Cell
            title="名字"
            extra={
              <input
                className="profile-field-input"
                value={name}
                maxLength={20}
                placeholder="你的名字"
                onChange={(event) => setName(event.target.value)}
              />
            }
            arrow={false}
          />
          <Cell title="微信号" value={me.wechatId} />
          <Cell
            title="地区"
            extra={
              <input
                className="profile-field-input"
                value={region}
                maxLength={20}
                placeholder="例如：广东 深圳"
                onChange={(event) => setRegion(event.target.value)}
              />
            }
            arrow={false}
          />
        </CellGroup>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="profile-file-input"
          onChange={(event) => {
            void pickAvatar(event.target.files?.[0])
            event.target.value = ''
          }}
        />

        <p className="settings-footer">
          改完点右上角“保存”才会生效；头像会自动裁成方形并压缩。微信号是演示标识，不支持修改。
        </p>

        <CellGroup>
          <Cell title="恢复默认头像和名字" onClick={restoreDefault} />
        </CellGroup>
      </div>
    </div>
  )
}
