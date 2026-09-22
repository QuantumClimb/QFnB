import React from "react";
import { DashboardProvider, TodayDashboard } from "../features/dashboard";

export function OverviewPage() {
  return (
    <DashboardProvider>
      <TodayDashboard />
    </DashboardProvider>
  );
}

export default OverviewPage;
