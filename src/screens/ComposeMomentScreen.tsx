import { ChevronLeft, ImagePlus, MapPin, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { compressImage } from '../lib/image'
import { useApp } from '../store'

export function ComposeMomentScreen() {
  const navigate = useNavigate()
  const addMoment = useApp((state) => state.addMoment)
  const showToast = useApp((state) => state.showToast)
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [location, setLocation] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const canPublish = content.trim().length > 0 || images.length > 0

  const addImages = async (files: FileList | null) => {
    if (!files?.length) return
    const remaining = 9 - images.length
    if (remaining <= 0) {
      showToast('最多选择 9 张图片')
      return
    }
    const selected = Array.from(files).slice(0, remaining)
    try {
      const next = await Promise.all(selected.map((file) => compressImage(file, 1200, 0.8)))
      setImages((current) => [...current, ...next])
    } catch {
      showToast('图片处理失败')
    }
  }

  const publish = () => {
    if (!canPublish) return
    addMoment(content, images, location)
    navigate('/moments', { replace: true })
  }

  return (
    <div className="page page--sub compose-moment-page">
      <div className="compose-nav">
        <button type="button" className="compose-cancel" onClick={() => navigate(-1)}>
          <ChevronLeft size={25} strokeWidth={1.8} />
          取消
        </button>
        <span className="compose-title" />
        <button type="button" className="compose-publish" disabled={!canPublish} onClick={publish}>
          发表
        </button>
      </div>
      <div className="scroll compose-scroll">
        <textarea
          autoFocus
          className="compose-textarea"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="这一刻的想法..."
          maxLength={1000}
        />
        <div className="compose-grid">
          {images.map((image, index) => (
            <div key={`${image.slice(0, 24)}-${index}`} className="compose-image">
              <img src={image} alt="" />
              <button
                type="button"
                className="compose-image-remove"
                aria-label="移除图片"
                onClick={() => setImages((current) => current.filter((_, i) => i !== index))}
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            </div>
          ))}
          {images.length < 9 ? (
            <button type="button" className="compose-add" onClick={() => fileRef.current?.click()}>
              <ImagePlus size={26} strokeWidth={1.5} />
            </button>
          ) : null}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => {
            void addImages(event.target.files)
            event.target.value = ''
          }}
        />
        <div className="compose-rows">
          <button type="button" className="compose-row" onClick={() => setLocation(location ? '' : '杭州 · 西湖区')}>
            <span className="compose-row-label">
              <MapPin size={18} strokeWidth={1.7} /> 所在位置
            </span>
            <span className="compose-row-value">{location || '不显示位置'}</span>
          </button>
          <button type="button" className="compose-row" onClick={() => showToast('可见范围默认公开')}>
            <span className="compose-row-label">谁可以看</span>
            <span className="compose-row-value">公开</span>
          </button>
          <button type="button" className="compose-row" onClick={() => showToast('提醒谁看暂未开放')}>
            <span className="compose-row-label">提醒谁看</span>
            <span className="compose-row-value">不提醒</span>
          </button>
        </div>
      </div>
    </div>
  )
}
