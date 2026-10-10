"use client";

import { Card, CardBody } from "reactstrap";

interface UpcomingEvent {
  id: string;
  title: string;
  start: string | Date;
  end?: string | Date | null;
  location?: string;
  description?: string;
  className?: string;
  color?: string;
}

interface Props {
  event: UpcomingEvent;
}

const COLORS = ["primary", "success", "warning", "info", "danger"];

const formatTime = (date: string | Date) => {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateShort = (date: string | Date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
};

const getDayName = (date: string | Date) => {
  return new Date(date).toLocaleDateString("en-GB", { weekday: "short" });
};

const isToday = (date: string | Date) => {
  const d = new Date(date);
  const t = new Date();
  return (
    d.getDate() === t.getDate() &&
    d.getMonth() === t.getMonth() &&
    d.getFullYear() === t.getFullYear()
  );
};

const isTomorrow = (date: string | Date) => {
  const d = new Date(date);
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return (
    d.getDate() === t.getDate() &&
    d.getMonth() === t.getMonth() &&
    d.getFullYear() === t.getFullYear()
  );
};

const getLabel = (date: string | Date) => {
  if (isToday(date)) return { text: "Today", color: "success" };
  if (isTomorrow(date)) return { text: "Tomorrow", color: "warning" };
  return null;
};

function UpcommingEvents({ event }: Props) {
  const label = getLabel(event.start);
  const color = event.color || "#405189";
  const startTime = formatTime(event.start);
  const endTime = event.end ? formatTime(event.end) : null;
  const dateStr = formatDateShort(event.start);
  const dayName = getDayName(event.start);

  return (
    <div className="d-flex gap-3 mb-3">
      {/* Date badge */}
      <div
        className="d-flex flex-column align-items-center justify-content-center flex-shrink-0"
        style={{
          width: 44,
          minHeight: 52,
          borderRadius: 10,
          padding: "6px 4px",
          background: `${color}18`,
          border: `1.5px solid ${color}33`,
        }}
      >
        <div className="fw-bold" style={{ fontSize: 16, color, lineHeight: 1 }}>
          {new Date(event.start).getDate()}
        </div>
        <div
          className="text-uppercase fw-semibold"
          style={{ fontSize: 9, color, letterSpacing: "0.5px" }}
        >
          {new Date(event.start).toLocaleDateString("en-GB", {
            month: "short",
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow-1 overflow-hidden">
        <div className="d-flex align-items-center gap-1 mb-1">
          {label && (
            <span
              className={`badge bg-${label.color}-subtle text-${label.color} px-2`}
              style={{ fontSize: 10, borderRadius: 6, fontWeight: 600 }}
            >
              {label.text}
            </span>
          )}
          <span className="text-muted" style={{ fontSize: 11 }}>
            {dayName}
          </span>
        </div>

        <div className="fw-semibold text-truncate" style={{ fontSize: 13 }}>
          {event.title}
        </div>

        <div className="d-flex align-items-center gap-2 mt-1">
          <span
            className="text-muted d-flex align-items-center gap-1"
            style={{ fontSize: 11 }}
          >
            <i className="ri-time-line" />
            {startTime}
            {endTime ? ` – ${endTime}` : ""}
          </span>
          {event.location && (
            <span
              className="text-muted d-flex align-items-center gap-1 text-truncate"
              style={{ fontSize: 11 }}
            >
              <i className="ri-map-pin-line" />
              <span className="text-truncate">{event.location}</span>
            </span>
          )}
        </div>
      </div>

      {/* Color dot */}
      <div className="flex-shrink-0 d-flex align-items-center">
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
          }}
        />
      </div>
    </div>
  );
}

export default UpcommingEvents;
