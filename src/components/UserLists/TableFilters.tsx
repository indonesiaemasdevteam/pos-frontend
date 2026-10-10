import { Col, Input, Label, Row } from "reactstrap";
import type { TableFiltersProps } from "./types";
import React from "react";
import rolesAPI from "../../helpers/roles";

const TableFilters = ({
  role,
  setRole,
  status,
  setStatus,
}: TableFiltersProps) => {
  const [roles, setRoles] = React.useState<any[] | any>([]);

  React.useEffect(() => {
    async function getAllRoles() {
      try {
        const res = await rolesAPI.fetchAllRoles();
        console.log("resssss", res);

        setRoles(res.data);
        console.log("successfully fetch roles", res);
      } catch (error) {
        console.log("error :", error);
      }
    }
    getAllRoles();
  }, []);
  return (
    <Row className="g-3 mb-3">
      <Col sm={4}>
        <Label className="form-label">Role</Label>
        <Input
          type="select"
          value={role}
          onChange={e => setRole(e.target.value)}
        >
          <option value="">All Roles</option>
          {roles.length > 0 &&
            roles.map((item: any, idx: any) => {
              return (
                <option key={idx} value={item.role}>
                  {item.role}
                </option>
              );
            })}
        </Input>
      </Col>

      <Col sm={4}>
        <Label className="form-label">Status</Label>
        <Input
          type="select"
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </Input>
      </Col>
    </Row>
  );
};

export default TableFilters;
