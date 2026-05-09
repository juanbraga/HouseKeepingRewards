import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "@/lib/queryClient"
import { HouseholdProvider } from "@/context/HouseholdContext"
import { ToastProvider } from "@/components/ui/Toast"
import { Layout } from "@/components/layout/Layout"
import { AuthPage } from "@/pages/AuthPage"
import { HouseholdsPage } from "@/pages/HouseholdsPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { TasksPage } from "@/pages/TasksPage"
import { RewardsPage } from "@/pages/RewardsPage"
import { MembersPage } from "@/pages/MembersPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { useAuth } from "@/hooks/useAuth"

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>
  if (!user) return <Navigate to="/auth" replace />
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/households" element={<ProtectedRoute><HouseholdsPage /></ProtectedRoute>} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/rewards" element={<RewardsPage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/auth"} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HouseholdProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </HouseholdProvider>
    </QueryClientProvider>
  )
}
