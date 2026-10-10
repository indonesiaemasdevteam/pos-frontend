"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { Providers } from "@/providers";
import { Toaster } from "react-hot-toast";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const isPreview = process.env.NEXT_PUBLIC_PREVIEW_MODE === "true";
  const previewSession = isPreview
    ? {
        user: {
          id: "preview-user",
          name: "POS Preview",
          email: "preview@localhost",
          roles: [{ role: "admin" }],
        },
        expires: "2099-12-31T23:59:59.999Z",
      }
    : undefined;

  return (
    <SessionProvider
      session={previewSession}
      refetchInterval={isPreview ? 0 : undefined}
      refetchOnWindowFocus={!isPreview}
    >
      <Providers>
        {children}
        <Toaster position="top-right" />
      </Providers>
    </SessionProvider>
  );
}
