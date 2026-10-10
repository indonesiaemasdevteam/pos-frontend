"use client"

import { useEffect, useState } from "react"
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
  Form, FormGroup, Label, Input, FormFeedback,
  Button, Spinner, Alert,
} from "reactstrap"
import { useFormik } from "formik"
import * as Yup from "yup"
import toast from "react-hot-toast"

interface Post {
  id:    string
  title: string
}

interface DeletePostDialogProps {
  open:       boolean
  setOpen:    (v: boolean) => void
  post?:      Post | null
  onSuccess?: () => void
}

const DeletePostDialog = ({ open, setOpen, post, onSuccess }: DeletePostDialogProps) => {
  const [isDeleting,   setIsDeleting]   = useState(false)
  const [submitError,  setSubmitError]  = useState("")

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      postId:       post?.id    || "",
      deleteReason: "",
    },
    validationSchema: Yup.object({
      deleteReason: Yup.string().required("Reason is required"),
    }),
    onSubmit: async (values) => {
      setIsDeleting(true)
      setSubmitError("")
      try {
        const res = await fetch(`/api/apps/posts/${values.postId}`, {
          method:  "DELETE",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ reason: values.deleteReason }),
        })

        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.error || "Failed to delete post")

        toast.success(`Post "${post?.title}" deleted successfully`)
        onSuccess?.()
        handleClose()
      } catch (err: any) {
        setSubmitError(err.message || "Unexpected error")
        toast.error(err.message || "Failed to delete post")
      } finally {
        setIsDeleting(false)
      }
    },
  })

  const handleClose = () => {
    formik.resetForm()
    setSubmitError("")
    setOpen(false)
  }

  return (
    <Modal isOpen={open} toggle={isDeleting ? undefined : handleClose} size="md" centered>
      <ModalHeader toggle={isDeleting ? undefined : handleClose}>
        <i className="ri-delete-bin-line me-2 text-danger" />Confirm Post Deletion
      </ModalHeader>

      <ModalBody>
        {submitError && <Alert color="danger" className="mb-3">{submitError}</Alert>}

        <Form onSubmit={formik.handleSubmit}>
          <FormGroup>
            <Label>Post ID</Label>
            <Input value={post?.id || ""} disabled style={{ background: "#f8f9fa" }} />
          </FormGroup>

          {post?.title && (
            <FormGroup>
              <Label>Post Title</Label>
              <Input value={post.title} disabled style={{ background: "#f8f9fa" }} />
            </FormGroup>
          )}

          <FormGroup>
            <Label>Reason for Deletion <span className="text-danger">*</span></Label>
            <Input
              type="textarea"
              name="deleteReason"
              rows={3}
              value={formik.values.deleteReason}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              invalid={formik.touched.deleteReason && !!formik.errors.deleteReason}
              disabled={isDeleting}
              placeholder="Provide a reason for deleting this post..."
            />
            <FormFeedback>{formik.errors.deleteReason}</FormFeedback>
          </FormGroup>
        </Form>
      </ModalBody>

      <ModalFooter>
        <Button color="secondary" outline onClick={handleClose} disabled={isDeleting}>Cancel</Button>
        <Button color="danger" disabled={isDeleting} onClick={() => formik.handleSubmit()}>
          {isDeleting
            ? <><Spinner size="sm" className="me-2" />Deleting...</>
            : <><i className="ri-delete-bin-line me-1" />Delete Post</>}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default DeletePostDialog
