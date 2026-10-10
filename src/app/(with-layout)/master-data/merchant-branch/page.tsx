"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import BreadCrumb from "@components/Common/BreadCrumb";
import TableContainer from "@components/Common/TableContainer";
import AddMerchantBranchModal from "@components/MasterData/AddMerchantBranchModal";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Modal,
  ModalBody,
  ModalHeader,
  Row,
  Spinner,
} from "reactstrap";

type MerchantInfo = { merchant_id: string | number; merchant_name?: string };
type MerchantBranch = {
  merchant_branch_id: string;
  merchant_branch_name: string;
  address: string;
  merchant_id: string;
  user_id: string;
  province_name: string;
  regency_name: string;
  district_name: string;
  village_name: string;
  province_id: string;
  regency_id: string;
  district_id: string;
  village_id: string;
  created_at: string;
  updated_at: string | null;
  fullname: string;
  photo: string | null;
  phone: string;
  email: string;
};

const initials = (name?: string) =>
  (name || "U")
    .split(" ")
    .slice(0, 2)
    .map(part => part.charAt(0))
    .join("")
    .toUpperCase();

const ProfileAvatar = ({ branch }: { branch: MerchantBranch }) => (
  <div className="avatar-sm flex-shrink-0">
    {branch.photo ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={branch.photo}
        alt={branch.fullname || "Profile"}
        className="img-fluid rounded-circle h-100 w-100 object-fit-cover"
      />
    ) : (
      <span className="avatar-title rounded-circle bg-primary-subtle text-primary fw-semibold">
        {initials(branch.fullname)}
      </span>
    )}
  </div>
);

const parseMessage = (payload: unknown, fallback: string) =>
  payload && typeof payload === "object" && "error" in payload
    ? String((payload as { error: unknown }).error)
    : fallback;

