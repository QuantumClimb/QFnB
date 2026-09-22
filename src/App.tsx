import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { OrgProvider } from "./context/OrgContext";
import { LoginPage } from "./pages/LoginPage";
import { SetupPage } from "./pages/SetupPage";
import { AppShell } from "./components/AppShell";
import { OverviewPage } from "./pages/OverviewPage";
import { ReservationsPage } from "./pages/ReservationsPage";
import { FloorPage } from "./pages/FloorPage";
import { QueuePage } from "./pages/QueuePage";
import { OrdersPage } from "./pages/OrdersPage";
import { GuestsPage } from "./pages/GuestsPage";
import { OffersPage } from "./pages/OffersPage";
import { InsightsPage } from "./pages/InsightsPage";
import { StaffPage } from "./pages/StaffPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

import { PermissionGuard } from "./components/PermissionGuard";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OrgProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/setup" element={<SetupPage />} />
            
            {/* App Routes wrapped inside AppShell & ProtectedRoute */}
            <Route 
              path="/app/*" 
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Routes>
                      <Route path="overview" element={<PermissionGuard requiredPermission="today.read"><OverviewPage /></PermissionGuard>} />
                      <Route path="today" element={<Navigate to="/app/overview" replace />} />
                      <Route path="reservations" element={<PermissionGuard requiredPermission="reservations.read"><ReservationsPage /></PermissionGuard>} />
                      <Route path="floor" element={<PermissionGuard requiredPermission="floor.read"><FloorPage /></PermissionGuard>} />
                      <Route path="queue" element={<PermissionGuard requiredPermission="queue.read"><QueuePage /></PermissionGuard>} />
                      <Route path="orders" element={<PermissionGuard requiredPermission="orders.read"><OrdersPage /></PermissionGuard>} />
                      <Route path="guests" element={<PermissionGuard requiredPermission="guests.read"><GuestsPage /></PermissionGuard>} />
                      <Route path="offers" element={<PermissionGuard requiredPermission="offers.read"><OffersPage /></PermissionGuard>} />
                      <Route path="insights" element={<PermissionGuard requiredPermission="insights.read"><InsightsPage /></PermissionGuard>} />
                      <Route path="staff" element={<PermissionGuard requiredPermission="staff.read"><StaffPage /></PermissionGuard>} />
                      <Route path="settings" element={<PermissionGuard requiredPermission="settings.read"><SettingsPage /></PermissionGuard>} />
                      <Route path="*" element={<Navigate to="overview" replace />} />
                    </Routes>
                  </AppShell>
                </ProtectedRoute>
              } 
            />

            <Route path="*" element={<Navigate to="/app/overview" replace />} />
          </Routes>
        </OrgProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
