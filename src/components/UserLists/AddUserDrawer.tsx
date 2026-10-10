"use client";

import { useState } from "react";
import {
  Offcanvas,
  OffcanvasHeader,
  OffcanvasBody,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
  Button,
  Row,
  Col,
} from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import Select from "react-select";
import { toast } from "react-toastify";
import usersAPI from "../../helpers/users";
import type { AddUserDrawerProps, RoleValue, User } from "./types";
import { DUMMY_COUNTRIES } from "./dummy";

// ─── Options ──────────────────────────────────────────────────────────────────
const roleOptions = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
  { value: "superadmin", label: "Super Admin" },
  { value: "superuser", label: "Super User" },
];

// ─── Component ────────────────────────────────────────────────────────────────
const AddUserDrawer = ({
  open,
  handleClose,
  userData,
  setData,
  countries = DUMMY_COUNTRIES,
}: AddUserDrawerProps) => {
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);

  const countryOptions = countries.map(c => ({
    value: c.name,
    label: `${c.name} (${c.phoneCode})`,
    code: c.code,
    phoneCode: c.phoneCode,
  }));

  const formik = useFormik({
    initialValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: roleOptions[0],
      country: null as (typeof countryOptions)[number] | null,
      phoneNumber: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Name is required"),
      username: Yup.string().required("Username is required"),
      email: Yup.string().email("Invalid email").required("Email is required"),
      password: Yup.string()
        .min(8, "Min 8 characters")
        .required("Password is required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], "Passwords do not match")
        .required("Please confirm password"),
      role: Yup.object().required("Role is required"),
      country: Yup.object().nullable().required("Country is required"),
      phoneNumber: Yup.string().required("Phone number is required"),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        const selected = values.country!;
        const cleanedPhone = values.phoneNumber.replace(/^0+/, "");
        const formattedPhone = `${selected.phoneCode}-${cleanedPhone}`;

        // ── Dummy mode: push to local state ───────────────────────────────────
        const newUser: any = {
          ...values,
          // id: `usr-${Date.now()}`,
          name: values.name,
          username: values.username,
          email: values.email,
          status: "active",
          role: values.role.value, //"user",
          // roles: [{ role: values.role.value as RoleValue }],
          country: selected.value,
          countryCode: selected.code,
          phoneNumber: formattedPhone,
          createdAt: new Date().toISOString(),
        };
        await usersAPI.insertNewData(newUser);
        setData(prev => [...prev, newUser]);
        toast.success("User registered successfully!");
        resetForm();
        handleClose();
      } catch (error: any) {
        console.log("error", error);
      }
    },
  });

  const selectedCountry = formik.values.country;

  const handleReset = () => {
    formik.resetForm();
    handleClose();
  };

  return (
    <Offcanvas
      isOpen={open}
      toggle={handleReset}
      direction="end"
      style={{ width: 400 }}
    >
      <OffcanvasHeader toggle={handleReset}>Add New User</OffcanvasHeader>
      <OffcanvasBody>
        <Form
          onSubmit={formik.handleSubmit}
          className="d-flex flex-column gap-3"
        >
          {/* Full Name */}
          <FormGroup>
            <Label>Full Name</Label>
            <Input
              name="name"
              placeholder="John Doe"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              invalid={formik.touched.name && !!formik.errors.name}
            />
            <FormFeedback>{formik.errors.name}</FormFeedback>
          </FormGroup>

          {/* Username */}
          <FormGroup>
            <Label>Username</Label>
            <Input
              name="username"
              placeholder="johndoe"
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              invalid={formik.touched.username && !!formik.errors.username}
            />
            <FormFeedback>{formik.errors.username}</FormFeedback>
          </FormGroup>

          {/* Email */}
          <FormGroup>
            <Label>Email</Label>
            <Input
              name="email"
              type="email"
              placeholder="john@example.com"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              invalid={formik.touched.email && !!formik.errors.email}
            />
            <FormFeedback>{formik.errors.email}</FormFeedback>
          </FormGroup>

          {/* Password */}
          <FormGroup>
            <Label>Password</Label>
            <div className="input-group">
              <Input
                name="password"
                type={showPass ? "text" : "password"}
                placeholder="Min 8 characters"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                invalid={formik.touched.password && !!formik.errors.password}
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

          {/* Confirm Password */}
          <FormGroup>
            <Label>Confirm Password</Label>
            <div className="input-group">
              <Input
                name="confirmPassword"
                type={showConf ? "text" : "password"}
                placeholder="Repeat password"
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
              <FormFeedback>{formik.errors.confirmPassword}</FormFeedback>
            </div>
          </FormGroup>

          {/* Role */}
          <FormGroup>
            <Label>Role</Label>
            <Select
              options={roleOptions}
              value={formik.values.role}
              onChange={val => formik.setFieldValue("role", val)}
              classNamePrefix="select2-selection"
            />
            {formik.touched.role && formik.errors.role && (
              <div className="text-danger small mt-1">
                {formik.errors.role as string}
              </div>
            )}
          </FormGroup>

          {/* Country */}
          <FormGroup>
            <Label>Country</Label>
            <Select
              options={countryOptions}
              value={formik.values.country}
              onChange={val => formik.setFieldValue("country", val)}
              placeholder="Select country..."
              classNamePrefix="select2-selection"
            />
            {formik.touched.country && formik.errors.country && (
              <div className="text-danger small mt-1">Country is required</div>
            )}
          </FormGroup>

          {/* Country Code (read-only) */}
          <FormGroup>
            <Label>Country Code</Label>
            <Input value={selectedCountry?.code ?? ""} disabled />
          </FormGroup>

          {/* Phone Number */}
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
                    e.target.value.replace(/\D/g, "")
                  )
                }
                onBlur={formik.handleBlur}
                invalid={
                  formik.touched.phoneNumber && !!formik.errors.phoneNumber
                }
                placeholder="812xxxxxxx"
              />
              <FormFeedback>{formik.errors.phoneNumber}</FormFeedback>
            </div>
          </FormGroup>

          {/* Actions */}
          <div className="d-flex gap-2 mt-2">
            <Button
              color="primary"
              type="submit"
              disabled={formik.isSubmitting}
            >
              Submit
            </Button>
            <Button color="danger" outline type="button" onClick={handleReset}>
              Cancel
            </Button>
          </div>
        </Form>
      </OffcanvasBody>
    </Offcanvas>
  );
};

export default AddUserDrawer;
