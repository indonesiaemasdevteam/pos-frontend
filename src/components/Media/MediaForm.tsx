'use client'

import { useRef } from 'react'
import { Alert, Spinner } from 'reactstrap'
import StatChip from './StatChip'
import MediaTagsInput from './MediaTagsInput'

interface MediaFormProps {
  type: 'VIDEO' | 'IMAGE'
  busy: boolean
  useUpload: boolean
  setUseUpload: (v: boolean) => void
  handleChangeType: (type: 'VIDEO' | 'IMAGE') => void
  urlInput: string
  setUrlInput: (v: string) => void
  inputRef: React.RefObject<HTMLInputElement>
  handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  isUploadingImage: boolean
  loadingValidate: boolean
  isSwitchingType: boolean
  isDeletingImage: boolean
  error: string
  submitError: string
  title: string
  setTitle: (v: string) => void
  description: string
  setDescription: (v: string) => void
  editor: string
  setEditor: (v: string) => void
  note: string
  setNote: (v: string) => void
  tags: string[]
  setTags: (v: string[]) => void
  isFeatured: boolean
  setIsFeatured: (v: boolean) => void
  sortOrder: number | string
  setSortOrder: (v: string) => void
  isPublished: boolean
  setIsPublished: (v: boolean) => void
  handleResetAll: () => void
  openConfirm: boolean
  setOpenConfirm: (v: boolean) => void
  submitLoading: boolean
  allFilled: boolean
  deleteUploadedImageIfAny: () => Promise<boolean>
  clearImageMeta: () => void
  resetUrlInstant: () => void
}

