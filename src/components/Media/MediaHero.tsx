'use client'

interface MediaHeroProps {
  type: 'VIDEO' | 'IMAGE'
}

export default function MediaHero({ type }: MediaHeroProps) {
  return (
    <div
      className="card border-0 shadow-sm mb-3 overflow-hidden"
      style={{ borderRadius: 12, position: 'relative' }}
    >
      {/* Gradient overlay */}
      <div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.6,
          background:
            'radial-gradient(650px circle at 20% 15%, rgba(99,102,241,.22), transparent 45%), ' +
            'radial-gradient(700px circle at 85% 10%, rgba(34,197,94,.18), transparent 45%)',
        }}
      />

      <div className="card-body py-3 px-4" style={{ position: 'relative' }}>
        <div className="d-flex justify-content-between align-items-center gap-3">
          <div>
            <h5 className="fw-bold mb-1" style={{ letterSpacing: -0.4 }}>
              Media Home Screen
            </h5>
            <p className="text-muted mb-0 fs-13">
              Tambahkan video YouTube atau foto untuk tampil di homepage.
              Upload aman + auto cleanup saat pindah tab/cancel.
            </p>
          </div>

          <span
            className="badge fs-12 fw-bold px-3 py-2"
            style={{
              borderRadius: 8,
              border: '1px solid',
              borderColor: type === 'VIDEO' ? 'rgba(99,102,241,.4)' : 'rgba(34,197,94,.4)',
              background: type === 'VIDEO' ? 'rgba(99,102,241,.1)' : 'rgba(34,197,94,.08)',
              color: type === 'VIDEO' ? '#6366f1' : '#22c55e',
              whiteSpace: 'nowrap',
            }}
          >
            {type === 'VIDEO'
              ? <><i className="ri-video-line me-1" />VIDEO</>
              : <><i className="ri-image-line me-1" />IMAGE</>}
          </span>
        </div>
      </div>
    </div>
  )
}
