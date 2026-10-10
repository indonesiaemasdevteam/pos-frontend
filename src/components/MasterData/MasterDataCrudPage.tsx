"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import BreadCrumb from "@components/Common/BreadCrumb";
import DeleteModal from "@components/Common/DeleteModal";
import TableContainer from "@components/Common/TableContainer";
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
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
} from "reactstrap";

export type MasterField = {
  key: string;
  label: string;
  type?: "text" | "email" | "number" | "textarea" | "select";
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  format?: "currency" | "number" | "status";
};

type MasterRecord = Record<string, string> & {
  id: string;
  createdAt: string;
};

type Props = {
  entityName: string;
  entityNamePlural: string;
  storageKey: string;
  icon: string;
  fields: MasterField[];
};

const formatValue = (value: string, format?: MasterField["format"]) => {
  if (format === "currency") {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  }

  if (format === "number")
    return new Intl.NumberFormat("id-ID").format(Number(value || 0));

  if (format === "status") {
    const active = value === "active";
    return (
      <Badge color={active ? "success" : "secondary"}>
        {active ? "Aktif" : "Nonaktif"}
      </Badge>
    );
  }

  return value || "-";
};

export default function MasterDataCrudPage({
  entityName,
  entityNamePlural,
  storageKey,
  icon,
  fields,
}: Props) {
  const initialValues = useMemo(
    () =>
      Object.fromEntries(
        fields.map(field => [field.key, field.key === "status" ? "active" : ""])
      ),
    [fields]
  );
  const [records, setRecords] = useState<MasterRecord[]>([]);
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<MasterRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setRecords(JSON.parse(saved));
    } catch {
      localStorage.removeItem(storageKey);
    } finally {
      setLoaded(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (loaded) localStorage.setItem(storageKey, JSON.stringify(records));
  }, [loaded, records, storageKey]);

  const openCreate = () => {
    setEditingId(null);
    setValues(initialValues);
    setSubmitted(false);
    setModalOpen(true);
  };

  const openEdit = (record: MasterRecord) => {
    setEditingId(record.id);
    setValues(
      Object.fromEntries(
        fields.map(field => [field.key, record[field.key] ?? ""])
      )
    );
    setSubmitted(false);
    setModalOpen(true);
  };

  const saveRecord = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (fields.some(field => field.required && !values[field.key]?.trim()))
      return;

    if (editingId) {
      setRecords(current =>
        current.map(record =>
          record.id === editingId ? { ...record, ...values } : record
        )
      );
      setNotice(`${entityName} berhasil diperbarui.`);
    } else {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}`;
      setRecords(current => [
        { ...values, id, createdAt: new Date().toISOString() } as MasterRecord,
        ...current,
      ]);
      setNotice(`${entityName} berhasil ditambahkan.`);
    }

    setModalOpen(false);
  };

  const columns = useMemo(
    () => [
      {
        header: "No.",
        enableSorting: false,
        cell: ({ row }: any) => row.index + 1,
      },
      ...fields.map(field => ({
        header: field.label,
        accessorKey: field.key,
        cell: ({ getValue }: any) =>
          formatValue(String(getValue() ?? ""), field.format),
      })),
      {
        header: "Aksi",
        enableSorting: false,
        cell: ({ row }: any) => (
          <div className="d-flex gap-2">
            <Button
              color="soft-info"
              size="sm"
              title="Edit"
              onClick={() => openEdit(row.original)}
            >
              <i className="ri-pencil-fill" />
            </Button>
            <Button
              color="soft-danger"
              size="sm"
              title="Hapus"
              onClick={() => setDeleting(row.original)}
            >
              <i className="ri-delete-bin-fill" />
            </Button>
          </div>
        ),
      },
    ],
    [fields]
  );

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title={entityNamePlural} pageTitle="Master Data" />

        {notice && (
          <Alert color="success" toggle={() => setNotice("")}>
            {notice}
          </Alert>
        )}

        <Card>
          <CardHeader className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
            <div className="d-flex align-items-center gap-3">
              <div className="avatar-sm">
                <span className="avatar-title bg-primary-subtle text-primary rounded fs-3">
                  <i className={icon} />
                </span>
              </div>
              <div>
                <h5 className="card-title mb-1">Daftar {entityNamePlural}</h5>
                <p className="text-muted mb-0">
                  Kelola data {entityNamePlural.toLowerCase()} merchant Anda.
                </p>
              </div>
            </div>
            <Button color="primary" onClick={openCreate}>
              <i className="ri-add-line align-bottom me-1" /> Tambah{" "}
              {entityName}
            </Button>
          </CardHeader>
          <CardBody>
            <Alert color="info" className="border-0">
              <i className="ri-information-line me-2" />
              Data sementara disimpan di browser. Integrasi API dapat
              ditambahkan saat endpoint tersedia.
            </Alert>
            {records.length ? (
              <TableContainer
                columns={columns}
                data={records}
                isGlobalFilter
                customPageSize={10}
                SearchPlaceholder={`Cari ${entityNamePlural.toLowerCase()}...`}
                divClass="table-responsive table-card mb-1"
                tableClass="align-middle table-nowrap"
                theadClass="table-light text-muted"
              />
            ) : (
              <div className="text-center py-5">
                <div className="avatar-md mx-auto mb-3">
                  <span className="avatar-title bg-light text-muted rounded-circle fs-2">
                    <i className={icon} />
                  </span>
                </div>
                <h5>Belum ada data {entityNamePlural.toLowerCase()}</h5>
                <p className="text-muted mb-3">
                  Tambahkan data pertama untuk mulai menggunakan halaman ini.
                </p>
                <Button color="primary" outline onClick={openCreate}>
                  Tambah {entityName}
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </Container>

      <Modal
        isOpen={modalOpen}
        toggle={() => setModalOpen(false)}
        centered
        size="lg"
      >
        <Form onSubmit={saveRecord} noValidate>
          <ModalHeader toggle={() => setModalOpen(false)}>
            {editingId ? "Edit" : "Tambah"} {entityName}
          </ModalHeader>
          <ModalBody>
            <Row className="g-3">
              {fields.map(field => (
                <Col md={field.type === "textarea" ? 12 : 6} key={field.key}>
                  <Label
                    htmlFor={`${storageKey}-${field.key}`}
                    className="form-label"
                  >
                    {field.label}
                    {field.required && <span className="text-danger"> *</span>}
                  </Label>
                  <Input
                    id={`${storageKey}-${field.key}`}
                    type={
                      field.type === "select" ? "select" : field.type || "text"
                    }
                    value={values[field.key] ?? ""}
                    placeholder={field.placeholder}
                    rows={field.type === "textarea" ? 3 : undefined}
                    invalid={
                      submitted &&
                      Boolean(field.required && !values[field.key]?.trim())
                    }
                    onChange={event =>
                      setValues(current => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                  >
                    {field.type === "select" && (
                      <option value="">Pilih {field.label}</option>
                    )}
                    {field.options?.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Input>
                  <FormFeedback>{field.label} wajib diisi.</FormFeedback>
                </Col>
              ))}
            </Row>
          </ModalBody>
          <ModalFooter>
            <Button
              color="light"
              type="button"
              onClick={() => setModalOpen(false)}
            >
              Batal
            </Button>
            <Button color="primary" type="submit">
              <i className="ri-save-line me-1" /> Simpan
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      <DeleteModal
        show={Boolean(deleting)}
        recordId={
          deleting
            ? fields.map(field => deleting[field.key]).find(Boolean)
            : undefined
        }
        onCloseClick={() => setDeleting(null)}
        onDeleteClick={() => {
          if (!deleting) return;
          setRecords(current =>
            current.filter(record => record.id !== deleting.id)
          );
          setNotice(`${entityName} berhasil dihapus.`);
          setDeleting(null);
        }}
      />
    </div>
  );
}
