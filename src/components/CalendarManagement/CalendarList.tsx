"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Col,
  Form,
  FormFeedback,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Spinner,
} from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";

// ─── Config ───────────────────────────────────────────────────────────────────
const COLOR_OPTIONS = [
  { value: "#405189", label: "Blue" },
  { value: "#0ab39c", label: "Green" },
  { value: "#f06548", label: "Coral" },
  { value: "#f7b84b", label: "Amber" },
  { value: "#6f42c1", label: "Violet" },
  { value: "#e83e8c", label: "Rose" },
  { value: "#878a99", label: "Slate" },
];

const TYPE_OPTIONS = [
  {
    value: "main",
    label: "Main Calendar",
    icon: "ri-calendar-2-line",
    color: "primary",
    desc: "Kalender utama pantai",
  },
  {
    value: "event",
    label: "Event & Acara",
    icon: "ri-calendar-event-line",
    color: "success",
    desc: "Event & acara khusus (public)",
  },
  {
    value: "activity",
    label: "Aktivitas Wisata",
    icon: "ri-run-line",
    color: "info",
    desc: "Aktivitas & paket wisata (public)",
  },
  {
    value: "promo",
    label: "Promosi & Paket",
    icon: "ri-price-tag-3-line",
    color: "warning",
    desc: "Promosi & penawaran (public)",
  },
  {
    value: "schedule",
    label: "Jadwal Staff",
    icon: "ri-team-line",
    color: "secondary",
    desc: "Jadwal operasional staff (private)",
  },
  {
    value: "internal",
    label: "Internal",
    icon: "ri-lock-line",
    color: "danger",
    desc: "Meeting & kegiatan internal (private)",
  },
];

const getTypeBadge = (type: string) => {
  const t = TYPE_OPTIONS.find(o => o.value === type);
  return t ? (
    <Badge
      color={t.color}
      className="px-2 py-1 text-capitalize"
      style={{ fontSize: 11, borderRadius: 6 }}
    >
      <i className={`${t.icon} me-1`} />
      {t.label}
    </Badge>
  ) : (
    <Badge color="secondary">{type}</Badge>
  );
};

interface CalendarData {
  id: string;
  title: string;
  slug: string;
  color: string;
  type: string;
  isPublic: boolean;
  isActive: boolean;
  description?: string;
  _count?: { events: number; members: number };
}

