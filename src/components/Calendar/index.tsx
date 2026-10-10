"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Card,
  CardBody,
  Col,
  Row,
  Modal,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  FormFeedback,
  Input,
  Label,
  Button,
  Spinner,
  Badge,
} from "reactstrap";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import Flatpickr from "react-flatpickr";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import SimpleBar from "simplebar-react";
import DeleteModal from "@common/DeleteModal";
import UpcommingEvents from "./UpcommingEvents";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CalendarData {
  id: string;
  title: string;
  color: string;
  slug: string;
  type?: string;
  description?: string;
  isPublic?: boolean;
  _count?: { events: number; members: number };
}

interface DbCategory {
  id: string;
  name: string;
  icon?: string;
  color: string;
  isActive: boolean;
  calendarId?: string;
}

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

const TYPE_BADGE: Record<string, { color: string; label: string }> = {
  main: { color: "primary", label: "Main" },
  event: { color: "success", label: "Event" },
  activity: { color: "info", label: "Activity" },
  promo: { color: "warning", label: "Promo" },
  schedule: { color: "secondary", label: "Schedule" },
  internal: { color: "danger", label: "Internal" },
};

const formatDateTime = (date: any) => {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number | string;
  color: string;
}) => (
  <div
    className="d-flex align-items-center gap-3 p-3 rounded-3 h-100"
    style={{ background: "#f8f9fa", border: "1px solid #e9ecef" }}
  >
    <div
      className={`d-flex align-items-center justify-content-center rounded-circle bg-${color}-subtle flex-shrink-0`}
      style={{ width: 42, height: 42 }}
    >
      <i className={`${icon} text-${color}`} style={{ fontSize: 18 }} />
    </div>
    <div className="overflow-hidden">
      <div
        className="text-muted text-uppercase fw-semibold"
        style={{ fontSize: 10, letterSpacing: "0.5px" }}
      >
        {label}
      </div>
      <div className="fw-bold" style={{ fontSize: 20, lineHeight: 1.1 }}>
        {value}
      </div>
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const CalendarView = () => {
  const calendarRef = useRef<any>(null);
  const isCreatingCal = useRef(false);

  // ── Data state ──────────────────────────────────────────────────────────
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [displayEvents, setDisplayEvents] = useState<any[]>([]);
  const [calendars, setCalendars] = useState<CalendarData[]>([]);
  const [dbCategories, setDbCategories] = useState<DbCategory[]>([]);
  const [upcomingEvts, setUpcomingEvts] = useState<any[]>([]);
  const [activeCalId, setActiveCalId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── UI state ────────────────────────────────────────────────────────────
  const [modal, setModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [editModal, setEditModal] = useState(false); // modal edit terpisah
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string>("");
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [sidebarTab, setSidebarTab] = useState<"upcoming" | "categories">(
    "upcoming"
  );
  const [editSubmitting, setEditSubmitting] = useState(false);

  // ── Fetch categories ──────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/apps/calendar/panel/categories");
      const data = await res.json();
      setDbCategories((data || []).filter((c: DbCategory) => c.isActive));
    } catch {
      console.error("Failed to load categories");
    }
  }, []);

  // ── Fetch calendars ───────────────────────────────────────────────────
  const fetchCalendars = useCallback(async () => {
    try {
      const res = await fetch("/api/apps/calendar/panel?all=true");
      const json = await res.json();
      let cals: CalendarData[] = json.data || [];

      // De-duplicate by title, keep highest event count
      const unique: CalendarData[] = [];
      const seen = new Set<string>();
      const sorted = [...cals].sort(
        (a, b) => (b._count?.events || 0) - (a._count?.events || 0)
      );
      for (const cal of sorted) {
        if (!seen.has(cal.title)) {
          seen.add(cal.title);
          unique.push(cal);
        }
      }

      if (unique.length === 0 && !isCreatingCal.current) {
        const created = sessionStorage.getItem("cal_default_created");
        if (!created) {
          isCreatingCal.current = true;
          sessionStorage.setItem("cal_default_created", "1");
          const r = await fetch("/api/apps/calendar/panel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "Main Calendar",
              slug: "main-calendar",
              color: "#405189",
              isPublic: false,
              type: "main",
            }),
          });
          if (r.ok) unique.push(await r.json());
          isCreatingCal.current = false;
        }
      } else if (unique.length > 0) {
        sessionStorage.removeItem("cal_default_created");
      }

      setCalendars(unique);
      if (unique.length > 0 && !activeCalId) setActiveCalId(unique[0].id);
    } catch {
      toast.error("Failed to load calendars");
    }
  }, [activeCalId]);

  // ── Fetch events ──────────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    if (!activeCalId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/apps/calendar/panel/events?calendarId=${activeCalId}&all=true`
      );
      const json = await res.json();
      const raw: any[] = json.data || [];
      const cal = calendars.find(c => c.id === activeCalId);

      const formatted = raw.map(e => {
        const eventColor = e.color || cal?.color || "#405189";
        return {
          id: e.id,
          title: e.title,
          start: e.start,
          end: e.end,
          allDay: e.allDay,
          backgroundColor: eventColor,
          borderColor: "transparent",
          textColor: "#fff",
          extendedProps: {
            location: e.location,
            description: e.description,
            categoryId: e.categoryId,
            categoryName: e.calendarCategory?.name || "",
            categoryIcon: e.calendarCategory?.icon || "ri-tag-line",
            categoryColor: e.calendarCategory?.color || "#878a99",
            tags: e.tags || [],
            guestCount: e._count?.guests || 0,
            color: eventColor,
            // ── Guard: lock delete jika ada guests ──
            hasGuests: (e._count?.guests || 0) > 0,
          },
        };
      });

      setAllEvents(formatted);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setUpcomingEvts(
        raw
          .filter(e => new Date(e.start) >= today)
          .sort(
            (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
          )
          .slice(0, 8)
          .map(e => ({ ...e, color: e.color || cal?.color || "#405189" }))
      );
    } catch {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [activeCalId, calendars]);

  // ── Filter by category ────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedCategory) setDisplayEvents(allEvents);
    else
      setDisplayEvents(
        allEvents.filter(e => e.extendedProps?.categoryId === selectedCategory)
      );
  }, [allEvents, selectedCategory]);

  useEffect(() => {
    fetchCalendars();
    fetchCategories();
  }, []);
  useEffect(() => {
    if (activeCalId && calendars.length > 0) fetchEvents();
  }, [activeCalId, calendars]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const openCreate = (date?: Date) => {
    setSelectedDays(date ? [date] : []);
    setIsEdit(false);
    setSelectedEvent(null);
    formik.resetForm();
    setModal(true);
  };

  const openView = (ev: any) => {
    setSelectedEvent(ev);
    setEventToDelete(ev.id);
    setIsEdit(true);
    setModal(true);
  };

  const openEdit = () => {
    // Pre-fill edit form
    editFormik.setValues({
      title: selectedEvent?.title || "",
      location: selectedEvent?.location || "",
      description: selectedEvent?.description || "",
      color: selectedEvent?.color || COLOR_OPTIONS[0].value,
      categoryId: selectedEvent?.categoryId || "",
      start: selectedEvent?.start
        ? new Date(selectedEvent.start).toISOString()
        : "",
      end: selectedEvent?.end ? new Date(selectedEvent.end).toISOString() : "",
      allDay: selectedEvent?.allDay || false,
    });
    setModal(false);
    setTimeout(() => setEditModal(true), 150);
  };

  const closeModal = useCallback(() => {
    setModal(false);
    setSelectedEvent(null);
    setIsEdit(false);
    setSelectedDays([]);
    formik.resetForm();
  }, []);
  const closeEditModal = useCallback(() => {
    setEditModal(false);
  }, []);

  const handleDateClick = (arg: any) => openCreate(arg.date);
  const handleEventClick = (arg: any) => {
    const ev = arg.event;
    openView({
      id: ev.id,
      title: ev.title,
      start: ev.start,
      end: ev.end,
      allDay: ev.allDay,
      location: ev.extendedProps?.location || "",
      description: ev.extendedProps?.description || "",
      categoryId: ev.extendedProps?.categoryId || "",
      categoryName: ev.extendedProps?.categoryName || "",
      categoryIcon: ev.extendedProps?.categoryIcon || "",
      categoryColor: ev.extendedProps?.categoryColor || "",
      tags: ev.extendedProps?.tags || [],
      guestCount: ev.extendedProps?.guestCount || 0,
      color: ev.extendedProps?.color || ev.backgroundColor,
      hasGuests: ev.extendedProps?.hasGuests || false,
    });
  };

  const handleEventDrop = async (arg: any) => {
    // Guard: jangan bisa drag kalau ada guests
    const hasGuests = arg.event.extendedProps?.hasGuests;
    if (hasGuests) {
      arg.revert();
      toast("Cannot reschedule event with guests — edit manually.", {
        icon: "⚠️",
      });
      return;
    }
    try {
      await fetch(`/api/apps/calendar/panel/events/${arg.event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: arg.event.start.toISOString(),
          end: (arg.event.end || arg.event.start).toISOString(),
        }),
      });
      toast.success("Event rescheduled");
      const upd = (e: any) =>
        e.id === arg.event.id
          ? {
              ...e,
              start: arg.event.start.toISOString(),
              end: (arg.event.end || arg.event.start).toISOString(),
            }
          : e;
      setAllEvents(prev => prev.map(upd));
    } catch {
      arg.revert();
      toast.error("Failed to reschedule");
    }
  };

  const handleEventResize = async (arg: any) => {
    try {
      await fetch(`/api/apps/calendar/panel/events/${arg.event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: arg.event.start.toISOString(),
          end: arg.event.end.toISOString(),
        }),
      });
      toast.success("Event updated");
      const upd = (e: any) =>
        e.id === arg.event.id
          ? {
              ...e,
              start: arg.event.start.toISOString(),
              end: arg.event.end.toISOString(),
            }
          : e;
      setAllEvents(prev => prev.map(upd));
    } catch {
      arg.revert();
      toast.error("Failed to update");
    }
  };

  // ── Delete guard ──────────────────────────────────────────────────────
  const handleDeleteEvent = async () => {
    if (selectedEvent?.hasGuests) {
      toast(
        "Cannot delete event with guests. Remove guests first or edit the event.",
        { icon: "⚠️" }
      );
      setDeleteModal(false);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/apps/calendar/panel/events/${eventToDelete}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Deleted from calendar view" }),
        }
      );
      if (!res.ok) throw new Error();
      setAllEvents(prev => prev.filter(e => e.id !== eventToDelete));
      setUpcomingEvts(prev => prev.filter(e => e.id !== eventToDelete));
      toast.success("Event deleted");
      setDeleteModal(false);
      closeModal();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  // ── Create form ───────────────────────────────────────────────────────
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: "",
      location: "",
      description: "",
      color: COLOR_OPTIONS[0].value,
      categoryId: selectedCategory || "",
      calendarId: activeCalId,
      start: selectedDays[0] ? selectedDays[0].toISOString() : "",
      end: selectedDays[0] ? selectedDays[0].toISOString() : "",
      allDay: false,
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Event name is required"),
      calendarId: Yup.string().required("Select a calendar"),
      start: Yup.string().required("Start date is required"),
      end: Yup.string().required("End date is required"),
    }),
    onSubmit: async values => {
      setSubmitting(true);
      try {
        const res = await fetch("/api/apps/calendar/panel/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: values.title,
            description: values.description || null,
            location: values.location || null,
            start: new Date(values.start).toISOString(),
            end: new Date(values.end).toISOString(),
            allDay: values.allDay,
            calendarId: values.calendarId || activeCalId,
            color: values.color,
            categoryId: values.categoryId || null,
          }),
        });
        if (!res.ok) throw new Error();
        const newEv = await res.json();
        const eventColor = newEv.color || values.color;
        const cat = dbCategories.find(c => c.id === values.categoryId);

        const newFcEvent = {
          id: newEv.id,
          title: newEv.title,
          start: newEv.start,
          end: newEv.end,
          allDay: newEv.allDay,
          backgroundColor: eventColor,
          borderColor: "transparent",
          textColor: "#fff",
          extendedProps: {
            location: newEv.location,
            description: newEv.description,
            categoryId: newEv.categoryId,
            categoryName: cat?.name || "",
            categoryIcon: cat?.icon || "ri-tag-line",
            categoryColor: cat?.color || "#878a99",
            tags: [],
            guestCount: 0,
            color: eventColor,
            hasGuests: false,
          },
        };

        // Only add to display if same calendar
        if ((values.calendarId || activeCalId) === activeCalId) {
          setAllEvents(prev => [...prev, newFcEvent]);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (new Date(newEv.start) >= today) {
            setUpcomingEvts(prev =>
              [...prev, { ...newEv, color: eventColor }]
                .sort(
                  (a, b) =>
                    new Date(a.start).getTime() - new Date(b.start).getTime()
                )
                .slice(0, 8)
            );
          }
        }

        toast.success("Event created!");
        closeModal();
      } catch {
        toast.error("Failed to create event");
      } finally {
        setSubmitting(false);
      }
    },
  });

  // ── Edit form ─────────────────────────────────────────────────────────
  const editFormik = useFormik({
    enableReinitialize: false,
    initialValues: {
      title: "",
      location: "",
      description: "",
      color: COLOR_OPTIONS[0].value,
      categoryId: "",
      start: "",
      end: "",
      allDay: false,
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Event name is required"),
      start: Yup.string().required("Start date is required"),
      end: Yup.string().required("End date is required"),
    }),
    onSubmit: async values => {
      if (!selectedEvent?.id) return;
      setEditSubmitting(true);
      try {
        const res = await fetch(
          `/api/apps/calendar/panel/events/${selectedEvent.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: values.title,
              description: values.description || null,
              location: values.location || null,
              start: new Date(values.start).toISOString(),
              end: new Date(values.end).toISOString(),
              allDay: values.allDay,
              color: values.color,
              categoryId: values.categoryId || null,
            }),
          }
        );
        if (!res.ok) throw new Error();

        const cat = dbCategories.find(c => c.id === values.categoryId);
        const eventColor = values.color;

        setAllEvents(prev =>
          prev.map(e =>
            e.id !== selectedEvent.id
              ? e
              : {
                  ...e,
                  title: values.title,
                  start: new Date(values.start).toISOString(),
                  end: new Date(values.end).toISOString(),
                  allDay: values.allDay,
                  backgroundColor: eventColor,
                  extendedProps: {
                    ...e.extendedProps,
                    location: values.location,
                    description: values.description,
                    color: eventColor,
                    categoryId: values.categoryId,
                    categoryName: cat?.name || "",
                    categoryIcon: cat?.icon || "ri-tag-line",
                    categoryColor: cat?.color || "#878a99",
                  },
                }
          )
        );

        toast.success("Event updated!");
        closeEditModal();
      } catch {
        toast.error("Failed to update event");
      } finally {
        setEditSubmitting(false);
      }
    },
  });

  // ── Stats ─────────────────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const totalEvents = allEvents.length;
  const todayCount = allEvents.filter(
    e => new Date(e.start).toDateString() === new Date().toDateString()
  ).length;
  const upcomingCount = allEvents.filter(
    e => new Date(e.start) >= today
  ).length;
  const activeCal = calendars.find(c => c.id === activeCalId);
  const headerColor = isEdit
    ? selectedEvent?.color || "#405189"
    : formik.values.color || "#405189";
  const activeCatInfo = dbCategories.find(c => c.id === selectedCategory);

  // Categories filtered for active calendar (global + calendar-specific)
  const availableCategories = dbCategories.filter(
    c => !c.calendarId || c.calendarId === activeCalId
  );

  return (
    <>
      <Row className="g-3 mb-4">
        <Col sm={4}>
          <StatCard
            icon="ri-calendar-event-line"
            label="Total Events"
            value={totalEvents}
            color="primary"
          />
        </Col>
        <Col sm={4}>
          <StatCard
            icon="ri-sun-line"
            label="Today"
            value={todayCount}
            color="success"
          />
        </Col>
        <Col sm={4}>
          <StatCard
            icon="ri-arrow-right-up-line"
            label="Upcoming"
            value={upcomingCount}
            color="info"
          />
        </Col>
      </Row>

      <Row className="g-4">
        {/* ══ SIDEBAR ══════════════════════════════════════════════════════ */}
        <Col xl={3} lg={4}>
          {/* Create button */}
          <button
            className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold mb-3"
            style={{ height: 44, borderRadius: 10, fontSize: 14 }}
            onClick={() => openCreate()}
          >
            <i className="ri-add-circle-line fs-16" />
            Create New Event
          </button>

          {/* ── Calendar Switcher ── */}
          <div className="mb-3">
            <div
              className="text-muted text-uppercase fw-semibold mb-2 d-flex align-items-center justify-content-between"
              style={{ fontSize: 10, letterSpacing: "0.6px" }}
            >
              <span>
                <i className="ri-calendar-2-line me-1" />
                Calendar
              </span>
              <a
                href="/apps-calendar-management"
                className="text-primary"
                style={{ fontSize: 10 }}
              >
                Manage →
              </a>
            </div>
            <div className="d-flex flex-column gap-1">
              {calendars.map(cal => {
                const typeInfo = TYPE_BADGE[cal.type || "main"];
                const isActive = activeCalId === cal.id;
                return (
                  <button
                    key={cal.id}
                    type="button"
                    className={`btn text-start d-flex align-items-center gap-2 py-2 px-3 fw-medium ${isActive ? "btn-primary" : "btn-outline-secondary"}`}
                    style={{ borderRadius: 8, fontSize: 12 }}
                    onClick={() => {
                      setActiveCalId(cal.id);
                      setSelectedCategory("");
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: isActive ? "#fff" : cal.color,
                        flexShrink: 0,
                      }}
                    />
                    <span className="flex-grow-1 text-truncate">
                      {cal.title}
                    </span>
                    <div className="d-flex align-items-center gap-1">
                      {typeInfo && (
                        <span
                          className={`badge bg-${isActive ? "white" : typeInfo.color}-subtle text-${isActive ? "white" : typeInfo.color}`}
                          style={{ fontSize: 9, borderRadius: 4 }}
                        >
                          {typeInfo.label}
                        </span>
                      )}
                      <span
                        className={`badge ${isActive ? "bg-white bg-opacity-25 text-white" : "bg-light text-muted"}`}
                        style={{ fontSize: 10 }}
                      >
                        {cal._count?.events || 0}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            style={{
              height: 1,
              background:
                "linear-gradient(90deg, transparent, #e9ecef, transparent)",
              margin: "12px 0",
            }}
          />

          {/* Tabs */}
          <div
            className="d-flex gap-1 p-1 mb-3"
            style={{
              background: "#f8f9fa",
              borderRadius: 10,
              border: "1px solid #e9ecef",
            }}
          >
            {(["upcoming", "categories"] as const).map(t => (
              <button
                key={t}
                type="button"
                className={`btn btn-sm flex-fill fw-semibold ${sidebarTab === t ? "btn-primary" : "btn-ghost-secondary"}`}
                style={{ borderRadius: 8, fontSize: 12 }}
                onClick={() => setSidebarTab(t)}
              >
                {t === "upcoming" ? (
                  <>
                    <i className="ri-time-line me-1" />
                    Upcoming
                  </>
                ) : (
                  <>
                    <i className="ri-price-tag-3-line me-1" />
                    Filter
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Upcoming */}
          {sidebarTab === "upcoming" && (
            <SimpleBar style={{ maxHeight: 360 }} className="pe-1">
              {upcomingEvts.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <i
                    className="ri-calendar-line d-block mb-2"
                    style={{ fontSize: 36, opacity: 0.25 }}
                  />
                  <p className="mb-0" style={{ fontSize: 13 }}>
                    No upcoming events
                  </p>
                </div>
              ) : (
                upcomingEvts.map(ev => (
                  <UpcommingEvents key={ev.id} event={ev} />
                ))
              )}
            </SimpleBar>
          )}

          {/* Category filter */}
          {sidebarTab === "categories" && (
            <SimpleBar style={{ maxHeight: 360 }} className="pe-1">
              <div className="d-flex flex-column gap-1">
                <button
                  type="button"
                  className={`btn text-start d-flex align-items-center gap-2 fw-medium py-2 px-3 ${selectedCategory === "" ? "btn-primary" : "btn-outline-secondary"}`}
                  style={{ borderRadius: 8, fontSize: 12 }}
                  onClick={() => setSelectedCategory("")}
                >
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                    style={{
                      width: 22,
                      height: 22,
                      background:
                        selectedCategory === ""
                          ? "rgba(255,255,255,.25)"
                          : "rgba(64,81,137,.12)",
                    }}
                  >
                    <i
                      className="ri-calendar-line"
                      style={{
                        fontSize: 11,
                        color: selectedCategory === "" ? "#fff" : "#405189",
                      }}
                    />
                  </div>
                  <span className="flex-grow-1">All Events</span>
                  <span
                    className={`badge ${selectedCategory === "" ? "bg-white bg-opacity-25 text-white" : "bg-light text-muted"}`}
                    style={{ fontSize: 10 }}
                  >
                    {allEvents.length}
                  </span>
                </button>

                {availableCategories.length === 0 ? (
                  <div
                    className="text-center text-muted py-3"
                    style={{ fontSize: 12 }}
                  >
                    <i
                      className="ri-price-tag-3-line d-block mb-1"
                      style={{ fontSize: 24, opacity: 0.3 }}
                    />
                    No categories.{" "}
                    <a
                      href="/apps-calendar-management"
                      className="text-primary"
                    >
                      Add →
                    </a>
                  </div>
                ) : (
                  availableCategories.map(cat => {
                    const count = allEvents.filter(
                      e => e.extendedProps?.categoryId === cat.id
                    ).length;
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`btn text-start d-flex align-items-center gap-2 fw-medium py-2 px-3 ${isActive ? "btn-primary" : "btn-outline-secondary"}`}
                        style={{ borderRadius: 8, fontSize: 12 }}
                        onClick={() => setSelectedCategory(cat.id)}
                      >
                        <div
                          className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                          style={{
                            width: 22,
                            height: 22,
                            background: isActive
                              ? "rgba(255,255,255,.25)"
                              : `${cat.color}18`,
                          }}
                        >
                          <i
                            className={cat.icon || "ri-tag-line"}
                            style={{
                              fontSize: 11,
                              color: isActive ? "#fff" : cat.color,
                            }}
                          />
                        </div>
                        <span className="flex-grow-1">{cat.name}</span>
                        <span
                          className={`badge ${isActive ? "bg-white bg-opacity-25 text-white" : "bg-light text-muted"}`}
                          style={{ fontSize: 10 }}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </SimpleBar>
          )}

          {/* Category filter indicator */}
          {selectedCategory && activeCatInfo && (
            <div
              className="mt-2 d-flex align-items-center justify-content-between p-2 rounded-2"
              style={{
                background: `${activeCatInfo.color}15`,
                border: `1px solid ${activeCatInfo.color}30`,
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <i
                  className={activeCatInfo.icon || "ri-tag-line"}
                  style={{ color: activeCatInfo.color, fontSize: 13 }}
                />
                <span
                  style={{
                    fontSize: 11,
                    color: activeCatInfo.color,
                    fontWeight: 600,
                  }}
                >
                  {activeCatInfo.name}
                </span>
              </div>
              <button
                className="btn btn-sm p-0"
                onClick={() => setSelectedCategory("")}
              >
                <i
                  className="ri-close-line text-muted"
                  style={{ fontSize: 13 }}
                />
              </button>
            </div>
          )}
        </Col>

        {/* ══ CALENDAR ═════════════════════════════════════════════════════ */}
        <Col xl={9} lg={8}>
          <Card
            className="border-0"
            style={{
              boxShadow: "0 4px 24px rgba(0,0,0,.08)",
              borderRadius: 16,
            }}
          >
            <CardBody className="p-3 p-md-4">
              {/* Calendar header info */}
              {activeCal && (
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: activeCal.color,
                    }}
                  />
                  <span className="fw-semibold" style={{ fontSize: 13 }}>
                    {activeCal.title}
                  </span>
                  {activeCal.type && (
                    <Badge
                      color={TYPE_BADGE[activeCal.type]?.color || "secondary"}
                      className="px-2"
                      style={{ fontSize: 10 }}
                    >
                      {TYPE_BADGE[activeCal.type]?.label || activeCal.type}
                    </Badge>
                  )}
                  {activeCal.isPublic && (
                    <Badge
                      color="success"
                      className="px-2"
                      style={{ fontSize: 10 }}
                    >
                      <i className="ri-earth-line me-1" />
                      Public
                    </Badge>
                  )}
                </div>
              )}

              {loading ? (
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{ minHeight: 400 }}
                >
                  <Spinner color="primary" className="me-2" />
                  <span className="text-muted">Loading events...</span>
                </div>
              ) : (
                <FullCalendar
                  ref={calendarRef}
                  plugins={[
                    dayGridPlugin,
                    timeGridPlugin,
                    interactionPlugin,
                    listPlugin,
                  ]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
                  }}
                  events={displayEvents}
                  editable={true}
                  droppable={true}
                  selectable={true}
                  selectMirror={true}
                  dayMaxEvents={3}
                  height="auto"
                  eventDisplay="block"
                  dateClick={handleDateClick}
                  eventClick={handleEventClick}
                  eventDrop={handleEventDrop}
                  eventResize={handleEventResize}
                />
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* ── Delete Modal ──────────────────────────────────────────────────── */}
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteEvent}
        onCloseClick={() => setDeleteModal(false)}
        recordId=""
      />

      {/* ── View / Create Modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={modal}
        toggle={submitting || deleting ? undefined : closeModal}
        centered
        size="lg"
      >
        <div
          style={{
            background: headerColor,
            borderRadius: "12px 12px 0 0",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <i
              className={`${isEdit ? "ri-calendar-event-line" : "ri-add-circle-line"} text-white fs-18`}
            />
            <span className="text-white fw-bold" style={{ fontSize: 15 }}>
              {isEdit
                ? selectedEvent?.title || "Event Detail"
                : "Create New Event"}
            </span>
            {isEdit && selectedEvent?.categoryName && (
              <span
                className="badge bg-white bg-opacity-25 text-white ms-1"
                style={{ fontSize: 11 }}
              >
                <i
                  className={`${selectedEvent.categoryIcon || "ri-tag-line"} me-1`}
                />
                {selectedEvent.categoryName}
              </span>
            )}
          </div>
          <button
            type="button"
            className="btn-close btn-close-white btn-sm"
            onClick={closeModal}
            disabled={submitting || deleting}
          />
        </div>

        <ModalBody className="p-4">
          {isEdit && selectedEvent ? (
            /* ── View mode ── */
            <div>
              {/* Guard warning */}
              {selectedEvent.hasGuests && (
                <div
                  className="d-flex align-items-start gap-2 p-3 rounded-3 mb-3"
                  style={{
                    background: "#fff8e6",
                    border: "1px solid #f7b84b33",
                  }}
                >
                  <i
                    className="ri-shield-check-line text-warning mt-1"
                    style={{ fontSize: 16 }}
                  />
                  <div>
                    <div
                      className="fw-semibold text-warning"
                      style={{ fontSize: 12 }}
                    >
                      Protected Event
                    </div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      This event has {selectedEvent.guestCount} guest(s). Delete
                      is disabled — you can only edit it.
                    </div>
                  </div>
                </div>
              )}

              <div className="d-flex flex-column gap-3 mb-4">
                {[
                  {
                    icon: "ri-calendar-line",
                    label: "Date",
                    value: `${formatDateTime(selectedEvent.start)}${selectedEvent.end ? " → " + formatDateTime(selectedEvent.end) : ""}`,
                  },
                  {
                    icon: "ri-map-pin-line",
                    label: "Location",
                    value: selectedEvent.location || "—",
                  },
                  {
                    icon: "ri-file-text-line",
                    label: "Description",
                    value: selectedEvent.description || "—",
                  },
                  {
                    icon: "ri-group-line",
                    label: "Guests",
                    value: `${selectedEvent.guestCount || 0} invited`,
                  },
                ].map((r, i) => (
                  <div key={i} className="d-flex align-items-start gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-circle bg-light flex-shrink-0"
                      style={{ width: 34, height: 34 }}
                    >
                      <i
                        className={`${r.icon} text-muted`}
                        style={{ fontSize: 15 }}
                      />
                    </div>
                    <div>
                      <div
                        className="text-muted text-uppercase fw-semibold"
                        style={{ fontSize: 10, letterSpacing: "0.5px" }}
                      >
                        {r.label}
                      </div>
                      <div className="fw-medium" style={{ fontSize: 13 }}>
                        {r.value}
                      </div>
                    </div>
                  </div>
                ))}

                {selectedEvent.categoryName && (
                  <div className="d-flex align-items-start gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-circle bg-light flex-shrink-0"
                      style={{ width: 34, height: 34 }}
                    >
                      <i
                        className={selectedEvent.categoryIcon || "ri-tag-line"}
                        style={{
                          fontSize: 15,
                          color: selectedEvent.categoryColor || "#878a99",
                        }}
                      />
                    </div>
                    <div>
                      <div
                        className="text-muted text-uppercase fw-semibold"
                        style={{ fontSize: 10, letterSpacing: "0.5px" }}
                      >
                        Category
                      </div>
                      <div
                        className="d-flex align-items-center gap-2 fw-medium"
                        style={{ fontSize: 13 }}
                      >
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background:
                              selectedEvent.categoryColor || "#878a99",
                            flexShrink: 0,
                          }}
                        />
                        {selectedEvent.categoryName}
                      </div>
                    </div>
                  </div>
                )}

                <div className="d-flex align-items-start gap-3">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle bg-light flex-shrink-0"
                    style={{ width: 34, height: 34 }}
                  >
                    <i
                      className="ri-palette-line text-muted"
                      style={{ fontSize: 15 }}
                    />
                  </div>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: selectedEvent.color || "#405189",
                      }}
                    />
                    <span className="text-muted" style={{ fontSize: 13 }}>
                      {COLOR_OPTIONS.find(c => c.value === selectedEvent.color)
                        ?.label || "Custom Color"}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="d-flex gap-2 pt-3"
                style={{ borderTop: "1px solid #f0f0f0" }}
              >
                {/* Edit — always allowed */}
                <button
                  className="btn btn-soft-primary btn-sm fw-semibold"
                  onClick={openEdit}
                >
                  <i className="ri-pencil-line me-1" />
                  Edit Event
                </button>

                {/* Delete — disabled if has guests */}
                {selectedEvent.hasGuests ? (
                  <button
                    className="btn btn-outline-secondary btn-sm fw-semibold"
                    disabled
                    title="Cannot delete event with guests"
                  >
                    <i className="ri-lock-line me-1" />
                    Delete Locked
                  </button>
                ) : (
                  <button
                    className="btn btn-soft-danger btn-sm fw-semibold"
                    disabled={deleting}
                    onClick={() => {
                      setModal(false);
                      setTimeout(() => setDeleteModal(true), 150);
                    }}
                  >
                    {deleting ? (
                      <>
                        <Spinner size="sm" className="me-1" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <i className="ri-delete-bin-line me-1" />
                        Delete Event
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* ── Create mode ── */
            <Form onSubmit={formik.handleSubmit}>
              <Row className="g-3">
                <Col xs={12}>
                  <FormGroup className="mb-0">
                    <Label className="fw-semibold fs-13">
                      Event Name <span className="text-danger">*</span>
                    </Label>
                    <Input
                      name="title"
                      placeholder="Enter event name..."
                      value={formik.values.title}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      invalid={formik.touched.title && !!formik.errors.title}
                      style={{ borderRadius: 8 }}
                    />
                    <FormFeedback>{formik.errors.title}</FormFeedback>
                  </FormGroup>
                </Col>

                {/* Calendar selector */}
                {calendars.length > 1 && (
                  <Col xs={12}>
                    <FormGroup className="mb-0">
                      <Label className="fw-semibold fs-13">
                        Calendar <span className="text-danger">*</span>
                      </Label>
                      <Input
                        type="select"
                        name="calendarId"
                        value={formik.values.calendarId}
                        onChange={e => {
                          formik.setFieldValue("calendarId", e.target.value);
                          formik.setFieldValue("categoryId", "");
                        }}
                        style={{ borderRadius: 8 }}
                      >
                        {calendars.map(cal => (
                          <option key={cal.id} value={cal.id}>
                            {cal.title} {cal.type ? `(${cal.type})` : ""}{" "}
                            {cal.isPublic ? "🌐" : "🔒"}
                          </option>
                        ))}
                      </Input>
                    </FormGroup>
                  </Col>
                )}

                {/* Color + Category */}
                <Col md={6}>
                  <Label className="fw-semibold fs-13 d-block mb-2">
                    Color
                  </Label>
                  <div className="d-flex flex-wrap gap-2 align-items-center">
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
                          transition: "all .15s",
                        }}
                      />
                    ))}
                    <span
                      className="badge ms-1"
                      style={{ background: formik.values.color, fontSize: 11 }}
                    >
                      Preview
                    </span>
                  </div>
                </Col>

                <Col md={6}>
                  <FormGroup className="mb-0">
                    <Label className="fw-semibold fs-13">Category</Label>
                    <Input
                      type="select"
                      name="categoryId"
                      value={formik.values.categoryId}
                      onChange={formik.handleChange}
                      style={{ borderRadius: 8 }}
                    >
                      <option value="">No Category</option>
                      {availableCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </Input>
                    {availableCategories.length === 0 && (
                      <div className="text-muted mt-1" style={{ fontSize: 11 }}>
                        <a
                          href="/apps-calendar-management"
                          className="text-primary"
                        >
                          Add categories →
                        </a>
                      </div>
                    )}
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup className="mb-0">
                    <Label className="fw-semibold fs-13">
                      Start <span className="text-danger">*</span>
                    </Label>
                    <div className="input-group">
                      <Flatpickr
                        className="form-control"
                        value={formik.values.start || ""}
                        onChange={date =>
                          formik.setFieldValue(
                            "start",
                            date[0]?.toISOString() || ""
                          )
                        }
                        options={{
                          enableTime: !formik.values.allDay,
                          dateFormat: formik.values.allDay
                            ? "Y-m-d"
                            : "Y-m-d H:i",
                        }}
                      />
                      <span className="input-group-text">
                        <i className="ri-calendar-event-line" />
                      </span>
                    </div>
                    {formik.touched.start && formik.errors.start && (
                      <div
                        className="text-danger mt-1"
                        style={{ fontSize: 12 }}
                      >
                        {formik.errors.start as string}
                      </div>
                    )}
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup className="mb-0">
                    <Label className="fw-semibold fs-13">
                      End <span className="text-danger">*</span>
                    </Label>
                    <div className="input-group">
                      <Flatpickr
                        className="form-control"
                        value={formik.values.end || ""}
                        onChange={date =>
                          formik.setFieldValue(
                            "end",
                            date[0]?.toISOString() || ""
                          )
                        }
                        options={{
                          enableTime: !formik.values.allDay,
                          dateFormat: formik.values.allDay
                            ? "Y-m-d"
                            : "Y-m-d H:i",
                        }}
                      />
                      <span className="input-group-text">
                        <i className="ri-calendar-event-line" />
                      </span>
                    </div>
                    {formik.touched.end && formik.errors.end && (
                      <div
                        className="text-danger mt-1"
                        style={{ fontSize: 12 }}
                      >
                        {formik.errors.end as string}
                      </div>
                    )}
                  </FormGroup>
                </Col>

                <Col xs={12}>
                  <div className="form-check form-switch">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      role="switch"
                      id="cal-allDay"
                      checked={formik.values.allDay}
                      onChange={e =>
                        formik.setFieldValue("allDay", e.target.checked)
                      }
                    />
                    <label
                      className="form-check-label fw-semibold fs-13"
                      htmlFor="cal-allDay"
                    >
                      All Day Event
                    </label>
                  </div>
                </Col>

                <Col xs={12}>
                  <FormGroup className="mb-0">
                    <Label className="fw-semibold fs-13">Location</Label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="ri-map-pin-line" />
                      </span>
                      <Input
                        name="location"
                        placeholder="Event location (optional)"
                        value={formik.values.location}
                        onChange={formik.handleChange}
                      />
                    </div>
                  </FormGroup>
                </Col>

                <Col xs={12}>
                  <FormGroup className="mb-0">
                    <Label className="fw-semibold fs-13">Description</Label>
                    <Input
                      type="textarea"
                      name="description"
                      rows={3}
                      placeholder="Add a description (optional)..."
                      value={formik.values.description}
                      onChange={formik.handleChange}
                      style={{ borderRadius: 8 }}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </Form>
          )}
        </ModalBody>

        {!isEdit && (
          <ModalFooter className="border-0 pt-0 gap-2">
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
                  Create Event
                </>
              )}
            </Button>
          </ModalFooter>
        )}
      </Modal>

      {/* ── Edit Modal ────────────────────────────────────────────────────── */}
      <Modal
        isOpen={editModal}
        toggle={editSubmitting ? undefined : closeEditModal}
        centered
        size="lg"
      >
        <div
          style={{
            background: selectedEvent?.color || "#405189",
            borderRadius: "12px 12px 0 0",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <i className="ri-pencil-line text-white fs-18" />
            <span className="text-white fw-bold" style={{ fontSize: 15 }}>
              Edit Event
            </span>
          </div>
          <button
            type="button"
            className="btn-close btn-close-white btn-sm"
            onClick={closeEditModal}
            disabled={editSubmitting}
          />
        </div>

        <ModalBody className="p-4">
          <Form onSubmit={editFormik.handleSubmit}>
            <Row className="g-3">
              <Col xs={12}>
                <FormGroup className="mb-0">
                  <Label className="fw-semibold fs-13">
                    Event Name <span className="text-danger">*</span>
                  </Label>
                  <Input
                    name="title"
                    value={editFormik.values.title}
                    onChange={editFormik.handleChange}
                    onBlur={editFormik.handleBlur}
                    invalid={
                      editFormik.touched.title && !!editFormik.errors.title
                    }
                    style={{ borderRadius: 8 }}
                  />
                  <FormFeedback>{editFormik.errors.title}</FormFeedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <Label className="fw-semibold fs-13 d-block mb-2">Color</Label>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  {COLOR_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      title={opt.label}
                      onClick={() =>
                        editFormik.setFieldValue("color", opt.value)
                      }
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: opt.value,
                        border: "3px solid transparent",
                        padding: 0,
                        cursor: "pointer",
                        boxShadow:
                          editFormik.values.color === opt.value
                            ? `0 0 0 3px ${opt.value}`
                            : "none",
                      }}
                    />
                  ))}
                </div>
              </Col>

              <Col md={6}>
                <FormGroup className="mb-0">
                  <Label className="fw-semibold fs-13">Category</Label>
                  <Input
                    type="select"
                    name="categoryId"
                    value={editFormik.values.categoryId}
                    onChange={editFormik.handleChange}
                    style={{ borderRadius: 8 }}
                  >
                    <option value="">No Category</option>
                    {availableCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup className="mb-0">
                  <Label className="fw-semibold fs-13">
                    Start <span className="text-danger">*</span>
                  </Label>
                  <div className="input-group">
                    <Flatpickr
                      className="form-control"
                      value={editFormik.values.start || ""}
                      onChange={date =>
                        editFormik.setFieldValue(
                          "start",
                          date[0]?.toISOString() || ""
                        )
                      }
                      options={{
                        enableTime: !editFormik.values.allDay,
                        dateFormat: editFormik.values.allDay
                          ? "Y-m-d"
                          : "Y-m-d H:i",
                      }}
                    />
                    <span className="input-group-text">
                      <i className="ri-calendar-event-line" />
                    </span>
                  </div>
                  {editFormik.touched.start && editFormik.errors.start && (
                    <div className="text-danger mt-1" style={{ fontSize: 12 }}>
                      {editFormik.errors.start as string}
                    </div>
                  )}
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup className="mb-0">
                  <Label className="fw-semibold fs-13">
                    End <span className="text-danger">*</span>
                  </Label>
                  <div className="input-group">
                    <Flatpickr
                      className="form-control"
                      value={editFormik.values.end || ""}
                      onChange={date =>
                        editFormik.setFieldValue(
                          "end",
                          date[0]?.toISOString() || ""
                        )
                      }
                      options={{
                        enableTime: !editFormik.values.allDay,
                        dateFormat: editFormik.values.allDay
                          ? "Y-m-d"
                          : "Y-m-d H:i",
                      }}
                    />
                    <span className="input-group-text">
                      <i className="ri-calendar-event-line" />
                    </span>
                  </div>
                  {editFormik.touched.end && editFormik.errors.end && (
                    <div className="text-danger mt-1" style={{ fontSize: 12 }}>
                      {editFormik.errors.end as string}
                    </div>
                  )}
                </FormGroup>
              </Col>

              <Col xs={12}>
                <div className="form-check form-switch">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    role="switch"
                    id="edit-allDay"
                    checked={editFormik.values.allDay}
                    onChange={e =>
                      editFormik.setFieldValue("allDay", e.target.checked)
                    }
                  />
                  <label
                    className="form-check-label fw-semibold fs-13"
                    htmlFor="edit-allDay"
                  >
                    All Day Event
                  </label>
                </div>
              </Col>

              <Col xs={12}>
                <FormGroup className="mb-0">
                  <Label className="fw-semibold fs-13">Location</Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="ri-map-pin-line" />
                    </span>
                    <Input
                      name="location"
                      value={editFormik.values.location}
                      onChange={editFormik.handleChange}
                    />
                  </div>
                </FormGroup>
              </Col>

              <Col xs={12}>
                <FormGroup className="mb-0">
                  <Label className="fw-semibold fs-13">Description</Label>
                  <Input
                    type="textarea"
                    name="description"
                    rows={3}
                    value={editFormik.values.description}
                    onChange={editFormik.handleChange}
                    style={{ borderRadius: 8 }}
                  />
                </FormGroup>
              </Col>
            </Row>
          </Form>
        </ModalBody>

        <ModalFooter className="border-0 pt-0 gap-2">
          <Button
            color="secondary"
            outline
            onClick={closeEditModal}
            disabled={editSubmitting}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            disabled={editSubmitting}
            onClick={() => editFormik.handleSubmit()}
          >
            {editSubmitting ? (
              <>
                <Spinner size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              <>
                <i className="ri-check-line me-1" />
                Save Changes
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default CalendarView;
