// import React from "react";
// import { Container } from "reactstrap";
// import BreadCrumb from "@components/Common/BreadCrumb";

// import UserView from "@/components/UserLists/UserView";

/*
 * 🔌 API MIGRATION NOTE:
 * Kalau sudah pakai Next.js dynamic route, buat folder:
 *   src/app/(with-layout)/apps-user-lists/view/[id]/page.tsx
 *
 * Lalu ambil params seperti ini:
 *   const UserViewPage = ({ params }: { params: { id: string } }) => {
 *     return <UserView userId={params.id} />
 *   }
 *
 * Untuk sekarang (dummy mode), userId tidak perlu di-pass —
 * component akan otomatis ambil user pertama dari DUMMY_USERS.
 */

import React from "react";
import { Container } from "reactstrap";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import BreadCrumb from "@components/Common/BreadCrumb";
import UserView from "@/components/UserLists/UserView";

const UserViewPage = async () => {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="User Detail" pageTitle="Users" />
          <UserView isSelf={true} />
        </Container>
      </div>
    </React.Fragment>
  );
};

export default UserViewPage;