// ─── Component ────────────────────────────────────────────────────────────────
const CalendarList = () => {
  const [calendars, setCalendars] = useState<CalendarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [delModal, setDelModal] = useState(false);
  const [selected, setSelected] = useState<CalendarData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCalendars = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/apps/calendar/panel?all=true");
      const json = await res.json();
      setCalendars(json.data || []);
    } catch {
      toast.error("Failed to load calendars");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendars();
  }, []);

  const openCreate = () => {
    setSelected(null);
    formik.resetForm();
    setModal(true);
  };
  const openEdit = (cal: CalendarData) => {
    setSelected(cal);
    setModal(true);
  };
  const closeModal = () => {
    setModal(false);
    setSelected(null);
    formik.resetForm();
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: selected?.title || "",
      slug: selected?.slug || "",
      description: selected?.description || "",
      color: selected?.color || COLOR_OPTIONS[0].value,
      type: selected?.type || "main",
      isPublic: selected?.isPublic ?? false,
      isActive: selected?.isActive ?? true,
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Title is required"),
      slug: Yup.string()
        .required("Slug is required")
        .matches(/^[a-z0-9-]+$/, "Lowercase letters, numbers and dashes only"),
    }),
    onSubmit: async values => {
      setSubmitting(true);
      try {
        const isEdit = !!selected;
        const url = isEdit
          ? `/api/apps/calendar/panel/${selected!.id}`
          : "/api/apps/calendar/panel";
        const method = isEdit ? "PATCH" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed");
        }

        toast.success(isEdit ? "Calendar updated!" : "Calendar created!");
        closeModal();
        fetchCalendars();
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleDelete = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/apps/calendar/panel/${selected.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Deleted from Calendar Management" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Calendar deleted");
      setDelModal(false);
      setSelected(null);
      fetchCalendars();
    } catch {
      toast.error("Failed to delete");
    }
  };

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    formik.setFieldValue("title", title);
    if (!selected) {
      formik.setFieldValue(
        "slug",
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      );
    }
  };

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>
            {calendars.length} calendar{calendars.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <Button
          color="primary"
          size="sm"
          className="d-flex align-items-center gap-1"
          onClick={openCreate}
        >
          <i className="ri-add-line" />
          Add Calendar
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner color="primary" />
        </div>
      ) : (
        <Row className="g-3">
          {calendars.map(cal => {
            const typeInfo =
              TYPE_OPTIONS.find(t => t.value === cal.type) || TYPE_OPTIONS[0];
            return (
              <Col key={cal.id} md={6} xl={4}>
                <Card
                  className="border-0 h-100"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}
                >
                  {/* Color bar */}
                  <div
                    style={{
                      height: 5,
                      background: cal.color,
                      borderRadius: "8px 8px 0 0",
                    }}
                  />
                  <CardBody className="p-3">
                    <div className="d-flex align-items-start justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                          style={{
                            width: 36,
                            height: 36,
                            background: `${cal.color}18`,
                          }}
                        >
                          <i
                            className={typeInfo.icon}
                            style={{ color: cal.color, fontSize: 16 }}
                          />
                        </div>
                        <div>
                          <div className="fw-bold" style={{ fontSize: 14 }}>
                            {cal.title}
                          </div>
                          <div className="text-muted" style={{ fontSize: 11 }}>
                            /{cal.slug}
                          </div>
                        </div>
                      </div>
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-soft-primary btn-sm p-1"
                          onClick={() => openEdit(cal)}
                          title="Edit"
                        >
                          <i
                            className="ri-pencil-line"
                            style={{ fontSize: 14 }}
                          />
                        </button>
                        <button
                          className="btn btn-soft-danger btn-sm p-1"
                          onClick={() => {
                            setSelected(cal);
                            setDelModal(true);
                          }}
                          title="Delete"
                        >
                          <i
                            className="ri-delete-bin-line"
                            style={{ fontSize: 14 }}
                          />
                        </button>
                      </div>
                    </div>

                    {cal.description && (
                      <p className="text-muted mb-2" style={{ fontSize: 12 }}>
                        {cal.description}
                      </p>
                    )}

                    <div className="d-flex flex-wrap gap-1 mt-2">
                      {getTypeBadge(cal.type)}
                      <Badge
                        color={cal.isPublic ? "success" : "secondary"}
                        className="px-2 py-1"
                        style={{ fontSize: 11, borderRadius: 6 }}
                      >
                        <i
                          className={`${cal.isPublic ? "ri-earth-line" : "ri-lock-line"} me-1`}
                        />
                        {cal.isPublic ? "Public" : "Private"}
                      </Badge>
                      <Badge
                        color={cal.isActive ? "success" : "danger"}
                        className="px-2 py-1"
                        style={{ fontSize: 11, borderRadius: 6 }}
                      >
                        {cal.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div
                      className="d-flex gap-3 mt-3 pt-2"
                      style={{ borderTop: "1px solid #f0f0f0" }}
                    >
                      <span className="text-muted" style={{ fontSize: 12 }}>
                        <i className="ri-calendar-event-line me-1" />
                        {cal._count?.events || 0} events
                      </span>
                      <span className="text-muted" style={{ fontSize: 12 }}>
                        <i className="ri-team-line me-1" />
                        {cal._count?.members || 0} members
                      </span>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            );
          })}

          {calendars.length === 0 && !loading && (
            <Col xs={12}>
              <div className="text-center text-muted py-5">
                <i
                  className="ri-calendar-2-line d-block mb-2"
                  style={{ fontSize: 40, opacity: 0.25 }}
                />
                <p>No calendars yet. Create one to get started.</p>
              </div>
            </Col>
          )}
        </Row>
      )}

      {/* ── Create/Edit Modal ── */}
      <Modal
        isOpen={modal}
        toggle={submitting ? undefined : closeModal}
        centered
        size="lg"
      >
        <ModalHeader toggle={closeModal}>
          {selected ? "Edit Calendar" : "Create Calendar"}
        </ModalHeader>
        <ModalBody>
          <Form onSubmit={formik.handleSubmit}>
            <Row className="g-3">
              <Col md={8}>
                <FormGroup className="mb-0">
                  <Label className="fw-semibold fs-13">
                    Calendar Name <span className="text-danger">*</span>
                  </Label>
                  <Input
                    name="title"
                    placeholder="e.g. Main Calendar, Event 2026..."
                    value={formik.values.title}
                    onChange={handleTitleChange}
                    onBlur={formik.handleBlur}
                    invalid={formik.touched.title && !!formik.errors.title}
                  />
                  <FormFeedback>{formik.errors.title}</FormFeedback>
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup className="mb-0">
                  <Label className="fw-semibold fs-13">
                    Slug <span className="text-danger">*</span>
                  </Label>
                  <Input
                    name="slug"
                    placeholder="main-calendar"
                    value={formik.values.slug}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={formik.touched.slug && !!formik.errors.slug}
                  />
                  <FormFeedback>{formik.errors.slug}</FormFeedback>
                </FormGroup>
              </Col>

              <Col xs={12}>
                <Label className="fw-semibold fs-13 d-block mb-2">
                  Type <span className="text-danger">*</span>
                </Label>
                <Row className="g-2">
                  {TYPE_OPTIONS.map(opt => (
                    <Col key={opt.value} sm={6} md={4}>
                      <button
                        type="button"
                        className={`btn w-100 text-start p-2 ${formik.values.type === opt.value ? `btn-${opt.color}` : "btn-outline-secondary"}`}
                        style={{ borderRadius: 8, fontSize: 12 }}
                        onClick={() => {
                          formik.setFieldValue("type", opt.value);
                          // Auto-set public berdasarkan type
                          formik.setFieldValue(
                            "isPublic",
                            ["event", "activity", "promo"].includes(opt.value)
                          );
                        }}
                      >
                        <i className={`${opt.icon} me-1`} />
                        <span className="fw-semibold d-block">{opt.label}</span>
                        <span style={{ fontSize: 10, opacity: 0.8 }}>
                          {opt.desc}
                        </span>
                      </button>
                    </Col>
                  ))}
                </Row>
              </Col>

              <Col md={6}>
                <Label className="fw-semibold fs-13 d-block mb-2">Color</Label>
                <div className="d-flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      title={opt.label}
                      onClick={() => formik.setFieldValue("color", opt.value)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: opt.value,
                        border: "3px solid transparent",
                        padding: 0,
                        cursor: "pointer",
                        boxShadow:
                          formik.values.color === opt.value
                            ? `0 0 0 3px ${opt.value}`
                            : "none",
                      }}
                    />
                  ))}
                </div>
              </Col>

              <Col md={6}>
                <Label className="fw-semibold fs-13 d-block mb-2">
                  Visibility & Status
                </Label>
                <div className="d-flex flex-column gap-2">
                  <div className="form-check form-switch">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      role="switch"
                      id="cal-isPublic"
                      checked={formik.values.isPublic}
                      onChange={e =>
                        formik.setFieldValue("isPublic", e.target.checked)
                      }
                    />
                    <label
                      className="form-check-label fs-13"
                      htmlFor="cal-isPublic"
                    >
                      <i className="ri-earth-line me-1 text-success" />
                      Public (visible di landing page)
                    </label>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      role="switch"
                      id="cal-isActive"
                      checked={formik.values.isActive}
                      onChange={e =>
                        formik.setFieldValue("isActive", e.target.checked)
                      }
                    />
                    <label
                      className="form-check-label fs-13"
                      htmlFor="cal-isActive"
                    >
                      <i className="ri-toggle-line me-1 text-primary" />
                      Active
                    </label>
                  </div>
                </div>
              </Col>

              <Col xs={12}>
                <FormGroup className="mb-0">
                  <Label className="fw-semibold fs-13">Description</Label>
                  <Input
                    type="textarea"
                    name="description"
                    rows={2}
                    placeholder="Optional description..."
                    value={formik.values.description}
                    onChange={formik.handleChange}
                  />
                </FormGroup>
              </Col>
            </Row>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button
            color="secondary"
            outline
            onClick={closeModal}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            disabled={submitting}
            onClick={() => formik.handleSubmit()}
          >
            {submitting ? (
              <>
                <Spinner size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              <>
                <i className="ri-check-line me-1" />
                {selected ? "Save Changes" : "Create Calendar"}
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal
        isOpen={delModal}
        toggle={() => setDelModal(false)}
        centered
        size="sm"
      >
        <ModalBody className="text-center p-4">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle bg-danger-subtle mx-auto mb-3"
            style={{ width: 64, height: 64 }}
          >
            <i
              className="ri-delete-bin-2-line text-danger"
              style={{ fontSize: 28 }}
            />
          </div>
          <h5 className="fw-bold">Delete Calendar?</h5>
          <p className="text-muted" style={{ fontSize: 13 }}>
            <strong>{selected?.title}</strong> akan dihapus. Events di dalamnya
            tidak akan hilang tapi calendar ini tidak akan aktif.
          </p>
          <div className="d-flex gap-2 justify-content-center mt-3">
            <Button
              color="secondary"
              outline
              size="sm"
              onClick={() => setDelModal(false)}
            >
              Cancel
            </Button>
            <Button color="danger" size="sm" onClick={handleDelete}>
              Yes, Delete
            </Button>
          </div>
        </ModalBody>
      </Modal>
    </>
  );
};

export default CalendarList;
