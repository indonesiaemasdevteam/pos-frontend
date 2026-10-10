"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import BreadCrumb from "@components/Common/BreadCrumb";
import {
  Alert,
  Badge,
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
  ListGroup,
  ListGroupItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Spinner,
} from "reactstrap";

const profileBg = "/images/profile-bg.jpg";
const defaultAvatar = "/images/users/avatar-1.jpg";

type UserProfile = {
  user_id: number;
  email: string;
  fullname: string | null;
  photo: string | null;
  role: string;
};

type MerchantBranch = {
  merchant_branch_id: string | number;
  merchant_branch_name: string;
  address: string;
  merchant_id: string | number;
  province_name: string;
  regency_name: string;
  district_name: string;
  village_name: string;
  province_id: string | number;
  regency_id: string | number;
  district_id: string | number;
  village_id: string | number;
  updated_at: string | null;
};

type MerchantInfo = {
  merchant_id: string | number;
  code: string | null;
  merchant_name: string;
  merchant_email: string;
  logo: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

type ProfileData = {
  user: UserProfile;
  branch: MerchantBranch | null;
  merchant: MerchantInfo;
};

type EditSection = "user" | "merchant" | "branch";

type Region = {
  id: string | number;
  code?: string;
  name: string;
};

type EditValues = {
  fullname: string;
  email: string;
  merchant_name: string;
  merchant_email: string;
  merchant_branch_name: string;
  address: string;
  province_id: string;
  regency_id: string;
  district_id: string;
  village_id: string;
};

const emptyEditValues: EditValues = {
  fullname: "",
  email: "",
  merchant_name: "",
  merchant_email: "",
  merchant_branch_name: "",
  address: "",
  province_id: "",
  regency_id: "",
  district_id: "",
  village_id: "",
};

async function requestJson(url: string) {
  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      payload.error || payload.message || "Gagal mengambil data profile."
    ) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return payload;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

async function fetchRegions(url: string) {
  const payload = await requestJson(url);
  const seen = new Set<string>();
  return ((payload.data ?? []) as Region[]).filter(region => {
    const key = region.code || region.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function InfoRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <ListGroupItem className="d-flex justify-content-between align-items-start gap-3 px-4 py-3">
      <span className="text-muted">{label}</span>
      <span className="fw-medium text-end">{value || "-"}</span>
    </ListGroupItem>
  );
}

function SummaryCard({
  icon,
  color,
  label,
  value,
}: {
  icon: string;
  color: string;
  label: string;
  value: ReactNode;
}) {
  return (
    <Card className="card-animate h-100">
      <CardBody>
        <div className="d-flex align-items-center">
          <div className="flex-grow-1 overflow-hidden">
            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
              {label}
            </p>
          </div>
          <div className="flex-shrink-0 avatar-sm">
            <span
              className={`avatar-title bg-${color}-subtle text-${color} rounded fs-3`}
            >
              <i className={icon} />
            </span>
          </div>
        </div>
        <h4 className="fs-22 fw-semibold mt-3 mb-0 text-truncate">{value}</h4>
      </CardBody>
    </Card>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editSection, setEditSection] = useState<EditSection | null>(null);
  const [editValues, setEditValues] = useState<EditValues>(emptyEditValues);
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);
  const [regionLoading, setRegionLoading] = useState(false);
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [regencies, setRegencies] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [villages, setVillages] = useState<Region[]>([]);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [mePayload, merchantPayload] = await Promise.all([
        requestJson("/api/apps/auth/me"),
        requestJson("/api/apps/auth/merchant-info"),
      ]);
      const user = mePayload.response?.data_user;
      const merchant = merchantPayload.response;

      if (!user || !merchant) {
        throw new Error("Data profile dari server tidak lengkap.");
      }

      setProfile({
        user,
        branch: mePayload.response?.data_merchant_branch ?? null,
        merchant,
      });
    } catch (loadError) {
      const apiError = loadError as Error & { status?: number };
      if (apiError.status === 401) {
        router.replace("/auth/login");
        return;
      }
      setError(apiError.message || "Gagal mengambil data profile.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    document.title = "Profile | POS";
  }, []);

  const openEditModal = (section: EditSection) => {
    if (!profile) return;
    setEditSection(section);
    setEditError("");
    setEditValues({
      fullname: profile.user.fullname || "",
      email: profile.user.email,
      merchant_name: profile.merchant.merchant_name,
      merchant_email: profile.merchant.merchant_email,
      merchant_branch_name: profile.branch?.merchant_branch_name || "",
      address: profile.branch?.address || "",
      province_id: String(profile.branch?.province_id || ""),
      regency_id: String(profile.branch?.regency_id || ""),
      district_id: String(profile.branch?.district_id || ""),
      village_id: String(profile.branch?.village_id || ""),
    });

    if (section === "branch" && profile.branch) {
      setRegionLoading(true);
      void Promise.all([
        fetchRegions("/api/apps/region/provinces/panel"),
        fetchRegions(
          `/api/apps/region/regencies/panel?province_id=${profile.branch.province_id}`
        ),
        fetchRegions(
          `/api/apps/region/districts/panel?regency_id=${profile.branch.regency_id}`
        ),
        fetchRegions(
          `/api/apps/region/villages/panel?district_id=${profile.branch.district_id}`
        ),
      ])
        .then(([provinceData, regencyData, districtData, villageData]) => {
          setProvinces(provinceData);
          setRegencies(regencyData);
          setDistricts(districtData);
          setVillages(villageData);
        })
        .catch(regionError => {
          setEditError(
            regionError instanceof Error
              ? regionError.message
              : "Gagal memuat data wilayah."
          );
        })
        .finally(() => setRegionLoading(false));
    }
  };

  const closeEditModal = () => {
    if (saving) return;
    setEditSection(null);
    setEditError("");
  };

  const updateEditValue = (field: keyof EditValues, value: string) => {
    setEditValues(current => ({ ...current, [field]: value }));
  };

  const selectProvince = async (provinceId: string) => {
    setEditValues(current => ({
      ...current,
      province_id: provinceId,
      regency_id: "",
      district_id: "",
      village_id: "",
    }));
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
    if (!provinceId) return;
    setRegionLoading(true);
    try {
      setRegencies(
        await fetchRegions(
          `/api/apps/region/regencies/panel?province_id=${provinceId}`
        )
      );
    } catch (regionError) {
      setEditError(
        regionError instanceof Error
          ? regionError.message
          : "Gagal memuat kabupaten/kota."
      );
    } finally {
      setRegionLoading(false);
    }
  };

  const selectRegency = async (regencyId: string) => {
    setEditValues(current => ({
      ...current,
      regency_id: regencyId,
      district_id: "",
      village_id: "",
    }));
    setDistricts([]);
    setVillages([]);
    if (!regencyId) return;
    setRegionLoading(true);
    try {
      setDistricts(
        await fetchRegions(
          `/api/apps/region/districts/panel?regency_id=${regencyId}`
        )
      );
    } catch (regionError) {
      setEditError(
        regionError instanceof Error
          ? regionError.message
          : "Gagal memuat kecamatan."
      );
    } finally {
      setRegionLoading(false);
    }
  };

  const selectDistrict = async (districtId: string) => {
    setEditValues(current => ({
      ...current,
      district_id: districtId,
      village_id: "",
    }));
    setVillages([]);
    if (!districtId) return;
    setRegionLoading(true);
    try {
      setVillages(
        await fetchRegions(
          `/api/apps/region/villages/panel?district_id=${districtId}`
        )
      );
    } catch (regionError) {
      setEditError(
        regionError instanceof Error
          ? regionError.message
          : "Gagal memuat desa/kelurahan."
      );
    } finally {
      setRegionLoading(false);
    }
  };

  const saveEdit = async () => {
    if (!editSection || !profile) return;

    const config = {
      user: {
        url: "/api/apps/auth/me",
        body: {
          fullname: editValues.fullname.trim(),
          email: editValues.email.trim(),
        },
        required: [editValues.fullname, editValues.email],
        success: "Profile pengguna berhasil diperbarui.",
      },
      merchant: {
        url: "/api/apps/auth/merchant-info",
        body: {
          merchant_name: editValues.merchant_name.trim(),
          merchant_email: editValues.merchant_email.trim(),
        },
        required: [editValues.merchant_name, editValues.merchant_email],
        success: "Informasi merchant berhasil diperbarui.",
      },
      branch: {
        url: "/api/apps/merchant/merchant-branch",
        body: {
          merchant_branch_id: profile.branch?.merchant_branch_id,
          merchant_branch_name: editValues.merchant_branch_name.trim(),
          address: editValues.address.trim(),
          province_id: Number(editValues.province_id),
          regency_id: Number(editValues.regency_id),
          district_id: Number(editValues.district_id),
          village_id: Number(editValues.village_id),
        },
        required: [
          editValues.merchant_branch_name,
          editValues.address,
          editValues.province_id,
          editValues.regency_id,
          editValues.district_id,
          editValues.village_id,
        ],
        success: "Cabang merchant berhasil diperbarui.",
      },
    }[editSection];

    if (config.required.some(value => !value.trim())) {
      setEditError("Seluruh field wajib diisi.");
      return;
    }

    if (
      editSection !== "branch" &&
      !/^\S+@\S+\.\S+$/.test(
        editSection === "user" ? editValues.email : editValues.merchant_email
      )
    ) {
      setEditError("Format email tidak valid.");
      return;
    }

    setSaving(true);
    setEditError("");
    try {
      const response = await fetch(config.url, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config.body),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Data gagal diperbarui.");
      }

      setEditSection(null);
      setSuccess(config.success);
      if (editSection === "merchant") {
        window.dispatchEvent(new Event("merchant-info-updated"));
      }
      await loadProfile();
    } catch (saveError) {
      setEditError(
        saveError instanceof Error
          ? saveError.message
          : "Data gagal diperbarui."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="d-flex align-items-center justify-content-center py-5">
            <Spinner color="primary" />
            <span className="ms-3 text-muted">Memuat profile...</span>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Profile" pageTitle="Akun" />

        {success && (
          <Alert color="success" toggle={() => setSuccess("")}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert
            color="danger"
            className="d-flex align-items-center justify-content-between"
          >
            <span>{error}</span>
            <Button color="danger" size="sm" outline onClick={loadProfile}>
              Coba lagi
            </Button>
          </Alert>
        )}

        {profile && (
          <>
            <div className="profile-foreground position-relative mx-n4 rounded overflow-hidden">
              <div className="profile-wid-bg">
                <Image
                  src={profileBg}
                  alt="Latar profile"
                  className="profile-wid-img"
                  width={1200}
                  height={300}
                  priority
                />
              </div>
            </div>

            <div className="pt-4 mb-4 pb-lg-4">
              <Row className="g-4 align-items-center">
                <Col xs="auto">
                  <div className="avatar-lg">
                    <Image
                      src={defaultAvatar}
                      alt={profile.user.fullname || "User"}
                      className="img-thumbnail rounded-circle"
                      width={96}
                      height={96}
                    />
                  </div>
                </Col>
                <Col>
                  <div className="p-3 bg-body bg-opacity-75 rounded-3 shadow-sm d-inline-block">
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                      <h3 className="text-body-emphasis mb-0">
                        {profile.user.fullname || profile.user.email}
                      </h3>
                      <Badge color="success">{profile.user.role}</Badge>
                    </div>
                    <p className="text-muted mb-2">{profile.user.email}</p>
                    <div className="d-flex flex-wrap text-secondary gap-3">
                      <span>
                        <i className="ri-store-2-line me-1" />
                        {profile.merchant.merchant_name}
                      </span>
                      {profile.branch && (
                        <span>
                          <i className="ri-map-pin-line me-1" />
                          {profile.branch.regency_name},{" "}
                          {profile.branch.province_name}
                        </span>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>
            </div>

            <Row className="g-3 mb-4">
              <Col sm={6} xl={3}>
                <SummaryCard
                  icon="ri-user-3-line"
                  color="primary"
                  label="ID Pengguna"
                  value={`#${profile.user.user_id}`}
                />
              </Col>
              <Col sm={6} xl={3}>
                <SummaryCard
                  icon="ri-store-2-line"
                  color="success"
                  label="Kode Merchant"
                  value={
                    profile.merchant.code || `#${profile.merchant.merchant_id}`
                  }
                />
              </Col>
              <Col sm={6} xl={3}>
                <SummaryCard
                  icon="ri-map-pin-2-line"
                  color="info"
                  label="Cabang Utama"
                  value={
                    profile.branch?.merchant_branch_name || "Belum tersedia"
                  }
                />
              </Col>
              <Col sm={6} xl={3}>
                <SummaryCard
                  icon={
                    profile.merchant.is_active
                      ? "ri-checkbox-circle-line"
                      : "ri-time-line"
                  }
                  color={profile.merchant.is_active ? "success" : "warning"}
                  label="Status Merchant"
                  value={profile.merchant.is_active ? "Aktif" : "Tidak aktif"}
                />
              </Col>
            </Row>

            <Row>
              <Col xl={4}>
                <Card>
                  <CardHeader className="d-flex align-items-center justify-content-between gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="avatar-xs">
                        <span className="avatar-title bg-primary-subtle text-primary rounded">
                          <i className="ri-user-line" />
                        </span>
                      </div>
                      <h5 className="card-title mb-0">Profile Pengguna</h5>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      color="primary"
                      outline
                      onClick={() => openEditModal("user")}
                    >
                      <i className="ri-edit-line me-1" /> Edit
                    </Button>
                  </CardHeader>
                  <CardBody className="p-0">
                    <ListGroup flush>
                      <InfoRow label="ID User" value={profile.user.user_id} />
                      <InfoRow
                        label="Nama Lengkap"
                        value={profile.user.fullname}
                      />
                      <InfoRow label="Email" value={profile.user.email} />
                      <InfoRow label="Role" value={profile.user.role} />
                    </ListGroup>
                  </CardBody>
                </Card>
              </Col>

              <Col xl={4}>
                <Card>
                  <CardHeader className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <div className="avatar-xs">
                        <span className="avatar-title bg-success-subtle text-success rounded">
                          <i className="ri-store-2-line" />
                        </span>
                      </div>
                      <h5 className="card-title mb-0">Informasi Merchant</h5>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Badge
                        color={
                          profile.merchant.is_active ? "success" : "warning"
                        }
                      >
                        {profile.merchant.is_active ? "Aktif" : "Tidak aktif"}
                      </Badge>
                      <Button
                        type="button"
                        size="sm"
                        color="success"
                        outline
                        onClick={() => openEditModal("merchant")}
                      >
                        <i className="ri-edit-line me-1" /> Edit
                      </Button>
                    </div>
                  </CardHeader>
                  <CardBody className="p-0">
                    <ListGroup flush>
                      <InfoRow
                        label="ID Merchant"
                        value={profile.merchant.merchant_id}
                      />
                      <InfoRow label="Kode" value={profile.merchant.code} />
                      <InfoRow
                        label="Nama Merchant"
                        value={profile.merchant.merchant_name}
                      />
                      <InfoRow
                        label="Email Merchant"
                        value={profile.merchant.merchant_email}
                      />
                      <InfoRow
                        label="Terdaftar"
                        value={formatDate(profile.merchant.created_at)}
                      />
                      <InfoRow
                        label="Terakhir diperbarui"
                        value={formatDate(profile.merchant.updated_at)}
                      />
                    </ListGroup>
                  </CardBody>
                </Card>
              </Col>

              <Col xl={4}>
                <Card>
                  <CardHeader className="d-flex align-items-center justify-content-between gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="avatar-xs">
                        <span className="avatar-title bg-info-subtle text-info rounded">
                          <i className="ri-map-pin-2-line" />
                        </span>
                      </div>
                      <h5 className="card-title mb-0">Cabang Merchant</h5>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      color="info"
                      outline
                      disabled={!profile.branch}
                      onClick={() => openEditModal("branch")}
                    >
                      <i className="ri-edit-line me-1" /> Edit
                    </Button>
                  </CardHeader>
                  <CardBody className={profile.branch ? "p-0" : undefined}>
                    {profile.branch ? (
                      <ListGroup flush>
                        <InfoRow
                          label="ID Cabang"
                          value={profile.branch.merchant_branch_id}
                        />
                        <InfoRow
                          label="Nama Cabang"
                          value={profile.branch.merchant_branch_name}
                        />
                        <InfoRow
                          label="Alamat"
                          value={profile.branch.address}
                        />
                        <InfoRow
                          label="Desa/Kelurahan"
                          value={profile.branch.village_name}
                        />
                        <InfoRow
                          label="Kecamatan"
                          value={profile.branch.district_name}
                        />
                        <InfoRow
                          label="Kabupaten/Kota"
                          value={profile.branch.regency_name}
                        />
                        <InfoRow
                          label="Provinsi"
                          value={profile.branch.province_name}
                        />
                      </ListGroup>
                    ) : (
                      <p className="text-muted mb-0">
                        Data cabang belum tersedia.
                      </p>
                    )}
                  </CardBody>
                </Card>
              </Col>
            </Row>

            <Modal
              isOpen={editSection !== null}
              toggle={closeEditModal}
              centered
            >
              <ModalHeader toggle={closeEditModal}>
                {editSection === "user" && "Edit Profile Pengguna"}
                {editSection === "merchant" && "Edit Informasi Merchant"}
                {editSection === "branch" && "Edit Cabang Merchant"}
              </ModalHeader>
              <Form
                onSubmit={event => {
                  event.preventDefault();
                  void saveEdit();
                }}
              >
                <ModalBody>
                  {editError && <Alert color="danger">{editError}</Alert>}

                  {editSection === "user" && (
                    <>
                      <div className="mb-3">
                        <Label htmlFor="edit-fullname">Nama Lengkap</Label>
                        <Input
                          id="edit-fullname"
                          value={editValues.fullname}
                          invalid={!!editError && !editValues.fullname.trim()}
                          onChange={event =>
                            updateEditValue("fullname", event.target.value)
                          }
                        />
                        <FormFeedback>Nama lengkap wajib diisi.</FormFeedback>
                      </div>
                      <div>
                        <Label htmlFor="edit-email">Email</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={editValues.email}
                          invalid={!!editError && !editValues.email.trim()}
                          onChange={event =>
                            updateEditValue("email", event.target.value)
                          }
                        />
                        <FormFeedback>Email wajib diisi.</FormFeedback>
                      </div>
                    </>
                  )}

                  {editSection === "merchant" && (
                    <>
                      <div className="mb-3">
                        <Label htmlFor="edit-merchant-name">
                          Nama Merchant
                        </Label>
                        <Input
                          id="edit-merchant-name"
                          value={editValues.merchant_name}
                          invalid={
                            !!editError && !editValues.merchant_name.trim()
                          }
                          onChange={event =>
                            updateEditValue("merchant_name", event.target.value)
                          }
                        />
                        <FormFeedback>Nama merchant wajib diisi.</FormFeedback>
                      </div>
                      <div>
                        <Label htmlFor="edit-merchant-email">
                          Email Merchant
                        </Label>
                        <Input
                          id="edit-merchant-email"
                          type="email"
                          value={editValues.merchant_email}
                          invalid={
                            !!editError && !editValues.merchant_email.trim()
                          }
                          onChange={event =>
                            updateEditValue(
                              "merchant_email",
                              event.target.value
                            )
                          }
                        />
                        <FormFeedback>Email merchant wajib diisi.</FormFeedback>
                      </div>
                    </>
                  )}

                  {editSection === "branch" && (
                    <>
                      <div className="mb-3">
                        <Label htmlFor="edit-branch-name">Nama Cabang</Label>
                        <Input
                          id="edit-branch-name"
                          value={editValues.merchant_branch_name}
                          invalid={
                            !!editError &&
                            !editValues.merchant_branch_name.trim()
                          }
                          onChange={event =>
                            updateEditValue(
                              "merchant_branch_name",
                              event.target.value
                            )
                          }
                        />
                        <FormFeedback>Nama cabang wajib diisi.</FormFeedback>
                      </div>
                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label htmlFor="edit-province">Provinsi</Label>
                            <Input
                              id="edit-province"
                              type="select"
                              value={editValues.province_id}
                              disabled={regionLoading}
                              onChange={event =>
                                void selectProvince(event.target.value)
                              }
                            >
                              <option value="">Pilih provinsi</option>
                              {provinces.map(region => (
                                <option key={region.id} value={region.id}>
                                  {region.name}
                                </option>
                              ))}
                            </Input>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label htmlFor="edit-regency">Kabupaten/Kota</Label>
                            <Input
                              id="edit-regency"
                              type="select"
                              value={editValues.regency_id}
                              disabled={
                                regionLoading || !editValues.province_id
                              }
                              onChange={event =>
                                void selectRegency(event.target.value)
                              }
                            >
                              <option value="">Pilih kabupaten/kota</option>
                              {regencies.map(region => (
                                <option key={region.id} value={region.id}>
                                  {region.name}
                                </option>
                              ))}
                            </Input>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label htmlFor="edit-district">Kecamatan</Label>
                            <Input
                              id="edit-district"
                              type="select"
                              value={editValues.district_id}
                              disabled={regionLoading || !editValues.regency_id}
                              onChange={event =>
                                void selectDistrict(event.target.value)
                              }
                            >
                              <option value="">Pilih kecamatan</option>
                              {districts.map(region => (
                                <option key={region.id} value={region.id}>
                                  {region.name}
                                </option>
                              ))}
                            </Input>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label htmlFor="edit-village">Desa/Kelurahan</Label>
                            <Input
                              id="edit-village"
                              type="select"
                              value={editValues.village_id}
                              disabled={
                                regionLoading || !editValues.district_id
                              }
                              onChange={event =>
                                updateEditValue(
                                  "village_id",
                                  event.target.value
                                )
                              }
                            >
                              <option value="">Pilih desa/kelurahan</option>
                              {villages.map(region => (
                                <option key={region.id} value={region.id}>
                                  {region.name}
                                </option>
                              ))}
                            </Input>
                          </div>
                        </Col>
                      </Row>
                      <div>
                        <Label htmlFor="edit-address">Alamat</Label>
                        <Input
                          id="edit-address"
                          type="textarea"
                          rows={4}
                          value={editValues.address}
                          invalid={!!editError && !editValues.address.trim()}
                          onChange={event =>
                            updateEditValue("address", event.target.value)
                          }
                        />
                        <FormFeedback>Alamat wajib diisi.</FormFeedback>
                      </div>
                    </>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button
                    type="button"
                    color="light"
                    disabled={saving}
                    onClick={closeEditModal}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    color="primary"
                    disabled={saving || regionLoading}
                  >
                    {(saving || regionLoading) && (
                      <Spinner size="sm" className="me-2" />
                    )}
                    Simpan Perubahan
                  </Button>
                </ModalFooter>
              </Form>
            </Modal>
          </>
        )}
      </Container>
    </div>
  );
}
