"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";

export default function DashboardLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <div className="flex justify-end items-center gap-2 px-8 py-4 border-b border-[var(--color-steel)]/10">
          <ThemeToggle />
          <NotificationBell />
        </div>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
