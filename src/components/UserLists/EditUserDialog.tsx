"use client";

import { useState } from "react";
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
  Row,
  Col,
  Spinner,
} from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import Select from "react-select";
import toast from "react-hot-toast";
import type { EditUserDialogProps, RoleValue, UserStatus } from "./types";
import { DUMMY_COUNTRIES } from "./dummy";

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
];

const roleOptions = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
  { value: "superadmin", label: "Super Admin" },
  { value: "superuser", label: "Super User" },
];

// Fix overlap: render menu di dalam modal, bukan portal ke body
const selectStyles = {
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
  menu: (base: any) => ({ ...base, zIndex: 9999 }),
};

const EditUserDialog = ({
  open,
  setOpen,
  data,
  session,
  countries = DUMMY_COUNTRIES,
  onSave,
}: EditUserDialogProps) => {
  const isPrivileged = session?.user?.roles?.some((r: any) =>
    ["admin", "superadmin"].includes(r.role)
  );

  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading] = useState(false);

  const countryOptions = countries.map(c => ({
    value: c.name,
    label: `${c.name} (${c.phoneCode})`,
    code: c.code,
    phoneCode: c.phoneCode,
  }));

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: data?.name ?? "",
      username: data?.username ?? "",
      email: data?.email ?? "",
      status:
        statusOptions.find(s => s.value === data?.status) ?? statusOptions[0],
      role:
        roleOptions.find(r => r.value === data?.roles?.[0]?.role) ??
        roleOptions[0],
      country: countryOptions.find(c => c.value === data?.country) ?? null,
      phoneNumber: data?.phoneNumber?.replace(/^\+\d{1,4}-/, "") ?? "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Name is required"),
      username: Yup.string().required("Username is required"),
      email: Yup.string().email("Invalid email").required("Email is required"),
      password: Yup.string().test(
        "pass-if-filled",
        "Min 8 characters",
        val => !val || val.length >= 8
      ),
      confirmPassword: Yup.string().test(
        "match",
        "Passwords do not match",
        function (val) {
          const { password } = this.parent;
          if (!password) return true;
          return val === password;
        }
      ),
    }),
    onSubmit: async values => {
      if (!data) return;
      setLoading(true);

      const selectedCountry = values.country;
      const phoneCode = selectedCountry?.phoneCode ?? "+";
      const cleanedPhone = values.phoneNumber.replace(/^0+/, "");
      const formattedPhone = `${phoneCode}-${cleanedPhone}`;

      try {
        const res = await fetch(`/api/apps/users/${data.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name,
            username: values.username,
            email: values.email,
            status: values.status.value,
            role: values.role.value,
            country: selectedCountry?.value ?? "",
            countryCode: selectedCountry?.code ?? "",
            phoneNumber: formattedPhone,
            ...(values.password && { password: values.password }),
          }),
        });

        const json = await res.json();

        if (!res.ok) {
          if (json.error === "Password sama dengan sebelumnya") {
            toast("Password baru sama dengan password lama", { icon: "⚠️" });
          } else {
            toast.error(json.error || "Failed to update user");
          }
          return;
        }

        onSave?.({
          ...data,
          name: values.name,
          username: values.username,
          email: values.email,
          status: values.status.value as UserStatus,
          roles: [{ role: values.role.value as RoleValue }],
          country: selectedCountry?.value ?? "",
          countryCode: selectedCountry?.code ?? "",
          phoneNumber: formattedPhone,
        });

        toast.success("User updated successfully!");
        setOpen(false);
      } catch (err: any) {
        toast.error(err.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    },
  });

  const selectedCountry = formik.values.country;

  const handleClose = () => {
    formik.resetForm();
    setOpen(false);
  };

  return (
    <Modal isOpen={open} toggle={handleClose} size="lg" centered>
      <ModalHeader toggle={handleClose}>Edit User</ModalHeader>
      <ModalBody style={{ overflowY: "visible" }}>
        <Form onSubmit={formik.handleSubmit}>
          <Row className="g-3">
            {/* ── Left ── */}
            <Col md={6}>
              <FormGroup>
                <Label>User ID</Label>
                <Input value={data?.id ?? ""} disabled />
              </FormGroup>
              <FormGroup>
                <Label>Full Name</Label>
                <Input
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  invalid={formik.touched.name && !!formik.errors.name}
                />
                <FormFeedback>{formik.errors.name}</FormFeedback>
              </FormGroup>
              <FormGroup>
                <Label>Username</Label>
                <Input
                  name="username"
                  value={formik.values.username}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  invalid={formik.touched.username && !!formik.errors.username}
                />
                <FormFeedback>{formik.errors.username}</FormFeedback>
              </FormGroup>
              <FormGroup>
                <Label>Email</Label>
                <Input
                  name="email"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  invalid={formik.touched.email && !!formik.errors.email}
                />
                <FormFeedback>{formik.errors.email}</FormFeedback>
              </FormGroup>
              <FormGroup>
                <Label>Status</Label>
                <Select
                  options={statusOptions}
                  value={formik.values.status}
                  onChange={val => formik.setFieldValue("status", val)}
                  classNamePrefix="select2-selection"
                  styles={selectStyles}
                  menuPortalTarget={
                    typeof document !== "undefined" ? document.body : undefined
                  }
                />
              </FormGroup>
              <FormGroup>
                <Label>Role</Label>
                <Select
                  options={roleOptions}
                  value={formik.values.role}
                  onChange={val => formik.setFieldValue("role", val)}
                  classNamePrefix="select2-selection"
                  styles={selectStyles}
                  menuPortalTarget={
                    typeof document !== "undefined" ? document.body : undefined
                  }
                />
              </FormGroup>
            </Col>

            {/* ── Right ── */}
            <Col md={6}>
              <FormGroup>
                <Label>Country</Label>
                <Select
                  options={countryOptions}
                  value={formik.values.country}
                  onChange={val => formik.setFieldValue("country", val)}
                  placeholder="Select country..."
                  classNamePrefix="select2-selection"
                  styles={selectStyles}
                  menuPortalTarget={
                    typeof document !== "undefined" ? document.body : undefined
                  }
                />
              </FormGroup>
              <FormGroup>
                <Label>Country Code</Label>
                <Input value={selectedCountry?.code ?? ""} disabled />
              </FormGroup>
              <FormGroup>
                <Label>Phone Number</Label>
                <div className="input-group">
                  <span className="input-group-text">
                    {selectedCountry?.phoneCode ?? "+"}
                  </span>
                  <Input
                    name="phoneNumber"
                    value={formik.values.phoneNumber}
                    onChange={e =>
                      formik.setFieldValue(
                        "phoneNumber",
                        e.target.value.replace(/[^\d]/g, "")
                      )
                    }
                    onBlur={formik.handleBlur}
                  />
                </div>
              </FormGroup>

              {isPrivileged && (
                <>
                  <FormGroup>
                    <Label>New Password</Label>
                    <div className="input-group">
                      <Input
                        name="password"
                        type={showPass ? "text" : "password"}
                        placeholder="Leave blank to keep current"
                        value={formik.values.password}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={
                          formik.touched.password && !!formik.errors.password
                        }
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPass(p => !p)}
                      >
                        <i className={`ri-eye${showPass ? "-off" : ""}-line`} />
                      </button>
                      <FormFeedback>{formik.errors.password}</FormFeedback>
                    </div>
                  </FormGroup>
                  <FormGroup>
                    <Label>Confirm Password</Label>
                    <div className="input-group">
                      <Input
                        name="confirmPassword"
                        type={showConf ? "text" : "password"}
                        placeholder="Repeat new password"
                        value={formik.values.confirmPassword}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={
                          formik.touched.confirmPassword &&
                          !!formik.errors.confirmPassword
                        }
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowConf(p => !p)}
                      >
                        <i className={`ri-eye${showConf ? "-off" : ""}-line`} />
                      </button>
                      <FormFeedback>
                        {formik.errors.confirmPassword}
                      </FormFeedback>
                    </div>
                  </FormGroup>
                </>
              )}
            </Col>
          </Row>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          color="primary"
          disabled={loading}
          onClick={() => formik.handleSubmit()}
        >
          {loading && <Spinner size="sm" className="me-2" />}
          Save Changes
        </Button>
        <Button color="secondary" outline onClick={handleClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default EditUserDialog;
