import React from "react";
import Layout from "@/layouts/Layouts";
import ActivityWatcher from "./ActivityWatcher";

export default function WithLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout>
      {process.env.PREVIEW_MODE !== "true" && <ActivityWatcher />}
      {children}
    </Layout>
  );
}
