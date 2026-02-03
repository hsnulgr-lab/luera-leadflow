import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { LoginPage } from "./pages/LoginPage";
import { Layout } from "./components/layout/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { LeadsPage } from "./pages/LeadsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import MessagesPage from "./pages/MessagesPage";
import WhatsAppPage from "./pages/WhatsAppPage";
import { SchedulerPage } from "./pages/SchedulerPage";
import { SettingsPage } from "./pages/SettingsPage";
import { Loader2 } from "lucide-react";

import { ErrorBoundary } from "./components/common/ErrorBoundary";

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-[#CCFF00] animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 text-sm">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

const App = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <NotificationProvider>
                    <ErrorBoundary>
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />

                            <Route path="/" element={
                                <ProtectedRoute>
                                    <Layout />
                                </ProtectedRoute>
                            }>
                                <Route index element={<DashboardPage />} />
                                <Route path="leads" element={<LeadsPage />} />
                                <Route path="analytics" element={<AnalyticsPage />} />
                                <Route path="whatsapp" element={<WhatsAppPage />} />
                                <Route path="messages" element={<MessagesPage />} />
                                <Route path="scheduler" element={<SchedulerPage />} />
                                <Route path="settings" element={<SettingsPage />} />
                            </Route>

                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </ErrorBoundary>
                </NotificationProvider>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;
