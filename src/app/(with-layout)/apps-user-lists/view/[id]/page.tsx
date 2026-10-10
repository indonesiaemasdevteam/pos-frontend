import React from "react";
import { Container } from "reactstrap";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import BreadCrumb from "@components/Common/BreadCrumb";
import UserView from "@/components/UserLists/UserView";

const UserViewPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const { id } = await params;

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="User Detail" pageTitle="Users" />
          <UserView userId={id} />
        </Container>
      </div>
    </React.Fragment>
  );
};

export default UserViewPage;
