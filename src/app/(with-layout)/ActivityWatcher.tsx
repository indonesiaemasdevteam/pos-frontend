"use client";

import { useSessionActivity } from "@/hooks/useSessionActivity";

export default function ActivityWatcher() {
  useSessionActivity({
    idleTimeout: 15 * 60 * 1000, // 15 menit idle → logout
    checkInterval: 60 * 1000, // cek setiap 1 menit
  });

  return null;
}
