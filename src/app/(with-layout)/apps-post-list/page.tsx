import React from "react";
import { Container } from "reactstrap";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import BreadCrumb from "@components/Common/BreadCrumb";
import PostLists from "@/components/Post";

const PostListsPage = async () => {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Post List" pageTitle="Posts" />
          <PostLists />
        </Container>
      </div>
    </React.Fragment>
  );
};

export default PostListsPage;
