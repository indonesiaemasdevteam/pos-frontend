"use client";

import { useEffect } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
  Button,
} from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";

import type { DeleteUserDialogProps } from "./types";

// ─── Component ────────────────────────────────────────────────────────────────
const DeleteUserDialog = ({
  open,
  setOpen,
  user,
  onClose,
  onDelete,
}: DeleteUserDialogProps) => {
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      userId:       user?.id ?? "",
      deleteReason: "",
    },
    validationSchema: Yup.object({
      deleteReason: Yup.string().required("Reason is required"),
    }),
    onSubmit: (values, { resetForm }) => {
      // ── Dummy mode: call onDelete callback ────────────────────────────────
      onDelete?.(values.userId);
      resetForm();
      setOpen(false);
      onClose?.();
    },
  });

  const handleClose = () => {
    formik.resetForm();
    setOpen(false);
    onClose?.();
  };

  return (
    <Modal isOpen={open} toggle={handleClose} centered size="sm">
      <ModalHeader toggle={handleClose} className="bg-danger-subtle">
        <span className="text-danger">
          <i className="ri-delete-bin-line me-2" />
          Confirm Deletion
        </span>
      </ModalHeader>
      <ModalBody>
        <Form onSubmit={formik.handleSubmit}>
          {/* User ID — read-only */}
          <FormGroup>
            <Label>User ID</Label>
            <Input
              name="userId"
              value={formik.values.userId}
              disabled
              className="bg-light"
            />
          </FormGroup>

          {/* Reason */}
          <FormGroup>
            <Label>
              Reason for Deletion <span className="text-danger">*</span>
            </Label>
            <Input
              name="deleteReason"
              type="textarea"
              rows={3}
              placeholder="State the reason..."
              value={formik.values.deleteReason}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              invalid={
                formik.touched.deleteReason && !!formik.errors.deleteReason
              }
            />
            <FormFeedback>{formik.errors.deleteReason}</FormFeedback>
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" outline onClick={handleClose}>
          Cancel
        </Button>
        <Button
          color="danger"
          onClick={() => formik.handleSubmit()}
          disabled={formik.isSubmitting}
        >
          <i className="ri-delete-bin-line me-1" />
          Delete User
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteUserDialog;
