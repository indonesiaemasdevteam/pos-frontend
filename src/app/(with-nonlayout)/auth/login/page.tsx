"use client";

import React, { useState } from "react";
import {
  Card,
  CardBody,
  Col,
  Container,
  Input,
  Label,
  Row,
  Button,
  Form,
  FormFeedback,
  Alert,
  Spinner,
} from "reactstrap";
import ParticlesAuth from "../ParticlesAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as Yup from "yup";
import { useFormik } from "formik";
import Image from "next/image";

const logoLight = "/images/logo-light.png";

const Login = () => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loader, setLoader] = useState(false);
  const [passwordShow, setPasswordShow] = useState(false);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Format email tidak valid")
        .required("Email wajib diisi"),
      password: Yup.string().required("Password wajib diisi"),
    }),
    onSubmit: async values => {
      setLoader(true);
      setError("");

      try {
        const response = await fetch("/api/apps/auth/login/email", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: values.email.trim(),
            password: values.password,
          }),
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            payload.error || payload.message || "Email atau password salah"
          );
        }

        if (!payload.response?.user_id || !payload.response?.token) {
          throw new Error("Response login tidak valid");
        }

        router.replace("/dashboard");
        router.refresh();
      } catch (loginError) {
        setError(
          loginError instanceof Error
            ? loginError.message
            : "Login gagal. Silakan coba kembali."
        );
        setLoader(false);
      }
    },
  });

  return (
    <React.Fragment>
      <ParticlesAuth>
        <div className="auth-page-content mt-lg-5">
          <Container>
            <Row>
              <Col lg={12}>
                <div className="text-center mt-sm-5 mb-4 text-white-50">
                  <div>
                    <Link href="/" className="d-inline-block auth-logo">
                      <Image src={logoLight} alt="" height={20} width={120} />
                    </Link>
                  </div>
                  <p className="mt-3 fs-15 fw-medium">
                    Premium Admin & Dashboard Template
                  </p>
                </div>
              </Col>
            </Row>

            <Row className="justify-content-center">
              <Col md={8} lg={6} xl={5}>
                <Card className="mt-4 card-bg-fill">
                  <CardBody className="p-4">
                    <div className="text-center mt-2">
                      <h5 className="text-primary">Welcome Back !</h5>
                      <p className="text-muted">
                        Sign in to continue to Velzon.
                      </p>
                    </div>
                    {error && <Alert color="danger">{error}</Alert>}
                    <div className="p-2 mt-4">
                      <Form
                        onSubmit={e => {
                          e.preventDefault();
                          validation.handleSubmit();
                        }}
                      >
                        <div className="mb-3">
                          <Label htmlFor="email" className="form-label">
                            Email
                          </Label>
                          <Input
                            name="email"
                            className="form-control"
                            placeholder="Enter email"
                            type="email"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.email}
                            invalid={
                              validation.touched.email &&
                              !!validation.errors.email
                            }
                          />
                          {validation.touched.email &&
                            validation.errors.email && (
                              <FormFeedback>
                                {validation.errors.email}
                              </FormFeedback>
                            )}
                        </div>

                        <div className="mb-3">
                          <div className="float-end">
                            <Link
                              href="/auth/forget-password"
                              className="text-muted"
                            >
                              Forgot password?
                            </Link>
                          </div>
                          <Label
                            className="form-label"
                            htmlFor="password-input"
                          >
                            Password
                          </Label>
                          <div className="position-relative auth-pass-inputgroup mb-3">
                            <Input
                              name="password"
                              value={validation.values.password}
                              type={passwordShow ? "text" : "password"}
                              className="form-control pe-5"
                              placeholder="Enter Password"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              invalid={
                                validation.touched.password &&
                                !!validation.errors.password
                              }
                            />
                            {validation.touched.password &&
                              validation.errors.password && (
                                <FormFeedback>
                                  {validation.errors.password}
                                </FormFeedback>
                              )}
                            <button
                              className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted"
                              type="button"
                              onClick={() => setPasswordShow(!passwordShow)}
                            >
                              <i className="ri-eye-fill align-middle"></i>
                            </button>
                          </div>
                        </div>

                        <div className="mt-4">
                          <Button
                            color="success"
                            disabled={loader}
                            className="btn btn-success w-100"
                            type="submit"
                          >
                            {loader && <Spinner size="sm" className="me-2" />}
                            Sign In
                          </Button>
                        </div>
                      </Form>
                    </div>
                  </CardBody>
                </Card>

                <div className="mt-4 text-center">
                  <p className="mb-0">
                    Don&apos;t have an account?{" "}
                    <Link
                      href="/apps-merchant-register"
                      className="fw-semibold text-primary text-decoration-underline"
                    >
                      Signup
                    </Link>
                  </p>
                </div>
              </Col>
            </Row>
          </Container>
        </div>
      </ParticlesAuth>
    </React.Fragment>
  );
};

export default Login;
