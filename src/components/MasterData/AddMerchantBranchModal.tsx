"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Form,
  FormFeedback,
  Input,
  InputGroup,
  InputGroupText,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Spinner,
} from "reactstrap";

type Region = { id: string | number; code?: string; name: string };
type RegionLevel = "provinces" | "regencies" | "districts" | "villages";
type FormValues = {
  fullname: string;
  phone: string;
  email: string;
  merchantbranch_name: string;
  address: string;
  province_id: string;
  regency_id: string;
  district_id: string;
  village_id: string;
};

const initialValues: FormValues = {
  fullname: "",
  phone: "",
  email: "",
  merchantbranch_name: "",
  address: "",
  province_id: "",
  regency_id: "",
  district_id: "",
  village_id: "",
};

const endpoints: Record<RegionLevel, string> = {
  provinces: "/api/apps/region/provinces/panel",
  regencies: "/api/apps/region/regencies/panel",
  districts: "/api/apps/region/districts/panel",
  villages: "/api/apps/region/villages/panel",
};

async function readResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      payload.error || payload.message || "Permintaan gagal diproses."
    );
  return payload;
}

const uniqueRegions = (regions: Region[]) => {
  const seen = new Set<string>();
  return regions.filter(region => {
    const key = String(region.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

type Props = { isOpen: boolean; toggle: () => void; onCreated: () => void };

export default function AddMerchantBranchModal({
  isOpen,
  toggle,
  onCreated,
}: Props) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [regencies, setRegencies] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [villages, setVillages] = useState<Region[]>([]);
  const [loadingLevel, setLoadingLevel] = useState<RegionLevel | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || provinces.length) return;
    setLoadingLevel("provinces");
    fetch(endpoints.provinces, { credentials: "include" })
      .then(readResponse)
      .then(payload => setProvinces(uniqueRegions(payload.data ?? [])))
      .catch(reason =>
        setError(
          reason instanceof Error ? reason.message : "Gagal memuat provinsi."
        )
      )
      .finally(() => setLoadingLevel(null));
  }, [isOpen, provinces.length]);

  const change = (field: keyof FormValues, value: string) =>
    setValues(current => ({ ...current, [field]: value }));

  const loadRegions = async (
    level: Exclude<RegionLevel, "provinces">,
    parentKey: string,
    parentId: string
  ) => {
    if (!parentId) return [];
    setLoadingLevel(level);
    setError("");
    try {
      const response = await fetch(
        `${endpoints[level]}?${parentKey}=${encodeURIComponent(parentId)}`,
        { credentials: "include" }
      );
      const payload = await readResponse(response);
      return uniqueRegions(payload.data ?? []);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Gagal memuat wilayah."
      );
      return [];
    } finally {
      setLoadingLevel(null);
    }
  };

  const selectProvince = async (id: string) => {
    setValues(current => ({
      ...current,
      province_id: id,
      regency_id: "",
      district_id: "",
      village_id: "",
    }));
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
    setRegencies(await loadRegions("regencies", "province_id", id));
  };
  const selectRegency = async (id: string) => {
    setValues(current => ({
      ...current,
      regency_id: id,
      district_id: "",
      village_id: "",
    }));
    setDistricts([]);
    setVillages([]);
    setDistricts(await loadRegions("districts", "regency_id", id));
  };
  const selectDistrict = async (id: string) => {
    setValues(current => ({ ...current, district_id: id, village_id: "" }));
    setVillages([]);
    setVillages(await loadRegions("villages", "district_id", id));
  };

  const invalid = (field: keyof FormValues) =>
    submitted && !values[field].trim();
  const close = () => {
    if (!submitting) {
      setError("");
      setSubmitted(false);
      toggle();
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setError("");
    if (Object.values(values).some(value => !value.trim()))
      return setError("Mohon lengkapi seluruh field wajib.");
    if (!/^\S+@\S+\.\S+$/.test(values.email))
      return setError("Format email belum valid.");
    const phoneDigits = values.phone.replace(/\D/g, "").replace(/^(62|0)/, "");
    if (phoneDigits.length < 8) return setError("Nomor telepon belum valid.");

    setSubmitting(true);
    try {
      const response = await fetch("/api/apps/merchantbranch/panel", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          phone: `+62${phoneDigits}`,
          province_id: Number(values.province_id),
          regency_id: Number(values.regency_id),
          district_id: Number(values.district_id),
          village_id: Number(values.village_id),
        }),
      });
      await readResponse(response);
      setValues(initialValues);
      setRegencies([]);
      setDistricts([]);
      setVillages([]);
      setSubmitted(false);
      toggle();
      onCreated();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Cabang gagal dibuat."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const regionSelect = (
    label: string,
    field: keyof FormValues,
    options: Region[],
    disabled: boolean,
    handler: (id: string) => void,
    level: RegionLevel
  ) => (
    <Col md={6}>
      <Label htmlFor={`branch-${field}`}>
        {label} <span className="text-danger">*</span>
      </Label>
      <Input
        id={`branch-${field}`}
        type="select"
        value={values[field]}
        disabled={disabled || loadingLevel === level}
        invalid={invalid(field)}
        onChange={event => handler(event.target.value)}
      >
        <option value="">
          {loadingLevel === level
            ? "Memuat..."
            : `Pilih ${label.toLowerCase()}`}
        </option>
        {options.map(region => (
          <option key={region.id} value={region.id}>
            {region.name}
          </option>
        ))}
      </Input>
      <FormFeedback>{label} wajib dipilih.</FormFeedback>
    </Col>
  );

  return (
    <Modal
      isOpen={isOpen}
      toggle={close}
      centered
      size="lg"
      scrollable
      contentClassName="overflow-hidden"
    >
      <Form onSubmit={submit} noValidate>
        <ModalHeader toggle={close}>Tambah Cabang Baru</ModalHeader>
        <ModalBody
          className="overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 190px)" }}
        >
          {error && (
            <Alert color="danger">
              <i className="ri-error-warning-line me-2" />
              {error}
            </Alert>
          )}
          <h6 className="text-uppercase text-muted mb-3">
            <i className="ri-user-settings-line me-2" />
            Admin Cabang
          </h6>
          <Row className="g-3 mb-4">
            <Col md={6}>
              <Label htmlFor="branch-fullname">
                Nama Lengkap <span className="text-danger">*</span>
              </Label>
              <Input
                id="branch-fullname"
                value={values.fullname}
                invalid={invalid("fullname")}
                placeholder="Nama admin cabang"
                onChange={event => change("fullname", event.target.value)}
              />
              <FormFeedback>Nama lengkap wajib diisi.</FormFeedback>
            </Col>
            <Col md={6}>
              <Label htmlFor="branch-email">
                Email <span className="text-danger">*</span>
              </Label>
              <Input
                id="branch-email"
                type="email"
                value={values.email}
                invalid={invalid("email")}
                placeholder="admin@email.com"
                onChange={event => change("email", event.target.value)}
              />
              <FormFeedback>Email wajib diisi.</FormFeedback>
            </Col>
            <Col md={6}>
              <Label htmlFor="branch-phone">
                Nomor Telepon <span className="text-danger">*</span>
              </Label>
              <InputGroup>
                <InputGroupText>+62</InputGroupText>
                <Input
                  id="branch-phone"
                  inputMode="numeric"
                  value={values.phone}
                  invalid={invalid("phone")}
                  placeholder="89799766785"
                  onChange={event =>
                    change("phone", event.target.value.replace(/\D/g, ""))
                  }
                />
                <FormFeedback>Nomor telepon wajib diisi.</FormFeedback>
              </InputGroup>
              <small className="text-muted">
                Masukkan nomor tanpa angka 0 di depan.
              </small>
            </Col>
          </Row>
          <h6 className="text-uppercase text-muted mb-3">
            <i className="ri-store-2-line me-2" />
            Informasi Cabang
          </h6>
          <Row className="g-3">
            <Col md={6}>
              <Label htmlFor="branch-name">
                Nama Cabang <span className="text-danger">*</span>
              </Label>
              <Input
                id="branch-name"
                value={values.merchantbranch_name}
                invalid={invalid("merchantbranch_name")}
                placeholder="Nama merchant - Cabang"
                onChange={event =>
                  change("merchantbranch_name", event.target.value)
                }
              />
              <FormFeedback>Nama cabang wajib diisi.</FormFeedback>
            </Col>
            <Col xs={12}>
              <Label htmlFor="branch-address">
                Alamat <span className="text-danger">*</span>
              </Label>
              <Input
                id="branch-address"
                type="textarea"
                rows={3}
                value={values.address}
                invalid={invalid("address")}
                placeholder="Alamat lengkap cabang"
                onChange={event => change("address", event.target.value)}
              />
              <FormFeedback>Alamat wajib diisi.</FormFeedback>
            </Col>
            {regionSelect(
              "Provinsi",
              "province_id",
              provinces,
              false,
              selectProvince,
              "provinces"
            )}
            {regionSelect(
              "Kabupaten/Kota",
              "regency_id",
              regencies,
              !values.province_id,
              selectRegency,
              "regencies"
            )}
            {regionSelect(
              "Kecamatan",
              "district_id",
              districts,
              !values.regency_id,
              selectDistrict,
              "districts"
            )}
            {regionSelect(
              "Desa/Kelurahan",
              "village_id",
              villages,
              !values.district_id,
              id => change("village_id", id),
              "villages"
            )}
          </Row>
          <Alert color="info" className="mt-4 mb-0 border-0">
            <i className="ri-information-line me-2" />
            Akun admin dibuat dengan role Admin dan password awal{" "}
            <strong>admin123</strong>.
          </Alert>
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            color="light"
            onClick={close}
            disabled={submitting}
          >
            Batal
          </Button>
          <Button type="submit" color="primary" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner size="sm" className="me-2" />
                Menyimpan...
              </>
            ) : (
              <>
                <i className="ri-save-line me-1" />
                Simpan Cabang
              </>
            )}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
}
