"use client";

import React, { useState } from "react";
import {
  Card,
  CardBody,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
} from "reactstrap";
import classnames from "classnames";
import CalendarList from "./CalendarList";
import CategoryList from "./CategoryList";

interface Props {
  isAllowed: boolean;
}

// ─── Lock Screen ──────────────────────────────────────────────────────────────
const LockScreen = () => (
  <div
    className="d-flex align-items-center justify-content-center"
    style={{ minHeight: "60vh" }}
  >
    <div className="text-center">
      <div
        className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-4 bg-danger-subtle"
        style={{ width: 100, height: 100 }}
      >
        <i className="ri-lock-2-fill text-danger" style={{ fontSize: 48 }} />
      </div>
      <h4 className="fw-bold text-danger mb-2">Access Restricted</h4>
      <p
        className="text-muted mb-4"
        style={{ maxWidth: 360, margin: "0 auto" }}
      >
        This page is only accessible to <strong>Admin</strong> and{" "}
        <strong>Super Admin</strong>. Please contact your administrator if you
        need access.
      </p>
      <div className="d-flex justify-content-center gap-2 flex-wrap">
        <span
          className="badge bg-danger-subtle text-danger px-3 py-2"
          style={{ fontSize: 12, borderRadius: 20 }}
        >
          <i className="ri-shield-fill me-1" />
          Admin Only
        </span>
        <span
          className="badge bg-warning-subtle text-warning px-3 py-2"
          style={{ fontSize: 12, borderRadius: 20 }}
        >
          <i className="ri-vip-crown-fill me-1" />
          Super Admin Only
        </span>
      </div>
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const CalendarManagement = ({ isAllowed }: Props) => {
  const [activeTab, setActiveTab] = useState("calendars");

  if (!isAllowed) return <LockScreen />;

  return (
    <Card
      className="border-0"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,.08)" }}
    >
      <CardBody className="p-4">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h5 className="fw-bold mb-1">Calendar Management</h5>
            <p className="text-muted mb-0" style={{ fontSize: 13 }}>
              Manage calendars, types, and categories for Pantai Kelapa Tuban
            </p>
          </div>
        </div>

        <Nav tabs className="nav-tabs-custom nav-primary mb-4">
          {[
            { id: "calendars", icon: "ri-calendar-2-line", label: "Calendars" },
            {
              id: "categories",
              icon: "ri-price-tag-3-line",
              label: "Categories",
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
              </NavLink>
            </NavItem>
          ))}
        </Nav>

        <TabContent activeTab={activeTab}>
          <TabPane tabId="calendars">
            <CalendarList />
          </TabPane>
          <TabPane tabId="categories">
            <CategoryList />
          </TabPane>
        </TabContent>
      </CardBody>
    </Card>
  );
};

export default CalendarManagement;
