import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { LeadProvider } from "./contexts/LeadContext";
import { WhatsAppProvider } from "./contexts/WhatsAppContext";
import { LoginPage } from "./pages/LoginPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { Layout } from "./components/layout/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { LeadsPage } from "./pages/LeadsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import MessagesPage from "./pages/MessagesPage";
import WhatsAppPage from "./pages/WhatsAppPage";
import { SchedulerPage } from "./pages/SchedulerPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { useUserSettings } from "./hooks/useUserSettings";
import { Loader2 } from "lucide-react";

import { ErrorBoundary } from "./components/common/ErrorBoundary";

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const { settings, isLoading: settingsLoading } = useUserSettings();

    if (isLoading || settingsLoading) {
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

    // Yeni kullanıcı (onboarding_completed === false) → onboarding'e yönlendir
    if (settings.onboarding_completed === false) {
        return <Navigate to="/onboarding" replace />;
    }

    return (
        <LeadProvider>
            <WhatsAppProvider>
                {children}
            </WhatsAppProvider>
        </LeadProvider>
    );
};

const App = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <NotificationProvider>
                    <ErrorBoundary>
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/reset-password" element={<ResetPasswordPage />} />
                            <Route path="/onboarding" element={<OnboardingPage />} />

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
