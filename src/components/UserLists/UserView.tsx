"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Col,
  Nav,
  NavItem,
  NavLink,
  Row,
  Spinner,
  TabContent,
  TabPane,
} from "reactstrap";
import classnames from "classnames";

// ─── Types ────────────────────────────────────────────────────────────────────
type RoleValue = "superadmin" | "admin" | "superuser" | "user";

interface LoginHistory {
  id: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

interface HistoryLog {
  id: string;
  actionType: string;
  entityType: string;
  performedAt: string;
  performedById?: string;
  reason?: string;
}

interface DeletionLog {
  deletedAt: string;
  reason?: string;
}

interface User {
  id: string;
  name?: string;
  username: string;
  email: string;
  image?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
  deletedAt?: string;
  isDeleted: boolean;
  phoneNumber?: string;
  country?: string;
  region?: string;
  city?: string;
  countryCode?: string;
  twoFactorEnabled: boolean;
  twoFactorVerified: boolean;
  roles: { role: RoleValue }[];
  loginHistory: LoginHistory[];
  historyLog: HistoryLog[];
  deletionLog: DeletionLog[];
}

interface UserViewProps {
  userId?: string;
  isSelf?: boolean;
  onBack?: () => void;
  onEdit?: (user: User) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name?: string) =>
  (name ?? "?")
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const formatDate = (str?: string) => {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (str?: string) => {
  if (!str) return "—";
  return new Date(str).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const parseUA = (ua?: string) => {
  if (!ua) return { browser: "Unknown", os: "Unknown", device: "Desktop" };
  const isPhone = /iPhone|Android.*Mobile/.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/.test(ua);
  const device = isPhone ? "Mobile" : isTablet ? "Tablet" : "Desktop";
  const browser = /Edg/.test(ua)
    ? "Edge"
    : /Chrome/.test(ua)
      ? "Chrome"
      : /Firefox/.test(ua)
        ? "Firefox"
        : /Safari/.test(ua)
          ? "Safari"
          : "Browser";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Macintosh/.test(ua)
      ? "macOS"
      : /X11/.test(ua)
        ? "Linux"
        : /iPhone/.test(ua)
          ? "iOS"
          : /Android/.test(ua)
            ? "Android"
            : "OS";
  return { browser, os, device };
};

const deviceIcon = (ua?: string) => {
  const { device } = parseUA(ua);
  return device === "Mobile"
    ? "ri-smartphone-line"
    : device === "Tablet"
      ? "ri-tablet-line"
      : "ri-computer-line";
};

// ─── Config ───────────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<
  RoleValue,
  {
    color: string;
    hex: string;
    icon: string;
    label: string;
    desc: string;
    perms: string[];
  }
> = {
  superadmin: {
    color: "warning",
    hex: "#f6a234",
    icon: "ri-vip-crown-fill",
    label: "Super Admin",
    desc: "Full system access with the highest level of privileges.",
    perms: [
      "Manage all users",
      "Delete users permanently",
      "Manage roles",
      "View audit logs",
      "System configuration",
      "Access all modules",
    ],
  },
  admin: {
    color: "primary",
    hex: "#405189",
    icon: "ri-shield-fill",
    label: "Admin",
    desc: "Administrative access with management capabilities.",
    perms: [
      "Manage users",
      "Edit user data",
      "View reports",
      "Access most modules",
    ],
  },
  superuser: {
    color: "info",
    hex: "#0ab39c",
    icon: "ri-star-fill",
    label: "Super User",
    desc: "Elevated user with extended feature access.",
    perms: [
      "Access most features",
      "View reports",
      "Export data",
      "Manage own profile",
    ],
  },
  user: {
    color: "secondary",
    hex: "#878a99",
    icon: "ri-user-fill",
    label: "User",
    desc: "Standard user with basic access.",
    perms: ["View own profile", "Access basic features", "Update own data"],
  },
};

const STATUS_COLOR: Record<string, string> = {
  active: "success",
  inactive: "secondary",
  pending: "warning",
};
const ACTION_ICON: Record<string, string> = {
  update: "ri-pencil-line",
  delete: "ri-delete-bin-line",
  background_job: "ri-settings-line",
  create: "ri-add-circle-line",
};
const ACTION_COLOR: Record<string, string> = {
  update: "primary",
  delete: "danger",
  background_job: "secondary",
  create: "success",
};

const INITIAL_LIMIT = 10;

// ─── Sub-components ───────────────────────────────────────────────────────────
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div
    className="text-muted text-uppercase fw-bold mb-3"
    style={{ fontSize: 11, letterSpacing: "1px" }}
  >
    {children}
  </div>
);

interface InfoRow {
  icon: string;
  label: string;
  value: React.ReactNode;
  extra?: React.ReactNode;
}

const InfoList = ({ rows }: { rows: InfoRow[] }) => (
  <div className="d-flex flex-column">
    {rows.map((row, i) => (
      <div
        key={i}
        className="d-flex align-items-start gap-3 py-2"
        style={{
          borderBottom: i < rows.length - 1 ? "1px solid #f5f5f5" : "none",
        }}
      >
        <div
          className="d-flex align-items-center justify-content-center rounded bg-light"
          style={{ width: 30, height: 30, flexShrink: 0, marginTop: 2 }}
        >
          <i className={`${row.icon} text-muted`} style={{ fontSize: 14 }} />
        </div>
        <div className="flex-grow-1 overflow-hidden">
          <div
            className="text-muted text-uppercase fw-semibold"
            style={{ fontSize: 10, letterSpacing: "0.5px" }}
          >
            {row.label}
          </div>
          <div
            className="fw-medium d-flex align-items-center"
            style={{ fontSize: 13, marginTop: 2 }}
          >
            {row.value}
            {row.extra}
          </div>
        </div>
      </div>
    ))}
  </div>
);

const EmptyState = ({ icon, text }: { icon: string; text: string }) => (
  <div className="text-center py-5 text-muted">
    <i
      className={`${icon} d-block mb-2`}
      style={{ fontSize: 40, opacity: 0.3 }}
    />
    <p className="mb-0" style={{ fontSize: 14 }}>
      {text}
    </p>
  </div>
);

// ─── Scrollable Table wrapper ─────────────────────────────────────────────────
const ScrollTable = ({
  children,
  maxHeight = 380,
}: {
  children: React.ReactNode;
  maxHeight?: number;
}) => (
  <div
    style={{
      maxHeight,
      overflowY: "auto",
      borderRadius: 8,
      border: "1px solid #f0f0f0",
    }}
  >
    <table
      className="table table-hover align-middle mb-0"
      style={{ fontSize: 13 }}
    >
      {children}
    </table>
  </div>
);

const THead = ({ cols }: { cols: string[] }) => (
  <thead
    style={{ position: "sticky", top: 0, zIndex: 2, background: "#f8f9fa" }}
  >
    <tr>
      {cols.map(h => (
        <th
          key={h}
          className="text-muted text-uppercase fw-semibold py-2 px-3"
          style={{
            fontSize: 11,
            letterSpacing: "0.5px",
            border: "none",
            whiteSpace: "nowrap",
          }}
        >
          {h}
        </th>
      ))}
    </tr>
  </thead>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const UserView = ({
  userId,
  isSelf = false,
  onBack,
  onEdit,
}: UserViewProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showAllAudit, setShowAllAudit] = useState(false);
  const [showAllLogin, setShowAllLogin] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError("");
      try {
        const url = isSelf ? "/api/apps/users/me" : `/api/apps/users/${userId}`;
        const res = await fetch(url);
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || `Error ${res.status}`);
        }
        setUser(await res.json());
      } catch (err: any) {
        setError(err.message || "Failed to load user");
      } finally {
        setLoading(false);
      }
    };

    if (isSelf || userId) fetchUser();
  }, [userId, isSelf]);

  if (loading)
    return (
      <div className="d-flex align-items-center justify-content-center py-5">
        <Spinner color="primary" className="me-2" />
        <span className="text-muted">Loading user data...</span>
      </div>
    );

  if (error || !user)
    return (
      <div className="text-center py-5 text-danger">
        <i
          className="ri-error-warning-line d-block mb-2"
          style={{ fontSize: 48, opacity: 0.5 }}
        />
        <p className="fw-semibold">{error || "User not found"}</p>
        {onBack && (
          <button
            className="btn btn-sm btn-outline-secondary mt-2"
            onClick={onBack}
          >
            <i className="ri-arrow-left-line me-1" />
            Go Back
          </button>
        )}
      </div>
    );

  const roleVal = user.roles?.[0]?.role ?? "user";
  const roleConf = ROLE_CONFIG[roleVal] ?? ROLE_CONFIG.user;
  const isDeleted = user.isDeleted;
  const loginHistory = user.loginHistory ?? [];
  const historyLog = user.historyLog ?? [];

  const visibleLogs = showAllAudit
    ? historyLog
    : historyLog.slice(0, INITIAL_LIMIT);
  const visibleLogins = showAllLogin
    ? loginHistory
    : loginHistory.slice(0, INITIAL_LIMIT);

  const accountAgeDays = Math.floor(
    (Date.now() - new Date(user.createdAt).getTime()) / 86400000
  );
  const accountAge =
    accountAgeDays > 365
      ? `${Math.floor(accountAgeDays / 365)}y ${Math.floor((accountAgeDays % 365) / 30)}m`
      : `${accountAgeDays}d`;

  return (
    <div>
      {onBack && (
        <button
          className="btn btn-sm btn-soft-secondary mb-3 d-inline-flex align-items-center gap-1"
          onClick={onBack}
        >
          <i className="ri-arrow-left-line" />
          Back to User List
        </button>
      )}

      <Row className="g-4">
        {/* ══ LEFT SIDEBAR ═══════════════════════════════════════════════════ */}
        <Col xl={3} lg={4}>
          <Card
            className="border-0"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,.08)" }}
          >
            <div
              style={{
                height: 110,
                position: "relative",
                borderRadius: "8px 8px 0 0",
                overflow: "hidden",
                background: `linear-gradient(135deg, ${roleConf.hex}cc 0%, ${roleConf.hex}66 100%)`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,.12)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -30,
                  left: -10,
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,.08)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  left: "40%",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,.1)",
                }}
              />
            </div>

            <div
              className="text-center"
              style={{ marginTop: -44, position: "relative", zIndex: 2 }}
            >
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "4px solid #fff",
                    boxShadow: "0 4px 16px rgba(0,0,0,.18)",
                    display: "inline-block",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${roleConf.hex} 0%, ${roleConf.hex}aa 100%)`,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 30,
                    fontWeight: 800,
                    color: "#fff",
                    border: "4px solid #fff",
                    boxShadow: "0 4px 16px rgba(0,0,0,.18)",
                    letterSpacing: -1,
                  }}
                >
                  {getInitials(user.name)}
                </div>
              )}
            </div>

            <CardBody className="px-3 pb-4 pt-2">
              <div className="text-center mt-2 mb-3">
                <h5 className="fw-bold mb-1" style={{ fontSize: 17 }}>
                  {user.name ?? user.username}
                </h5>
                <p className="text-muted mb-3" style={{ fontSize: 13 }}>
                  @{user.username}
                </p>
                <div className="d-flex justify-content-center gap-2 flex-wrap">
                  <span
                    className={`badge bg-${roleConf.color}-subtle text-${roleConf.color} px-3 py-2`}
                    style={{ borderRadius: 20, fontSize: 12, fontWeight: 600 }}
                  >
                    <i className={`${roleConf.icon} me-1`} />
                    {roleConf.label}
                  </span>
                  <span
                    className={`badge bg-${isDeleted ? "danger" : STATUS_COLOR[user.status]}-subtle text-${isDeleted ? "danger" : STATUS_COLOR[user.status]} px-3 py-2 text-capitalize`}
                    style={{ borderRadius: 20, fontSize: 12, fontWeight: 600 }}
                  >
                    <i
                      className={`ri-radio-button-${user.status === "active" ? "line" : "fill"} me-1`}
                    />
                    {isDeleted ? "Deleted" : user.status}
                  </span>
                </div>
              </div>

              <div
                style={{
                  height: 1,
                  background:
                    "linear-gradient(90deg, transparent, #e9ecef, transparent)",
                  margin: "16px 0",
                }}
              />

              <div className="d-flex flex-column gap-3 px-1">
                {[
                  {
                    icon: "ri-mail-line",
                    color: "primary",
                    label: "Email",
                    value: user.email,
                  },
                  {
                    icon: "ri-phone-line",
                    color: "success",
                    label: "Phone",
                    value: (user.phoneNumber ?? "—").replace(/-/g, ""),
                  },
                  {
                    icon: "ri-map-pin-line",
                    color: "info",
                    label: "Location",
                    value:
                      [user.city, user.region, user.country]
                        .filter(Boolean)
                        .join(", ") || "—",
                  },
                  {
                    icon: "ri-calendar-line",
                    color: "warning",
                    label: "Joined",
                    value: formatDate(user.createdAt),
                  },
                ].map((r, i) => (
                  <div key={i} className="d-flex align-items-center gap-3">
                    <div
                      className={`d-flex align-items-center justify-content-center rounded-circle bg-${r.color}-subtle`}
                      style={{ width: 34, height: 34, flexShrink: 0 }}
                    >
                      <i
                        className={`${r.icon} text-${r.color}`}
                        style={{ fontSize: 15 }}
                      />
                    </div>
                    <div className="overflow-hidden">
                      <div
                        className="text-muted text-uppercase fw-semibold"
                        style={{ fontSize: 10, letterSpacing: "0.6px" }}
                      >
                        {r.label}
                      </div>
                      <div
                        className="text-truncate fw-medium"
                        style={{ fontSize: 13 }}
                        title={r.value}
                      >
                        {r.value}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="d-flex align-items-center gap-3">
                  <div
                    className={`d-flex align-items-center justify-content-center rounded-circle bg-${user.twoFactorEnabled ? "success" : "secondary"}-subtle`}
                    style={{ width: 34, height: 34, flexShrink: 0 }}
                  >
                    <i
                      className={`ri-shield-keyhole-line text-${user.twoFactorEnabled ? "success" : "secondary"}`}
                      style={{ fontSize: 15 }}
                    />
                  </div>
                  <div>
                    <div
                      className="text-muted text-uppercase fw-semibold"
                      style={{ fontSize: 10, letterSpacing: "0.6px" }}
                    >
                      2FA
                    </div>
                    {user.twoFactorEnabled ? (
                      <div
                        className="text-success fw-semibold"
                        style={{ fontSize: 13 }}
                      >
                        <i className="ri-check-line me-1" />
                        Enabled{user.twoFactorVerified ? " & Verified" : ""}
                      </div>
                    ) : (
                      <div className="text-muted" style={{ fontSize: 13 }}>
                        Not Enabled
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div
                style={{
                  height: 1,
                  background:
                    "linear-gradient(90deg, transparent, #e9ecef, transparent)",
                  margin: "16px 0",
                }}
              />

              {!isSelf && (
                <div className="d-flex gap-2">
                  <Button
                    color="primary"
                    size="sm"
                    className="flex-fill fw-semibold"
                    style={{ borderRadius: 8 }}
                    onClick={() => onEdit?.(user)}
                  >
                    <i className="ri-pencil-line me-1" />
                    Edit
                  </Button>
                  <Button
                    color="danger"
                    outline
                    size="sm"
                    className="flex-fill fw-semibold"
                    style={{ borderRadius: 8 }}
                    disabled={isDeleted}
                  >
                    <i className="ri-delete-bin-line me-1" />
                    {isDeleted ? "Deleted" : "Delete"}
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>

          <Card
            className="border-0 mt-3"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}
          >
            <CardBody className="py-3 px-3">
              <div
                className="text-muted text-uppercase fw-semibold mb-2"
                style={{ fontSize: 10, letterSpacing: "0.6px" }}
              >
                User ID
              </div>
              <div className="d-flex align-items-center justify-content-between">
                <code
                  className="text-primary"
                  style={{
                    fontSize: 12,
                    background: "#f3f6f9",
                    padding: "4px 10px",
                    borderRadius: 6,
                  }}
                >
                  {user.id.slice(0, 16)}...
                </code>
                <button
                  className="btn btn-soft-secondary btn-sm p-1 ms-2"
                  title="Copy"
                  onClick={() => navigator.clipboard?.writeText(user.id)}
                >
                  <i className="ri-file-copy-line" style={{ fontSize: 14 }} />
                </button>
              </div>
            </CardBody>
          </Card>

          {isDeleted && user.deletionLog?.[0] && (
            <Card
              className="border-0 mt-3"
              style={{
                boxShadow: "0 2px 12px rgba(240,101,72,.12)",
                borderLeft: "3px solid #f06548",
              }}
            >
              <CardBody className="py-3 px-3">
                <div
                  className="text-danger text-uppercase fw-semibold mb-2 d-flex align-items-center gap-1"
                  style={{ fontSize: 10, letterSpacing: "0.6px" }}
                >
                  <i className="ri-delete-bin-2-line" />
                  Deletion Info
                </div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  <span className="fw-semibold">Date: </span>
                  {formatDate(user.deletionLog[0].deletedAt)}
                </div>
                <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                  <span className="fw-semibold">Reason: </span>
                  {user.deletionLog[0].reason ?? "—"}
                </div>
              </CardBody>
            </Card>
          )}
        </Col>

        {/* ══ RIGHT MAIN ═════════════════════════════════════════════════════ */}
        <Col xl={9} lg={8}>
          <Row className="g-3 mb-4">
            {[
              {
                label: "Last Login",
                value: formatDateTime(user.lastLogin),
                icon: "ri-login-circle-line",
                color: "primary",
              },
              {
                label: "Login Sessions",
                value: loginHistory.length || 0,
                icon: "ri-history-line",
                color: "success",
              },
              {
                label: "Edit History",
                value: historyLog.length || 0,
                icon: "ri-edit-line",
                color: "warning",
              },
              {
                label: "Account Age",
                value: accountAge,
                icon: "ri-time-line",
                color: "info",
              },
            ].map((s, i) => (
              <Col sm={6} xl={3} key={i}>
                <Card
                  className="border-0 h-100"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}
                >
                  <CardBody className="d-flex align-items-center gap-3 py-3 px-3">
                    <div
                      className={`d-flex align-items-center justify-content-center rounded-circle bg-${s.color}-subtle`}
                      style={{ width: 46, height: 46, flexShrink: 0 }}
                    >
                      <i
                        className={`${s.icon} text-${s.color}`}
                        style={{ fontSize: 20 }}
                      />
                    </div>
                    <div className="overflow-hidden">
                      <div
                        className="text-muted text-uppercase fw-semibold text-truncate"
                        style={{ fontSize: 10, letterSpacing: "0.6px" }}
                      >
                        {s.label}
                      </div>
                      <div
                        className="fw-bold text-truncate"
                        style={{ fontSize: 16 }}
                      >
                        {s.value}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            ))}
          </Row>

          <Card
            className="border-0"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,.08)" }}
          >
            <CardBody className="p-4">
              <Nav tabs className="nav-tabs-custom nav-primary mb-4">
                {[
                  { id: "overview", icon: "ri-user-3-line", label: "Overview" },
                  {
                    id: "activity",
                    icon: "ri-history-line",
                    label: "Login History",
                    count: loginHistory.length,
                  },
                  {
                    id: "audit",
                    icon: "ri-file-list-3-line",
                    label: "Audit Trail",
                    count: historyLog.length,
                  },
                  {
                    id: "permissions",
                    icon: "ri-shield-line",
                    label: "Permissions",
                  },
                ].map(tab => (
                  <NavItem key={tab.id}>
                    <NavLink
                      className={classnames(
                        "d-flex align-items-center gap-1 fw-medium",
                        { active: activeTab === tab.id }
                      )}
                      style={{ cursor: "pointer", fontSize: 13 }}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <i className={tab.icon} style={{ fontSize: 15 }} />
                      {tab.label}
                      {!!tab.count && (
                        <span
                          className="badge bg-primary-subtle text-primary ms-1"
                          style={{ fontSize: 10, borderRadius: 10 }}
                        >
                          {tab.count}
                        </span>
                      )}
                    </NavLink>
                  </NavItem>
                ))}
              </Nav>

              <TabContent activeTab={activeTab}>
                {/* ── Overview ── */}
                <TabPane tabId="overview">
                  <Row className="g-4">
                    <Col md={6}>
                      <SectionLabel>Personal Information</SectionLabel>
                      <InfoList
                        rows={[
                          {
                            icon: "ri-user-line",
                            label: "Full Name",
                            value: user.name ?? "—",
                          },
                          {
                            icon: "ri-at-line",
                            label: "Username",
                            value: `@${user.username}`,
                          },
                          {
                            icon: "ri-mail-line",
                            label: "Email",
                            value: user.email,
                          },
                          {
                            icon: "ri-phone-line",
                            label: "Phone",
                            value: (user.phoneNumber ?? "—").replace(/-/g, ""),
                          },
                          {
                            icon: "ri-building-line",
                            label: "City",
                            value: user.city ?? "—",
                          },
                          {
                            icon: "ri-map-2-line",
                            label: "Region",
                            value: user.region ?? "—",
                          },
                          {
                            icon: "ri-global-line",
                            label: "Country",
                            value: user.country ?? "—",
                            extra: user.countryCode ? (
                              <img
                                src={`https://flagcdn.com/w40/${user.countryCode}.png`}
                                width={16}
                                height={12}
                                alt=""
                                style={{
                                  borderRadius: 2,
                                  objectFit: "cover",
                                  marginLeft: 6,
                                }}
                              />
                            ) : null,
                          },
                          {
                            icon: "ri-flag-line",
                            label: "Country Code",
                            value: user.countryCode?.toUpperCase() ?? "—",
                          },
                        ]}
                      />
                    </Col>
                    <Col md={6}>
                      <SectionLabel>Account Information</SectionLabel>
                      <InfoList
                        rows={[
                          {
                            icon: "ri-fingerprint-line",
                            label: "User ID",
                            value: (
                              <code
                                style={{
                                  fontSize: 11,
                                  background: "#f3f6f9",
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                }}
                              >
                                {user.id.slice(0, 16)}...
                              </code>
                            ),
                          },
                          {
                            icon: "ri-shield-user-line",
                            label: "Role",
                            value: roleConf.label,
                          },
                          {
                            icon: "ri-toggle-line",
                            label: "Status",
                            value: (
                              <Badge
                                color={
                                  isDeleted
                                    ? "danger"
                                    : STATUS_COLOR[user.status]
                                }
                                className="text-capitalize px-2 py-1"
                                style={{ borderRadius: 8, fontSize: 11 }}
                              >
                                {isDeleted ? "Deleted" : user.status}
                              </Badge>
                            ),
                          },
                          {
                            icon: "ri-calendar-event-line",
                            label: "Joined",
                            value: formatDate(user.createdAt),
                          },
                          {
                            icon: "ri-refresh-line",
                            label: "Last Updated",
                            value: formatDate(user.updatedAt),
                          },
                          {
                            icon: "ri-login-box-line",
                            label: "Last Login",
                            value: formatDateTime(user.lastLogin),
                          },
                          {
                            icon: "ri-shield-keyhole-line",
                            label: "2FA Status",
                            value: user.twoFactorEnabled ? (
                              <span className="text-success fw-semibold">
                                Enabled
                                {user.twoFactorVerified
                                  ? " & Verified"
                                  : " (Unverified)"}
                              </span>
                            ) : (
                              <span className="text-muted">Disabled</span>
                            ),
                          },
                          {
                            icon: "ri-delete-bin-2-line",
                            label: "Deleted At",
                            value: user.deletedAt ? (
                              <span className="text-danger fw-semibold">
                                {formatDate(user.deletedAt)}
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            ),
                          },
                        ]}
                      />
                    </Col>
                  </Row>
                </TabPane>

                {/* ── Login History ── */}
                <TabPane tabId="activity">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <SectionLabel>Login History</SectionLabel>
                    {loginHistory.length > 0 && (
                      <span
                        className="badge bg-success-subtle text-success px-2 py-1"
                        style={{ fontSize: 11, borderRadius: 6 }}
                      >
                        {loginHistory.length} sessions
                      </span>
                    )}
                  </div>

                  {loginHistory.length === 0 ? (
                    <EmptyState
                      icon="ri-history-line"
                      text="No login history recorded"
                    />
                  ) : (
                    <>
                      <ScrollTable maxHeight={360}>
                        <THead
                          cols={[
                            "#",
                            "Timestamp",
                            "Browser / OS",
                            "Device",
                            "IP Address",
                          ]}
                        />
                        <tbody>
                          {visibleLogins.map((log, i) => {
                            const { browser, os } = parseUA(log.userAgent);
                            return (
                              <tr
                                key={log.id}
                                style={{ borderBottom: "1px solid #f0f0f0" }}
                              >
                                <td
                                  className="text-muted px-3"
                                  style={{ width: 40 }}
                                >
                                  {i + 1}
                                </td>
                                <td className="px-3">
                                  <div className="d-flex align-items-center gap-2">
                                    <div
                                      className="d-flex align-items-center justify-content-center rounded-circle bg-primary-subtle"
                                      style={{
                                        width: 28,
                                        height: 28,
                                        flexShrink: 0,
                                      }}
                                    >
                                      <i
                                        className="ri-login-circle-line text-primary"
                                        style={{ fontSize: 13 }}
                                      />
                                    </div>
                                    {formatDateTime(log.timestamp)}
                                  </div>
                                </td>
                                <td className="text-muted px-3">
                                  {browser} · {os}
                                </td>
                                <td className="px-3">
                                  <div className="d-flex align-items-center gap-1">
                                    <i
                                      className={`${deviceIcon(log.userAgent)} text-muted`}
                                    />
                                    <span className="text-muted">
                                      {parseUA(log.userAgent).device}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3">
                                  <code
                                    className="text-muted"
                                    style={{
                                      fontSize: 12,
                                      background: "#f3f6f9",
                                      padding: "2px 8px",
                                      borderRadius: 4,
                                    }}
                                  >
                                    {log.ipAddress ?? "—"}
                                  </code>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </ScrollTable>

                      {loginHistory.length > INITIAL_LIMIT && (
                        <button
                          className="btn btn-sm btn-soft-secondary w-100 mt-2 fw-semibold"
                          onClick={() => setShowAllLogin(p => !p)}
                        >
                          {showAllLogin ? (
                            <>
                              <i className="ri-arrow-up-s-line me-1" />
                              Show Less
                            </>
                          ) : (
                            <>
                              <i className="ri-arrow-down-s-line me-1" />
                              Show All ({loginHistory.length} sessions)
                            </>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </TabPane>

                {/* ── Audit Trail ── */}
                <TabPane tabId="audit">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <SectionLabel>Audit Trail</SectionLabel>
                    {historyLog.length > 0 && (
                      <span
                        className="badge bg-warning-subtle text-warning px-2 py-1"
                        style={{ fontSize: 11, borderRadius: 6 }}
                      >
                        {historyLog.length} records
                      </span>
                    )}
                  </div>

                  {historyLog.length === 0 ? (
                    <EmptyState
                      icon="ri-file-list-3-line"
                      text="No audit records found"
                    />
                  ) : (
                    <>
                      <ScrollTable maxHeight={360}>
                        <THead
                          cols={[
                            "#",
                            "Action",
                            "Entity",
                            "Reason",
                            "Performed By",
                            "Date",
                          ]}
                        />
                        <tbody>
                          {visibleLogs.map((log, i) => {
                            const aColor =
                              ACTION_COLOR[log.actionType] ?? "secondary";
                            const aIcon =
                              ACTION_ICON[log.actionType] ??
                              "ri-information-line";
                            return (
                              <tr
                                key={log.id}
                                style={{ borderBottom: "1px solid #f0f0f0" }}
                              >
                                <td
                                  className="text-muted px-3"
                                  style={{ width: 40 }}
                                >
                                  {i + 1}
                                </td>
                                <td className="px-3">
                                  <span
                                    className={`badge bg-${aColor}-subtle text-${aColor} text-capitalize px-2 py-1 d-inline-flex align-items-center gap-1`}
                                    style={{ fontSize: 11, borderRadius: 6 }}
                                  >
                                    <i
                                      className={aIcon}
                                      style={{ fontSize: 12 }}
                                    />
                                    {log.actionType}
                                  </span>
                                </td>
                                <td className="px-3">
                                  <span className="text-capitalize fw-medium">
                                    {log.entityType}
                                  </span>
                                </td>
                                <td className="px-3" style={{ maxWidth: 220 }}>
                                  <span
                                    className="text-muted d-block text-truncate"
                                    style={{ maxWidth: 220 }}
                                    title={log.reason}
                                  >
                                    {log.reason || "—"}
                                  </span>
                                </td>
                                <td className="px-3">
                                  {log.performedById ? (
                                    <code
                                      style={{
                                        fontSize: 11,
                                        background: "#f3f6f9",
                                        padding: "2px 8px",
                                        borderRadius: 4,
                                      }}
                                    >
                                      {log.performedById.slice(0, 12)}...
                                    </code>
                                  ) : (
                                    <span className="text-muted">System</span>
                                  )}
                                </td>
                                <td
                                  className="px-3 text-muted"
                                  style={{ whiteSpace: "nowrap" }}
                                >
                                  {formatDateTime(log.performedAt)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </ScrollTable>

                      {historyLog.length > INITIAL_LIMIT && (
                        <button
                          className="btn btn-sm btn-soft-secondary w-100 mt-2 fw-semibold"
                          onClick={() => setShowAllAudit(p => !p)}
                        >
                          {showAllAudit ? (
                            <>
                              <i className="ri-arrow-up-s-line me-1" />
                              Show Less
                            </>
                          ) : (
                            <>
                              <i className="ri-arrow-down-s-line me-1" />
                              Show All ({historyLog.length} records)
                            </>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </TabPane>

                {/* ── Permissions ── */}
                <TabPane tabId="permissions">
                  <Row className="g-4">
                    <Col md={5}>
                      <div
                        className={`p-4 rounded-3 bg-${roleConf.color}-subtle`}
                        style={{ border: "1px solid rgba(0,0,0,.06)" }}
                      >
                        <div className="d-flex align-items-center gap-3 mb-3">
                          <div
                            className={`d-flex align-items-center justify-content-center rounded-circle bg-${roleConf.color}`}
                            style={{
                              width: 52,
                              height: 52,
                              flexShrink: 0,
                              boxShadow: `0 4px 12px ${roleConf.hex}55`,
                            }}
                          >
                            <i
                              className={`${roleConf.icon} text-white`}
                              style={{ fontSize: 22 }}
                            />
                          </div>
                          <div>
                            <h6 className="fw-bold mb-0">{roleConf.label}</h6>
                            <div
                              className="text-muted"
                              style={{ fontSize: 12 }}
                            >
                              Assigned Role
                            </div>
                          </div>
                        </div>
                        <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                          {roleConf.desc}
                        </p>
                      </div>

                      <div
                        className="mt-3 p-3 rounded-3 bg-light"
                        style={{ border: "1px solid #e9ecef" }}
                      >
                        <div
                          className="text-muted text-uppercase fw-semibold mb-3 d-flex align-items-center gap-1"
                          style={{ fontSize: 10, letterSpacing: "0.6px" }}
                        >
                          <i className="ri-shield-keyhole-line" />
                          Two-Factor Auth
                        </div>
                        {[
                          { label: "2FA Enabled", val: user.twoFactorEnabled },
                          {
                            label: "2FA Verified",
                            val: user.twoFactorVerified,
                          },
                        ].map((r, i) => (
                          <div
                            key={i}
                            className={`d-flex justify-content-between align-items-center ${i > 0 ? "mt-2" : ""}`}
                          >
                            <span style={{ fontSize: 13 }}>{r.label}</span>
                            <Badge
                              color={r.val ? "success" : "secondary"}
                              className="px-2 py-1"
                              style={{ fontSize: 11, borderRadius: 6 }}
                            >
                              {r.val ? "Yes" : "No"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </Col>

                    <Col md={7}>
                      <SectionLabel>Access Permissions</SectionLabel>
                      <div className="d-flex flex-wrap gap-2">
                        {roleConf.perms.map((perm, i) => (
                          <div
                            key={i}
                            className="d-flex align-items-center gap-2 bg-light px-3 py-2"
                            style={{
                              borderRadius: 20,
                              border: "1px solid #e9ecef",
                              fontSize: 13,
                            }}
                          >
                            <i
                              className="ri-checkbox-circle-fill text-success"
                              style={{ fontSize: 14 }}
                            />
                            {perm}
                          </div>
                        ))}
                      </div>
                      <div
                        className="mt-4 p-3 rounded-3"
                        style={{
                          background: "#f8f9fa",
                          border: "1px solid #e9ecef",
                        }}
                      >
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <i className="ri-information-line text-muted" />
                          <span
                            className="text-muted text-uppercase fw-semibold"
                            style={{ fontSize: 10, letterSpacing: "0.5px" }}
                          >
                            Note
                          </span>
                        </div>
                        <p className="text-muted mb-0" style={{ fontSize: 12 }}>
                          Permissions are inherited from the assigned role.
                          Contact a Super Admin to modify role assignments.
                        </p>
                      </div>
                    </Col>
                  </Row>
                </TabPane>
              </TabContent>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserView;
