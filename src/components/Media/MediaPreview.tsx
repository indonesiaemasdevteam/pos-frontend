'use client'

import { Spinner } from 'reactstrap'
import StatChip from './StatChip'

interface MediaPreviewProps {
  type: 'VIDEO' | 'IMAGE'
  canPreview: boolean
  embedUrl?: string
  finalUrl?: string
  loadingValidate: boolean
  isUploadingImage: boolean
  isDeletingImage: boolean
  setError: (msg: string) => void
  imgWidth?: number
  imgHeight?: number
  imgBytes?: number
}

export default function MediaPreview({
  type,
  canPreview,
  embedUrl,
  finalUrl,
  loadingValidate,
  isUploadingImage,
  isDeletingImage,
  setError,
  imgWidth,
  imgHeight,
  imgBytes,
}: MediaPreviewProps) {
  return (
    <div
      className="card border shadow-sm"
      style={{ borderRadius: 12, position: 'sticky', top: 16 }}
    >
      <div className="card-body" style={{ padding: '20px 20px 24px' }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="fw-bold fs-14">Preview</span>
          {type === 'IMAGE' && (
            <div className="d-flex gap-1">
              {!!imgWidth  && <StatChip label="W"    value={imgWidth} />}
              {!!imgHeight && <StatChip label="H"    value={imgHeight} />}
              {!!imgBytes  && <StatChip label="Size" value={`${Math.round(imgBytes / 1024)} KB`} />}
            </div>
          )}
        </div>

        <hr className="mt-0 mb-3" />

        {/* Content */}
        {!canPreview ? (
          /* Empty state */
          <div
            className="d-flex flex-column align-items-center justify-content-center text-center p-4"
            style={{
              minHeight: 320, border: '1.5px dashed #dee2e6',
              borderRadius: 10, background: '#f8f9fa',
            }}
          >
            <i className={`${type === 'VIDEO' ? 'ri-video-line' : 'ri-image-line'} text-muted fs-36 mb-2`} />
            <p className="fw-bold mb-1 fs-14">Belum ada preview</p>
            <p className="text-muted mb-0 fs-13">
              Masukkan link valid atau upload image untuk melihat preview.
            </p>
          </div>

        ) : type === 'VIDEO' ? (
          /* Video embed */
          <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #dee2e6' }}>
            <div style={{ position: 'relative', paddingTop: '56.25%' }}>
              <iframe
                src={embedUrl}
                title="YouTube Player"
                allowFullScreen
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%', border: 0,
                }}
              />
            </div>
          </div>

        ) : (
          /* Image preview */
          <div style={{ position: 'relative' }}>
            {/* Skeleton while loading */}
            {(isUploadingImage || loadingValidate) && (
              <div
                className="d-flex align-items-center justify-content-center"
                style={{
                  height: 360, borderRadius: 10,
                  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.4s infinite',
                }}
              >
                <Spinner color="secondary" />
              </div>
            )}

            {/* Image */}
            {!isUploadingImage && !loadingValidate && (
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #dee2e6' }}>
                <img
                  src={finalUrl}
                  alt="Preview"
                  style={{ width: '100%', height: 360, objectFit: 'cover', display: 'block' }}
                  onError={() => setError('Gagal load gambar. Pastikan URL gambar valid.')}
                />
              </div>
            )}

            {/* Deleting overlay */}
            {isDeletingImage && (
              <div
                className="d-flex align-items-center justify-content-center gap-2 fw-bold text-white"
                style={{
                  position: 'absolute', inset: 0, borderRadius: 10,
                  background: 'rgba(0,0,0,.45)',
                }}
              >
                <Spinner size="sm" color="light" />
                Deleting...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0 }
          100% { background-position:  200% 0 }
        }
      `}</style>
    </div>
  )
}