export default function MediaForm({
  type, busy, useUpload, setUseUpload, handleChangeType,
  urlInput, setUrlInput, inputRef, handleUpload, isUploadingImage,
  loadingValidate, isSwitchingType, isDeletingImage,
  error, submitError,
  title, setTitle, description, setDescription,
  editor, setEditor, note, setNote,
  tags, setTags,
  isFeatured, setIsFeatured, sortOrder, setSortOrder, isPublished, setIsPublished,
  handleResetAll, setOpenConfirm, submitLoading, allFilled,
  deleteUploadedImageIfAny, clearImageMeta, resetUrlInstant,
}: MediaFormProps) {

  return (
    <div className="card border shadow-sm" style={{ borderRadius: 12 }}>
      <div className="card-body d-flex flex-column gap-3" style={{ padding: '20px 20px 24px' }}>

        {/* ── Type toggle + Upload switch ── */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          {/* VIDEO / IMAGE toggle */}
          <div
            className="d-flex p-1 gap-1"
            style={{ background: '#f8f9fa', borderRadius: 10, border: '1px solid #e9ecef' }}
          >
            {(['VIDEO', 'IMAGE'] as const).map((t) => (
              <button
                key={t}
                type="button"
                disabled={busy}
                onClick={() => { if (t !== type) handleChangeType(t) }}
                className={`btn btn-sm fw-bold px-3 ${type === t ? 'btn-primary shadow-sm' : 'btn-ghost-secondary'}`}
                style={{ borderRadius: 8, transition: 'all .15s' }}
              >
                <i className={`${t === 'VIDEO' ? 'ri-video-line' : 'ri-image-line'} me-1`} />
                {t === 'VIDEO' ? 'Video' : 'Photo'}
              </button>
            ))}
          </div>

          {/* Upload file switch — IMAGE only */}
          {type === 'IMAGE' && (
            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="uploadSwitch"
                checked={useUpload}
                disabled={busy}
                onChange={async (e) => {
                  const newVal = e.target.checked
                  const ok = await deleteUploadedImageIfAny()
                  if (!ok) return
                  clearImageMeta()
                  resetUrlInstant()
                  setUseUpload(newVal)
                  setTimeout(() => inputRef.current?.focus(), 50)
                }}
              />
              <label className="form-check-label fw-bold fs-13" htmlFor="uploadSwitch">
                Upload file
              </label>
            </div>
          )}
        </div>

        <hr className="my-0" />

        {/* ── URL input or file upload ── */}
        {type === 'IMAGE' && useUpload ? (
          <div>
            <label className="btn btn-outline-secondary w-100 fw-bold" style={{ height: 48, borderRadius: 10 }}>
              {isUploadingImage
                ? <><Spinner size="sm" className="me-2" />Uploading...</>
                : <><i className="ri-upload-cloud-line me-2" />Choose Image</>}
              <input
                hidden
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleUpload}
                disabled={busy}
              />
            </label>
            <small className="text-muted d-block mt-1" style={{ fontSize: 11 }}>
              Supported: <b>jpg, png, webp</b> · Max: <b>5MB</b> · JPEG auto-compress
            </small>
          </div>
        ) : (
          <div>
            <label className="form-label fw-semibold">
              {type === 'VIDEO' ? 'Link YouTube' : 'Link Gambar (URL)'}
              <span className="text-danger ms-1">*</span>
            </label>
            <input
              ref={inputRef}
              type="url"
              className="form-control"
              style={{ borderRadius: 10 }}
              placeholder={type === 'VIDEO' ? 'https://www.youtube.com/watch?v=xxxx' : 'https://example.com/image.jpg'}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={busy}
            />
            <small className="text-muted" style={{ fontSize: 11 }}>
              {type === 'VIDEO'
                ? 'Contoh: https://www.youtube.com/watch?v=xxxx'
                : 'Gunakan direct image URL (.jpg/.png/.webp)'}
            </small>
          </div>
        )}

        {/* ── Status alerts ── */}
        {(loadingValidate || isSwitchingType || isDeletingImage) && (
          <Alert color="info" className="py-2 mb-0" style={{ borderRadius: 10 }}>
            <i className="ri-information-line me-2" />
            {isSwitchingType
              ? 'Switching tab... cleaning state'
              : isDeletingImage
                ? 'Cleaning uploaded image...'
                : 'Validating link...'}
          </Alert>
        )}
        {error       && <Alert color="danger" className="py-2 mb-0" style={{ borderRadius: 10 }}><i className="ri-error-warning-line me-2" />{error}</Alert>}
        {submitError && <Alert color="danger" className="py-2 mb-0" style={{ borderRadius: 10 }}><i className="ri-error-warning-line me-2" />{submitError}</Alert>}

        {/* ── Detail Media ── */}
        <div className="p-3" style={{ borderRadius: 10, border: '1px solid #e9ecef', background: '#f8f9fa' }}>
          <p className="fw-bold mb-3 fs-14">Detail Media</p>

          <div className="d-flex flex-column gap-3">
            {/* Title */}
            <div>
              <label className="form-label fw-semibold fs-13">
                {type === 'VIDEO' ? 'Judul Video' : 'Judul Photo'}
                <span className="text-danger ms-1">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                style={{ borderRadius: 8 }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitLoading}
              />
            </div>

            {/* Description */}
            <div>
              <label className="form-label fw-semibold fs-13">
                Keterangan Singkat <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                style={{ borderRadius: 8 }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitLoading}
              />
            </div>

            {/* Editor */}
            <div>
              <label className="form-label fw-semibold fs-13">
                Editor <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                style={{ borderRadius: 8 }}
                value={editor}
                onChange={(e) => setEditor(e.target.value)}
                disabled={submitLoading}
              />
            </div>

            {/* Tags */}
            <MediaTagsInput
              value={tags || []}
              onChange={setTags}
              options={[]}
              errorText={tags?.length ? '' : 'Minimal 1 tag'}
            />

            {/* Note */}
            <div>
              <label className="form-label fw-semibold fs-13">Catatan Tambahan (optional)</label>
              <textarea
                className="form-control"
                style={{ borderRadius: 8 }}
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={submitLoading}
              />
            </div>
          </div>
        </div>

        {/* ── Settings ── */}
        <div className="p-3" style={{ borderRadius: 10, border: '1px solid #e9ecef' }}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-bold fs-14">Settings</span>
            <div className="d-flex gap-1">
              <StatChip label="Order"   value={sortOrder} />
              <StatChip label="Publish" value={isPublished ? 'ON' : 'OFF'} />
              <StatChip label="Featured"value={isFeatured ? 'ON' : 'OFF'} />
            </div>
          </div>

          <hr className="my-2" />

          <div className="d-flex flex-column gap-3">
            {/* Featured */}
            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="featuredSwitch"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                disabled={submitLoading}
              />
              <label className="form-check-label fw-bold fs-13" htmlFor="featuredSwitch">
                Featured (tampil di homepage)
              </label>
            </div>

            {/* Sort order */}
            <div>
              <label className="form-label fw-semibold fs-13">Sort Order</label>
              <input
                type="number"
                className="form-control"
                style={{ borderRadius: 8 }}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                disabled={submitLoading}
              />
              <small className="text-muted" style={{ fontSize: 11 }}>Angka kecil tampil lebih dulu</small>
            </div>

            {/* Publish */}
            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="publishSwitch"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                disabled={submitLoading}
              />
              <label className="form-check-label fw-bold fs-13" htmlFor="publishSwitch">
                Publish
              </label>
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary fw-bold flex-fill"
            style={{ borderRadius: 10 }}
            onClick={handleResetAll}
            disabled={busy}
          >
            <i className="ri-refresh-line me-1" />Reset
          </button>

          <button
            type="button"
            className="btn btn-primary fw-bold flex-fill"
            style={{ borderRadius: 10, padding: '10px 0' }}
            disabled={!allFilled || busy}
            onClick={() => setOpenConfirm(true)}
          >
            {submitLoading
              ? <><Spinner size="sm" className="me-2" />Saving...</>
              : <><i className="ri-save-line me-1" />Submit Media</>}
          </button>
        </div>

      </div>
    </div>
  )
}
