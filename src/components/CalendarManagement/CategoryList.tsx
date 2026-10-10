"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
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

// ─── Preset kategori Pantai Kelapa Tuban ─────────────────────────────────────
const PRESET_CATEGORIES = [
  // Aktivitas Wisata
  {
    name: "Berkuda",
    slug: "berkuda",
    color: "#f7b84b",
    icon: "ri-riding-fill",
    group: "Aktivitas",
  },
  {
    name: "Perahu",
    slug: "perahu",
    color: "#405189",
    icon: "ri-ship-line",
    group: "Aktivitas",
  },
  {
    name: "ATV Bike",
    slug: "atv-bike",
    color: "#f06548",
    icon: "ri-bike-line",
    group: "Aktivitas",
  },
  {
    name: "Flying Fox",
    slug: "flying-fox",
    color: "#0ab39c",
    icon: "ri-run-line",
    group: "Aktivitas",
  },
  {
    name: "Kolam Renang",
    slug: "kolam-renang",
    color: "#405189",
    icon: "ri-water-flash-line",
    group: "Aktivitas",
  },
  {
    name: "Spot Foto",
    slug: "spot-foto",
    color: "#e83e8c",
    icon: "ri-camera-line",
    group: "Aktivitas",
  },
  {
    name: "Camping",
    slug: "camping",
    color: "#6f42c1",
    icon: "ri-camping-tent-line",
    group: "Aktivitas",
  },
  // Event
  {
    name: "Event Khusus",
    slug: "event-khusus",
    color: "#f06548",
    icon: "ri-calendar-event-line",
    group: "Event",
  },
  {
    name: "BBQ Night",
    slug: "bbq-night",
    color: "#f7b84b",
    icon: "ri-fire-line",
    group: "Event",
  },
  {
    name: "Sunset Tour",
    slug: "sunset-tour",
    color: "#e83e8c",
    icon: "ri-sun-line",
    group: "Event",
  },
  // Internal
  {
    name: "Rapat",
    slug: "rapat",
    color: "#878a99",
    icon: "ri-team-line",
    group: "Internal",
  },
  {
    name: "Maintenance",
    slug: "maintenance",
    color: "#f06548",
    icon: "ri-tools-line",
    group: "Internal",
  },
  {
    name: "Promosi",
    slug: "promosi",
    color: "#0ab39c",
    icon: "ri-price-tag-3-line",
    group: "Promosi",
  },
];

const ICON_OPTIONS = [
  "ri-calendar-event-line",
  "ri-riding-fill",
  "ri-ship-line",
  "ri-bike-line",
  "ri-run-line",
  "ri-water-flash-line",
  "ri-camera-line",
  "ri-camping-tent-line",
  "ri-fire-line",
  "ri-sun-line",
  "ri-team-line",
  "ri-tools-line",
  "ri-price-tag-3-line",
  "ri-star-line",
  "ri-music-line",
  "ri-restaurant-line",
  "ri-shopping-bag-line",
  "ri-car-line",
  "ri-fish-line",
  "ri-leaf-line",
];

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  calendarId?: string;
  calendar?: { id: string; title: string; color: string };
  _count?: { events: number };
}

