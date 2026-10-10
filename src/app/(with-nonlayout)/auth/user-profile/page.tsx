"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Container,
  Row,
  Col,
  Card,
  Alert,
  CardBody,
  Button,
  Label,
  Input,
  Form,
} from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import Image from "next/image";

const avatar = "/images/users/avatar-1.jpg";

const UserProfile = () => {
  const { data: session, update } = useSession();
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const user = session?.user;

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: (user?.name as string) || "Admin",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Please Enter Your Username"),
    }),
    onSubmit: async values => {
      try {
        const res = await fetch("/api/auth/update-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: values.name }),
        });

        if (!res.ok) throw new Error("Failed to update");

        await update({ name: values.name }); // update session
        setSuccess(`Username updated to ${values.name}`);
        setError("");
      } catch (err: any) {
        setError(err.message || "Something went wrong");
        setSuccess("");
      }
    },
  });

  return (
    <React.Fragment>
      <div className="page-content mt-lg-5">
        <Container fluid>
          <Row>
            <Col lg="12">
              {error && <Alert color="danger">{error}</Alert>}
              {success && <Alert color="success">{success}</Alert>}

              <Card>
                <CardBody>
                  <div className="d-flex">
                    <div className="mx-3">
                      <Image
                        src={user?.image || avatar}
                        alt="avatar"
                        className="avatar-md rounded-circle img-thumbnail"
                        width={48}
                        height={48}
                      />
                    </div>
                    <div className="flex-grow-1 align-self-center">
                      <div className="text-muted">
                        <h5>{user?.name || "Admin"}</h5>
                        <p className="mb-1">Email: {user?.email || "-"}</p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>

          <h4 className="card-title mb-4">Change Username</h4>

          <Card>
            <CardBody>
              <Form
                className="form-horizontal"
                onSubmit={e => {
                  e.preventDefault();
                  validation.handleSubmit();
                }}
              >
                <div className="form-group">
                  <Label className="form-label">Username</Label>
                  <Input
                    name="name"
                    className="form-control"
                    placeholder="Enter Username"
                    type="text"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.name}
                    invalid={
                      !!(validation.touched.name && validation.errors.name)
                    }
                  />
                  {validation.touched.name && validation.errors.name && (
                    <div className="text-danger mt-1">
                      {validation.errors.name}
                    </div>
                  )}
                </div>
                <div className="text-center mt-4">
                  <Button type="submit" color="danger">
                    Update Username
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default UserProfile;
