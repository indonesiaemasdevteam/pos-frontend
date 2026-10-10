// src/app/(with-layout)/apps-calendar-management/page.tsx
import React from "react";
import { Container } from "reactstrap";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import BreadCrumb from "@common/BreadCrumb";
import CalendarManagement from "@components/CalendarManagement";

const CalendarManagementPage = async () => {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const isAllowed = session.user?.roles?.some((r: any) =>
    ["admin", "superadmin"].includes(r.role)
  );

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Calendar Management" pageTitle="Apps" />
          <CalendarManagement isAllowed={!!isAllowed} />
        </Container>
      </div>
    </React.Fragment>
  );
};

export default CalendarManagementPage;
