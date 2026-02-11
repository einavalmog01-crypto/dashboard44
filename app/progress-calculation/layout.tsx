"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout
      title="Progress Calculation"
      description="Manage progress calculations"
    >
      {children}
    </DashboardLayout>
  );
}
