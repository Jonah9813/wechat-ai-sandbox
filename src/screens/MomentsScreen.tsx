import { Camera, ChevronLeft, Heart, MapPin, MessageCircle, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { formatMomentTime } from '../lib/time'
import { useApp } from '../store'

export function MomentsScreen() {
  const navigate = useNavigate()
  const me = useApp((state) => state.me)
  const friends = useApp((state) => state.friends)
  const moments = useApp((state) => state.moments)
  const toggleLike = useApp((state) => state.toggleLike)
  const addComment = useApp((state) => state.addComment)
  const showToast = useApp((state) => state.showToast)
  const [commentingId, setCommentingId] = useState<string | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [actionMomentId, setActionMomentId] = useState<string | null>(null)

  const person = (authorId: string) => {
    if (authorId === 'me') return { name: me.name, avatar: me.avatar, id: 'me' }
    const friend = friends.find((item) => item.id === authorId)
    return {
      name: friend?.name ?? '好友',
      avatar: friend?.avatar ?? '',
      id: friend?.id ?? authorId,
    }
  }

  const submitComment = (momentId: string) => {
    if (!commentDraft.trim()) return
    addComment(momentId, commentDraft)
    setCommentDraft('')
    setCommentingId(null)
  }

  return (
    <div className="page page--sub moments-page">
      <div className="scroll moments-scroll">
        <section className="moments-cover">
          <img src="/moments/cover.avif" alt="" />
          <div className="moments-topbar">
            <button type="button" aria-label="返回" onClick={() => navigate(-1)}>
              <ChevronLeft size={24} strokeWidth={1.8} />
            </button>
            <button type="button" aria-label="发表" onClick={() => navigate('/moments/compose')}>
              <Camera size={21} strokeWidth={1.8} />
            </button>
          </div>
          <div className="moments-cover-shade" />
          <div className="moments-me" onClick={() => navigate('/my-qr')}>
            <span className="moments-me-name">{me.name}</span>
            <Avatar src={me.avatar} name={me.name} size={42} radius={6} className="moments-me-avatar" />
          </div>
        </section>

        <div className="moments-feed">
          {moments.map((moment) => {
            const author = person(moment.authorId)
            const liked = moment.likes.includes('me')
            const imageCount = moment.images.length
            const imageClass =
              imageCount === 1
                ? 'moment-images--1'
                : imageCount === 2
                  ? 'moment-images--2'
                  : imageCount === 4
                    ? 'moment-images--4'
                    : 'moment-images--3'
            return (
              <article key={moment.id} className="moment">
                <Avatar src={author.avatar} name={author.name} size={32} radius={5} />
                <div className="moment-main">
                  <button
                    type="button"
                    className="moment-author"
                    onClick={() => (author.id === 'me' ? showToast('这是你自己') : navigate(`/friend/${author.id}`))}
                  >
                    {author.name}
                  </button>
                  {moment.content ? <p className="moment-content">{moment.content}</p> : null}
                  {imageCount > 0 ? (
                    <div className={`moment-images ${imageClass}`}>
                      {moment.images.map((image, index) => (
                        <button
                          type="button"
                          key={`${moment.id}-${index}`}
                          className="moment-image-btn"
                          onClick={() => showToast('点击查看大图（演示）')}
                        >
                          <img src={image} alt="" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {moment.location ? (
                    <div className="moment-location">
                      <MapPin size={12} strokeWidth={1.8} />
                      {moment.location}
                    </div>
                  ) : null}
                  <div className="moment-meta">
                    <span>{formatMomentTime(moment.createdAt)}</span>
                    <span className="moment-action-wrap">
                      <button
                        type="button"
                        className="moment-more-pill"
                        aria-label="更多操作"
                        onClick={() => setActionMomentId(actionMomentId === moment.id ? null : moment.id)}
                      >
                        <MoreHorizontal size={16} strokeWidth={2} />
                      </button>
                      {actionMomentId === moment.id ? (
                        <span className="moment-action-menu">
                          <button
                            type="button"
                            onClick={() => {
                              toggleLike(moment.id)
                              setActionMomentId(null)
                            }}
                          >
                            <Heart size={15} strokeWidth={1.8} fill={liked ? 'currentColor' : 'none'} />
                            {liked ? '取消' : '赞'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCommentingId(moment.id)
                              setCommentDraft('')
                              setActionMomentId(null)
                            }}
                          >
                            <MessageCircle size={15} strokeWidth={1.8} />
                            评论
                          </button>
                        </span>
                      ) : null}
                    </span>
                  </div>

                  {moment.likes.length > 0 || moment.comments.length > 0 ? (
                    <div className="moment-social">
                      {moment.likes.length > 0 ? (
                        <div className={`moment-likes ${moment.comments.length === 0 ? 'moment-likes--only' : ''}`}>
                          <span>{moment.likes.map((id) => (id === 'me' ? '我' : person(id).name)).join('，')}</span>
                        </div>
                      ) : null}
                      {moment.comments.length > 0 ? (
                        <div className="moment-comments">
                          {moment.comments.map((comment) => (
                            <p key={comment.id}>
                              <span className="comment-name">{comment.authorName}</span>
                              {comment.replyToName ? <span className="comment-reply"> 回复 {comment.replyToName}</span> : null}
                              <span className="comment-text">：{comment.content}</span>
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {commentingId === moment.id ? (
                    <div className="comment-composer">
                      <input
                        autoFocus
                        value={commentDraft}
                        onChange={(event) => setCommentDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') submitComment(moment.id)
                        }}
                        placeholder="评论"
                      />
                      <button
                        type="button"
                        className="comment-send"
                        disabled={!commentDraft.trim()}
                        onClick={() => submitComment(moment.id)}
                      >
                        发送
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
        <div className="moments-end">— 已经到底了 —</div>
      </div>
    </div>
  )
}
