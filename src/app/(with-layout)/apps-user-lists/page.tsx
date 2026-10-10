import React from "react";
import { Container } from "reactstrap";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import BreadCrumb from "@components/Common/BreadCrumb";
import UserList from "@/components/UserLists";
import { DUMMY_COUNTRIES } from "@/components/UserLists/dummy";

const UserListsPage = async () => {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="User List" pageTitle="Users" />
          <UserList session={session} countriesdata={DUMMY_COUNTRIES} />
        </Container>
      </div>
    </React.Fragment>
  );
};

export default UserListsPage;
