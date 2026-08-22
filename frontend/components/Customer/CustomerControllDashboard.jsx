import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import Dashboard from "./Dashboard";
import Profile from "./Profile";
import RepairStatus from "./RepairStatus";
import ServiceHistory from "./ServiceHistory";
import ReviewsRatings from "./ReviewsRatings";
import Notification, { useUnreadCount } from "./Notification";
import Settings from "./Settings";
import CustomerSidebar from "./CustomerSidebar";


function CustomerControllDashboard() {
    const location = useLocation();
    const navigate = useNavigate();

    const [currentPage, setCurrentPage] = useState(location.state?.targetPage || "dashboard");
    const [targetRequestId, setTargetRequestId] = useState(null);
    const [profileModalState, setProfileModalState] = useState(null);
    const [selectedNotifId, setSelectedNotifId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const unreadCount = useUnreadCount();

    useEffect(() => {
        if (location.state?.navigateTo === "repair") {
            setCurrentPage("repair");
            setTargetRequestId(location.state?.requestId || null);
            navigate(location.pathname, { replace: true, state: {} });
        } else if (location.state?.targetPage) {
            setCurrentPage(location.state.targetPage);
            setSelectedNotifId(location.state.selectedNotifId || null);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state?.navigateTo, location.state?.targetPage]);

    useEffect(() => {
        const handler = (e) => {
            if (e.detail?.tab === "repair-status" || e.detail?.tab === "repair") {
                setCurrentPage("repair");
            } else if (e.detail?.tab) {
                setCurrentPage(e.detail.tab);
                if (e.detail.tab === "notifications" && e.detail.selectedNotifId) {
                    setSelectedNotifId(e.detail.selectedNotifId);
                }
            }
        };
        window.addEventListener("fixgo_navigate", handler);
        return () => window.removeEventListener("fixgo_navigate", handler);
    }, []);

    const handlePageChange = (page, options = {}) => {
        if (page !== "repair") setTargetRequestId(null);
        if (page === "profile" && options?.action) {
            setProfileModalState({ open: true, tab: options.action === "password" ? "password" : "info" });
        } else if (page !== "profile") {
            setProfileModalState(null);
        }
        setCurrentPage(page);
        setSidebarOpen(false);
    };

    return (
        <div className="min-h-screen bg-[#F4F8F5] text-[#111827]" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
            {/* Mobile backdrop overlay */}
            {sidebarOpen && (
                <div 
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs transition-opacity"
                />
            )}

            <CustomerSidebar
                currentPage={currentPage}
                setCurrentPage={handlePageChange}
                unreadCount={unreadCount}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <main className="ml-0 md:ml-60 min-h-[calc(100vh-65px)] p-4 sm:p-6 box-border transition-all duration-300">
                <div className="max-w-[1180px] mx-auto">
                    {/* Mobile Menu Bar Toggle */}
                    <div className="md:hidden flex items-center justify-between bg-white px-4 py-3 border border-gray-100 mb-4 rounded-2xl shadow-xs">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-green-600 bg-transparent border-none cursor-pointer"
                        >
                            <FontAwesomeIcon icon={sidebarOpen ? faXmark : faBars} className="text-base text-green-600" />
                            <span>Dashboard Menu</span>
                        </button>
                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full capitalize">
                            {currentPage === "repair" ? "Repair Status" : currentPage === "history" ? "Service History" : currentPage === "reviews" ? "Reviews & Ratings" : currentPage}
                        </span>
                    </div>

                    {currentPage === "dashboard" && (
                        <Dashboard onNavigate={handlePageChange} />
                    )}
                    {currentPage === "profile" && (
                        <Profile
                            initialModalOpen={profileModalState?.open || false}
                            initialTab={profileModalState?.tab || "info"}
                        />
                    )}
                    {currentPage === "repair" && <RepairStatus targetRequestId={targetRequestId} />}
                    {currentPage === "history" && <ServiceHistory />}
                    {currentPage === "reviews" && <ReviewsRatings />}
                    {currentPage === "notifications" && (
                        <Notification 
                            initialSelectedId={selectedNotifId} 
                            onClearSelection={() => setSelectedNotifId(null)} 
                        />
                    )}
                    {currentPage === "settings" && <Settings onNavigate={handlePageChange} />}
                </div>
            </main>
        </div>
    );
}

export default CustomerControllDashboard;