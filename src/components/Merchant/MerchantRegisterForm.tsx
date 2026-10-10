"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ParticlesAuth from "@/app/(with-nonlayout)/auth/ParticlesAuth";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Form,
  FormFeedback,
  Input,
  Label,
  Row,
  Spinner,
} from "reactstrap";

type Region = {
  id: number | string;
  code?: string;
  name: string;
};

type FormValues = {
  email: string;
  password: string;
  bank_name: string;
  bank_no: string;
  merchant_name: string;
  merchant_email: string;
  address: string;
  province_id: string;
  regency_id: string;
  district_id: string;
  village_id: string;
};

const initialValues: FormValues = {
  email: "",
  password: "",
  bank_name: "",
  bank_no: "",
  merchant_name: "",
  merchant_email: "",
  address: "",
  province_id: "",
  regency_id: "",
  district_id: "",
  village_id: "",
};

const regionEndpoints = {
  provinces: "/api/apps/region/provinces/panel",
  regencies: "/api/apps/region/regencies/panel",
  districts: "/api/apps/region/districts/panel",
  villages: "/api/apps/region/villages/panel",
};

async function readResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      payload.error || payload.message || "Permintaan gagal diproses."
    );
  }
  return payload;
}

function uniqueRegions(regions: Region[]) {
  const seen = new Set<string>();
  return regions.filter(region => {
    const key = region.code || region.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function MerchantRegisterForm() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [regencies, setRegencies] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [villages, setVillages] = useState<Region[]>([]);
  const [loadingLevel, setLoadingLevel] = useState<string | null>("provinces");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "danger";
    text: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    fetch(regionEndpoints.provinces)
      .then(readResponse)
      .then(
        payload => active && setProvinces(uniqueRegions(payload.data ?? []))
      )
      .catch(
        error => active && setMessage({ type: "danger", text: error.message })
      )
      .finally(() => active && setLoadingLevel(null));
    return () => {
      active = false;
    };
  }, []);

  const loadRegions = async (
    level: "regencies" | "districts" | "villages",
    parentKey: "province_id" | "regency_id" | "district_id",
    parentId: string
  ) => {
    if (!parentId) return [];
    setLoadingLevel(level);
    setMessage(null);
    try {
      const response = await fetch(
        `${regionEndpoints[level]}?${parentKey}=${encodeURIComponent(parentId)}`
      );
      const payload = await readResponse(response);
      return uniqueRegions((payload.data ?? []) as Region[]);
    } catch (error) {
      setMessage({
        type: "danger",
        text:
          error instanceof Error ? error.message : "Gagal memuat data wilayah.",
      });
      return [];
    } finally {
      setLoadingLevel(null);
    }
  };

  const handleChange = (field: keyof FormValues, value: string) => {
    setValues(current => ({ ...current, [field]: value }));
  };

  const selectProvince = async (provinceId: string) => {
    setValues(current => ({
      ...current,
      province_id: provinceId,
      regency_id: "",
      district_id: "",
      village_id: "",
    }));
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
    setRegencies(await loadRegions("regencies", "province_id", provinceId));
  };

  const selectRegency = async (regencyId: string) => {
    setValues(current => ({
      ...current,
      regency_id: regencyId,
      district_id: "",
      village_id: "",
    }));
    setDistricts([]);
    setVillages([]);
    setDistricts(await loadRegions("districts", "regency_id", regencyId));
  };

  const selectDistrict = async (districtId: string) => {
    setValues(current => ({
      ...current,
      district_id: districtId,
      village_id: "",
    }));
    setVillages([]);
    setVillages(await loadRegions("villages", "district_id", districtId));
  };

  const invalid = (field: keyof FormValues) =>
    submitted && !values[field].trim();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setMessage(null);

    if (Object.values(values).some(value => !value.trim())) {
      setMessage({
        type: "danger",
        text: "Mohon lengkapi seluruh field wajib.",
      });
      return;
    }

    if (
      !/^\S+@\S+\.\S+$/.test(values.email) ||
      !/^\S+@\S+\.\S+$/.test(values.merchant_email)
    ) {
      setMessage({ type: "danger", text: "Format email belum valid." });
      return;
    }

    if (values.password.length < 8) {
      setMessage({ type: "danger", text: "Password minimal 8 karakter." });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/apps/merchant/panel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          province_id: Number(values.province_id),
          regency_id: Number(values.regency_id),
          district_id: Number(values.district_id),
          village_id: Number(values.village_id),
        }),
      });
      await readResponse(response);
      setMessage({ type: "success", text: "Merchant berhasil didaftarkan." });
      setValues(initialValues);
      setRegencies([]);
      setDistricts([]);
      setVillages([]);
      setSubmitted(false);
    } catch (error) {
      setMessage({
        type: "danger",
        text:
          error instanceof Error ? error.message : "Registrasi merchant gagal.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const regionSelect = (
    label: string,
    field: keyof Pick<
      FormValues,
      "province_id" | "regency_id" | "district_id" | "village_id"
    >,
    options: Region[],
    disabled: boolean,
    onChange: (value: string) => void
  ) => (
    <Col md={6}>
      <div className="mb-3">
        <Label htmlFor={field}>
          {label} <span className="text-danger">*</span>
        </Label>
        <Input
          id={field}
          type="select"
          value={values[field]}
          disabled={
            disabled ||
            loadingLevel ===
              (
                {
                  province_id: "provinces",
                  regency_id: "regencies",
                  district_id: "districts",
                  village_id: "villages",
                } as const
              )[field]
          }
          invalid={invalid(field)}
          onChange={event => onChange(event.target.value)}
        >
          <option value="">Pilih {label.toLowerCase()}</option>
          {options.map(option => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </Input>
        <FormFeedback>{label} wajib dipilih.</FormFeedback>
      </div>
    </Col>
  );

  return (
    <ParticlesAuth>
      <div className="auth-page-content py-5">
        <Container>
          <Row>
            <Col lg={12}>
              <div className="text-center mb-4 text-white-50">
                <Link href="/auth/login" className="d-inline-block auth-logo">
                  <Image
                    src="/images/logo-light.png"
                    alt="POS"
                    height={24}
                    width={144}
                  />
                </Link>
                <p className="mt-3 fs-15 fw-medium">
                  Daftarkan usaha Anda untuk mulai menggunakan POS
                </p>
              </div>
            </Col>
          </Row>
          <Row className="justify-content-center">
            <Col xl={10}>
              <Card>
                <CardHeader>
                  <h4 className="card-title mb-1">Registrasi Merchant Baru</h4>
                  <p className="text-muted mb-0">
                    Lengkapi akun pemilik, informasi merchant, rekening bank,
                    dan alamat cabang utama.
                  </p>
                </CardHeader>
                <CardBody>
                  {message && (
                    <Alert color={message.type}>{message.text}</Alert>
                  )}
                  <Form noValidate onSubmit={handleSubmit}>
                    <h5 className="fs-14 mb-3">Akun Pemilik</h5>
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label htmlFor="email">
                            Email Login <span className="text-danger">*</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={values.email}
                            invalid={invalid("email")}
                            placeholder="pemilik@merchant.com"
                            onChange={event =>
                              handleChange("email", event.target.value)
                            }
                          />
                          <FormFeedback>Email login wajib diisi.</FormFeedback>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label htmlFor="password">
                            Password <span className="text-danger">*</span>
                          </Label>
                          <Input
                            id="password"
                            type="password"
                            value={values.password}
                            invalid={invalid("password")}
                            minLength={8}
                            placeholder="Minimal 8 karakter"
                            onChange={event =>
                              handleChange("password", event.target.value)
                            }
                          />
                          <FormFeedback>Password wajib diisi.</FormFeedback>
                        </div>
                      </Col>
                    </Row>

                    <hr className="my-3" />
                    <h5 className="fs-14 mb-3">Informasi Merchant</h5>
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label htmlFor="merchant_name">
                            Nama Merchant <span className="text-danger">*</span>
                          </Label>
                          <Input
                            id="merchant_name"
                            value={values.merchant_name}
                            invalid={invalid("merchant_name")}
                            placeholder="Contoh: Warkop II"
                            onChange={event =>
                              handleChange("merchant_name", event.target.value)
                            }
                          />
                          <FormFeedback>
                            Nama merchant wajib diisi.
                          </FormFeedback>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label htmlFor="merchant_email">
                            Email Merchant{" "}
                            <span className="text-danger">*</span>
                          </Label>
                          <Input
                            id="merchant_email"
                            type="email"
                            value={values.merchant_email}
                            invalid={invalid("merchant_email")}
                            placeholder="merchant@contoh.com"
                            onChange={event =>
                              handleChange("merchant_email", event.target.value)
                            }
                          />
                          <FormFeedback>
                            Email merchant wajib diisi.
                          </FormFeedback>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label htmlFor="bank_name">
                            Nama Bank <span className="text-danger">*</span>
                          </Label>
                          <Input
                            id="bank_name"
                            type="select"
                            value={values.bank_name}
                            invalid={invalid("bank_name")}
                            onChange={event =>
                              handleChange("bank_name", event.target.value)
                            }
                          >
                            <option value="">Pilih bank</option>
                            {[
                              "BCA",
                              "BNI",
                              "BRI",
                              "BSI",
                              "CIMB Niaga",
                              "Mandiri",
                              "Permata",
                            ].map(bank => (
                              <option key={bank} value={bank}>
                                {bank}
                              </option>
                            ))}
                          </Input>
                          <FormFeedback>Nama bank wajib dipilih.</FormFeedback>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label htmlFor="bank_no">
                            Nomor Rekening{" "}
                            <span className="text-danger">*</span>
                          </Label>
                          <Input
                            id="bank_no"
                            inputMode="numeric"
                            value={values.bank_no}
                            invalid={invalid("bank_no")}
                            placeholder="12343245342"
                            onChange={event =>
                              handleChange(
                                "bank_no",
                                event.target.value.replace(/\D/g, "")
                              )
                            }
                          />
                          <FormFeedback>
                            Nomor rekening wajib diisi.
                          </FormFeedback>
                        </div>
                      </Col>
                    </Row>

                    <hr className="my-3" />
                    <h5 className="fs-14 mb-3">Alamat Cabang Utama</h5>
                    <Row>
                      {regionSelect(
                        "Provinsi",
                        "province_id",
                        provinces,
                        loadingLevel === "provinces",
                        selectProvince
                      )}
                      {regionSelect(
                        "Kabupaten/Kota",
                        "regency_id",
                        regencies,
                        !values.province_id,
                        selectRegency
                      )}
                      {regionSelect(
                        "Kecamatan",
                        "district_id",
                        districts,
                        !values.regency_id,
                        selectDistrict
                      )}
                      {regionSelect(
                        "Desa/Kelurahan",
                        "village_id",
                        villages,
                        !values.district_id,
                        value => handleChange("village_id", value)
                      )}
                      <Col xs={12}>
                        <div className="mb-3">
                          <Label htmlFor="address">
                            Alamat Lengkap{" "}
                            <span className="text-danger">*</span>
                          </Label>
                          <Input
                            id="address"
                            type="textarea"
                            rows={3}
                            value={values.address}
                            invalid={invalid("address")}
                            placeholder="Nama jalan, nomor bangunan, dan patokan"
                            onChange={event =>
                              handleChange("address", event.target.value)
                            }
                          />
                          <FormFeedback>Alamat wajib diisi.</FormFeedback>
                        </div>
                      </Col>
                    </Row>

                    <div className="d-flex justify-content-end gap-2">
                      <Button
                        type="button"
                        color="light"
                        disabled={submitting}
                        onClick={() => {
                          setValues(initialValues);
                          setRegencies([]);
                          setDistricts([]);
                          setVillages([]);
                          setSubmitted(false);
                          setMessage(null);
                        }}
                      >
                        Reset
                      </Button>
                      <Button
                        type="submit"
                        color="primary"
                        disabled={submitting || loadingLevel !== null}
                      >
                        {submitting && <Spinner size="sm" className="me-2" />}
                        Daftarkan Merchant
                      </Button>
                    </div>
                  </Form>
                </CardBody>
              </Card>
              <div className="mt-4 text-center">
                <p className="mb-0 text-muted">
                  Sudah memiliki akun?{" "}
                  <Link
                    href="/auth/login"
                    className="fw-semibold text-primary text-decoration-underline"
                  >
                    Masuk
                  </Link>
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </ParticlesAuth>
  );
}
