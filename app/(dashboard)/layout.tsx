"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout
      title="Autonation Testing AI"
      description="Test automation dashboard"
    >
      {children}
    </DashboardLayout>
  );
}
