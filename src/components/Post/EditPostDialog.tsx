"use client"

import { useState, useEffect, useRef } from "react"
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
  Form, FormGroup, Label, Input, FormFeedback,
  Button, Row, Col, Spinner, Alert,
} from "reactstrap"
import CreatableSelect from "react-select/creatable"
import toast from "react-hot-toast"
import { useFormik } from "formik"
import * as Yup from "yup"

const CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

interface Post {
  id:          string
  title:       string
  subTitle:    string
  postLink:    string
  img:         string
  isPublished: boolean
  tags:        { tag?: { name: string } }[]
}

interface EditPostDialogProps {
  open:       boolean
  setOpen:    (v: boolean) => void
  post?:      Post | null
  onSuccess?: () => void
}

const EditPostDialog = ({ open, setOpen, post, onSuccess }: EditPostDialogProps) => {
  const [useUpload,        setUseUpload]        = useState(false)
  const [previewImage,     setPreviewImage]     = useState("")
  const [imageError,       setImageError]       = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isDeletingImage,  setIsDeletingImage]  = useState(false)
  const [isSubmitting,     setIsSubmitting]     = useState(false)
  const [submitError,      setSubmitError]      = useState("")

  const lastUploadedPublicIdRef = useRef<string | null>(null)

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title:       post?.title       || "",
      subTitle:    post?.subTitle    || "",
      postLink:    post?.postLink    || "",
      img:         post?.img         || "",
      tags:        post?.tags?.map(t => t?.tag?.name).filter(Boolean) as string[] || [],
      isPublished: post?.isPublished ?? true,
    },
    validationSchema: Yup.object({
      title:    Yup.string().required("Title is required"),
      subTitle: Yup.string().required("Subtitle is required"),
      postLink: Yup.string().required("Post link is required"),
      img:      Yup.string().required("Image is required"),
    }),
    onSubmit: async (values) => {
      if (!post?.id) return
      setIsSubmitting(true)
      setSubmitError("")
      try {
        const res = await fetch(`/api/apps/posts/${post.id}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title:       values.title,
            img:         values.img,
            subTitle:    values.subTitle,
            postLink:    values.postLink,
            tags:        values.tags,
            isPublished: values.isPublished,
          }),
        })

        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.error || "Failed to update post")

        lastUploadedPublicIdRef.current = null
        toast.success("Post updated successfully!")
        onSuccess?.()
        handleClose()
      } catch (err: any) {
        setSubmitError(err.message || "Unexpected error")
        toast.error(err.message || "Failed to update post")
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  useEffect(() => {
    if (open && post?.img) {
      setPreviewImage(post.img)
      setImageError(false)
    }
  }, [open, post?.id])

  // ── Image helpers ───────────────────────────────────────────────────────────
  const compressImage = (file: File): Promise<Blob> => new Promise(resolve => {
    const img    = new Image()
    const reader = new FileReader()
    reader.onload = e => { img.src = e.target?.result as string }
    img.onload = () => {
      const canvas  = document.createElement("canvas")
      const ctx     = canvas.getContext("2d")!
      const scale   = Math.min(1, 800 / img.width)
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => resolve(blob!), "image/jpeg", 0.7)
    }
    reader.readAsDataURL(file)
  })

  const uploadToCloudinary = async (file: File) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) throw new Error("Cloudinary env belum lengkap")
    const fd = new FormData()
    fd.append("file", file)
    fd.append("upload_preset", UPLOAD_PRESET)
    const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: fd })
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new Error(data?.error?.message || "Failed to upload")
    lastUploadedPublicIdRef.current = data.public_id
    formik.setFieldValue("img", data.secure_url)
    setPreviewImage(data.secure_url)
    setImageError(false)
  }

  const deleteUploadedImage = async () => {
    const publicId = lastUploadedPublicIdRef.current
    if (!publicId) return
    try {
      setIsDeletingImage(true)
      await fetch("/api/apps/posts/delete-image", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ public_id: publicId }),
      })
    } catch (err) {
      console.warn("Failed to delete image:", err)
    } finally {
      setIsDeletingImage(false)
      lastUploadedPublicIdRef.current = null
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Invalid file type. Use JPG/PNG/WEBP"); return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File exceeds 5MB"); return
    }
    try {
      setIsUploadingImage(true)
      if (lastUploadedPublicIdRef.current) await deleteUploadedImage()
      let finalFile = file
      if (file.type === "image/jpeg" || file.type === "image/jpg") {
        const blob = await compressImage(file)
        finalFile  = new File([blob], file.name, { type: "image/jpeg" })
      }
      await uploadToCloudinary(finalFile)
      toast.success("Image uploaded!")
    } catch (err: any) {
      toast.error(err.message || "Upload failed")
    } finally {
      setIsUploadingImage(false)
      e.target.value = ""
    }
  }

  const handleClose = async () => {
    if (lastUploadedPublicIdRef.current) await deleteUploadedImage()
    setUseUpload(false)
    setSubmitError("")
    formik.resetForm()
    setOpen(false)
  }

  const busy = isUploadingImage || isDeletingImage || isSubmitting

  return (
    <Modal isOpen={open} toggle={busy ? undefined : handleClose} size="xl" centered scrollable>
      <ModalHeader toggle={busy ? undefined : handleClose}>
        <i className="ri-pencil-line me-2" />Edit Post
      </ModalHeader>

      <ModalBody>
        {submitError && <Alert color="danger" className="mb-3">{submitError}</Alert>}

        <Form onSubmit={formik.handleSubmit}>
          <Row className="g-3">
            <Col md={6}>
              <FormGroup>
                <Label>Title <span className="text-danger">*</span></Label>
                <Input name="title" value={formik.values.title}
                  onChange={formik.handleChange} onBlur={formik.handleBlur}
                  invalid={formik.touched.title && !!formik.errors.title} disabled={busy} />
                <FormFeedback>{formik.errors.title}</FormFeedback>
              </FormGroup>

              <FormGroup>
                <Label>Subtitle <span className="text-danger">*</span></Label>
                <Input type="textarea" name="subTitle" rows={3} value={formik.values.subTitle}
                  onChange={formik.handleChange} onBlur={formik.handleBlur}
                  invalid={formik.touched.subTitle && !!formik.errors.subTitle} disabled={busy} />
                <FormFeedback>{formik.errors.subTitle}</FormFeedback>
              </FormGroup>

              <FormGroup>
                <Label>Post Link <span className="text-danger">*</span></Label>
                <Input name="postLink" value={formik.values.postLink}
                  onChange={formik.handleChange} onBlur={formik.handleBlur}
                  invalid={formik.touched.postLink && !!formik.errors.postLink} disabled={busy} />
                <FormFeedback>{formik.errors.postLink}</FormFeedback>
              </FormGroup>

              <FormGroup>
                <Label>Tags</Label>
                <CreatableSelect
                  isMulti
                  value={formik.values.tags.map(t => ({ value: t, label: t }))}
                  onChange={(v) => formik.setFieldValue("tags", (v ?? []).map((t: any) => t.value))}
                  placeholder="Type and press Enter..."
                  classNamePrefix="select2-selection"
                  formatCreateLabel={(i) => `Add "${i}"`}
                  isDisabled={busy}
                />
              </FormGroup>

              <FormGroup>
                <Label>Publication Status</Label>
                <div className="d-flex gap-3">
                  {[{ value: true, label: "Publish" }, { value: false, label: "Draft" }].map(opt => (
                    <div key={String(opt.value)} className="form-check">
                      <input type="radio" className="form-check-input"
                        id={`status-${opt.value}`}
                        checked={formik.values.isPublished === opt.value}
                        onChange={() => formik.setFieldValue("isPublished", opt.value)}
                        disabled={busy} />
                      <label className="form-check-label" htmlFor={`status-${opt.value}`}>{opt.label}</label>
                    </div>
                  ))}
                </div>
              </FormGroup>
            </Col>

            <Col md={6}>
              <FormGroup className="d-flex align-items-center gap-2">
                <div className="form-check form-switch">
                  <input type="checkbox" className="form-check-input" role="switch" id="editUseUpload"
                    checked={useUpload} disabled={busy}
                    onChange={async (e) => {
                      if (lastUploadedPublicIdRef.current) await deleteUploadedImage()
                      formik.setFieldValue("img", "")
                      setPreviewImage("")
                      setUseUpload(e.target.checked)
                    }} />
                  <label className="form-check-label fw-semibold" htmlFor="editUseUpload">Upload Image File</label>
                </div>
              </FormGroup>

              {useUpload ? (
                <FormGroup>
                  <label className="btn btn-outline-secondary w-100 fw-bold" style={{ height: 44, borderRadius: 8 }}>
                    {isUploadingImage
                      ? <><Spinner size="sm" className="me-2" />Uploading...</>
                      : <><i className="ri-upload-cloud-line me-2" />Choose Image</>}
                    <input hidden type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleUpload} disabled={busy} />
                  </label>
                  <small className="text-muted">JPG, PNG, WEBP · Max 5MB</small>
                </FormGroup>
              ) : (
                <FormGroup>
                  <Label>Image URL <span className="text-danger">*</span></Label>
                  <Input name="img" value={formik.values.img}
                    onChange={(e) => { formik.handleChange(e); setPreviewImage(e.target.value); setImageError(false) }}
                    onBlur={formik.handleBlur}
                    invalid={formik.touched.img && !!formik.errors.img}
                    disabled={busy} placeholder="https://example.com/image.jpg" />
                  <FormFeedback>{formik.errors.img}</FormFeedback>
                </FormGroup>
              )}

              {/* Preview */}
              <div style={{ minHeight: 160, borderRadius: 10, overflow: "hidden", border: "1px solid #dee2e6", background: "#f8f9fa" }}>
                {isUploadingImage ? (
                  <div className="d-flex align-items-center justify-content-center" style={{ height: 160 }}>
                    <Spinner color="primary" />
                  </div>
                ) : imageError ? (
                  <Alert color="danger" className="m-2">⚠️ Failed to load image</Alert>
                ) : previewImage ? (
                  <div className="position-relative">
                    <img src={previewImage} alt="Preview" style={{ width: "100%", maxHeight: 240, objectFit: "cover" }}
                      onError={() => setImageError(true)} onLoad={() => setImageError(false)} />
                    {isDeletingImage && (
                      <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center gap-2 text-white fw-bold"
                        style={{ background: "rgba(0,0,0,0.5)" }}>
                        <Spinner size="sm" color="light" />Deleting...
                      </div>
                    )}
                    {!isDeletingImage && (
                      <button className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
                        onClick={async () => {
                          await deleteUploadedImage()
                          formik.setFieldValue("img", "")
                          setPreviewImage("")
                        }}>✕</button>
                    )}
                  </div>
                ) : (
                  <div className="d-flex flex-column align-items-center justify-content-center text-muted" style={{ height: 160 }}>
                    <i className="ri-image-line fs-2 mb-1" />
                    <small>Image preview</small>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Form>
      </ModalBody>

      <ModalFooter>
        <Button color="secondary" outline onClick={handleClose} disabled={busy}>Cancel</Button>
        <Button color="primary" disabled={busy} onClick={() => formik.handleSubmit()}>
          {isSubmitting ? <><Spinner size="sm" className="me-2" />Saving...</> : "Save Changes"}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default EditPostDialog