export default function MerchantBranchPage() {
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null);
  const [branches, setBranches] = useState<MerchantBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<MerchantBranch | null>(
    null
  );
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBranches = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const merchantResponse = await fetch("/api/apps/auth/merchant-info", {
        credentials: "include",
        cache: "no-store",
      });
      const merchantPayload = await merchantResponse.json();
      if (!merchantResponse.ok)
        throw new Error(
          parseMessage(merchantPayload, "Gagal mengambil informasi merchant.")
        );

      const merchantData = (merchantPayload.response ??
        merchantPayload) as MerchantInfo;
      if (!merchantData?.merchant_id)
        throw new Error("Merchant ID tidak ditemukan pada akun yang login.");
      setMerchant(merchantData);

      const branchResponse = await fetch(
        `/api/apps/user-merchantbranch/${encodeURIComponent(String(merchantData.merchant_id))}`,
        { credentials: "include", cache: "no-store" }
      );
      const branchPayload = await branchResponse.json();
      if (!branchResponse.ok)
        throw new Error(
          parseMessage(branchPayload, "Gagal mengambil data merchant branch.")
        );

      const branchData = Array.isArray(branchPayload)
        ? branchPayload
        : Array.isArray(branchPayload.data)
          ? branchPayload.data
          : Array.isArray(branchPayload.response)
            ? branchPayload.response
            : [];
      setBranches(branchData);
    } catch (requestError) {
      setBranches([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Terjadi kesalahan saat memuat merchant branch."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const columns = useMemo(
    () => [
      {
        header: "Pengguna",
        accessorKey: "fullname",
        cell: ({ row }: any) => {
          const branch = row.original as MerchantBranch;
          return (
            <div className="d-flex align-items-center gap-3">
              <ProfileAvatar branch={branch} />
              <div>
                <h6 className="mb-1">{branch.fullname || "Belum diatur"}</h6>
                <span className="text-muted">{branch.email || "-"}</span>
              </div>
            </div>
          );
        },
      },
      {
        header: "Merchant Branch",
        accessorKey: "merchant_branch_name",
        cell: ({ row }: any) => (
          <div>
            <h6 className="mb-1">{row.original.merchant_branch_name}</h6>
            <span className="badge bg-success-subtle text-success">
              ID #{row.original.merchant_branch_id}
            </span>
          </div>
        ),
      },
      {
        header: "Kontak",
        accessorKey: "phone",
        cell: ({ row }: any) => (
          <div>
            <div>
              <i className="ri-phone-line text-muted me-2" />
              {row.original.phone || "-"}
            </div>
            <div className="text-muted mt-1">
              <i className="ri-mail-line me-2" />
              {row.original.email || "-"}
            </div>
          </div>
        ),
      },
      {
        header: "Lokasi",
        accessorKey: "address",
        cell: ({ row }: any) => (
          <div style={{ minWidth: 230 }}>
            <div className="text-wrap">{row.original.address || "-"}</div>
            <small className="text-muted">
              {[
                row.original.village_name,
                row.original.district_name,
                row.original.regency_name,
                row.original.province_name,
              ]
                .filter(Boolean)
                .join(", ") || "Wilayah belum diatur"}
            </small>
          </div>
        ),
      },
      {
        header: "Aksi",
        enableSorting: false,
        cell: ({ row }: any) => (
          <Button
            color="soft-primary"
            size="sm"
            onClick={() => setSelectedBranch(row.original)}
          >
            <i className="ri-eye-line me-1" /> Detail
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Merchant Branch" pageTitle="Master Data" />
        <Row className="mb-3">
          <Col xl={4} md={6}>
            <Card className="card-animate">
              <CardBody>
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <p className="text-uppercase fw-medium text-muted mb-0">
                      Total Cabang
                    </p>
                    <h4 className="fs-22 fw-semibold mt-2 mb-0">
                      {branches.length}
                    </h4>
                  </div>
                  <div className="avatar-sm">
                    <span className="avatar-title bg-primary-subtle text-primary rounded fs-3">
                      <i className="ri-store-2-line" />
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col xl={4} md={6}>
            <Card className="card-animate">
              <CardBody>
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <p className="text-uppercase fw-medium text-muted mb-0">
                      Merchant
                    </p>
                    <h5 className="fs-16 fw-semibold mt-2 mb-0">
                      {merchant?.merchant_name || "-"}
                    </h5>
                  </div>
                  <div className="avatar-sm">
                    <span className="avatar-title bg-success-subtle text-success rounded fs-3">
                      <i className="ri-building-line" />
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Card>
          <CardHeader className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
            <div>
              <h5 className="card-title mb-1">Daftar Merchant Branch</h5>
              <p className="text-muted mb-0">
                Cabang dan pengguna yang terhubung dengan merchant Anda.
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button color="light" onClick={loadBranches} disabled={loading}>
                <i className="ri-refresh-line me-1" /> Muat Ulang
              </Button>
              <Button color="primary" onClick={() => setAddModalOpen(true)}>
                <i className="ri-add-line me-1" /> Tambah Cabang
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {error && (
              <Alert color="danger">
                <i className="ri-error-warning-line me-2" />
                {error}
              </Alert>
            )}
            {loading ? (
              <div className="text-center py-5">
                <Spinner color="primary" />
                <p className="text-muted mt-3 mb-0">
                  Memuat merchant branch...
                </p>
              </div>
            ) : branches.length ? (
              <TableContainer
                columns={columns}
                data={branches}
                isGlobalFilter
                customPageSize={10}
                SearchPlaceholder="Cari cabang, pengguna, atau lokasi..."
                divClass="table-responsive table-card mb-1"
                tableClass="align-middle table-nowrap"
                theadClass="table-light text-muted"
              />
            ) : !error ? (
              <div className="text-center py-5">
                <div className="avatar-md mx-auto mb-3">
                  <span className="avatar-title bg-light text-muted rounded-circle fs-2">
                    <i className="ri-store-2-line" />
                  </span>
                </div>
                <h5>Belum ada merchant branch</h5>
                <p className="text-muted mb-0">
                  Data cabang untuk merchant ini belum tersedia.
                </p>
              </div>
            ) : null}
          </CardBody>
        </Card>
      </Container>

      <Modal
        isOpen={Boolean(selectedBranch)}
        toggle={() => setSelectedBranch(null)}
        centered
        size="lg"
      >
        <ModalHeader toggle={() => setSelectedBranch(null)}>
          Detail Merchant Branch
        </ModalHeader>
        {selectedBranch && (
          <ModalBody>
            <div className="d-flex align-items-center gap-3 pb-3 mb-3 border-bottom">
              <ProfileAvatar branch={selectedBranch} />
              <div>
                <h5 className="mb-1">
                  {selectedBranch.fullname || "Belum diatur"}
                </h5>
                <p className="text-muted mb-0">{selectedBranch.email || "-"}</p>
              </div>
            </div>
            <Row className="g-3">
              <Col md={6}>
                <small className="text-muted d-block">Nama Cabang</small>
                <span className="fw-medium">
                  {selectedBranch.merchant_branch_name}
                </span>
              </Col>
              <Col md={6}>
                <small className="text-muted d-block">Nomor Telepon</small>
                <span className="fw-medium">{selectedBranch.phone || "-"}</span>
              </Col>
              <Col xs={12}>
                <small className="text-muted d-block">Alamat</small>
                <span className="fw-medium">
                  {selectedBranch.address || "-"}
                </span>
              </Col>
              <Col xs={12}>
                <small className="text-muted d-block">Wilayah</small>
                <span className="fw-medium">
                  {[
                    selectedBranch.village_name,
                    selectedBranch.district_name,
                    selectedBranch.regency_name,
                    selectedBranch.province_name,
                  ]
                    .filter(Boolean)
                    .join(", ") || "-"}
                </span>
              </Col>
            </Row>
          </ModalBody>
        )}
      </Modal>

      <AddMerchantBranchModal
        isOpen={addModalOpen}
        toggle={() => setAddModalOpen(current => !current)}
        onCreated={() => {
          setSuccessModalOpen(true);
          loadBranches();
        }}
      />

      <Modal
        isOpen={successModalOpen}
        toggle={() => setSuccessModalOpen(false)}
        centered
      >
        <ModalBody className="text-center py-5 px-4">
          <div className="avatar-lg mx-auto mb-4">
            <span className="avatar-title bg-success-subtle text-success rounded-circle display-5">
              <i className="ri-checkbox-circle-line" />
            </span>
          </div>
          <h4 className="mb-2">Cabang Berhasil Dibuat</h4>
          <p className="text-muted mb-4">
            Cabang baru beserta akun adminnya telah berhasil ditambahkan.
          </p>
          <Button color="success" onClick={() => setSuccessModalOpen(false)}>
            Selesai
          </Button>
        </ModalBody>
      </Modal>
    </div>
  );
}
