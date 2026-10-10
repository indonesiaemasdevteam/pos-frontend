"use client";

import React from "react";
import { Container } from "reactstrap";
import BreadCrumb from "@common/BreadCrumb";
import CalendarView from "@components/Calendar";

const CalendarPage = () => {
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Calendar" pageTitle="Apps" />
          <CalendarView />
        </Container>
      </div>
    </React.Fragment>
  );
};

export default CalendarPage;