interface CalendarOption {
  id: string;
  title: string;
  color: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
const CategoryList = () => {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [delModal, setDelModal] = useState(false);
  const [selected, setSelected] = useState<CategoryData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [filterCalId, setFilterCalId] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, calRes] = await Promise.all([
        fetch("/api/apps/calendar/panel/categories"),
        fetch("/api/apps/calendar/panel?all=true"),
      ]);
      const catJson = await catRes.json();
      const calJson = await calRes.json();
      setCategories(catJson || []);
      setCalendars(calJson.data || []);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setSelected(null);
    formik.resetForm();
    setModal(true);
  };
  const openEdit = (cat: CategoryData) => {
    setSelected(cat);
    setModal(true);
  };
  const closeModal = () => {
    setModal(false);
    setSelected(null);
    formik.resetForm();
  };

  // ── Check duplicate slug ──────────────────────────────────────────────────
  const isDuplicate = (
    slug: string,
    calId: string | undefined,
    excludeId?: string
  ) => {
    return categories.some(
      c =>
        c.slug === slug &&
        (c.calendarId || "") === (calId || "") &&
        c.id !== excludeId
    );
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: selected?.name || "",
      slug: selected?.slug || "",
      description: selected?.description || "",
      color: selected?.color || COLOR_OPTIONS[0].value,
      icon: selected?.icon || ICON_OPTIONS[0],
      calendarId: selected?.calendarId || "",
      isActive: selected?.isActive ?? true,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Name is required"),
      slug: Yup.string()
        .required("Slug is required")
        .matches(/^[a-z0-9-]+$/, "Lowercase, numbers and dashes only"),
    }),
    onSubmit: async values => {
      // Check duplicate
      if (
        isDuplicate(values.slug, values.calendarId || undefined, selected?.id)
      ) {
        formik.setFieldError("slug", "Slug already exists for this calendar");
        return;
      }

      setSubmitting(true);
      try {
        const isEdit = !!selected;
        const url = isEdit
          ? `/api/apps/calendar/panel/categories/${selected!.id}`
          : "/api/apps/calendar/panel/categories";
        const method = isEdit ? "PATCH" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...values,
            calendarId: values.calendarId || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed");
        }

        toast.success(isEdit ? "Category updated!" : "Category created!");
        closeModal();
        fetchData();
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
      const res = await fetch(
        `/api/apps/calendar/panel/categories/${selected.id}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Category deleted");
      setDelModal(false);
      setSelected(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ── Seed preset categories ────────────────────────────────────────────────
  const handleSeedPresets = async () => {
    setSeeding(true);
    let created = 0;
    let skipped = 0;

    for (const preset of PRESET_CATEGORIES) {
      if (isDuplicate(preset.slug, undefined)) {
        skipped++;
        continue;
      }
      try {
        await fetch("/api/apps/calendar/panel/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...preset, calendarId: null }),
        });
        created++;
      } catch {
        skipped++;
      }
    }

    toast.success(
      `${created} categories created, ${skipped} skipped (already exist)`
    );
    setSeeding(false);
    fetchData();
  };

  // Auto-generate slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    formik.setFieldValue("name", name);
    if (!selected) {
      formik.setFieldValue(
        "slug",
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      );
    }
  };

  const filtered = filterCalId
    ? categories.filter(c => (c.calendarId || "") === filterCalId)
    : categories;

  const grouped = filtered.reduce(
    (acc, cat) => {
      const calTitle = cat.calendar?.title || "Global";
      if (!acc[calTitle]) acc[calTitle] = [];
      acc[calTitle].push(cat);
      return acc;
    },
    {} as Record<string, CategoryData[]>
  );

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>
            {categories.length} categor{categories.length !== 1 ? "ies" : "y"}{" "}
            found
          </p>
          {/* Filter by calendar */}
          <Input
            type="select"
            value={filterCalId}
            onChange={e => setFilterCalId(e.target.value)}
            style={{ width: 180, fontSize: 12, height: 32 }}
          >
            <option value="">All Calendars</option>
            <option value="global">Global (no calendar)</option>
            {calendars.map(cal => (
              <option key={cal.id} value={cal.id}>
                {cal.title}
              </option>
            ))}
          </Input>
        </div>
        <div className="d-flex gap-2">
          <Button
            color="secondary"
            outline
            size="sm"
            disabled={seeding}
            onClick={handleSeedPresets}
            className="d-flex align-items-center gap-1"
          >
            {seeding ? <Spinner size="sm" /> : <i className="ri-magic-line" />}
            Seed Pantai Kelapa Presets
          </Button>
          <Button
            color="primary"
            size="sm"
            className="d-flex align-items-center gap-1"
            onClick={openCreate}
          >
            <i className="ri-add-line" />
            Add Category
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner color="primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted py-5">
          <i
            className="ri-price-tag-3-line d-block mb-2"
            style={{ fontSize: 40, opacity: 0.25 }}
          />
          <p>No categories yet.</p>
          <Button
            color="primary"
            size="sm"
            outline
            onClick={handleSeedPresets}
            disabled={seeding}
          >
            <i className="ri-magic-line me-1" />
            Seed Pantai Kelapa Presets
          </Button>
        </div>
      ) : (
        Object.entries(grouped).map(([groupName, cats]) => (
          <div key={groupName} className="mb-4">
            <div
              className="text-muted text-uppercase fw-bold mb-2"
              style={{ fontSize: 11, letterSpacing: "0.8px" }}
            >
              <i className="ri-folder-line me-1" />
              {groupName}
              <span
                className="badge bg-light text-muted ms-2"
                style={{ fontSize: 10 }}
              >
                {cats.length}
              </span>
            </div>
            <Row className="g-2">
              {cats.map(cat => (
                <Col key={cat.id} sm={6} md={4} xl={3}>
                  <div
                    className={`p-3 rounded-3 border h-100 ${!cat.isActive ? "opacity-50" : ""}`}
                    style={{
                      borderColor: `${cat.color}33 !important`,
                      background: `${cat.color}08`,
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="d-flex align-items-center justify-content-center rounded-circle"
                          style={{
                            width: 32,
                            height: 32,
                            background: `${cat.color}20`,
                            flexShrink: 0,
                          }}
                        >
                          <i
                            className={cat.icon || "ri-tag-line"}
                            style={{ color: cat.color, fontSize: 15 }}
                          />
                        </div>
                        <div>
                          <div className="fw-semibold" style={{ fontSize: 13 }}>
                            {cat.name}
                          </div>
                          <div className="text-muted" style={{ fontSize: 10 }}>
                            /{cat.slug}
                          </div>
                        </div>
                      </div>
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-soft-primary btn-sm p-1"
                          onClick={() => openEdit(cat)}
                        >
                          <i
                            className="ri-pencil-line"
                            style={{ fontSize: 12 }}
                          />
                        </button>
                        <button
                          className="btn btn-soft-danger btn-sm p-1"
                          onClick={() => {
                            setSelected(cat);
                            setDelModal(true);
                          }}
                        >
                          <i
                            className="ri-delete-bin-line"
                            style={{ fontSize: 12 }}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-muted" style={{ fontSize: 11 }}>
                        <i className="ri-calendar-event-line me-1" />
                        {cat._count?.events || 0} events
                      </span>
                      {!cat.isActive && (
                        <Badge color="secondary" style={{ fontSize: 10 }}>
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        ))
      )}

      {/* ── Create/Edit Modal ── */}
      <Modal
        isOpen={modal}
        toggle={submitting ? undefined : closeModal}
        centered
        size="lg"
      >
        <ModalHeader toggle={closeModal}>
          {selected ? `Edit Category: ${selected.name}` : "Add Category"}
        </ModalHeader>
        <ModalBody>
          <Form onSubmit={formik.handleSubmit}>
            <Row className="g-3">
              <Col md={6}>
                <FormGroup className="mb-0">
                  <Label className="fw-semibold fs-13">
                    Name <span className="text-danger">*</span>
                  </Label>
                  <Input
                    name="name"
                    placeholder="e.g. Berkuda, Flying Fox..."
                    value={formik.values.name}
                    onChange={handleNameChange}
                    onBlur={formik.handleBlur}
                    invalid={formik.touched.name && !!formik.errors.name}
                  />
                  <FormFeedback>{formik.errors.name}</FormFeedback>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup className="mb-0">
                  <Label className="fw-semibold fs-13">
                    Slug <span className="text-danger">*</span>
                  </Label>
                  <Input
                    name="slug"
                    placeholder="berkuda"
                    value={formik.values.slug}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    invalid={formik.touched.slug && !!formik.errors.slug}
                  />
                  <FormFeedback>{formik.errors.slug}</FormFeedback>
                </FormGroup>
              </Col>

              {/* Icon picker */}
              <Col xs={12}>
                <Label className="fw-semibold fs-13 d-block mb-2">Icon</Label>
                <div className="d-flex flex-wrap gap-2">
                  {ICON_OPTIONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      className={`btn btn-sm d-flex align-items-center justify-content-center ${formik.values.icon === icon ? "btn-primary" : "btn-outline-secondary"}`}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        padding: 0,
                      }}
                      onClick={() => formik.setFieldValue("icon", icon)}
                      title={icon}
                    >
                      <i className={icon} style={{ fontSize: 16 }} />
                    </button>
                  ))}
                </div>
              </Col>

              {/* Color */}
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

              {/* Link to calendar */}
              <Col md={6}>
                <FormGroup className="mb-0">
                  <Label className="fw-semibold fs-13">Link to Calendar</Label>
                  <Input
                    type="select"
                    name="calendarId"
                    value={formik.values.calendarId}
                    onChange={formik.handleChange}
                  >
                    <option value="">Global (semua calendar)</option>
                    {calendars.map(cal => (
                      <option key={cal.id} value={cal.id}>
                        {cal.title}
                      </option>
                    ))}
                  </Input>
                  <div className="text-muted mt-1" style={{ fontSize: 11 }}>
                    Global = bisa dipakai di semua calendar
                  </div>
                </FormGroup>
              </Col>

              <Col xs={12}>
                <FormGroup className="mb-0">
                  <Label className="fw-semibold fs-13">Description</Label>
                  <Input
                    type="textarea"
                    name="description"
                    rows={2}
                    value={formik.values.description}
                    onChange={formik.handleChange}
                  />
                </FormGroup>
              </Col>

              <Col xs={12}>
                <div className="form-check form-switch">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    role="switch"
                    id="cat-isActive"
                    checked={formik.values.isActive}
                    onChange={e =>
                      formik.setFieldValue("isActive", e.target.checked)
                    }
                  />
                  <label
                    className="form-check-label fs-13"
                    htmlFor="cat-isActive"
                  >
                    Active
                  </label>
                </div>
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
                {selected ? "Save Changes" : "Create Category"}
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
          <h5 className="fw-bold">Delete Category?</h5>
          <p className="text-muted" style={{ fontSize: 13 }}>
            <strong>{selected?.name}</strong> akan dihapus. Tidak bisa dihapus
            jika masih dipakai oleh events.
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

export default CategoryList;
