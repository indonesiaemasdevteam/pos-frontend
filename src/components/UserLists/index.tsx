"use client";

import React, { useCallback, useState } from "react";
import { Row, Col } from "reactstrap";
import UserListTable from "./UserListTable";
import UserListCards from "./UserListCards";
import type { UserListProps } from "./types";

const UserList = ({ session, countriesdata }: UserListProps) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  return (
    <React.Fragment>
      <Row>
        <Col xs={12}>
          <UserListCards refreshKey={refreshKey} />
        </Col>
      </Row>
      <Row>
        <Col xs={12}>
          <UserListTable
            session={session}
            countriesdata={countriesdata}
            onDataChange={handleRefresh}
          />
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default UserList;
