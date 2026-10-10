'use client'

import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Spinner } from 'reactstrap'

interface ConfirmSubmitDialogProps {
  open: boolean
  onClose: () => void
  onCancelAndCleanup: () => void
  onSubmit: () => void
  submitLoading: boolean
  type: 'VIDEO' | 'IMAGE'
}

export default function ConfirmSubmitDialog({
  open,
  onClose,
  onCancelAndCleanup,
  onSubmit,
  submitLoading,
  type,
}: ConfirmSubmitDialogProps) {
  return (
    <Modal
      isOpen={open}
      toggle={submitLoading ? undefined : onClose}
      centered
      size="sm"
    >
      <ModalHeader toggle={submitLoading ? undefined : onClose} className="fw-bold">
        Konfirmasi Submit
      </ModalHeader>

      <ModalBody>
        <p className="mb-0 fs-14">
          Simpan media ini sekarang?{' '}
          <strong>{type}</strong> akan masuk ke database dan bisa tampil di homepage.
        </p>
      </ModalBody>

      <ModalFooter className="gap-2">
        <Button
          color="secondary"
          outline
          onClick={onCancelAndCleanup}
          disabled={submitLoading}
          className="fw-bold"
        >
          Cancel (hapus upload)
        </Button>
        <Button
          color="primary"
          onClick={onSubmit}
          disabled={submitLoading}
          className="fw-bold"
        >
          {submitLoading
            ? <><Spinner size="sm" className="me-1" />Saving...</>
            : 'Ya, Simpan'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
