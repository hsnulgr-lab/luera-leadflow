
import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/utils/cn";

export const Layout = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Map current path to active tab ID for sidebar highlighting
    const getCurrentTab = () => {
        const path = location.pathname.substring(1); // remove leading slash
        if (path === "") return "dashboard";
        return path;
    };

    return (
        <div className="min-h-screen bg-background">
            <Sidebar
                activeTab={getCurrentTab()}
                onTabChange={(tabId) => navigate(tabId === "dashboard" ? "/" : `/${tabId}`)}
                isCollapsed={isCollapsed}
                onCollapsedChange={setIsCollapsed}
            />

            <main className={cn(
                "transition-all duration-300",
                isCollapsed ? "ml-20" : "ml-64"
            )}>
                <Outlet />
            </main>
        </div>
    );
};
